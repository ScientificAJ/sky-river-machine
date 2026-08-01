import { afterEach, expect, test } from 'vitest';
import { createChromiumAdapter } from '../src/browser/chromium';
import { createFirefoxAdapter } from '../src/browser/firefox';

const rawTabs = [
  { id: 3, windowId: 4, windowType: 'normal', title: 'Fictional tab', url: 'https://example.com/work', active: true, status: 'complete' },
  { id: 5, windowId: 4, windowType: 'normal', incognito: true, title: 'Private fictional tab', url: 'https://example.com/private' },
];

function fakeApi() {
  const event = { addListener: () => undefined };
  return {
    tabs: {
      query: async () => rawTabs,
      get: async () => rawTabs[0],
      update: async () => rawTabs[0],
      create: async () => ({ ...rawTabs[0], id: 8 }),
      remove: async () => undefined,
      onCreated: event, onUpdated: event, onActivated: event, onRemoved: event,
    },
    runtime: { sendMessage: async () => undefined },
  };
}

afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
  delete (globalThis as { browser?: unknown }).browser;
});

test.each([
  ['chromium', 'chrome', createChromiumAdapter],
  ['firefox', 'browser', createFirefoxAdapter],
] as const)('%s adapter shares normalized inventory behavior', async (_name, namespace, create) => {
  (globalThis as Record<string, unknown>)[namespace] = fakeApi();
  const adapter = create();
  await expect(adapter.queryTabs()).resolves.toMatchObject([{ browserTabId: 3, windowId: 4, domain: 'example.com', title: 'Fictional tab' }]);
  expect((await adapter.queryTabs()).length).toBe(1);
  expect(adapter.getCapabilities().queryTabs).toBe(true);
});

test.each([
  ['chromium', 'chrome', createChromiumAdapter],
  ['firefox', 'browser', createFirefoxAdapter],
] as const)('%s adapter exposes safe missing-capability fallbacks', async (_name, namespace, create) => {
  (globalThis as Record<string, unknown>)[namespace] = fakeApi();
  const adapter = create();
  expect(adapter.getCapabilities().nativeDiscard).toBe(false);
  expect(adapter.getCapabilities().visibleContext).toBe(false);
  await expect(adapter.discardTab(3)).resolves.toBeNull();
  await expect(adapter.extractVisibleContext(3)).rejects.toThrow('Visible page context is unavailable');
});
