import type { TabRecord } from '../shared/types';

export type MutationKind = 'discard' | 'archive' | 'close';

export type MutationDecision = { allowed: true } | { allowed: false; reason: string };

export function canMutateTab(record: TabRecord, kind: MutationKind): MutationDecision {
  if (record.state === 'Extinct') return { allowed: false, reason: 'This tab is already archived and has no live browser handle.' };
  if (record.signals.active) return { allowed: false, reason: 'The active tab is always protected.' };
  if (record.protection.important || record.protection.neverSleep || record.protection.keepUntilCompleted) {
    return { allowed: false, reason: 'The user protected this tab.' };
  }
  if (record.signals.audible) return { allowed: false, reason: 'An audible tab needs explicit user review.' };
  if (kind === 'close' && !record.url) return { allowed: false, reason: 'This tab has no restorable URL.' };
  return { allowed: true };
}
