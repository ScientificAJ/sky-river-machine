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
    getCapabilities: () => ({ queryTabs: true, observeTabEvents: true, activateTab: true, createTab: true, closeTab: true, nativeDiscard: Boolean(browser.tabs.discard), visibleContext: Boolean(browser.scripting) }),
    async getTab(tabId) { return normalizeTab(await browser.tabs.get(tabId)); },
    async activateTab(tabId) { return normalizeTab(await browser.tabs.update(tabId, { active: true }))!; },
    async createTab(url) { return normalizeTab(await browser.tabs.create({ url }))!; },
    async closeTab(tabId) { await browser.tabs.remove(tabId); },
    async discardTab(tabId) {
      if (!browser.tabs.discard) return null;
      const discarded = await browser.tabs.discard(tabId);
      return discarded ? normalizeTab(discarded) : null;
    },
    async extractVisibleContext(tabId) {
      if (!browser.scripting) throw new Error('Visible page context is unavailable');
      const [result] = await browser.scripting.executeScript({ target: { tabId }, func: () => ({ headings: [...document.querySelectorAll('h1,h2')].map((node) => (node.textContent || '').trim()).filter(Boolean).slice(0, 8), description: (document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim().slice(0, 500) }) });
      const value = result?.result;
      if (!value || typeof value !== 'object') throw new Error('Visible page context was malformed');
      return { headings: Array.isArray((value as { headings?: unknown }).headings) ? (value as { headings: unknown[] }).headings.filter((item): item is string => typeof item === 'string').slice(0, 8) : [], description: typeof (value as { description?: unknown }).description === 'string' ? (value as { description: string }).description.slice(0, 500) : '' };
    },
  };
}
