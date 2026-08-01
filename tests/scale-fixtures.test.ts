import { expect, test } from 'vitest';
import { syntheticRecords } from '../src/core/fixtures';
import { searchMetadata } from '../src/core/search';
import { reconcileTabs } from '../src/core/reconciliation';

test.each([12, 100, 1000, 10000])('synthetic fixture stays deterministic and searchable at %i records', (count) => {
  const records = syntheticRecords(count);
  expect(records).toHaveLength(count);
  expect(new Set(records.map((record) => record.recordId)).size).toBe(count);
  const started = performance.now();
  expect(searchMetadata(records, [], `fictional tab ${count - 1}`)).toHaveLength(1);
  const normalized = records.filter((record) => record.browserTabId !== null && record.windowId !== null).map((record) => ({ browserTabId: record.browserTabId!, windowId: record.windowId!, title: record.title, url: record.url, domain: record.domain, active: record.signals.active, audible: record.signals.audible, discarded: record.signals.discarded, loading: record.signals.loading, pinned: record.signals.pinned }));
  expect(reconcileTabs(records, normalized, 2)).toHaveLength(count);
  if (count === 10_000) expect(performance.now() - started).toBeLessThan(500);
});

test('search ranks remembered visible context when the exact title is unknown', () => {
  const records = syntheticRecords(2).map((record, index) => index === 0 ? { ...record, title: 'Untitled page', context: { level: 'visible' as const, headings: ['Fictional browser sleeping guide'], description: 'Reference notes for preserving tabs', storedAt: 1 } } : record);
  expect(searchMetadata(records, [], 'browser sleeping guide')[0]?.recordId).toBe('synthetic-0');
});
