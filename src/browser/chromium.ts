import type { BrowserAdapter, BrowserEvent } from './contract';
import { normalizeTab } from './normalize';
import type { RawBrowserApi, RawTab } from './raw';

function api(): RawBrowserApi {
  const value = (globalThis as unknown as { chrome?: RawBrowserApi }).chrome;
  if (!value) throw new Error('Chromium browser API is unavailable');
  return value;
}

export function createChromiumAdapter(): BrowserAdapter {
  const browser = api();
  return {
    async queryTabs() {
      const tabs = await browser.tabs.query({ windowType: 'normal' });
      return tabs.flatMap((tab) => {
        const normalized = normalizeTab(tab);
        return normalized ? [normalized] : [];
      });
    },
    observeTabEvents(listener: (event: BrowserEvent) => void) {
      browser.tabs.onCreated?.addListener((tab: RawTab) => {
        const normalized = normalizeTab(tab);
        if (normalized) listener({ kind: 'created', tab: normalized });
      });
      browser.tabs.onUpdated?.addListener((_tabId, _changeInfo, tab) => {
        const normalized = normalizeTab(tab);
        if (normalized) listener({ kind: 'updated', tab: normalized });
      });
      browser.tabs.onActivated?.addListener(({ tabId }) => listener({ kind: 'activated', browserTabId: tabId }));
      browser.tabs.onRemoved?.addListener((tabId) => listener({ kind: 'removed', browserTabId: tabId }));
    },
    getCapabilities: () => ({ queryTabs: true, observeTabEvents: true }),
  };
}
