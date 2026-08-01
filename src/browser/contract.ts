import type { NormalizedTab } from '../shared/types';

export type BrowserEvent = {
  kind: 'created' | 'updated' | 'activated' | 'removed';
  tab?: NormalizedTab;
  browserTabId?: number;
};

export type BrowserCapabilities = {
  queryTabs: true;
  observeTabEvents: boolean;
  activateTab: true;
  createTab: true;
  closeTab: true;
  nativeDiscard: boolean;
  visibleContext: boolean;
};

export type BrowserAdapter = {
  queryTabs(): Promise<NormalizedTab[]>;
  observeTabEvents(listener: (event: BrowserEvent) => void): void;
  getCapabilities(): BrowserCapabilities;
  getTab(tabId: number): Promise<NormalizedTab | null>;
  activateTab(tabId: number): Promise<NormalizedTab>;
  createTab(url: string): Promise<NormalizedTab>;
  closeTab(tabId: number): Promise<void>;
  discardTab(tabId: number): Promise<NormalizedTab | null>;
  extractVisibleContext(tabId: number): Promise<{ headings: string[]; description: string }>;
};
