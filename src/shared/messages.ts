import type { InventoryMessage } from './types';

const TYPES = new Set<InventoryMessage['type']>([
  'refresh-inventory', 'search-metadata', 'list-workspaces', 'create-workspace', 'rename-workspace', 'archive-workspace', 'delete-workspace', 'move-record', 'set-protection', 'lifecycle', 'undo-operation', 'delete-record', 'get-recovery', 'get-suggestions', 'organize-heuristically', 'review-suggestion', 'apply-suggestion', 'reject-suggestion', 'extract-visible-context', 'delete-all', 'export-data',
]);

const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128;
const name = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
const bool = (value: unknown): value is boolean => typeof value === 'boolean';
const pageNumber = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10_000;
const pageSize = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100;
const keysOnly = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every((key) => allowed.includes(key));

export function parseInventoryMessage(input: unknown): InventoryMessage | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value.type !== 'string' || !TYPES.has(value.type as InventoryMessage['type'])) return null;
  switch (value.type) {
    case 'refresh-inventory': case 'list-workspaces': case 'get-recovery': case 'get-suggestions': case 'organize-heuristically': case 'export-data':
      return keysOnly(value, ['type']) ? value as InventoryMessage : null;
    case 'search-metadata':
      return keysOnly(value, ['type', 'query', 'offset', 'limit']) && typeof value.query === 'string' && value.query.length <= 200 && pageNumber(value.offset) && pageSize(value.limit) ? value as InventoryMessage : null;
    case 'create-workspace':
      return keysOnly(value, ['type', 'name']) && name(value.name) ? value as InventoryMessage : null;
    case 'rename-workspace':
      return keysOnly(value, ['type', 'workspaceId', 'name']) && id(value.workspaceId) && name(value.name) ? value as InventoryMessage : null;
    case 'archive-workspace':
      return keysOnly(value, ['type', 'workspaceId']) && id(value.workspaceId) ? value as InventoryMessage : null;
    case 'delete-workspace':
      return keysOnly(value, ['type', 'workspaceId', 'confirm']) && id(value.workspaceId) && bool(value.confirm) ? value as InventoryMessage : null;
    case 'move-record':
      return keysOnly(value, ['type', 'recordId', 'workspaceId']) && id(value.recordId) && (value.workspaceId === null || id(value.workspaceId)) ? value as InventoryMessage : null;
    case 'set-protection': {
      const allowed = ['type', 'recordId', 'important', 'neverSleep', 'keepUntilCompleted'];
      const protectionKeys = ['important', 'neverSleep', 'keepUntilCompleted'].filter((key) => value[key] !== undefined);
      return keysOnly(value, allowed) && id(value.recordId) && protectionKeys.length > 0 && protectionKeys.every((key) => bool(value[key])) ? value as InventoryMessage : null;
    }
    case 'lifecycle':
      return keysOnly(value, ['type', 'recordId', 'action', 'confirm']) && id(value.recordId) && ['wake', 'rest', 'archive', 'restore'].includes(String(value.action)) && (value.confirm === undefined || bool(value.confirm)) ? value as InventoryMessage : null;
    case 'undo-operation':
      return keysOnly(value, ['type', 'operationId']) && id(value.operationId) ? value as InventoryMessage : null;
    case 'apply-suggestion': case 'reject-suggestion':
      return keysOnly(value, ['type', 'suggestionId']) && id(value.suggestionId) ? value as InventoryMessage : null;
    case 'review-suggestion': {
      if (!keysOnly(value, ['type', 'suggestionId', 'workspaceProposals']) || !id(value.suggestionId) || !Array.isArray(value.workspaceProposals) || value.workspaceProposals.length > 24) return null;
      const proposals = value.workspaceProposals;
      const assigned = new Set<string>();
      for (const proposal of proposals) {
        if (!proposal || typeof proposal !== 'object' || !keysOnly(proposal as Record<string, unknown>, ['name', 'recordIds'])) return null;
        const draft = proposal as { name?: unknown; recordIds?: unknown };
        if (!name(draft.name) || !Array.isArray(draft.recordIds) || draft.recordIds.length > 64) return null;
        for (const recordId of draft.recordIds) {
          if (!id(recordId) || assigned.has(recordId)) return null;
          assigned.add(recordId);
        }
      }
      return value as InventoryMessage;
    }
    case 'delete-record':
      return keysOnly(value, ['type', 'recordId', 'confirm']) && id(value.recordId) && bool(value.confirm) ? value as InventoryMessage : null;
    case 'extract-visible-context':
      return keysOnly(value, ['type', 'recordId', 'confirm']) && id(value.recordId) && bool(value.confirm) ? value as InventoryMessage : null;
    case 'delete-all':
      return keysOnly(value, ['type', 'confirm']) && bool(value.confirm) ? value as InventoryMessage : null;
  }
  return null;
}
