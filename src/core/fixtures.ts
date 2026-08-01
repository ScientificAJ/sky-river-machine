import type { TabRecord } from '../shared/types';

export function syntheticRecords(count: number): TabRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const state: TabRecord['state'] = index % 5 === 0 ? 'Extinct' : index % 3 === 0 ? 'Dormant' : 'Active';
    return {
    recordId: `synthetic-${index}`,
    browserTabId: index + 1,
    windowId: 1,
    workspaceId: null,
    state,
    url: `https://example.${index % 2 ? 'com' : 'org'}/fictional/work/${index}`,
    title: `Fictional tab ${index}`,
    domain: index % 2 ? 'example.com' : 'example.org',
    signals: { active: index === 0, audible: false, discarded: index % 3 === 0, loading: false, pinned: false },
    protection: { important: index % 17 === 0, neverSleep: false, keepUntilCompleted: false },
    createdAt: 1,
    updatedAt: 1,
    lastActivatedAt: index === 0 ? 1 : null,
    lastObservedAt: 1,
    revision: 1,
    };
  });
}
