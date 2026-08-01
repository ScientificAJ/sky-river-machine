import { createBrowserAdapter } from '../browser';
import type { InventoryMessage, InventoryResponse, Workspace } from '../shared/types';
import { reconcileTabs } from '../core/reconciliation';
import { IndexedDbTabStore } from '../storage/database';
import type { RawRuntimeApi } from '../browser/raw';
import { canMutateTab } from '../core/lifecycle';
import { planOperation } from '../core/operations';
import { suggestWithSafeFallback } from '../analysis/pipeline';

const adapter = createBrowserAdapter();
const store = new IndexedDbTabStore();
let refreshInFlight: Promise<InventoryResponse> | null = null;
let refreshQueued = false;

function runtime(): RawRuntimeApi {
  const globals = globalThis as unknown as { browser?: { runtime: RawRuntimeApi }; chrome?: { runtime: RawRuntimeApi } };
  const value = globals.browser?.runtime ?? globals.chrome?.runtime;
  if (!value) throw new Error('Extension runtime is unavailable');
  return value;
}

async function refreshInventory(): Promise<InventoryResponse> {
  if (refreshInFlight) {
    refreshQueued = true;
    return await refreshInFlight;
  }
  refreshInFlight = refreshInventoryOnce();
  const result = await refreshInFlight;
  refreshInFlight = null;
  if (refreshQueued) {
    refreshQueued = false;
    void refreshInventory();
  }
  return result;
}

async function refreshInventoryOnce(): Promise<InventoryResponse> {
  try {
    const tabs = await adapter.queryTabs();
    const records = reconcileTabs(await store.list(), tabs, Date.now());
    await store.replaceAll(records);
    return { ok: true, records };
  } catch {
    return { ok: false, error: 'Local inventory is unavailable. Check the extension permission and try again.' };
  }
}

