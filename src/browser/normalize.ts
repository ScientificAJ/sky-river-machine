import type { NormalizedTab } from '../shared/types';
import type { RawTab } from './raw';

export function normalizeTab(tab: RawTab, assumeNormalWindow = false): NormalizedTab | null {
  if (tab.id === undefined || tab.windowId === undefined || tab.incognito || (tab.windowType !== 'normal' && !(assumeNormalWindow && tab.windowType === undefined))) return null;

  const url = tab.url?.trim() || 'about:blank';
  if (/^(chrome|moz)-extension:\/\//i.test(url)) return null;
  let domain = 'local';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname || parsed.protocol.replace(':', '') || 'local';
  } catch {
    domain = 'local';
  }

  return {
    browserTabId: tab.id,
    windowId: tab.windowId,
    title: tab.title?.trim() || 'Untitled tab',
    url,
    domain,
    ...(tab.favIconUrl ? { faviconRef: tab.favIconUrl } : {}),
    active: tab.active === true,
    audible: tab.audible === true,
    discarded: tab.discarded === true,
    loading: tab.status === 'loading',
    pinned: tab.pinned === true,
  };
}
