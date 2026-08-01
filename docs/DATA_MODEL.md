# Data model and persistence

## 1. Storage rules

The local database is the source of truth. Browser tab IDs are temporary handles and must never be the identity of a tab record because browsers can reuse or remove them.

Use a schema version and migrations. Every mutation has a revision and an operation ID so replaying an event is safe.

Do not store full page bodies by default. Store the minimum context needed for the enabled feature and let the user choose whether page excerpts or summaries are retained.

## 2. Core entities

### `TabRecord`

```text
recordId: stable local UUID
browserTabId: current browser tab ID or null
windowId: current browser window ID or null
workspaceId: workspace UUID or null
state: Active | Dormant | Extinct
url: normalized URL
title: last observed title
domain: normalized registrable domain
faviconRef: optional local/browser reference
context: bounded title/meta/excerpt/summary fields
signals: recency, audible, loading, discarded, form-risk, document-risk
protection: important, neverSleep, keepUntilCompleted, customRule
analysis: labels, topics, relatedRecords, confidence, modelVersion
search: normalized terms and optional local embedding reference
createdAt: timestamp
updatedAt: timestamp
lastActivatedAt: timestamp or null
lastObservedAt: timestamp
revision: integer
```

### `Workspace`

```text
workspaceId: stable local UUID
name: user-visible name
description: optional short explanation
color: accessible visual token
tabRecordIds: derived/indexed membership, not the only membership source
createdAt: timestamp
updatedAt: timestamp
archivedAt: timestamp or null
```

### `SuggestionBatch`

```text
suggestionId: stable UUID
sourceRevision: database revision used for analysis
workspaceProposals: proposed names and memberships
duplicateCandidates: record pairs/groups
uncertainRecords: records requiring user choice
evidence: bounded human-readable reasons
confidence: per proposal, never a safety override
status: pending | accepted | rejected | partiallyApplied | expired
createdAt: timestamp
```

### `Operation`

```text
operationId: stable UUID
kind: organize | lifecycle | restore | delete | protectionChange
targetRecordIds: affected records
before: minimal reversible snapshot
after: intended local state
browserPlan: intended browser mutations
status: planned | applying | applied | partial | failed | undone
error: sanitized local error information
createdAt: timestamp
completedAt: timestamp or null
```

### `UserCorrection`

```text
correctionId: stable UUID
kind: movedTab | renamedWorkspace | rejectedSuggestion | protectedTab | duplicateDecision
recordIds: affected records
features: bounded local signals that explain the correction
createdAt: timestamp
```

Corrections are initially used as local retrieval/ranking features. Do not begin with opaque online training.

### `Settings`

Settings include automation mode, analysis scope, page-context permission, model choice, memory budget, protected URL patterns, private-window behavior, retention, and export/delete actions. Settings are user intent and must be separated from derived analysis.

## 3. Indexes

At minimum, index:

- `workspaceId + state`
- `state + updatedAt`
- normalized URL hash
- domain
- last activation time
- protection flags
- search terms
- operation status

An inverted text index is local and rebuildable. It is derived data, so corruption should trigger a rebuild rather than data loss.

## 4. State transitions

```text
Active <-> Dormant
Active <-> Extinct
Dormant <-> Extinct
```

Every transition records:

- Trigger: user, policy, browser, or recovery.
- Reason and evidence.
- Previous state.
- New state.
- Browser result.
- Whether restoration is available.

`Extinct` is not deletion. Deletion is a separate explicit operation with confirmation and retention behavior.

## 5. Reconciliation

On startup, browser focus changes, extension update, and periodic alarm:

1. Query current browser tabs.
2. Match them to records using browser ID first, then a short-lived identity hint such as normalized URL/window/creation time.
3. Create records for unknown tabs.
4. Mark missing live tabs as `Extinct` only when the close event or reconciliation evidence is reliable.
5. Preserve uncertain matches for review instead of merging two possible histories.

The reconciliation process is idempotent and bounded.

## 6. Recovery and deletion

- Crash recovery resumes `planned` and `applying` operations after checking actual browser state.
- Restore creates a browser tab from the stored URL and reattaches the record.
- Deleting a record removes its context, search terms, analysis, and correction references according to the user's retention setting.
- “Delete everything” clears the database, derived indexes, model cache, and pending operations; it does not claim to erase browser history or pages owned by the browser.
- Export is a local file operation and must warn that it may contain sensitive browsing context.
