# Testing, performance, and release gates

## 1. Test layers

### Pure logic

Test URL normalization, duplicate scoring, workspace ranking, lifecycle guards, policy evaluation, migrations, search tokenization, and operation replay without a browser.

### Adapter contract tests

Run the same normalized behavior tests against Chromium and Firefox adapters. Include missing-capability profiles so fallback behavior is tested rather than assumed.

### Browser integration

Verify:

- Tab discovery and event reconciliation.
- Active/Dormant/Extinct transitions.
- Browser-native discard where available.
- Extinct close and restore.
- Side panel and fallback extension-tab surfaces.
- Service-worker restart during queued work.
- Private-window isolation.
- Browser update and extension reload recovery.

### UI checks

Exercise keyboard navigation, screen readers where available, reduced motion, large workspaces, errors, partial failures, empty states, and confirmation text.

### Model evaluation

Maintain a small local fixture set containing unrelated same-domain tabs, related cross-domain tabs, forms, dashboards, documents, media, duplicates, sensitive-looking pages, and ambiguous projects. Measure useful grouping, false grouping, protected-page safety, latency, and memory.

## 2. Invariants

These must remain true:

- No protected tab is automatically moved to a disallowed state.
- No browser close occurs without a durable restoration record.
- A malformed model response cannot call a browser API.
- Replaying an event or operation does not duplicate records or close a different tab.
- Extinct records remain searchable and restorable until explicitly deleted.
- A browser API failure cannot delete the local record.
- All data remains local in offline mode.
- The UI never renders the entire archive at once.

## 3. Performance targets

Targets are measured on a low-end CPU-only profile and a normal desktop profile, not only a developer machine.

Initial targets:

- Extension idle overhead: negligible and bounded; no permanent polling loop.
- First dashboard render: usable before archive analysis finishes.
- Tab inventory: incremental and responsive for 100, 1,000, and 10,000 records.
- Analysis: bounded concurrency, cancelable work, and no unbounded promise/memory growth.
- Search: interactive over the local index without loading full records into the UI.
- Restore: immediate browser action followed by background metadata reconciliation.
- Model fallback: product remains functional with no GPU and no model.

Record actual measurements in release notes. Do not replace evidence with “works on my machine.”

## 4. Memory and queue budgets

Use configurable budgets with safe defaults:

- One loaded model instance.
- One active model task initially.
- Small bounded batches for analysis.
- Maximum pending jobs with coalescing per record.
- Maximum in-memory record cache.
- Maximum retained excerpt/summary size per record.
- UI window size independent of archive size.

When a budget is reached, defer low-priority work, evict derived caches, or fall back to heuristics. Never drop durable user state silently.

## 5. Failure matrix

Test failures during:

- Model load, inference, validation, and cancellation.
- IndexedDB transaction and migration.
- Service-worker shutdown.
- Tab close, restore, discard, navigation, and permission errors.
- Browser restart and extension update.
- Storage quota exhaustion.
- Corrupt derived search index.
- User cancellation halfway through a proposal.

Each failure should produce one of: retry, safe defer, partial result with recovery, or explicit user action. “Continue silently” is not a recovery strategy for a destructive operation.

## 6. Browser support gates

A browser is supported only when it passes:

1. Installation and upgrade smoke test.
2. Tab inventory/reconciliation test.
3. Search and restore test.
4. Dormant behavior test or documented capability fallback.
5. Automation safety test.
6. Private-window and permission behavior review.
7. Low-resource test.

Publish the support matrix with browser version, supported capabilities, known limitations, and test date.

## 7. Release stages

### Stage 1: local foundation

Browser adapter, IndexedDB schema, inventory, reconciliation, search by metadata, workspace editing, and explicit restore/delete.

### Stage 2: lifecycle safety

Active/Dormant/Extinct state machine, protection rules, native discard adapter, checkpointed operations, recovery UI, and automation settings.

### Stage 3: local intelligence

Heuristic grouping, duplicate hints, tiny-model adapter, evidence display, and correction features.

### Stage 4: scale and polish

Large-archive performance, lazy summaries, optional page-context analysis, browser capability parity, accessibility review, and measured release documentation.

The product is not ready merely because the model can classify a few tabs. It is ready when organization, lifecycle, privacy, recovery, and scale work together safely.
