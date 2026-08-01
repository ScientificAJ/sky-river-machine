# Technical architecture

## 1. Product boundary

Sky River Machine is a browser extension, not a hosted service. Its source of truth is the user's local extension data. The browser remains responsible for rendering pages and owning live tab state; Sky River Machine stores the durable meaning and recovery information around those tabs.

The architecture has two separate responsibilities:

1. **Understand:** collect permitted tab signals, group related work, find duplicates, and answer searches.
2. **Act safely:** recommend or apply workspace and lifecycle changes under deterministic safety rules.

AI may propose. It never bypasses protection rules or directly performs an unreviewed destructive action.

## 2. Runtime shape

```text
Browser events and user actions
              |
              v
       Browser adapter layer
              |
              v
       Normalized tab event log
              |
      +-------+--------+
      |                |
      v                v
 Durable store     Bounded job queue
      |                |
      |        +-------+--------+
      |        |                |
      v        v                v
 Workspace  Local analysis   Search index
 engine     pipeline         and retrieval
      |        |                |
      +--------+----------------+
               |
               v
       Policy and lifecycle engine
               |
               v
       Browser mutations + UI review
```

### Extension contexts

- **Service worker/background context:** event handling, reconciliation, persistence, queues, policy evaluation, and browser mutations. It must be restart-safe because Manifest V3 service workers are event-driven and can be unloaded.
- **Side panel or extension page:** primary dashboard, workspace review, search, and settings. Use a new extension tab as the fallback where a side panel API is unavailable.
- **Content script, only when permitted:** extracts a bounded, user-controlled page context. It does not run on every page by default.
- **Model worker or offscreen document:** local inference and tokenization when the selected runtime needs DOM-like APIs or an isolated worker. It receives explicit input and returns structured output; it does not own product state.

No important state may live only in a service-worker global variable.

## 3. Stack decision

The implementation baseline is:

- TypeScript for shared types and browser-independent logic.
- A small component UI using Preact or React; choose the smaller bundle unless the project already has a strong reason to use React.
- Vite for bundling, with per-browser manifest builds.
- `webextension-polyfill`-style promise APIs behind the adapter boundary, without exposing browser-specific namespaces to product code.
- IndexedDB for the main local database. Use extension storage for small settings and migration markers, not for the entire tab archive.
- Web Workers/WebAssembly for the tiny local model, with WebGPU as an optional accelerator.
- No server, database, account system, telemetry SDK, or runtime-fetched code.

The exact model runtime is intentionally a replaceable adapter. Do not let a model library define the data model or safety policy.

## 4. Browser adapter contract

Product code calls a narrow interface such as:

```text
queryTabs()
observeTabEvents()
activateTab(tabId)
createTab(url)
closeTab(tabId)
discardTab(tabId)
setAutoDiscardable(tabId, value)
openProductSurface(surface)
getCapabilities()
```

Adapters normalize:

- `chrome` versus `browser` namespaces and promise behavior.
- Manifest and permission differences.
- Side panel/sidebar availability.
- Tab discard and `autoDiscardable` support.
- Tab-group support.
- Incognito/private-window rules.
- Error shapes and unavailable APIs.

Capabilities are explicit, for example:

```text
core: query, observe, create, activate, close, local persistence
enhanced: native discard, tab groups, side panel/sidebar
optional: page extraction, screenshot, browser-specific workspace APIs
```

If an enhanced capability is missing, the product keeps the durable record and explains the degraded behavior. It must never pretend that an unloaded tab was discarded when the browser kept it live.

“Every browser” means broad WebExtensions compatibility with honest capability-based degradation, not one untested universal bundle. Chromium, Firefox, Edge, Safari, and compatible browsers each need a smoke-tested adapter/profile before being called supported.

## 5. Durable event flow

1. A browser event or user action arrives.
2. The adapter converts it into a normalized event.
3. The store applies the event idempotently and increments a revision.
4. The event schedules bounded analysis only if the tab changed enough to matter.
5. Analysis produces suggestions, confidence, evidence, or an isolated error.
6. The UI presents suggestions or the policy engine evaluates an enabled automation rule.
7. A mutation plan is checkpointed.
8. Browser mutations run one at a time per affected window.
9. The store records success, partial failure, and recovery information.

This ordering prevents a browser failure, service-worker shutdown, or model failure from losing the user's workspace state.

## 6. Lifecycle engine

`Active`, `Dormant`, and `Extinct` are product states, not just browser flags.

- **Active:** immediate work or protected live work.
- **Dormant:** the tab remains represented and recoverable; its live page may be discarded when supported.
- **Extinct:** the live browser tab is closed, while its durable record remains restorable.

Deterministic guards run before any score or model output:

- Never mutate the active tab.
- Never override `Never sleep`, `Important`, or `Keep until completed`.
- Avoid audible, capturing, downloading, permission, authentication, payment, form, and likely-unsaved-document tabs unless the user explicitly commands it.
- Never close a tab unless its record and restoration data are checkpointed.
- If a browser API says the operation cannot be performed, keep the record and report the reason.

After guards, a policy score may use recency, activity, page type, workspace need, memory pressure, user corrections, and the user's automation settings. Scores recommend a transition; policy decides whether that transition is allowed.

## 7. Workspace organization

Workspace suggestions are proposals containing:

- Proposed workspace names.
- Tab membership changes.
- Confidence and evidence.
- Ambiguous tabs requiring review.
- Duplicate candidates.
- A complete reversible operation plan.

The review surface supports rename, move, merge, split, reject, leave unchanged, and apply. Applying a proposal is a transaction over the local store followed by browser mutations. Partial browser failure leaves the proposal recoverable and visible.

## 8. Memory strategy

- Keep metadata and page-derived context separate from live tab content.
- Use a bounded analysis queue with one small model instance by default.
- Process new, active, and recently changed tabs before dormant archives.
- Analyze dormant/extinct records lazily when search or review needs them.
- Maintain a bounded in-memory cache and rebuild it from IndexedDB after restart.
- Render large lists with windowing/pagination.
- Coalesce repeated tab events before analysis.
- Checkpoint before close/archive mutations.

The extension must reduce detail and defer work under pressure before it risks freezing the browser. It must never respond to a large collection by loading every page or creating one permanent job per tab.

## 9. Architecture decisions

### ADR-001: local-only by default

All browsing context and model inputs stay on the device. This removes account, sync, server, and network failure paths. The cost is local storage management and lower model capacity.

### ADR-002: browser-only inference first

The first model runner lives inside extension-compatible workers/WASM. A native companion is deferred because it adds installation, signing, permission, update, and cross-browser complexity. The runner interface leaves room for it later.

### ADR-003: deterministic safety before AI

Safety and protection rules are easier to test and explain than a model. Model output can influence organization and ranking, but cannot override hard guards.

### ADR-004: IndexedDB for the archive

The archive can exceed small key/value settings quotas and needs indexed queries, migrations, and atomic transactions. Browser extension storage remains useful for small preferences and bootstrap state.
