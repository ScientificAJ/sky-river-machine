import type { InventoryMessage, InventoryResponse } from '../shared/types';
import type { RawRuntimeApi } from './raw';

function runtime(): RawRuntimeApi {
  const globals = globalThis as unknown as { browser?: { runtime: RawRuntimeApi }; chrome?: { runtime: RawRuntimeApi } };
  const value = globals.browser?.runtime ?? globals.chrome?.runtime;
  if (!value) throw new Error('Extension runtime is unavailable');
  return value;
}

export async function refreshInventory(): Promise<InventoryResponse> {
  return await sendMessage({ type: 'refresh-inventory' });
}

export async function sendMessage(message: InventoryMessage): Promise<InventoryResponse> {
  return await runtime().sendMessage(message) as InventoryResponse;
}
