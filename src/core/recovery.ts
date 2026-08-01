import type { NormalizedTab, Operation, TabRecord } from '../shared/types';

export type RecoveryResult = { status: Operation['status']; error: string | null };

function liveTabFor(record: TabRecord | undefined, tabs: NormalizedTab[]): NormalizedTab | undefined {
  if (!record || record.browserTabId === null || record.windowId === null) return undefined;
  return tabs.find((tab) => tab.browserTabId === record.browserTabId && tab.windowId === record.windowId);
}

function sameProtection(left: TabRecord['protection'], right: TabRecord['protection'] | undefined): boolean {
  return Boolean(right && left.important === right.important && left.neverSleep === right.neverSleep && left.keepUntilCompleted === right.keepUntilCompleted);
}

export function recoverOperation(operation: Operation, records: TabRecord[], tabs: NormalizedTab[]): RecoveryResult | null {
  if (!['planned', 'applying'].includes(operation.status)) return null;
  const current = new Map(records.map((record) => [record.recordId, record]));
  const before = new Map(operation.before.map((snapshot) => [snapshot.recordId, snapshot]));
  const targets = operation.targetRecordIds.map((recordId) => current.get(recordId));

  if (operation.kind === 'delete') {
    return targets.every((record) => !record)
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The delete operation did not complete; the record was preserved.' };
  }

  if (operation.kind === 'protectionChange') {
    const complete = targets.every((record) => record && sameProtection(record.protection, operation.after.protection));
    return complete
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The protection change could not be confirmed after restart.' };
  }

  if (operation.kind === 'organize') {
    const changed = targets.map((record) => {
      const snapshot = record ? before.get(record.recordId) : undefined;
      return Boolean(record && snapshot && record.workspaceId !== snapshot.workspaceId);
    });
    if (changed.every(Boolean)) return { status: 'applied', error: null };
    if (changed.some(Boolean)) return { status: 'partial', error: 'Some workspace assignments were applied before restart; review the remaining records.' };
    return { status: 'failed', error: 'The organization operation could not be confirmed after restart.' };
  }

  const record = targets[0];
  const live = liveTabFor(record, tabs);
  if (operation.browserPlan.action === 'close') {
    return record?.state === 'Extinct' && !live
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The archive close was not confirmed; the live tab was preserved.' };
  }
  if (operation.browserPlan.action === 'discard') {
    return record?.state === 'Dormant'
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The rest operation was not confirmed after restart.' };
  }
  if (operation.browserPlan.action === 'activate') {
    return record?.state === 'Active' && live?.active
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The wake operation was not confirmed after restart.' };
  }
  if (operation.browserPlan.action === 'create') {
    return record?.state === 'Active' && live
      ? { status: 'applied', error: null }
      : { status: 'failed', error: 'The restore operation was not confirmed after restart.' };
  }
  return { status: 'failed', error: 'The pending operation could not be classified safely after restart.' };
}
