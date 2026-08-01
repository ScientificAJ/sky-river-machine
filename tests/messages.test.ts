import { expect, test } from 'vitest';
import { parseInventoryMessage } from '../src/shared/messages';

test('message validation accepts bounded extension intents', () => {
  expect(parseInventoryMessage({ type: 'set-protection', recordId: 'fictional-record', neverSleep: true })).toEqual({ type: 'set-protection', recordId: 'fictional-record', neverSleep: true });
  expect(parseInventoryMessage({ type: 'create-workspace', name: 'Fictional workspace' })).toEqual({ type: 'create-workspace', name: 'Fictional workspace' });
  expect(parseInventoryMessage({ type: 'delete-workspace', workspaceId: 'fictional-workspace', confirm: true })).toEqual({ type: 'delete-workspace', workspaceId: 'fictional-workspace', confirm: true });
  expect(parseInventoryMessage({ type: 'search-metadata', query: 'fictional', offset: 0, limit: 50 })).toEqual({ type: 'search-metadata', query: 'fictional', offset: 0, limit: 50 });
});

test('message validation rejects unexpected fields and oversized input', () => {
  expect(parseInventoryMessage({ type: 'refresh-inventory', extra: 'unexpected' })).toBeNull();
  expect(parseInventoryMessage({ type: 'undo-operation', suggestionId: 'wrong-field' })).toBeNull();
  expect(parseInventoryMessage({ type: 'create-workspace', name: 'x'.repeat(121) })).toBeNull();
  expect(parseInventoryMessage({ type: 'delete-all', confirm: 'yes' })).toBeNull();
  expect(parseInventoryMessage({ type: 'search-metadata', query: 'fictional', offset: -1, limit: 50 })).toBeNull();
  expect(parseInventoryMessage({ type: 'search-metadata', query: 'fictional', offset: 0, limit: 101 })).toBeNull();
});
