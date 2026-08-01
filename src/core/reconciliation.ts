import type { NormalizedTab, TabRecord } from '../shared/types';

type IdFactory = () => string;

function sameObservedData(record: TabRecord, tab: NormalizedTab): boolean {
  return record.browserTabId === tab.browserTabId &&
    record.windowId === tab.windowId &&
    record.title === tab.title &&
    record.url === tab.url &&
    record.domain === tab.domain &&
    record.faviconRef === tab.faviconRef &&
    record.signals.active === tab.active &&
    record.signals.audible === tab.audible &&
    record.signals.discarded === tab.discarded &&
    record.signals.loading === tab.loading &&
    record.signals.pinned === tab.pinned;
}

function createRecord(tab: NormalizedTab, now: number, idFactory: IdFactory): TabRecord {
  return {
    recordId: idFactory(),
    browserTabId: tab.browserTabId,
    windowId: tab.windowId,
    workspaceId: null,
    state: 'Active',
    url: tab.url,
    title: tab.title,
    domain: tab.domain,
    ...(tab.faviconRef ? { faviconRef: tab.faviconRef } : {}),
    signals: {
      active: tab.active,
      audible: tab.audible,
      discarded: tab.discarded,
      loading: tab.loading,
      pinned: tab.pinned,
    },
    protection: { important: false, neverSleep: false, keepUntilCompleted: false },
    createdAt: now,
    updatedAt: now,
    lastActivatedAt: tab.active ? now : null,
    lastObservedAt: now,
    revision: 1,
  };
}

export function reconcileTabs(
  existing: TabRecord[],
  tabs: NormalizedTab[],
  now: number,
  idFactory: IdFactory = () => crypto.randomUUID(),
): TabRecord[] {
  const byBrowserId = new Map(existing.map((record) => [`${record.windowId}:${record.browserTabId}`, record]));
  const seen = new Set<string>();
  const records = tabs.map((tab) => {
    const key = `${tab.windowId}:${tab.browserTabId}`;
    const previous = byBrowserId.get(key);
    seen.add(key);
    if (!previous) return createRecord(tab, now, idFactory);
    const nextState: TabRecord['state'] = previous.state === 'Dormant' && !tab.active ? 'Dormant' : 'Active';
    if (sameObservedData(previous, tab) && previous.state === nextState) {
      return { ...previous, lastObservedAt: now };
    }
    return {
      ...previous,
      browserTabId: tab.browserTabId,
      windowId: tab.windowId,
      state: nextState,
      url: tab.url,
      title: tab.title,
      domain: tab.domain,
      faviconRef: tab.faviconRef,
      signals: {
        active: tab.active,
        audible: tab.audible,
        discarded: tab.discarded,
        loading: tab.loading,
        pinned: tab.pinned,
      },
      updatedAt: now,
      lastActivatedAt: tab.active && !previous.signals.active ? now : previous.lastActivatedAt,
      lastObservedAt: now,
      revision: previous.revision + 1,
    };
  });

  for (const record of existing) {
    const key = `${record.windowId}:${record.browserTabId}`;
    if (!seen.has(key)) {
      records.push(record.state === 'Extinct'
        ? record
        : { ...record, browserTabId: null, windowId: null, state: 'Extinct', updatedAt: now, lastObservedAt: now, revision: record.revision + 1 });
    }
  }
  return records;
}
