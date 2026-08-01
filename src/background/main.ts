import { createBrowserAdapter } from '../browser';
import type { InventoryMessage, InventoryResponse, Workspace } from '../shared/types';
import { reconcileTabs } from '../core/reconciliation';
import { IndexedDbTabStore } from '../storage/database';
import type { RawRuntimeApi } from '../browser/raw';

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
  if (message.type === 'move-record') {
    await store.updateRecordWorkspace(message.recordId, message.workspaceId);
    return await refreshInventory();
  }
  if (message.type === 'set-protection') {
    await store.updateRecordProtection(message.recordId, message.important);
    return await refreshInventory();
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
