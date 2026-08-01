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
  get(tabId: number): Promise<RawTab>;
  update(tabId: number, properties: { active?: boolean }): Promise<RawTab>;
  create(properties: { url: string }): Promise<RawTab>;
  remove(tabId: number): Promise<void>;
  discard?(tabId: number): Promise<RawTab | void>;
  executeScript?(tabId: number, details: { code: string }): Promise<Array<{ result?: unknown }> >;
  onCreated?: { addListener(listener: (tab: RawTab) => void): void };
  onUpdated?: { addListener(listener: (tabId: number, changeInfo: unknown, tab: RawTab) => void): void };
  onActivated?: { addListener(listener: (info: { tabId: number; windowId: number }) => void): void };
  onRemoved?: { addListener(listener: (tabId: number, info: { windowId: number }) => void): void };
};

export type RawScriptingApi = {
  executeScript(details: { target: { tabId: number }; func: () => unknown }): Promise<Array<{ result?: unknown }> >;
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
  scripting?: RawScriptingApi;
  runtime: RawRuntimeApi;
};
