import { expect, test } from 'vitest';
import { reconcileTabs } from '../src/core/reconciliation';
import type { NormalizedTab } from '../src/shared/types';

const tab: NormalizedTab = {
  browserTabId: 7,
  windowId: 3,
  title: 'Fictional workspace',
  url: 'https://example.com/work',
  domain: 'example.com',
  active: true,
  audible: false,
  discarded: false,
  loading: false,
  pinned: false,
};

test('reconciliation is idempotent for the same browser snapshot', () => {
  const first = reconcileTabs([], [tab], 100, () => 'record-1');
  const second = reconcileTabs(first, [tab], 100, () => 'record-2');

  expect(second).toEqual(first);
  expect(second).toHaveLength(1);
  expect(second[0]?.recordId).toBe('record-1');
});

test('missing live tabs become restorable Extinct records', () => {
  const first = reconcileTabs([], [tab], 100, () => 'record-1');
  const second = reconcileTabs(first, [], 200);

  expect(second[0]).toMatchObject({ recordId: 'record-1', state: 'Extinct', browserTabId: null, windowId: null });
});
