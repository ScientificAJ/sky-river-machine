import { expect, test } from 'vitest';
import { duplicateScore } from '../src/analysis/heuristics';
import { validateSuggestionOutput } from '../src/analysis/validation';
import { canMutateTab } from '../src/core/lifecycle';
import { planOperation } from '../src/core/operations';
import type { TabRecord } from '../src/shared/types';

const record: TabRecord = {
  recordId: 'fictional-record', browserTabId: 7, windowId: 3, workspaceId: null, state: 'Active',
  url: 'https://example.com/work', title: 'Fictional workspace', domain: 'example.com',
  signals: { active: true, audible: false, discarded: false, loading: false, pinned: false },
  protection: { important: false, neverSleep: false, keepUntilCompleted: false },
  createdAt: 1, updatedAt: 1, lastActivatedAt: 1, lastObservedAt: 1, revision: 1,
};

test('the lifecycle guard rejects active and protected records', () => {
  expect(canMutateTab(record, 'close')).toEqual({ allowed: false, reason: 'The active tab is always protected.' });
  expect(canMutateTab({ ...record, signals: { ...record.signals, active: false }, protection: { ...record.protection, important: true } }, 'discard').allowed).toBe(false);
  expect(canMutateTab({ ...record, signals: { ...record.signals, active: false }, protection: { ...record.protection, neverSleep: true } }, 'discard').allowed).toBe(false);
  expect(canMutateTab({ ...record, signals: { ...record.signals, active: false }, protection: { ...record.protection, keepUntilCompleted: true } }, 'close').allowed).toBe(false);
  expect(canMutateTab({ ...record, signals: { ...record.signals, active: false, pinned: true } }, 'close').allowed).toBe(false);
  expect(canMutateTab({ ...record, signals: { ...record.signals, active: false, loading: true } }, 'discard').allowed).toBe(false);
});

test('heuristics identify exact duplicates without a domain category map', () => {
  expect(duplicateScore(record, { ...record, recordId: 'second' })).toBe(1);
});

test('model-shaped output rejects record IDs outside its request', () => {
  expect(validateSuggestionOutput({ groups: [{ name: 'Unsafe', recordIds: ['other'], confidence: 1 }] }, new Set(['fictional-record'])).ok).toBe(false);
});

test('operation planning snapshots the reversible state before mutation', () => {
  const operation = planOperation('lifecycle', record, 'close', { state: 'Extinct' }, 42);
  expect(operation.status).toBe('planned');
  expect(operation.before).toEqual([expect.objectContaining({ recordId: record.recordId, browserTabId: 7, url: record.url, state: 'Active' })]);
  expect(operation.browserPlan).toEqual({ action: 'close', tabIds: [7] });
});

test('delete planning does not retain a restoration URL', () => {
  expect(planOperation('delete', record, 'none', {}, 42).before).toEqual([]);
});