async function handleMessage(message: InventoryMessage): Promise<InventoryResponse> {
  if (message.type === 'refresh-inventory') return await refreshInventory();
  if (message.type === 'list-workspaces') return { ok: true, workspaces: await store.listWorkspaces() };
  if (message.type === 'get-recovery') return { ok: true, recovery: await store.listOperations(['planned', 'applying', 'partial', 'failed']) };
  if (message.type === 'get-suggestions') return { ok: true, suggestions: await store.listSuggestions() };
  if (message.type === 'delete-all') {
    if (!message.confirm) return { ok: false, error: 'Deleting all local data requires explicit confirmation.' };
    await store.clearAll();
    return { ok: true, records: [] };
  }
  if (message.type === 'export-data') return { ok: true, data: JSON.stringify(await store.exportAll()) };
  if (message.type === 'extract-visible-context') {
    if (!message.confirm) return { ok: false, error: 'Visible page context requires explicit confirmation.' };
    const record = await store.get(message.recordId);
    if (!record || record.browserTabId === null) return { ok: false, error: 'That record has no live tab to inspect.' };
    try {
      const live = await adapter.getTab(record.browserTabId);
      if (!live || live.windowId !== record.windowId || !live.active) return { ok: false, error: 'Select this tab first. Visible context is available only for the current tab.' };
      const extracted = await adapter.extractVisibleContext(record.browserTabId);
      const context = { level: 'visible' as const, ...extracted, storedAt: Date.now() };
      const updated = await store.updateRecordContext(record.recordId, context);
      return { ok: true, context, records: [updated] };
    } catch {
      return { ok: false, error: 'Visible page context was unavailable. Metadata-only mode remains usable.' };
    }
  }
  if (message.type === 'organize-heuristically') {
    const records = await store.list();
    const { suggestion } = await suggestWithSafeFallback(records.filter((record) => record.state !== 'Extinct'));
    await store.putSuggestion(suggestion);
    return { ok: true, suggestions: [suggestion] };
  }
  if (message.type === 'reject-suggestion') {
    const suggestion = await store.getSuggestion(message.suggestionId);
    if (!suggestion) return { ok: false, error: 'That suggestion is no longer available.' };
    const rejected = { ...suggestion, status: 'rejected' as const };
    await store.updateSuggestion(rejected);
    await store.putCorrection({ correctionId: crypto.randomUUID(), kind: 'rejectedSuggestion', recordIds: suggestion.workspaceProposals.flatMap((proposal) => proposal.recordIds), features: ['suggestion-rejected'], createdAt: Date.now() });
    return { ok: true, suggestions: [rejected] };
  }
  if (message.type === 'apply-suggestion') {
    const suggestion = await store.getSuggestion(message.suggestionId);
    if (!suggestion || suggestion.status !== 'pending') return { ok: false, error: 'That suggestion is no longer available.' };
    const records = await store.list();
    const currentRevision = records.reduce((total, record) => total + record.revision, 0);
    if (currentRevision !== suggestion.sourceRevision) {
      const expired = { ...suggestion, status: 'expired' as const };
      await store.updateSuggestion(expired);
      return { ok: false, error: 'The suggestion expired because tab data changed. Generate a new suggestion.' };
    }
    const before = records.filter((record) => suggestion.workspaceProposals.some((proposal) => proposal.recordIds.includes(record.recordId))).map((record) => ({ recordId: record.recordId, browserTabId: record.browserTabId, windowId: record.windowId, state: record.state, url: record.url, workspaceId: record.workspaceId, protection: record.protection }));
    const operation = { operationId: crypto.randomUUID(), kind: 'organize' as const, targetRecordIds: before.map((record) => record.recordId), before, after: {}, browserPlan: { action: 'none' as const, tabIds: [] }, status: 'planned' as const, error: null, createdAt: Date.now(), completedAt: null };
    await store.putOperation(operation);
    const workspaces = await store.listWorkspaces();
    for (const proposal of suggestion.workspaceProposals) {
      const workspace = workspaces.find((item) => !item.archivedAt && item.name === proposal.name) ?? { workspaceId: crypto.randomUUID(), name: proposal.name.slice(0, 80), color: 'river', createdAt: Date.now(), updatedAt: Date.now(), archivedAt: null } satisfies Workspace;
      await store.putWorkspace({ ...workspace, updatedAt: Date.now() });
      for (const recordId of proposal.recordIds) await store.updateRecordWorkspace(recordId, workspace.workspaceId);
    }
    const applied = { ...operation, status: 'applied' as const, completedAt: Date.now() };
    await store.putOperation(applied);
    await store.updateSuggestion({ ...suggestion, status: 'accepted' });
    await store.putCorrection({ correctionId: crypto.randomUUID(), kind: 'movedTab', recordIds: before.map((record) => record.recordId), features: ['workspace-assignment'], createdAt: Date.now() });
    return { ok: true, operation: applied, records: await store.list(), workspaces: [...workspaces, ...(await store.listWorkspaces()).filter((workspace) => !workspaces.some((old) => old.workspaceId === workspace.workspaceId))] };
  }
  if (message.type === 'move-record') {
    await store.updateRecordWorkspace(message.recordId, message.workspaceId);
    await store.putCorrection({ correctionId: crypto.randomUUID(), kind: 'movedTab', recordIds: [message.recordId], features: [message.workspaceId ?? 'unassigned'] , createdAt: Date.now() });
    return await refreshInventory();
  }
  if (message.type === 'set-protection') {
    const protection = Object.fromEntries(Object.entries({ important: message.important, neverSleep: message.neverSleep, keepUntilCompleted: message.keepUntilCompleted }).filter(([, value]) => value !== undefined));
    if (!Object.keys(protection).length) return { ok: false, error: 'Protection change was incomplete.' };
    await store.updateRecordProtection(message.recordId, protection);
    await store.putCorrection({ correctionId: crypto.randomUUID(), kind: 'protectedTab', recordIds: [message.recordId], features: Object.entries(protection).map(([key, value]) => `${key}:${value}`), createdAt: Date.now() });
    return await refreshInventory();
  }
  if (message.type === 'delete-record') {
    if (!message.confirm) return { ok: false, error: 'Deletion requires explicit confirmation.' };
    const record = await store.get(message.recordId);
    if (!record) return { ok: false, error: 'That tab record is no longer available.' };
    if (record.state !== 'Extinct') return { ok: false, error: 'Archive the live tab before deleting its record.' };
    const operation = planOperation('delete', record, 'none', {}, Date.now());
    await store.putOperation(operation);
    await store.delete(record.recordId);
    await store.putOperation({ ...operation, status: 'applied', completedAt: Date.now() });
    return await refreshInventory();
  }
  if (message.type === 'undo-operation') {
    const operation = await store.getOperation(message.operationId);
    if (!operation || !['applied', 'partial'].includes(operation.status)) return { ok: false, error: 'That operation is not undoable.' };
    if (!operation.before.length) return { ok: false, error: 'The operation has no recovery snapshot.' };
    if (operation.kind === 'delete') return { ok: false, error: 'Deleted records are not recoverable from the extension.' };
    const updatedRecords = [];
    for (const before of operation.before) {
      const record = await store.get(before.recordId);
      if (!record) return { ok: false, error: 'The original tab record is no longer available.' };
      if (before.state === 'Extinct' && record.state !== 'Extinct') return { ok: false, error: 'The current tab state changed; review recovery before undoing.' };
      if (operation.kind === 'restore' && before.state === 'Extinct' && record.browserTabId !== null) {
        const live = await adapter.getTab(record.browserTabId).catch(() => null);
        if (!live || live.url !== record.url) return { ok: false, error: 'The restored tab changed before undo; review recovery first.' };
        await adapter.closeTab(record.browserTabId);
      } else if (operation.kind !== 'organize' && record.browserTabId === null && before.state !== 'Extinct') {
        const restored = await adapter.createTab(before.url);
        before.browserTabId = restored.browserTabId;
        before.windowId = restored.windowId;
      } else if (operation.kind !== 'organize' && record.browserTabId !== null) await adapter.activateTab(record.browserTabId);
      if (before.state === 'Extinct') {
        before.browserTabId = null;
        before.windowId = null;
      }
      updatedRecords.push(await store.restoreSnapshot(before));
    }
    const undone = { ...operation, status: 'undone' as const, completedAt: Date.now() };
    await store.putOperation(undone);
    return { ok: true, operation: undone, records: updatedRecords };
  }
  if (message.type === 'lifecycle') {
    const record = await store.get(message.recordId);
    if (!record) return { ok: false, error: 'That tab record is no longer available.' };
    if (record.browserTabId !== null) {
      const live = await adapter.getTab(record.browserTabId).catch(() => null);
      if (!live || live.windowId !== record.windowId) return { ok: false, error: 'The tab handle is stale. Refresh the inventory before trying again.' };
    }
    if (message.action === 'restore' && record.state === 'Extinct') {
      const operation = planOperation('restore', record, 'create', { state: 'Active' }, Date.now());
      await store.putOperation(operation);
      await store.putOperation({ ...operation, status: 'applying' });
      try {
        const restored = await adapter.createTab(record.url);
        const updated = await store.updateRecordState(record.recordId, 'Active', restored.browserTabId, restored.windowId);
        const applied = { ...operation, status: 'applied' as const, completedAt: Date.now() };
        await store.putOperation(applied);
        return { ok: true, operation: applied, records: [updated] };
      } catch {
        const failed = { ...operation, status: 'failed' as const, error: 'The browser could not restore this tab.', completedAt: Date.now() };
        await store.putOperation(failed);
        return { ok: false, error: failed.error };
      }
    }
    if (message.action === 'wake' && record.browserTabId !== null) {
      await adapter.activateTab(record.browserTabId);
      const updated = await store.updateRecordState(record.recordId, 'Active', record.browserTabId, record.windowId);
      return { ok: true, operation: planOperation('lifecycle', record, 'activate', { state: 'Active' }, Date.now()), records: [updated] };
    }
    const mutation = message.action === 'rest' ? 'discard' : 'close';
    const decision = canMutateTab(record, mutation);
    if (!decision.allowed) return { ok: false, error: decision.reason };
    if (message.action === 'archive' && !message.confirm) return { ok: false, error: 'Archiving requires explicit confirmation after review.' };
    const action = message.action === 'rest' ? (adapter.getCapabilities().nativeDiscard ? 'discard' : 'none') : 'close';
    const operation = planOperation('lifecycle', record, action, { state: message.action === 'rest' ? 'Dormant' : 'Extinct' }, Date.now());
    await store.putOperation(operation);
    await store.putOperation({ ...operation, status: 'applying' });
    try {
      if (message.action === 'rest' && record.browserTabId !== null && action === 'discard') await adapter.discardTab(record.browserTabId);
      if (message.action === 'archive' && record.browserTabId !== null) await adapter.closeTab(record.browserTabId);
      const updated = await store.updateRecordState(record.recordId, message.action === 'rest' ? 'Dormant' : 'Extinct', message.action === 'rest' ? record.browserTabId : null, message.action === 'rest' ? record.windowId : null);
      const applied = { ...operation, status: 'applied' as const, completedAt: Date.now() };
      await store.putOperation(applied);
      return { ok: true, operation: applied, records: [updated] };
    } catch {
      const failed = { ...operation, status: 'failed' as const, error: 'The browser did not complete the requested lifecycle action.', completedAt: Date.now() };
      await store.putOperation(failed);
      return { ok: false, error: failed.error };
    }
  }

  const workspaces = await store.listWorkspaces();
  const now = Date.now();
  if (message.type === 'create-workspace') {
    const workspace: Workspace = {
      workspaceId: crypto.randomUUID(),
      name: message.name.trim() || 'Untitled workspace',
      color: 'river',
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    await store.putWorkspace(workspace);
    return { ok: true, workspace };
  }

  const workspace = workspaces.find((item) => item.workspaceId === message.workspaceId);
  if (!workspace) return { ok: false, error: 'That workspace is no longer available.' };
  if (message.type === 'rename-workspace') {
    const renamed = { ...workspace, name: message.name.trim() || workspace.name, updatedAt: now };
    await store.putWorkspace(renamed);
    return { ok: true, workspace: renamed };
  }
  const archived = { ...workspace, archivedAt: now, updatedAt: now };
  await store.putWorkspace(archived);
  return { ok: true, workspace: archived };
}

const messageApi = runtime().onMessage;
messageApi?.addListener((message, _sender, sendResponse) => {
  void handleMessage(message as InventoryMessage).then(sendResponse).catch(() => sendResponse({ ok: false, error: 'The local workspace action could not be completed.' }));
  return true;
});

adapter.observeTabEvents(() => { void refreshInventory(); });
void refreshInventory();
