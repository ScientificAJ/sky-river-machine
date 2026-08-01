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

export type Workspace = {
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
};

export type InventoryMessage =
  | { type: 'refresh-inventory' }
  | { type: 'list-workspaces' }
  | { type: 'create-workspace'; name: string }
  | { type: 'rename-workspace'; workspaceId: string; name: string }
  | { type: 'archive-workspace'; workspaceId: string }
  | { type: 'move-record'; recordId: string; workspaceId: string | null }
  | { type: 'set-protection'; recordId: string; important: boolean };

export type InventoryResponse =
  | { ok: true; records: TabRecord[] }
  | { ok: true; workspaces: Workspace[] }
  | { ok: true; workspace: Workspace }
  | { ok: true; records: TabRecord[]; workspaces: Workspace[] }
  | { ok: false; error: string };
