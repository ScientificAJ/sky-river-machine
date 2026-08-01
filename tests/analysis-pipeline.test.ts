import { expect, test } from 'vitest';
import { safeAnalysisInput } from '../src/analysis/normalize';
import { suggestWithSafeFallback } from '../src/analysis/pipeline';
import { validateModelRequest } from '../src/analysis/model';
import type { ModelRunner } from '../src/analysis/model';
import type { TabRecord } from '../src/shared/types';
import { syntheticRecords } from '../src/core/fixtures';
import { makeHeuristicSuggestion } from '../src/analysis/suggestions';
import { duplicateScore } from '../src/analysis/heuristics';

const record: TabRecord = {
  recordId: 'fictional-record', browserTabId: 7, windowId: 3, workspaceId: null, state: 'Active',
  url: 'https://example.com/work?token=secret&topic=private#fragment', title: 'Fictional workspace', domain: 'example.com',
  signals: { active: false, audible: false, discarded: false, loading: false, pinned: false },
  protection: { important: false, neverSleep: false, keepUntilCompleted: false },
  createdAt: 1, updatedAt: 1, lastActivatedAt: 1, lastObservedAt: 1, revision: 1,
};

test('analysis input preserves a useful URL shape without sending query values or fragments', () => {
  expect(safeAnalysisInput(record.title, record.url).url).toBe('https://example.com/work?topic=%5Bredacted%5D');
});

test('validated model groups replace the fallback without exposing raw restoration URLs', async () => {
  let input: unknown;
  const runner: ModelRunner = { run: async (request) => {
    input = request.input;
    return { ok: true, output: { groups: [{ name: 'Fictional work', recordIds: ['fictional-record'], confidence: 0.8 }] }, confidence: 0.8, metadata: { modelId: 'fictional-local', modelVersion: 'v1', artifactChecksum: 'fictional-checksum', strategyVersion: 'fictional-strategy' } };
  } };
  const result = await suggestWithSafeFallback([record], runner);
  expect(result.model).toBe('available');
  expect(result.suggestion.workspaceProposals[0]?.name).toBe('Fictional work');
  expect(JSON.stringify(input)).not.toContain('secret');
  expect(JSON.stringify(input)).not.toContain('private');
});

test('malformed model output keeps the heuristic fallback usable', async () => {
  const runner: ModelRunner = { run: async () => ({ ok: true, output: { groups: [{ name: 'Unsafe', recordIds: ['unknown'], confidence: 1 }] }, confidence: 1, metadata: { modelId: 'fictional-local', modelVersion: 'v1', artifactChecksum: 'fictional-checksum', strategyVersion: 'fictional-strategy' } }) };
  const result = await suggestWithSafeFallback([record], runner);
  expect(result.model).toBe('unavailable');
  expect(result.suggestion.status).toBe('pending');
});

test('model runner failure keeps the heuristic fallback usable', async () => {
  const runner: ModelRunner = { run: async () => { throw new Error('fictional model failure'); } };
  const result = await suggestWithSafeFallback([record], runner);
  expect(result.model).toBe('unavailable');
});

test('heuristic fallback bounds analysis work for a large archive', async () => {
  const started = performance.now();
  const result = await suggestWithSafeFallback(syntheticRecords(10_000));
  expect(result.model).toBe('unavailable');
  expect(result.suggestion.sourceRevision).toBe(10_000);
  expect(result.suggestion.workspaceProposals.length).toBeLessThanOrEqual(24);
  expect(performance.now() - started).toBeLessThan(1_000);
});

test('model request validation bounds input and aligned revisions', () => {
  expect(validateModelRequest({ task: 'relateTabs', schemaVersion: 1, input: { text: 'fictional' }, recordIds: ['one'], revisions: [1], modelId: 'fictional', modelVersion: '1', artifactChecksum: 'sum', strategyVersion: '1', timeBudgetMs: 100 })).toBe(true);
  expect(validateModelRequest({ task: 'relateTabs', schemaVersion: 1, input: 'x'.repeat(20_001), recordIds: ['one'], revisions: [], modelId: 'fictional', modelVersion: '1', artifactChecksum: 'sum', strategyVersion: '1', timeBudgetMs: 100 })).toBe(false);
});

test('heuristic suggestions reuse explicit workspace correction signals', () => {
  const records = [
    { ...record, recordId: 'one', domain: 'example.com', title: 'Fictional browser setup' },
    { ...record, recordId: 'two', domain: 'example.org', title: 'Fictional browser guide' },
  ];
  const suggestion = makeHeuristicSuggestion(records, 2, records, [{ workspaceId: 'fictional-workspace', name: 'Fictional project', color: 'river', createdAt: 1, updatedAt: 1, archivedAt: null }], [{ correctionId: 'correction', kind: 'movedTab', recordIds: ['one'], features: ['workspace:fictional-workspace', 'domain:example.com', 'token:browser'], createdAt: 1 }]);
  expect(suggestion.workspaceProposals[0]?.name).toBe('Fictional project');
});

test('duplicate scoring does not treat encoded data-page markup as duplicate content', () => {
  const left = { ...record, domain: 'data', title: 'Fictional browser setup', url: 'data:text/html,%3Ctitle%3EFictional%20browser%20setup%3C%2Ftitle%3E' };
  const right = { ...record, recordId: 'other', domain: 'data', title: 'Fictional payment form', url: 'data:text/html,%3Ctitle%3EFictional%20payment%20form%3C%2Ftitle%3E' };
  expect(duplicateScore(left, right)).toBeLessThan(0.9);
});
