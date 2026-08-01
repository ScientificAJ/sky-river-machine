import type { Operation, TabRecord } from '../shared/types';

export function planOperation(
  kind: Operation['kind'],
  record: TabRecord,
  action: Operation['browserPlan']['action'],
  after: Partial<Pick<TabRecord, 'state' | 'workspaceId' | 'protection'>>,
  now: number,
): Operation {
  return {
    operationId: crypto.randomUUID(),
    kind,
    targetRecordIds: [record.recordId],
    before: kind === 'delete' ? [] : [{ recordId: record.recordId, browserTabId: record.browserTabId, windowId: record.windowId, state: record.state, url: record.url, workspaceId: record.workspaceId, protection: record.protection }],
    after,
    browserPlan: { action, tabIds: record.browserTabId === null ? [] : [record.browserTabId] },
    status: 'planned',
    error: null,
    createdAt: now,
    completedAt: null,
  };
}
