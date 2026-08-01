import { expect, test } from 'vitest';
import { safeAnalysisInput } from '../src/analysis/normalize';
import { suggestWithSafeFallback } from '../src/analysis/pipeline';
import { validateModelRequest } from '../src/analysis/model';
import type { ModelRunner } from '../src/analysis/model';
import type { TabRecord } from '../src/shared/types';

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

test('model request validation bounds input and aligned revisions', () => {
  expect(validateModelRequest({ task: 'relateTabs', schemaVersion: 1, input: { text: 'fictional' }, recordIds: ['one'], revisions: [1], modelId: 'fictional', modelVersion: '1', artifactChecksum: 'sum', strategyVersion: '1', timeBudgetMs: 100 })).toBe(true);
  expect(validateModelRequest({ task: 'relateTabs', schemaVersion: 1, input: 'x'.repeat(20_001), recordIds: ['one'], revisions: [], modelId: 'fictional', modelVersion: '1', artifactChecksum: 'sum', strategyVersion: '1', timeBudgetMs: 100 })).toBe(false);
});
