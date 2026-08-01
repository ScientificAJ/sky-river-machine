export type RawTab = {
  id?: number;
  windowId?: number;
  windowType?: string;
  incognito?: boolean;
  title?: string;
  url?: string;
  favIconUrl?: string;
  active?: boolean;
  audible?: boolean;
  discarded?: boolean;
  pinned?: boolean;
  status?: string;
};

export type RawTabsApi = {
  query(queryInfo: { windowType: string }): Promise<RawTab[]>;
  onCreated?: { addListener(listener: (tab: RawTab) => void): void };
  onUpdated?: { addListener(listener: (tabId: number, changeInfo: unknown, tab: RawTab) => void): void };
  onActivated?: { addListener(listener: (info: { tabId: number; windowId: number }) => void): void };
  onRemoved?: { addListener(listener: (tabId: number, info: { windowId: number }) => void): void };
};

export type RawRuntimeApi = {
  sendMessage(message: unknown): Promise<unknown>;
  onMessage?: {
    addListener(
      listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | void,
    ): void;
  };
};

export type RawBrowserApi = {
  tabs: RawTabsApi;
  runtime: RawRuntimeApi;
};
