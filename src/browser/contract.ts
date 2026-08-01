import type { NormalizedTab } from '../shared/types';

export type BrowserEvent = {
  kind: 'created' | 'updated' | 'activated' | 'removed';
  tab?: NormalizedTab;
  browserTabId?: number;
};

export type BrowserCapabilities = {
  queryTabs: true;
  observeTabEvents: boolean;
};

export type BrowserAdapter = {
  queryTabs(): Promise<NormalizedTab[]>;
  observeTabEvents(listener: (event: BrowserEvent) => void): void;
  getCapabilities(): BrowserCapabilities;
};
