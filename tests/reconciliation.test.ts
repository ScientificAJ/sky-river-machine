import { expect, test } from 'vitest';
import { reconcileTabs } from '../src/core/reconciliation';
import { recoverOperation } from '../src/core/recovery';
import type { Operation } from '../src/shared/types';
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

test('reconciliation retains already-extinct records across later refreshes', () => {
  const first = reconcileTabs([], [tab], 100, () => 'record-extinct');
  const extinct = reconcileTabs(first, [], 200);
  expect(reconcileTabs(extinct, [], 300)).toEqual(extinct);
});

test('reconciliation preserves an explicit dormant state for a background tab', () => {
  const existing = reconcileTabs([], [{ ...tab, active: false }], 1, () => 'stable');
  const dormant = { ...existing[0]!, state: 'Dormant' as const, revision: 2 };
  const next = reconcileTabs([dormant], [{ ...tab, active: false }], 3, () => 'new-id');
  expect(next[0]?.state).toBe('Dormant');
  expect(next[0]?.recordId).toBe('stable');
});

test('pending archive recovery only marks success when the tab is actually absent', () => {
  const existing = reconcileTabs([], [tab], 1, () => 'stable');
  const operation: Operation = {
    operationId: 'operation-1', kind: 'lifecycle', targetRecordIds: ['stable'],
    before: [{ recordId: 'stable', browserTabId: 7, windowId: 3, state: 'Active', url: tab.url, workspaceId: null, protection: existing[0]!.protection }],
    after: { state: 'Extinct' }, browserPlan: { action: 'close', tabIds: [7] }, status: 'applying', error: null, createdAt: 1, completedAt: null,
  };
  expect(recoverOperation(operation, [{ ...existing[0]!, state: 'Extinct', browserTabId: null, windowId: null }], [])).toEqual({ status: 'applied', error: null });
  expect(recoverOperation(operation, existing, [tab])).toMatchObject({ status: 'failed' });
});

test('recovery reports partial organization instead of replaying it blindly', () => {
  const records = reconcileTabs([], [tab, { ...tab, browserTabId: 8, title: 'Second fictional tab' }], 1, (() => {
    let next = 0;
    return () => `record-${++next}`;
  })());
  const operation: Operation = {
    operationId: 'operation-2', kind: 'organize', targetRecordIds: ['record-1', 'record-2'],
    before: records.map((record) => ({ recordId: record.recordId, browserTabId: record.browserTabId, windowId: record.windowId, state: record.state, url: record.url, workspaceId: null, protection: record.protection })),
    after: {}, browserPlan: { action: 'none', tabIds: [] }, status: 'applying', error: null, createdAt: 1, completedAt: null,
  };
  const partial = [{ ...records[0]!, workspaceId: 'workspace-1' }, records[1]!];
  expect(recoverOperation(operation, partial, [tab, { ...tab, browserTabId: 8, title: 'Second fictional tab' }])).toEqual({ status: 'partial', error: 'Some workspace assignments were applied before restart; review the remaining records.' });
});

test('recovery refuses to call a stale wake operation successful', () => {
  const existing = reconcileTabs([], [{ ...tab, active: false }], 1, () => 'stable');
  const operation: Operation = {
    operationId: 'operation-3', kind: 'lifecycle', targetRecordIds: ['stable'],
    before: [{ recordId: 'stable', browserTabId: 7, windowId: 3, state: 'Dormant', url: tab.url, workspaceId: null, protection: existing[0]!.protection }],
    after: { state: 'Active' }, browserPlan: { action: 'activate', tabIds: [7] }, status: 'applying', error: null, createdAt: 1, completedAt: null,
  };
  expect(recoverOperation(operation, existing, [{ ...tab, active: false }])).toMatchObject({ status: 'failed' });
});

test('recovery confirms a Dormant fallback when native discard is unavailable', () => {
  const existing = reconcileTabs([], [{ ...tab, active: false }], 1, () => 'stable');
  const operation: Operation = {
    operationId: 'operation-fallback', kind: 'lifecycle', targetRecordIds: ['stable'],
    before: [{ recordId: 'stable', browserTabId: 7, windowId: 3, state: 'Active', url: tab.url, workspaceId: null, protection: existing[0]!.protection }],
    after: { state: 'Dormant' }, browserPlan: { action: 'none', tabIds: [] }, status: 'applying', error: null, createdAt: 1, completedAt: null,
  };
  expect(recoverOperation(operation, [{ ...existing[0]!, state: 'Dormant' }], [tab])).toEqual({ status: 'applied', error: null });
});
