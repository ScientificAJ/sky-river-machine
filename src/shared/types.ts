export type LifecycleState = 'Active' | 'Dormant' | 'Extinct';

export type NormalizedTab = {
  browserTabId: number;
  windowId: number;
  title: string;
  url: string;
  domain: string;
  faviconRef?: string;
  active: boolean;
  audible: boolean;
  discarded: boolean;
  loading: boolean;
  pinned: boolean;
};

export type TabRecord = {
  recordId: string;
  browserTabId: number | null;
  windowId: number | null;
  workspaceId: string | null;
  state: LifecycleState;
  url: string;
  title: string;
  domain: string;
  faviconRef?: string;
  signals: {
    active: boolean;
    audible: boolean;
    discarded: boolean;
    loading: boolean;
    pinned: boolean;
  };
  protection: {
    important: boolean;
    neverSleep: boolean;
    keepUntilCompleted: boolean;
  };
  createdAt: number;
  updatedAt: number;
  lastActivatedAt: number | null;
  lastObservedAt: number;
  revision: number;
};

export type InventoryMessage = { type: 'refresh-inventory' };

export type InventoryResponse =
  | { ok: true; records: TabRecord[] }
  | { ok: false; error: string };
