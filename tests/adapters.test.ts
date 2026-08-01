import { afterEach, expect, test } from 'vitest';
import { createChromiumAdapter } from '../src/browser/chromium';
import { createFirefoxAdapter } from '../src/browser/firefox';
import type { RawTab } from '../src/browser/raw';

const rawTabs: RawTab[] = [
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

test('Firefox keeps normal tabs when Firefox omits windowType after a normal-window query', async () => {
  const event = { addListener: () => undefined };
  (globalThis as Record<string, unknown>).browser = {
    tabs: {
      query: async () => [{ id: 9, windowId: 2, title: 'Fictional Firefox tab', url: 'https://example.org/work', active: true, incognito: false, status: 'complete' }],
      get: async () => ({ id: 9, windowId: 2, title: 'Fictional Firefox tab', url: 'https://example.org/work', active: true, incognito: false, status: 'complete' }),
      update: async () => ({ id: 9, windowId: 2, title: 'Fictional Firefox tab', url: 'https://example.org/work', active: true, incognito: false, status: 'complete' }),
      create: async () => ({ id: 10, windowId: 2, title: 'Fictional Firefox tab', url: 'https://example.org/work', active: true, incognito: false, status: 'complete' }),
      remove: async () => undefined,
      onCreated: event, onUpdated: event, onActivated: event, onRemoved: event,
    },
    runtime: { sendMessage: async () => undefined },
  };
  await expect(createFirefoxAdapter().queryTabs()).resolves.toMatchObject([{ browserTabId: 9, title: 'Fictional Firefox tab' }]);
});

test('Firefox accepts a native discard API that resolves without a tab payload', async () => {
  const fake = fakeApi();
  (fake.tabs as { discard?: () => Promise<undefined> }).discard = async () => undefined;
  (globalThis as Record<string, unknown>).browser = fake;
  const adapter = createFirefoxAdapter();
  expect(adapter.getCapabilities().nativeDiscard).toBe(true);
  await expect(adapter.discardTab(3)).resolves.toBeNull();
});

test('extension-owned pages are not added to the user tab inventory', async () => {
  const fake = fakeApi();
  fake.tabs.query = async () => [...rawTabs, { id: 12, windowId: 4, windowType: 'normal', incognito: false, active: false, status: 'complete', title: 'Extension UI', url: 'moz-extension://fictional/extension.html' }];
  (globalThis as Record<string, unknown>).browser = fake;
  expect(await createFirefoxAdapter().queryTabs()).toHaveLength(1);
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
