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
  context?: { level: 'metadata' | 'visible'; headings: string[]; description: string; storedAt: number };
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

export type OperationStatus = 'planned' | 'applying' | 'applied' | 'partial' | 'failed' | 'undone';

export type Operation = {
  operationId: string;
  kind: 'lifecycle' | 'restore' | 'delete' | 'protectionChange' | 'organize';
  targetRecordIds: string[];
  before: Array<Pick<TabRecord, 'recordId' | 'browserTabId' | 'windowId' | 'state' | 'url' | 'workspaceId' | 'protection'>>;
  after: Partial<Pick<TabRecord, 'state' | 'workspaceId' | 'protection'>>;
  browserPlan: { action: 'activate' | 'create' | 'discard' | 'close' | 'none'; tabIds: number[] };
  status: OperationStatus;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
};

export type SuggestionBatch = {
  suggestionId: string;
  sourceRevision: number;
  workspaceProposals: Array<{ name: string; recordIds: string[]; confidence: number; evidence: string[] }>;
  duplicateCandidates: Array<{ recordIds: string[]; evidence: string[] }>;
  uncertainRecords: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'partiallyApplied' | 'expired';
  createdAt: number;
  analysis?: { modelId: string; modelVersion: string; artifactChecksum: string; strategyVersion: string; confidence: number };
};

export type UserCorrection = {
  correctionId: string;
  kind: 'movedTab' | 'renamedWorkspace' | 'rejectedSuggestion' | 'protectedTab' | 'duplicateDecision';
  recordIds: string[];
  features: string[];
  createdAt: number;
};

export type Settings = {
  analysisScope: 'metadata';
  automation: 'approval-first';
  pageContextEnabled: false;
  memoryBudget: 'standard';
  privateWindows: false;
};

export type InventoryMessage =
  | { type: 'refresh-inventory' }
  | { type: 'search-metadata'; query: string; offset: number; limit: number }
  | { type: 'list-workspaces' }
  | { type: 'create-workspace'; name: string }
  | { type: 'rename-workspace'; workspaceId: string; name: string }
  | { type: 'archive-workspace'; workspaceId: string }
  | { type: 'delete-workspace'; workspaceId: string; confirm: boolean }
  | { type: 'move-record'; recordId: string; workspaceId: string | null }
  | { type: 'set-protection'; recordId: string; important?: boolean; neverSleep?: boolean; keepUntilCompleted?: boolean }
  | { type: 'lifecycle'; recordId: string; action: 'wake' | 'rest' | 'archive' | 'restore'; confirm?: boolean }
  | { type: 'undo-operation'; operationId: string }
  | { type: 'delete-record'; recordId: string; confirm: boolean }
  | { type: 'get-recovery' }
  | { type: 'get-suggestions' }
  | { type: 'organize-heuristically' }
  | { type: 'review-suggestion'; suggestionId: string; workspaceProposals: Array<{ name: string; recordIds: string[] }> }
  | { type: 'apply-suggestion'; suggestionId: string }
  | { type: 'reject-suggestion'; suggestionId: string }
  | { type: 'duplicate-decision'; suggestionId: string; recordIds: string[]; decision: 'keep' | 'archive' | 'dismiss'; confirm?: boolean }
  | { type: 'extract-visible-context'; recordId: string; confirm: boolean }
  | { type: 'delete-all'; confirm: boolean }
  | { type: 'export-data' };

export type InventoryResponse =
  | { ok: true; records: TabRecord[] }
  | { ok: true; records: TabRecord[]; total: number }
  | { ok: true; workspaces: Workspace[] }
  | { ok: true; workspace: Workspace }
  | { ok: true; records: TabRecord[]; workspaces: Workspace[] }
  | { ok: true; operation: Operation; records: TabRecord[] }
  | { ok: true; operation: Operation; records: TabRecord[]; total: number }
  | { ok: true; operation: Operation; records: TabRecord[]; workspaces: Workspace[] }
  | { ok: true; operation: Operation; records: TabRecord[]; total: number; workspaces: Workspace[] }
  | { ok: true; suggestions: SuggestionBatch[] }
  | { ok: true; recovery: Operation[] }
  | { ok: true; data: string }
  | { ok: true; context: NonNullable<TabRecord['context']>; records: TabRecord[] }
  | { ok: false; error: string };
