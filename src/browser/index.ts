import type { BrowserAdapter } from './contract';
import { createChromiumAdapter } from './chromium';
import { createFirefoxAdapter } from './firefox';

export function createBrowserAdapter(): BrowserAdapter {
  return 'browser' in globalThis ? createFirefoxAdapter() : createChromiumAdapter();
}
