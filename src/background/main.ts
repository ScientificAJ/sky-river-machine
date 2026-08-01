import { createBrowserAdapter } from '../browser';
import type { InventoryMessage, InventoryResponse } from '../shared/types';
import { reconcileTabs } from '../core/reconciliation';
import { IndexedDbTabStore } from '../storage/database';
import type { RawRuntimeApi } from '../browser/raw';

const adapter = createBrowserAdapter();
const store = new IndexedDbTabStore();

function runtime(): RawRuntimeApi {
  const globals = globalThis as unknown as { browser?: { runtime: RawRuntimeApi }; chrome?: { runtime: RawRuntimeApi } };
  const value = globals.browser?.runtime ?? globals.chrome?.runtime;
  if (!value) throw new Error('Extension runtime is unavailable');
  return value;
}

async function refreshInventory(): Promise<InventoryResponse> {
  try {
    const tabs = await adapter.queryTabs();
    const records = reconcileTabs(await store.list(), tabs, Date.now());
    await store.replaceAll(records);
    return { ok: true, records };
  } catch {
    return { ok: false, error: 'Local inventory is unavailable. Check the extension permission and try again.' };
  }
}

const messageApi = runtime().onMessage;
messageApi?.addListener((message, _sender, sendResponse) => {
  if ((message as InventoryMessage).type !== 'refresh-inventory') return;
  void refreshInventory().then(sendResponse);
  return true;
});

adapter.observeTabEvents(() => { void refreshInventory(); });
