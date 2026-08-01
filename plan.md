# Sky River Machine implementation plan

> Status: implementation roadmap. The repository now contains local slices through the foundation, lifecycle, bounded analysis fallback, privacy controls, UI surfaces, synthetic scale fixtures, and a reproducible local-model evaluation gate. Real-browser smoke, representative release performance/fault injection, and a passing local-model artifact remain separately recorded in [`docs/RELEASE_STATUS.md`](docs/RELEASE_STATUS.md); no browser support or release claim is implied here.

## 1. What this plan is for

This file turns the product and engineering contracts in [`README.md`](README.md) and [`docs/`](docs/README.md) into an ordered implementation path.

It is written for a developer who may be new to browser extensions, IndexedDB, local models, and recovery-oriented systems. Follow it from top to bottom. Do not try to build the model, the final visual polish, or automatic tab actions first. Begin with the smallest end-to-end path that proves the extension can observe tabs, store durable records, survive a restart, and show the truth back to the user.

This plan is a navigation and sequencing document. It does not replace the source documents. If this plan and a source document disagree, stop and resolve the disagreement in the governing source before implementing the behavior.

### The most important release distinction

The implementation will be built in stages, but an early stage is not the “first useful release” promised in the README.

- The stages are engineering checkpoints that let us test one safe layer at a time.
- The first useful release is reached only when the complete loop in [`README.md` under “First useful release scope”](README.md#first-useful-release-scope) works together: organization, review, lifecycle management, protection, duplicate detection, search, corrections, tested local inference with a safe model-unavailable fallback, restoration, bounded resource use, recovery, and tested browser adapters.
- A read-only tab list, a workspace mockup, or a model demo is a development milestone, not a releasable Sky River Machine product.

The documented release-stage order comes from [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md#7-release-stages): local foundation, lifecycle safety, local intelligence, then scale and polish.

## 2. Read these sources before changing code

Do not read every document before every small edit. Use this map to know which contract governs the work you are touching.

| Source | What it governs | Re-read it when |
| --- | --- | --- |
| [`README.md`](README.md) | Product promise, intended user experience, lifecycle meaning, first useful release scope, and honest project status | Changing scope, naming a release, or deciding whether a feature is core |
| [`docs/README.md`](docs/README.md) | Documentation map, fixed decisions, deliberately open decisions, and official platform-reference starting points | Making a new architectural decision or checking whether a question is already settled |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Runtime contexts, adapters, event flow, lifecycle policy boundary, memory strategy, and architecture decisions | Editing background logic, adapters, queues, browser mutations, or runtime boundaries |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Durable entities, identity, indexes, revisions, operations, reconciliation, recovery, deletion, and migration rules | Editing IndexedDB, record types, state transitions, restore behavior, or data deletion |
| [`docs/AI_PIPELINE.md`](docs/AI_PIPELINE.md) | Context levels, normalization, heuristics, model tasks, queueing, search, duplicates, corrections, and uncertainty | Editing any analysis, prompt, model, search, duplicate, or learning behavior |
| [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md) | Local-only promise, data inventory, permissions, threat model, private-window rules, encryption boundary, and deletion transparency | Adding a permission, reading page content, storing new data, exporting data, or handling extension messages |
| [`docs/DESIGN.md`](docs/DESIGN.md) | UI hierarchy, interaction patterns, visual language, accessibility, responsive behavior, user-facing states, and copy | Building or changing a visible surface or interaction |
| [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md) | Test layers, invariants, performance budgets, failure matrix, browser gates, and release stages | Choosing verification, setting a performance budget, or deciding whether a browser/release is supported |

### Authority by question

When a question crosses documents, use this order:

1. Product scope and meaning: `README.md`.
2. Runtime behavior and capability boundaries: `docs/ARCHITECTURE.md`.
3. Persistence, identity, operation, and recovery truth: `docs/DATA_MODEL.md`.
4. Model and analysis behavior: `docs/AI_PIPELINE.md`.
5. Data access and permission limits: `docs/PRIVACY_SECURITY.md`.
6. Presentation and interaction: `docs/DESIGN.md`.
7. Proof and release claims: `docs/TESTING_PERFORMANCE.md`.

The design document explicitly does not create product capabilities, weaken safety rules, or expand permissions. See [`docs/DESIGN.md` under “Purpose and authority”](docs/DESIGN.md#1-purpose-and-authority).

## 3. Fixed contracts that every phase must preserve

These are not optional enhancements. Put them in code review checklists and test names.

### 3.1 Product control

- The extension assists; the user owns the browsing session.
- Suggestions must be reviewable before they move, discard, archive, or close anything.
- Automation starts off. Approval-first is the default.
- A model recommendation never bypasses deterministic safety rules.
- `Extinct` means archived and restorable. It does not mean deleted.
- Permanent deletion is a separate, explicit action.
- Consequential actions must be attributable and checkpointed before the browser is changed.
- Partial success must be reported as partial success; never pretend an operation was atomic when the browser completed only part of it.

References: [`README.md` lifecycle and user-control sections](README.md#the-tab-lifecycle-active-dormant-extinct), [`docs/ARCHITECTURE.md` lifecycle engine](docs/ARCHITECTURE.md#6-lifecycle-engine), and [`docs/DATA_MODEL.md` state transitions](docs/DATA_MODEL.md#4-state-transitions).

### 3.2 Privacy and security

- No account, hosted backend, cloud sync, remote AI, or telemetry is part of the initial architecture.
- No browsing context leaves the device.
- No runtime-fetched JavaScript or model code is allowed.
- Metadata is the default context level. Page text and retained summaries require visible, user-controlled opt-in.
- Do not collect passwords, form values, cookies, private messages, hidden DOM content, or unrelated browsing history.
- Do not log page content or full sensitive URLs by default.
- Private-window data is off by default and must never mix with normal browsing data.
- Local storage is not automatically encrypted. Never claim encryption at rest unless it is actually implemented and verified.
- Page content and model output are untrusted inputs.

Reference: [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md).

### 3.3 Identity and recovery

- A browser tab ID is a temporary handle, not durable identity.
- Each record uses a stable local UUID.
- Every mutation carries an operation ID and revision so replay is safe.
- Important state must survive background service-worker shutdown.
- A close/archive operation cannot begin until a usable restoration record exists.
- Browser API failure must not delete the local record.
- A corrupt derived index is rebuilt. It must not cause loss of durable records.

Reference: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

### 3.4 Resource behavior

- Never create one unbounded job or one permanently retained object per tab.
- Keep queues, model concurrency, caches, excerpts, summaries, and visible list windows bounded.
- Prioritize active and recently changed tabs.
- Defer or simplify low-priority analysis under pressure; never silently drop durable user state.
- The useful UI shell must appear before archive-wide analysis completes.
- Performance claims require measurements on representative CPU-only and normal desktop profiles.

References: [`README.md` memory and crash-safety contract](README.md#memory-and-crash-safety-contract), [`docs/ARCHITECTURE.md` memory strategy](docs/ARCHITECTURE.md#8-memory-strategy), and [`docs/TESTING_PERFORMANCE.md` performance targets](docs/TESTING_PERFORMANCE.md#3-performance-targets).

### 3.5 Cross-browser behavior

- Chromium and Firefox are equal first-class targets.
- Product code talks to a narrow browser adapter, not scattered `chrome.*` or `browser.*` calls.
- Capability detection decides whether native discard, tab groups, a side panel, or another enhanced feature is available.
- A missing capability produces a truthful fallback, not a fake success.
- Do not call another browser supported until its adapter/profile passes the documented support gates.

References: [`README.md` intended browser support](README.md#intended-browser-support), [`docs/ARCHITECTURE.md` browser adapter contract](docs/ARCHITECTURE.md#4-browser-adapter-contract), and [`docs/TESTING_PERFORMANCE.md` browser support gates](docs/TESTING_PERFORMANCE.md#6-browser-support-gates).

### 3.6 Accessibility and language

- One obvious primary action per decision area.
- All actions work with a keyboard; drag and hover are never the only paths.
- State, confidence, warning, and selection are never communicated by color alone.
- Core flows must work at 200% zoom, with reduced motion, and in forced/high-contrast modes.
- Use native elements before ARIA.
- Keep the documented terms consistent: `Organize tabs`, `Suggested workspace`, `Needs your choice`, `Let tab rest`, `Wake tab`, `Archive tab`, `Restore tab`, `Delete record`, and `Undo`.
- Do not call AI output perfect, magical, or certain.

References: [`docs/DESIGN.md` accessibility section](docs/DESIGN.md#20-accessibility-is-the-design-not-a-checklist) and [`docs/DESIGN.md` content design and voice](docs/DESIGN.md#22-content-design-and-voice).

## 4. The first implementation slice: start here

The first end-to-end slice should do exactly this:

```text
Load the development extension
    -> query normal-window tabs through a browser adapter
    -> normalize each browser event/tab snapshot
    -> create or update durable TabRecords in IndexedDB
    -> reopen the background context safely
    -> reconcile the browser snapshot with stored records
    -> show a read-only metadata list in the extension page
```

This slice intentionally does not organize, discard, close, archive, run a model, or read page contents. It proves the most important foundation without risking the user’s tabs.

### Why this is the correct starting point

- Every later feature depends on correct inventory, identity, persistence, and reconciliation.
- It exercises the browser adapter, background entry point, store, shared types, and UI boundary in one path.
- It reveals service-worker restart problems before destructive actions exist.
- It can be tested in Chromium and Firefox with synthetic tabs.
- It creates useful diagnostics without claiming the product is ready.

### First-slice acceptance criteria

- The extension loads as an unpacked/development extension in the first Chromium test profile and the first Firefox test profile.
- The same shared `queryTabs()` contract returns normalized records in both browsers.
- Browser-specific API calls exist only inside adapter code.
- A discovered tab receives a stable record ID generated with the platform `crypto.randomUUID()` API.
- Restarting or reloading the extension does not duplicate the same known tab record.
- Closing and reopening the UI does not lose records.
- No host permissions, content scripts, model assets, remote requests, or tab mutations exist.
- The UI says it is an early local inventory view; it does not display organization, memory-saving, or AI claims.
- Focus order, visible labels, empty state, loading state, and permission-denied/error state work.
- A focused automated test proves reconciliation is idempotent.
- A manual smoke-test note records the browser versions and observed results.

Primary references: [`docs/ARCHITECTURE.md` runtime shape and durable event flow](docs/ARCHITECTURE.md#2-runtime-shape), [`docs/DATA_MODEL.md` storage and reconciliation](docs/DATA_MODEL.md#1-storage-rules), and [`docs/TESTING_PERFORMANCE.md` Stage 1](docs/TESTING_PERFORMANCE.md#stage-1-local-foundation).

## 5. Planned repository shape

Do not create this entire tree on day one. Create a directory when the first working feature needs it. Empty architecture is not progress.

```text
Sky River Machine/
├── README.md
├── plan.md
├── docs/
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── manifests/
│   ├── chromium.json
│   └── firefox.json
├── scripts/
│   └── build-browser.mjs
├── src/
│   ├── background/
│   │   └── main.ts
│   ├── browser/
│   │   ├── contract.ts
│   │   ├── chromium.ts
│   │   └── firefox.ts
│   ├── core/
│   │   ├── lifecycle.ts
│   │   ├── operations.ts
│   │   ├── reconciliation.ts
│   │   └── workspaces.ts
│   ├── storage/
│   │   ├── database.ts
│   │   └── migrations.ts
│   ├── analysis/
│   │   ├── normalize.ts
│   │   ├── heuristics.ts
│   │   ├── queue.ts
│   │   └── model-runner.ts
│   ├── search/
│   │   └── index.ts
│   ├── shared/
│   │   └── types.ts
│   └── ui/
│       ├── main.tsx
│       ├── routes/
│       ├── components/
│       └── styles/
└── tests/
    ├── fixtures/
    ├── pure/
    ├── adapters/
    └── browser/
```

### Boundaries to enforce

- `browser/`: the only place allowed to know browser namespaces and capability differences.
- `background/`: wires browser events to durable services; it should contain little business logic.
- `storage/`: owns IndexedDB transactions, schema versions, migrations, and durable queries.
- `core/`: owns product rules that do not require a browser or UI.
- `analysis/`: treats browser-derived text and model output as untrusted data and returns recommendations only.
- `search/`: owns rebuildable derived search data.
- `ui/`: displays state and sends explicit intents; it does not directly call privileged browser mutation APIs.
- `shared/`: only genuinely shared types and tiny constants. Do not turn it into a miscellaneous dumping ground.

The intended runtime boundary is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The entity boundary is documented in [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

## 6. Toolchain and dependency policy

### Baseline choices

- TypeScript for shared and browser-independent code.
- Vite for browser-specific builds.
- Preact for the component UI because the architecture says to choose the smaller bundle unless a concrete React-only need appears.
- IndexedDB for durable records.
- Extension storage only for small settings and migration/bootstrap markers.
- Web Workers/WebAssembly for model execution, with optional WebGPU acceleration.
- `npm` and a committed lockfile unless the repository later records a different package-manager decision.

Reference: [`docs/ARCHITECTURE.md` stack decision](docs/ARCHITECTURE.md#3-stack-decision).

### Dependency rules for a junior developer

Before adding a dependency, answer these questions in the pull request:

1. Is this feature required in the current phase?
2. Is the capability already in the browser platform or current toolchain?
3. Is there already a package in the repository that solves it?
4. Does the package execute remote code, fetch runtime assets, add broad permissions, or expand the data boundary?
5. What is its unpacked and bundled size?
6. Is its license compatible with distribution?
7. Can it run under extension content-security-policy restrictions?
8. Is it maintained for the target Chromium and Firefox extension environments?

Start with the minimum expected packages: Preact, Vite, TypeScript, a browser API compatibility layer if current verification supports it, and one test runner. Add a runtime schema validator only when model output is introduced; validation at that trust boundary is mandatory. Add the local-model runtime only after the model packaging spike passes its gate.

Do not add:

- a server framework;
- authentication or analytics SDKs;
- a hosted database client;
- remote font or icon loaders;
- a state-management library before plain component state and a small store boundary demonstrably fail;
- an animation framework for the Riverline or basic transitions;
- an embeddings library before token search and measured need justify it;
- a second browser abstraction on top of the adapter contract.

### Initial setup commands

Run these only when beginning implementation, after checking current official package documentation and supported versions. Commit the generated lockfile.

```bash
npm init -y
npm install preact
npm install -D typescript vite @preact/preset-vite vitest
```

Then add a browser API compatibility package only if the adapter implementation needs it and current Chromium/Firefox verification confirms the choice. Do not paste an old dependency list blindly into the project.

## 7. Phase 0: establish a truthful, buildable extension shell

### Goal

Create the smallest cross-browser development shell that builds, loads, opens a shared extension page, and contains no false product claims.

### Work items

1. Initialize `package.json`, the lockfile, strict TypeScript configuration, and Vite.
2. Add scripts for at least `build:chromium`, `build:firefox`, `typecheck`, `test`, and `check`.
3. Create separate Chromium and Firefox manifest sources rather than one manifest filled with runtime brand checks.
4. Start with the narrowest permissions required by the inventory slice. Do not add host permissions.
5. Add the background/service-worker entry and shared extension-page entry.
6. Build the extension page as the common fallback surface. Add side-panel/sidebar entry points later when the capability adapter is implemented and tested.
7. Add a plain first-run screen with the product name, the truthful statement that the build is under development, and one action to inspect local tab metadata.
8. Add Daybreak/Night Current token variables, a readable type fallback stack, visible focus, reduced-motion handling, and forced-colors-safe defaults. Do not build decorative Riverline motion yet.
9. Ensure the build contains no remote scripts, remote fonts, remote model assets, analytics, or server URLs.
10. Document local build/load commands only after both browser builds have actually been loaded.

### Manifest review

For every permission, add a short entry to a local permission table in implementation documentation:

| Permission | Feature that needs it | Requested now? | Behavior when denied/absent |
| --- | --- | --- | --- |
| `tabs` | Query permitted tab metadata | Only if verified necessary for the implemented inventory behavior | Show a reduced or blocked inventory state without looping the prompt |
| `storage` | Small settings/bootstrap markers | When settings/bootstrap storage exists | Use safe in-memory defaults for the current session where possible |
| `alarms` | Scheduled reconciliation | Not until scheduled reconciliation is implemented | Reconcile on startup and relevant browser events |
| `activeTab` | User-invoked bounded page context | No, not in Phase 0 | Metadata-only mode remains usable |
| Optional host access | Continuous page-context analysis | No | Metadata-only mode remains usable |

Check the permission strategy against [`docs/PRIVACY_SECURITY.md` under “Permissions”](docs/PRIVACY_SECURITY.md#3-permissions).

### Verification

- Build both manifest targets.
- Inspect the built manifests and bundle for permissions, external URLs, and unexpected assets.
- Load both development builds in isolated test profiles.
- Open the shared extension page from the extension action.
- Reload the extension and confirm the page still opens.
- Use keyboard-only navigation and 200% zoom.
- Record actual browser versions and limitations; do not write “cross-browser supported” yet.

### Exit gate

Phase 0 is complete when the repository produces two loadable development builds from shared source, requests no unjustified permission, and passes build/type/unit checks. It is not a product demo and not a release.

References: [`docs/ARCHITECTURE.md` extension contexts and stack](docs/ARCHITECTURE.md#extension-contexts), [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md), and [`docs/DESIGN.md` surface strategy](docs/DESIGN.md#7-surface-strategy).

## 8. Phase 1: local foundation—inventory, durable records, reconciliation, and manual retrieval

### Goal

Prove that local state accurately follows the browser without losing identity or duplicating records across service-worker restarts.

### 8.1 Define the smallest real types

Implement only the entity fields used by this phase, while using the names and meanings from [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md#2-core-entities).

Start with:

- `TabRecord`: stable `recordId`, temporary browser/window IDs, lifecycle state, restorable normalized URL, title, domain, timestamps, revision, and a minimal signal/protection shape.
- `Workspace`: stable ID, name, optional description, accessible color token, and timestamps.
- `Settings`: metadata-only analysis scope and safe defaults.

Do not create empty model-analysis, correction, suggestion, or operation objects merely to match a future diagram. Add those when their phase begins and migrate the database explicitly.

URL handling needs two distinct ideas:

- Store a restorable URL representation that preserves the information needed to reopen the document.
- Derive a separate comparison key/hash for duplicate detection. Tracking removal for comparison must never rewrite the restoration value.

Do not print either value in routine logs. This follows [`docs/AI_PIPELINE.md` normalization rules](docs/AI_PIPELINE.md#stage-a-normalization) and the privacy threat model.

### 8.2 Build the browser adapter contract

Implement the smallest initial contract:

```text
queryTabs()
observeTabEvents()
activateTab(tabId)
openProductSurface(surface)
getCapabilities()
```

Do not implement `createTab`, `closeTab`, `discardTab`, or `setAutoDiscardable` until the lifecycle phase has a real restore or mutation path that needs it.

The normalized tab shape should contain only values core logic needs. Convert browser errors into a small sanitized error type. Keep raw browser objects inside the adapter.

Implement Chromium and Firefox adapters against the same contract tests. Capability results must be explicit, not inferred from a brand string elsewhere in the code.

### 8.3 Implement IndexedDB

1. Create one database with an explicit name and integer schema version.
2. Create the stores and indexes currently needed for records and workspaces.
3. Wrap each write in a transaction that either completes or reports an error.
4. Generate stable IDs with `crypto.randomUUID()`.
5. Increment record revisions on meaningful mutations.
6. Keep a migration function for every version change.
7. Make derived indexes rebuildable.
8. Never keep the only current copy of state in a service-worker global.

Do not use extension key/value storage as the archive. The IndexedDB decision is recorded in [`docs/ARCHITECTURE.md` ADR-004](docs/ARCHITECTURE.md#adr-004-indexeddb-for-the-archive).

### 8.4 Implement normalized event ingestion

For tab creation, update, activation, movement, attachment/detachment, replacement, and removal events that the target adapters expose:

1. Receive the browser event.
2. Convert it to a normalized event with an operation/event ID.
3. Read current durable state.
4. Apply the event idempotently.
5. Persist before notifying the UI.
6. Schedule only the smallest later work needed.
7. Sanitize errors and continue processing unrelated tabs.

Coalesce repeated noisy updates where safe. Do not start an analysis job in this phase.

### 8.5 Implement reconciliation

Reconciliation runs on startup, extension update, and the explicit refresh action. Add an alarm only when periodic reconciliation is implemented and justified.

The algorithm must:

1. Query current tabs.
2. Match browser IDs to current records first.
3. Use a short-lived identity hint only when a direct binding is absent.
4. Create a record for an unknown normal-context tab.
5. Avoid merging ambiguous histories.
6. Mark a missing tab `Extinct` only when close/reconciliation evidence is reliable.
7. Remain idempotent when run twice on the same browser snapshot.
8. Bound work into batches for large inventories.

Write pure tests for matching and idempotence before relying on browser smoke tests.

### 8.6 Build the first read-only UI

Show:

- loading, empty, success, permission-denied, and local-storage-error states;
- a count of currently observed records without turning it into a statistics dashboard;
- title, sanitized domain/location, and lifecycle text;
- a clear refresh action;
- truthful copy that metadata is processed locally;
- no claim that organization, dormancy, archiving, AI, or memory savings exists.

Use the structure from [`docs/DESIGN.md` tab rows](docs/DESIGN.md#93-tab-rows), but expose only actions that exist.

### 8.7 Add manual workspace editing and metadata search

After inventory/reconciliation is stable:

1. Let the user create, rename, and archive a workspace locally.
2. Let the user move a record between workspaces without moving a browser tab yet.
3. Add exact/prefix search over title, domain, URL representation, and workspace name.
4. Add a small rebuildable token index only when exact/prefix behavior is covered.
5. Return lifecycle state, workspace, evidence, and the correct available action.
6. Make search usable without a model.

Manual organization is a real fallback and a foundation for later proposal review. It must not be presented as semantic AI organization.

### Phase 1 tests

- URL/restoration normalization and comparison-key separation.
- Database creation and migration from an empty database.
- Record revision increments.
- Event replay does not duplicate records.
- Reconciliation with new, existing, missing, and ambiguous tabs.
- Service-worker restart between event receipt and UI refresh.
- Search index rebuild after simulated corruption.
- Firefox and Chromium adapter contract behavior, including missing capability profiles.
- Keyboard, zoom, reduced-motion, loading, empty, denied, and storage-error UI states.

### Exit gate

The product can inventory, persist, reconcile, manually organize, and search metadata locally in both development browsers. No tab mutation occurs. The implementation is still an engineering stage, not the first useful release.

References: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md), [`docs/ARCHITECTURE.md` durable event flow](docs/ARCHITECTURE.md#5-durable-event-flow), [`docs/AI_PIPELINE.md` search](docs/AI_PIPELINE.md#6-search), and [`docs/TESTING_PERFORMANCE.md` Stage 1](docs/TESTING_PERFORMANCE.md#stage-1-local-foundation).

## 9. Phase 2: lifecycle safety, checkpointed operations, restore, and recovery

### Goal

Implement `Active`, `Dormant`, and `Extinct` as durable product states with deterministic protection rules and tested restoration. This is the first phase allowed to mutate tabs.

### 9.1 Add protection data and controls first

Before adding discard or close actions:

1. Implement `Important`, `Never sleep`, and `Keep until completed` protections.
2. Store protections as user intent, separate from derived signals.
3. Show protection text and a shield marker in the row and details UI.
4. Make protection changes durable and auditable.
5. Ensure protections survive restart and reconciliation.
6. Do not claim the extension can detect every risky form, download, or private state.

### 9.2 Implement one central lifecycle guard

All lifecycle requests—manual now and automated later—must pass through the same guard function. The guard should reject or require stronger confirmation for:

- the currently active tab;
- protected tabs;
- audible or capturing tabs;
- active downloads when detectable;
- authentication, permission, payment, form, and likely-unsaved-document risks;
- stale browser IDs;
- private-context tabs without explicit, isolated support;
- operations whose browser capability is absent;
- archive/close attempts without a durable restorable record.

Return a structured result such as allowed, denied, or confirmation-required with a plain reason. Do not scatter similar checks across buttons, policy code, and browser adapters.

Reference: [`docs/ARCHITECTURE.md` lifecycle engine](docs/ARCHITECTURE.md#6-lifecycle-engine).

### 9.3 Add the `Operation` journal

Implement the documented operation states:

```text
planned -> applying -> applied
                    -> partial
                    -> failed
applied/partial -> undone when supported
```

For each operation:

1. Create a stable operation ID.
2. Record the target record IDs.
3. Store a minimal reversible `before` snapshot.
4. Store the intended local `after` state.
5. Store the exact browser mutation plan.
6. Commit the planned operation before touching the browser.
7. Re-read the current tab and re-run guards immediately before mutation.
8. Apply browser mutations serially per affected window.
9. Record each actual result.
10. Mark full, partial, or failed completion truthfully.
11. Preserve enough data for retry, undo, or recovery.

Do not overwrite the last valid recovery snapshot until the new snapshot is known to be usable.

### 9.4 Implement manual transitions in risk order

Implement and verify these one at a time:

1. `Dormant -> Active` / `Wake tab`: activate or recreate as needed without a confirmation dialog in ordinary cases.
2. `Extinct -> Active` / `Restore tab`: create the tab from the durable URL and reattach the record.
3. `Active -> Dormant` / `Let tab rest`: update product state and use native discard only when the adapter reports verified support.
4. `Dormant -> Extinct` / `Archive tab`: checkpoint, close the live tab, preserve the record, and show a consequence preview.
5. Direct `Active -> Extinct`: treat as a high-consequence archive path using the same checkpoint and guard flow, not a shortcut.
6. `Delete record`: keep separate from Extinct, require explicit confirmation, and apply retention/deletion rules.

If the browser cannot discard a tab, keep the durable Dormant state only if the UI clearly says the page may remain loaded. Never claim the browser released memory.

### 9.5 Recovery and partial failure

On background startup:

1. Query operations in `planned` or `applying` state.
2. Query actual browser state.
3. Determine which intended steps happened.
4. Never blindly replay a close against a reused tab ID.
5. Resume, mark partial, or request user action.
6. Put recovery above normal suggestions in the UI.

The partial-failure view must show what succeeded, what did not, what remains safe, what can be retried, and what can be undone. Follow [`docs/DESIGN.md` recovery and partial-failure guidance](docs/DESIGN.md#17-recovery-errors-and-imperfect-reality).

### 9.6 Add undo

- Undo should use the operation’s durable `before` snapshot.
- Revalidate current browser state before applying the inverse plan.
- Do not promise perfect restoration of in-page state the browser did not preserve.
- If only part can be undone, state the actual result.
- Keep undo adjacent to success where the UI contract requires it.

### 9.7 Add automation settings, but leave automation off

Build the setting/data contract before enabling any automatic lifecycle action:

- approval-first default;
- configurable thresholds and memory budgets;
- explicitly listed exclusions;
- separate agreement for what can happen without approval;
- plain explanation of recording, undo, and recovery behavior.

Do not add a single vague `Smart mode` switch. Follow [`docs/DESIGN.md` automation presentation](docs/DESIGN.md#14-automation-presentation).

### Phase 2 tests

- Every documented protection rejects a disallowed automatic transition.
- Stale tab ID cannot mutate a different tab.
- Close is impossible without a committed restoration record.
- Browser close/discard failure preserves the local record.
- Restart between `planned`, `applying`, and per-tab results recovers safely.
- Batch operation with mixed success reports exact results.
- Restore reattaches the correct record.
- Delete is distinct from Extinct and clears the documented derived references.
- Missing native-discard capability produces a truthful fallback.
- Permission denial and private-context exclusion remain usable states.

### Exit gate

Manual lifecycle actions, protection, checkpointing, recovery, and undo work in supported development profiles. Automation remains off unless a later test explicitly enables an exact safe behavior. This completes the documented lifecycle-safety stage, not the full product.

References: [`docs/DATA_MODEL.md` operations and recovery](docs/DATA_MODEL.md#operation), [`docs/ARCHITECTURE.md` lifecycle engine](docs/ARCHITECTURE.md#6-lifecycle-engine), and [`docs/TESTING_PERFORMANCE.md` Stage 2](docs/TESTING_PERFORMANCE.md#stage-2-lifecycle-safety).

## 10. Phase 3: bounded heuristic analysis, proposals, duplicates, and corrections

### Goal

Build the analysis and review loop without depending on a model. Heuristics provide the safe fallback and the pre/post-processing around later semantic inference. They are not the final semantic intelligence claim.

### 10.1 Normalize safely

Create pure, bounded functions for:

- URL restoration normalization;
- separate duplicate-comparison canonicalization;
- domain extraction;
- title tokenization;
- secret/high-risk-field redaction before analysis;
- input size limits;
- browser/page signal normalization.

Use fictional test URLs. Include credentials, fragments, sensitive query parameters, internal browser pages, local files, extension pages, empty titles, and malformed URLs.

### 10.2 Build the bounded job queue

Start with:

- one high-priority queue for active/recent records;
- one low-priority queue for archive work;
- one active analysis task;
- a maximum pending-job budget;
- coalescing by record ID;
- cancellation when a record revision changes;
- persisted retry metadata;
- explicit defer/fallback behavior at budget limits.

Do not increase concurrency until measurements show a benefit. Never create an unbounded promise list.

### 10.3 Implement cheap signals

Use only the configurable signals listed in [`docs/AI_PIPELINE.md` Stage B](docs/AI_PIPELINE.md#stage-b-cheap-heuristics):

- exact and canonical URL matches;
- domain/path similarity;
- title-token overlap;
- recent co-activation;
- explicit workspace/protection preferences;
- active, audible, loading, download, form-risk, and discard signals.

Do not hard-code permanent workspace categories, domain-to-project maps, fixed group names, or universal idle thresholds. Thresholds live in settings/policy configuration and fixtures.

### 10.4 Implement `SuggestionBatch`

A suggestion batch must store:

- the source database revision;
- proposed workspace names and memberships;
- duplicate candidates;
- uncertain records;
- bounded human-readable evidence;
- confidence per proposal;
- pending/accepted/rejected/partially-applied/expired status.

Expire or revalidate a batch when underlying records change. Never apply a stale proposal as if it still matches the browser.

### 10.5 Build proposal review

Implement the documented flow:

1. `Organize tabs` entry.
2. Scope choice showing tab count and current context level.
3. Plain disclosure of what will be read, stored, and processed locally.
4. Truthful, cancelable progress without a fake percentage.
5. Editable suggested workspaces.
6. Rename, move, merge, split, reject, and leave-unchanged actions.
7. `Clear match`, `Possible match`, and `Needs your choice` interaction levels.
8. Final action bar stating exact workspace/tab effects.
9. Separate disclosure for any lifecycle transition; organization must never silently imply archive/close.
10. Apply through the durable `Operation` path.
11. Report actual results and keep undo nearby.

Reference: [`docs/DESIGN.md` analyze and organize flow](docs/DESIGN.md#10-analyze-and-organize-flow).

### 10.6 Add duplicate candidates

Evaluate in cheapest-reliable order:

1. same restoration URL;
2. same canonical comparison URL/title tokens;
3. same domain with high title/context overlap;
4. later model tie-breaker.

Show evidence. Offer keep all, archive selected, or dismiss. Never automatically close a duplicate candidate.

### 10.7 Store corrections

Record explicit corrections such as moved tab, renamed workspace, rejected suggestion, protected tab, and duplicate decision.

Initially use them as inspectable retrieval/ranking features. Do not retrain model weights. Make the effect and scope visible and deletable.

### Phase 3 tests

- Related cross-domain fixture tabs can be suggested together without a fixed domain map.
- Unrelated same-domain tabs are not automatically forced together.
- Ambiguous tabs remain reviewable.
- Duplicate signals explain their match.
- Adversarial titles are treated as data, not instructions.
- A record revision change cancels/expires stale work.
- Queue limits defer work without losing durable records.
- Heuristic mode works with no model installed.
- Corrections affect only their documented local scope and can be removed.

### Exit gate

The user can generate, review, correct, apply, undo, and recover a bounded heuristic proposal. The UI describes it honestly as suggestion behavior, not as validated semantic AI quality.

References: [`docs/AI_PIPELINE.md`](docs/AI_PIPELINE.md), [`docs/DESIGN.md` proposal review](docs/DESIGN.md#105-proposal-review), and [`docs/TESTING_PERFORMANCE.md` model evaluation fixtures](docs/TESTING_PERFORMANCE.md#model-evaluation).

## 11. Phase 4: local model integration and semantic organization

### Goal

Add replaceable, offline, structured local inference that improves cross-domain semantic relationships without controlling browser actions.

### 11.1 Define `ModelRunner` before selecting packaging details

The runner boundary should support one narrow task at a time:

- `relateTabs`;
- `nameWorkspace`;
- `classifyPage`;
- `rankLifecycle`;
- `searchIntent`.

Each request includes:

- task name and schema version;
- bounded minimized input;
- relevant record revisions;
- model identity/version/artifact checksum;
- prompt/strategy version;
- cancellation signal and time budget.

Each response includes only schema-validated output or a structured failure. The runner never imports the browser adapter and never performs a browser action.

### 11.2 Create versioned schemas and prompts

For each task:

1. Define the smallest output schema.
2. Bound arrays and string lengths.
3. Reject unknown actions and record IDs not present in the request.
4. Require evidence to reference safe supplied signals, not hidden reasoning.
5. Version the prompt/strategy.
6. Store enough metadata to reproduce the historical decision at the appropriate privacy level.
7. Reject malformed, oversized, timed-out, stale, and low-confidence results.

Use an established runtime schema validator after reviewing bundle size and extension compatibility. Do not write a permissive ad hoc parser at this trust boundary.

### 11.3 Evaluate the documented baseline

The current documented baseline is Qwen2.5-0.5B-Instruct through Transformers.js and ONNX Runtime Web. Treat it as a candidate to measure, not a guaranteed release dependency.

Evaluate:

- `q4f16` under WebGPU;
- `q8` under WebAssembly/CPU;
- grouping usefulness and false grouping;
- structured-output validity;
- multilingual titles;
- ambiguous and sensitive-looking tabs;
- prompt-injection metadata;
- cold start and per-task latency;
- peak memory and cancellation;
- model unavailable and corrupt asset behavior;
- base-extension/package size.

Pin the exact artifact revision and checksum used in evaluation. Bundle executable/runtime assets locally and disable remote loading. Do not silently ship both artifacts. Do not fall back to a hosted model.

Reference: [`docs/AI_PIPELINE.md` model/runtime strategy](docs/AI_PIPELINE.md#4-modelruntime-strategy).

### 11.4 Make packaging a measured gate

The model artifacts documented today are hundreds of megabytes. Before release, decide from measurements whether to:

- package one artifact in a full distribution;
- offer an explicit additional local model package;
- replace the baseline with a smaller validated local model;
- ship heuristic mode in the base extension while model availability remains explicit.

The decision must preserve offline operation, local-only processing, extension-store constraints, browser CSP, licensing, update integrity, and a usable model-free fallback.

Do not build a native companion in this phase. It is explicitly deferred in [`docs/README.md`](docs/README.md#what-remains-deliberately-open) and [`docs/ARCHITECTURE.md` ADR-002](docs/ARCHITECTURE.md#adr-002-browser-only-inference-first).

### 11.5 Integrate model results as recommendations

The sequence stays:

```text
minimized signals
    -> cheap heuristics
    -> bounded model task
    -> schema validation
    -> freshness check
    -> uncertainty handling
    -> deterministic safety/policy
    -> review UI
    -> authorized operation
```

High confidence can reduce review friction but cannot bypass protection, checkpoint, or authorization rules. Low confidence produces alternatives or `Needs your choice`. Model failure leaves manual organization, metadata search, and heuristic mode usable.

### Phase 4 tests

- Every task accepts valid structured output and rejects malformed/oversized/unknown output.
- Model-provided IDs/actions outside the request are rejected.
- Page text that says “ignore previous instructions” remains inert data.
- Timeout, cancellation, model unload, corrupt asset, and token overflow fail safely.
- Low confidence does not trigger a browser action.
- Model-free fallback completes the same manual/product flow.
- Model identity, artifact checksum, prompt/strategy version, input references, output, confidence, and user response are traceable locally.
- Representative fixtures measure useful grouping and false grouping rather than reporting only hand-picked successes.

### Exit gate

Semantic model assistance improves the measured fixture set, stays within accepted package/runtime budgets, and cannot cross the deterministic safety boundary. If it misses the gate, keep the replaceable runner and ship the safe fallback internally while evaluating another local model; do not weaken privacy or safety to rescue the benchmark.

References: [`docs/AI_PIPELINE.md`](docs/AI_PIPELINE.md), [`docs/ARCHITECTURE.md` deterministic safety ADR](docs/ARCHITECTURE.md#adr-003-deterministic-safety-before-ai), and [`docs/TESTING_PERFORMANCE.md` model evaluation](docs/TESTING_PERFORMANCE.md#model-evaluation).

## 12. Phase 5: optional visible-page context and privacy controls

### Goal

Add more page context only as an explicit, bounded capability while keeping metadata-only mode complete and useful.

### 12.1 Implement the context ladder exactly

1. **Tab details:** title, URL, domain, favicon, and browser signals. Default.
2. **Visible page context:** bounded headings, description, and selected visible text after explicit permission.
3. **Stored summary:** locally retained, bounded, visible, and deletable.

For each level, the UI states what is read, why, whether it is stored, how long it is retained, and how to delete it. Do not label broader access as recommended merely to increase acceptance.

Reference: [`docs/DESIGN.md` context ladder](docs/DESIGN.md#161-context-ladder) and [`docs/AI_PIPELINE.md` context levels](docs/AI_PIPELINE.md#2-context-levels).

### 12.2 Add user-invoked extraction first

- Use `activeTab` or the narrowest current platform mechanism.
- Explain the browser permission before triggering its prompt.
- Inject/expose a content script only for the user-selected tab and action.
- Extract only the permitted visible fields.
- Enforce strict character/token budgets before persistence or model input.
- Never read password/form values, cookies, scripts, hidden DOM, or private messages.
- Treat extracted text as untrusted data.
- Tear down or leave no broader persistent access than necessary.

Continuous page analysis remains off and requires a separate optional-host-permission decision later.

### 12.3 Secure extension messaging

For every message:

- validate the sender context and allowed origin;
- validate a versioned schema;
- verify the target browser tab and record binding;
- reject unexpected fields and oversized data;
- never expose privileged browser methods to page code;
- sanitize errors and logs.

Include malicious webpage and stale-tab tests from the threat model in [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md#4-threat-model).

### 12.4 Implement data inspection, retention, export, and deletion

Settings must allow the user to:

- inspect stored data categories;
- delete one tab record;
- delete a workspace;
- clear the derived search/model cache;
- delete all extension data;
- export a local archive with a sensitive-data warning.

Deletion must remove context, search terms, derived analysis, and relevant correction references according to retention settings. `Delete everything` does not claim to erase browser history, browser caches, or prior exports.

### 12.5 Preserve privacy-context isolation

- Private browsing remains off by default.
- If later enabled per browser, store and query private-context data in an explicit isolated scope.
- Never mix profiles, containers, windows/workspaces, or users in model context, search, caches, corrections, exports, or recovery.
- Deny an operation when its privacy scope cannot be proven.

### Phase 5 tests

- Permission denial returns to usable metadata-only mode.
- Extraction never returns excluded fields.
- Oversized and adversarial page content is bounded/rejected.
- Message with the wrong sender, schema, tab, record, or context is rejected.
- Stored summary can be inspected and deleted.
- Delete-all clears the database, derived index, model cache, and pending operations without making claims about browser-owned data.
- Export warning is visible and the export stays a local file operation.
- Normal/private/profile/workspace scopes cannot leak into each other.

### Exit gate

Optional context measurably improves an enabled feature, has a narrow and explained permission path, can be denied without breaking the product, and can be inspected and deleted.

References: [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md), [`docs/AI_PIPELINE.md` context levels](docs/AI_PIPELINE.md#2-context-levels), and [`docs/DESIGN.md` privacy and permission UX](docs/DESIGN.md#16-privacy-and-permission-ux).

## 13. Phase 6: complete product UI and interaction system

### Goal

Turn the tested foundation into the calm, spatial, trustworthy product described in the design document without hiding capability gaps.

UI work begins in Phase 0 and continues throughout. This phase completes the full information architecture and polishes it only after real state and failure behavior exist.

### 13.1 Implement the three primary destinations

- **Home:** safety status, one current workspace, bounded attention queue, and one obvious next action.
- **Workspaces:** cards, workspace detail, lifecycle filters, protected state, and large-list behavior.
- **Search:** exact and natural-language retrieval across Active, Dormant, and Extinct records with state-appropriate actions.

Review remains a task route. Settings remains conventional. Recovery is contextual and takes priority when required.

Reference: [`docs/DESIGN.md` information architecture](docs/DESIGN.md#6-information-architecture-without-overload).

### 13.2 Implement surfaces by capability

1. Keep the full extension page as the common fallback.
2. Add the Chromium side-panel path only after capability and permission behavior are verified.
3. Add the Firefox sidebar path through its adapter/profile.
4. Keep a browser-action popup, if used, to status plus one primary entry action.
5. Never compress the full product into a tiny popup.

### 13.3 Build reusable components only after repetition exists

Likely components include button, field, tab row, lifecycle label, protection marker, workspace card, inline notice, banner, dialog/sheet, and toast. Build each when two real screens need consistent behavior. Keep native HTML semantics underneath.

### 13.4 Apply the visual system

- Implement Daybreak and Night Current tokens.
- Measure actual contrast for every used foreground/background/state pairing.
- Use the documented spacing, target sizes, typography fallbacks, borders, radii, and limited elevation.
- Bundle approved fonts/icons locally or use system fallbacks; never fetch them at runtime.
- Add the Riverline only after the UI works without it. Use CSS or one small bundled asset, mark it decorative, bound its motion, and remove it in reduced-motion/forced-colors/low-performance conditions.
- Avoid the design anti-patterns in [`docs/DESIGN.md`](docs/DESIGN.md#26-design-anti-patterns).

### 13.5 Implement every major state

For Home, Workspaces, Search, Review, Settings, Privacy, and Recovery, cover where relevant:

- first use;
- no data/no results;
- loading;
- canceled work;
- permission denied;
- local model unavailable;
- invalid model output;
- partial success;
- browser capability unavailable;
- storage pressure;
- recovery after restart;
- very large collection.

Do not use a generic toast for a partial or critical failure.

### 13.6 Accessibility pass

- Verify keyboard operation for every action.
- Restore focus after menus/dialogs and after dynamic list changes.
- Use polite live regions for analysis completion, selection totals, partial failures, and restoration results.
- Test at 200% zoom without two-dimensional scrolling in core flows.
- Test reduced motion, forced colors, high contrast, and both themes.
- Keep 44-by-44-pixel target areas.
- Provide Move controls and keyboard alternatives to drag-and-drop.
- Ensure virtualized/paginated rows retain understandable list position and focus.
- Conduct the documented “grandma test” with a browsing-comfortable nontechnical participant before release.

### Exit gate

Every surface passes the definition in [`docs/DESIGN.md` under “Definition of done for a UI surface”](docs/DESIGN.md#28-definition-of-done-for-a-ui-surface). Decorative polish cannot compensate for missing recovery, permission-denied, model-unavailable, or accessibility behavior.

## 14. Phase 7: scale, performance, storage pressure, and fault injection

### Goal

Prove that the product remains responsive and safe as records grow from tens to thousands and failures occur at inconvenient times.

### 14.1 Define configurable budgets

Record safe initial values in configuration, then calibrate them from measurements:

- one loaded model instance;
- one active model task;
- maximum high/low-priority pending jobs;
- analysis batch size;
- maximum in-memory record cache;
- maximum excerpt/summary size per record;
- search result/page/window size;
- operation batch size per window;
- retry count/backoff bounds;
- storage-pressure thresholds.

Defaults are calibration values, not permanent product identity. They must be configurable and tested.

### 14.2 Build synthetic scale fixtures

Create deterministic fictional datasets for:

- 12 mixed tabs;
- 100 records;
- 1,000 records;
- 10,000 records;
- mixed Active/Dormant/Extinct distribution;
- multilingual, long, empty, and identical titles;
- repeated URL families and ambiguous cross-domain projects;
- protected and risky states;
- corrupt derived index and interrupted operations.

Do not use the developer’s real browsing history.

### 14.3 Measure the critical paths

On a low-end CPU-only profile and a normal desktop profile, record:

- extension idle overhead;
- cold dashboard shell/render time;
- inventory and reconciliation time at each fixture size;
- search latency without loading all records into UI memory;
- local-model cold start, task time, cancellation, and peak memory;
- queue growth and coalescing behavior;
- restore action latency and later reconciliation;
- IndexedDB migration and recovery time;
- UI scroll/focus stability with large workspaces.

Store measured results with browser version, device profile, build commit, model artifact, and test date. Do not turn aspirational targets into claims.

### 14.4 Apply backpressure

At a budget limit:

1. Keep durable writes and user actions highest priority.
2. Coalesce duplicate pending analysis jobs.
3. Cancel stale work.
4. Defer archive analysis.
5. Evict rebuildable caches.
6. Reduce optional analysis detail.
7. Fall back to heuristics if the model budget is unavailable.
8. Surface storage pressure when user action is required.

Never silently remove a durable record to satisfy a cache or queue budget.

### 14.5 Run the failure matrix

Inject failures during:

- model load, inference, validation, and cancellation;
- IndexedDB writes and migrations;
- service-worker shutdown;
- tab close, restore, discard, navigation, and permission operations;
- browser restart and extension update;
- storage quota exhaustion;
- derived-index corruption;
- user cancellation halfway through a proposal;
- multi-tab operations where only some mutations succeed.

Every failure must yield retry, safe defer, partial result with recovery, or explicit user action. A destructive operation never continues silently.

### Exit gate

The documented invariants hold at representative scale, actual budgets are recorded, the UI does not render the entire archive at once, and failure injection does not lose durable records or operate on the wrong tab.

Reference: [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md).

## 15. Phase 8: browser parity, packaging, and release readiness

### Goal

Prove the complete loop in real supported browsers and publish only claims supported by evidence.

### 15.1 Freeze the capability matrix

For each candidate browser/version, record:

- installation/update behavior;
- manifest/runtime model;
- tab inventory and event support;
- side panel/sidebar/full-page support;
- native discard and auto-discardable behavior;
- tab-group support if exposed;
- private-window behavior;
- permission prompt behavior;
- storage limits and observed constraints;
- known degraded paths.

Use official browser documentation linked from [`docs/README.md`](docs/README.md#platform-references), then prove behavior with smoke tests. Documentation alone does not make a browser supported.

### 15.2 Run the complete local smoke flow

Use isolated browser profiles and fictional tabs:

1. Install the release candidate.
2. Open a mixed session.
3. Inventory and reconcile it.
4. Trigger organization.
5. Review suggested workspaces and evidence.
6. Correct an incorrect placement.
7. Rename, move, merge, split, reject, and leave unchanged where applicable.
8. Apply organization.
9. Protect a synthetic payment/form tab and an audible tab.
10. Let an eligible tab rest.
11. Archive an eligible synthetic tab.
12. Restore it.
13. Undo the organization/lifecycle action.
14. Search Active, Dormant, and Extinct records.
15. Restart the browser.
16. Confirm state and recovery.
17. Deny page-context permission and continue in metadata mode.
18. Disable/unavailable the model and continue manually/heuristically.
19. Interrupt an operation and complete recovery.
20. Repeat representative paths with a large fixture.

Never run archive/close tests against the user’s real browsing session.

### 15.3 Pass the browser support gates

A browser is listed as supported only after it passes all seven gates in [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md#6-browser-support-gates): installation/upgrade, inventory/reconciliation, search/restore, Dormant or documented fallback, automation safety, private/permission review, and low-resource testing.

### 15.4 Release documentation

Update the README and documentation from observed behavior:

- exact setup/build commands;
- exact supported browsers and versions;
- capability limitations and fallbacks;
- actual permissions and why they are requested;
- model artifact/runtime requirements and package behavior;
- local data categories and retention behavior;
- measured performance scope;
- known risks and unsupported cases;
- screenshots containing only fictional data;
- release-stage status.

Do not claim memory savings, crash prevention, perfect grouping, encryption, universal browser support, or privacy guarantees beyond what was measured and inspected.

### 15.5 Final first-useful-release gate

The release is ready only if all of these work together:

- contextual cross-domain organization;
- review and correction before consequential change;
- Active/Dormant/Extinct lifecycle behavior;
- protection and deterministic safety;
- duplicate review without automatic closure;
- local search and restoration across all states;
- inspectable correction influence;
- a tested local-model path on qualifying device profiles plus a truthful safe fallback when the model is unavailable;
- optional bounded page context with permission controls;
- checkpointed operations, partial failure, undo, and restart recovery;
- bounded queues/caches/UI rendering at representative scale;
- tested Chromium and Firefox adapters or an explicitly documented unresolved release blocker;
- accessibility and capability-degraded states;
- honest documentation matching the packaged build.

This gate is the implementation counterpart of [`README.md` under “First useful release scope”](README.md#first-useful-release-scope).

## 16. Testing strategy across all phases

### 16.1 Pure logic tests

Keep these free of browser globals:

- URL normalization/comparison keys;
- search tokenization;
- duplicate scoring;
- workspace ranking;
- lifecycle guards;
- policy evaluation;
- migrations;
- operation replay and inverse plans;
- reconciliation matching;
- model-output validation.

### 16.2 Adapter contract tests

Run the same behavior suite for Chromium, Firefox, and explicit missing-capability profiles. The test should care about normalized results, not vendor object shapes.

### 16.3 Browser integration tests

Verify real event order, service-worker restart, discard/restore/close behavior, extension reload/update, permission denial, side-panel/fallback surfaces, and private-window behavior.

### 16.4 UI checks

For every changed surface, cover keyboard, focus, screen-reader announcements where available, 200% zoom, reduced motion, forced colors, narrow/wide layouts, empty/loading/error/partial/recovery states, and large collections.

### 16.5 Model evaluation

Do not call a few unit tests an evaluation. Maintain a versioned fictional fixture set and report:

- useful group rate;
- false group rate;
- protected-page safety;
- structured-output validity;
- ambiguity handling;
- multilingual behavior;
- prompt-injection resistance;
- latency and peak memory by device/runtime profile;
- model-unavailable fallback behavior.

### 16.6 Minimum check before each commit

Run the smallest complete set appropriate to the change:

```text
documentation only -> link/terminology/status review + diff check
pure core logic     -> typecheck + focused unit test + diff check
adapter/storage     -> typecheck + focused tests + both builds
browser mutation    -> all above + isolated-profile integration smoke
UI behavior         -> all above + accessibility/responsive state checks
model behavior      -> schema/failure tests + relevant fixture evaluation
release candidate   -> full check + full browser gates + complete smoke flow
```

The exact invariants and failure matrix are in [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md).

## 17. Synthetic fixture design

All fixtures must be obviously fictional. A starter mixed session should include:

- two related extension-development pages on different fictional domains;
- two unrelated repositories on the same fictional code-host domain;
- an audible media page;
- a synthetic payment form;
- a synthetic document editor with possible unsaved work;
- a dashboard;
- exact and near-duplicate documentation pages;
- a local-file URL;
- an internal browser URL;
- an extension page;
- multilingual titles;
- empty, extremely long, and identical titles;
- a title containing prompt-injection text;
- records spread across Active, Dormant, and Extinct states;
- explicit protections and ambiguous workspace membership.

Use reserved/example hosts such as `example.com`, `example.org`, or clearly local test pages. Never copy a developer’s real tab session into fixtures, screenshots, logs, or commits.

The full scenario list is in [`docs/DESIGN.md` under “Design review scenarios”](docs/DESIGN.md#27-design-review-scenarios).

## 18. Requirement-to-phase traceability

| First useful release requirement | Primary implementation phases | Primary source |
| --- | --- | --- |
| Read tab context safely | 1 and 5 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#2-context-levels) |
| Understand related activities/projects | 3 and 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#3-pipeline) |
| Suggest meaningful workspaces/names | 3 and 4 | [`ARCHITECTURE.md`](docs/ARCHITECTURE.md#7-workspace-organization) |
| Review, correct, rename, merge, split, reject, apply | 3 and 6 | [`DESIGN.md`](docs/DESIGN.md#10-analyze-and-organize-flow) |
| Active/Dormant/Extinct lifecycle | 2 | [`DATA_MODEL.md`](docs/DATA_MODEL.md#4-state-transitions) |
| Context-aware lifecycle recommendations | 3 and 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#stage-c-local-model-tasks) |
| Protected tabs | 2 | [`ARCHITECTURE.md`](docs/ARCHITECTURE.md#6-lifecycle-engine) |
| Exact/repeated/near-duplicate review | 3 and 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#7-duplicate-detection) |
| Natural-language search across all states | 1 and 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#6-search) |
| Learn from corrections | 3 and 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#8-learning-from-corrections) |
| Save and restore workspaces | 1 and 2 | [`DATA_MODEL.md`](docs/DATA_MODEL.md#6-recovery-and-deletion) |
| Compact local model | 4 | [`AI_PIPELINE.md`](docs/AI_PIPELINE.md#4-modelruntime-strategy) |
| Bounded memory and processing | Every phase, measured in 7 | [`TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md#4-memory-and-queue-budgets) |
| Checkpoint and recover from failure | 2 and 7 | [`ARCHITECTURE.md`](docs/ARCHITECTURE.md#5-durable-event-flow) |
| Shared Chromium/Firefox experience | Every phase, released in 8 | [`ARCHITECTURE.md`](docs/ARCHITECTURE.md#4-browser-adapter-contract) |

## 19. Recommended pull-request sequence

Keep each change reviewable and leave the repository working after every merge. A sensible sequence is:

1. Toolchain, strict TypeScript, Vite, two manifests, and truthful extension page.
2. Browser adapter contract plus Chromium/Firefox `queryTabs()` implementations and contract tests.
3. IndexedDB v1, stable record identity, and migration test.
4. Normalized event ingestion and idempotent reconciliation.
5. Read-only local inventory UI and documented development smoke results.
6. Manual workspaces and metadata search.
7. Protections and centralized lifecycle guard.
8. Operation journal, manual restore, and recovery UI.
9. Dormant/native-discard capability path and truthful fallback.
10. Archive/Extinct path, partial failure, and undo.
11. Bounded analysis queues, normalization, and heuristic signals.
12. Suggestion batches, proposal review, and corrections.
13. Duplicate candidates and review actions.
14. Versioned model task schemas and a fake deterministic runner for contract tests.
15. Baseline local-model packaging/evaluation spike.
16. Accepted local-model integration or documented replacement decision.
17. User-invoked visible-context permission path and secure extraction.
18. Privacy inspection, retention, export, and deletion UI.
19. Complete Home/Workspaces/Search/Settings/Recovery surfaces and accessibility pass.
20. Scale budgets, large fixtures, fault injection, and measured results.
21. Chromium release-gate pass.
22. Firefox release-gate pass.
23. Release documentation, packaging audit, and complete first-useful-release smoke.

Some of these may be combined when the diff stays small and the proof stays clear. Do not combine a new destructive browser mutation, a database migration, and a large UI rewrite in one review.

## 20. How a junior developer should work through each task

Use this loop for every item:

1. **Name the user-visible outcome.** Example: “After reloading the extension, the same open tab is still the same local record.”
2. **Read the governing sections.** Use the source map at the top of this plan.
3. **Trace the full flow.** Browser event -> adapter -> normalized event -> store -> core rule -> UI. For mutations continue through checkpoint -> current-state validation -> browser result -> durable status -> recovery/undo.
4. **List trust boundaries.** Browser/page data, model output, messages, imported/exported data, and stale IDs need validation.
5. **List failure points.** Browser API rejection, service-worker shutdown, database failure, stale revision, permission denial, and partial success.
6. **Choose the smallest correct implementation.** Reuse the shared guard/store/adapter path. Do not patch one caller when the rule belongs in a shared boundary.
7. **Write the focused failing check.** Non-trivial logic should have one runnable test that fails before the fix/feature.
8. **Implement without unrelated refactoring.** Keep the change easy to review.
9. **Run proportionate checks.** Use the matrix in this plan.
10. **Inspect the built artifact when relevant.** Source correctness is not enough for permissions, remote assets, manifests, and package size.
11. **Smoke the real browser path when behavior exists.** Use an isolated profile and fictional data.
12. **Update directly affected docs.** Describe only what the build proves.
13. **Review the diff for sensitive data.** No private URLs, histories, tokens, profiles, or generated browser data.
14. **Record the exact result.** Browser/version, checks passed, checks skipped, limitation, and next dependency.

### Questions to ask before a tab mutation

- Is this exact action authorized?
- Is the record durable and restorable?
- Is the browser tab ID current?
- Is the tab active, audible, capturing, downloading, protected, private, a form, a payment/auth page, or likely unsaved?
- Does the adapter prove the capability exists?
- What happens if the browser completes only half the batch?
- What will the user see?
- How will retry, undo, and restart recovery work?

If any answer is unknown, do not mutate the tab.

### Questions to ask before reading more context

- Which user-selected feature requires it?
- Can metadata-only behavior satisfy the request?
- What exact fields will be read?
- What will be stored and for how long?
- Is permission user-invoked and narrow?
- Can denial return to a useful state?
- Can the user inspect and delete the data?
- Could this content include secrets, messages, form values, or adversarial instructions?

If the data purpose or permission is unclear, remain in metadata-only mode.

## 21. Deliberately deferred work and decision gates

These are real possibilities, but they should not be built until the documented trigger occurs.

| Deferred item | Why it is deferred | Reconsider when |
| --- | --- | --- |
| Native companion process | Installation, signing, permissions, updates, and cross-browser complexity | Browser-only model evaluation cannot meet measured quality/performance budgets |
| Local embeddings | Token search must remain sufficient and package/memory cost is unknown | Measured search fixtures show a meaningful retrieval gap that reranking cannot solve |
| Continuous page-context access | Broad permission and privacy impact | User-invoked extraction proves value and a reviewed feature needs continuous context |
| Encryption-at-rest archive | Key recovery and data-loss design is separate | A validated threat/user need justifies the complete key/recovery UX |
| Cloud sync/account/backend | Conflicts with the local-only initial architecture | Product direction is explicitly changed with a new privacy/security architecture |
| Additional browsers | Loading is not support | Chromium and Firefox foundations are stable and a new adapter can pass all support gates |
| Increased model concurrency | Higher resource and cancellation risk | Measurements prove one-task concurrency is a bottleneck and added concurrency stays within budgets |
| Runtime-downloaded model/code | Violates current local/offline/CSP contract | Do not reconsider without a deliberate architecture and privacy change; hosted fallback is not allowed |
| Elaborate animation or visual effects | Does not establish product correctness | Core UI, accessibility, reduced-motion, and low-performance behavior are already proven |

Open baseline decisions already documented are summarized in [`docs/README.md`](docs/README.md#what-remains-deliberately-open).

## 22. Global definition of done

A feature is done only when:

- the user-visible outcome exists in the real extension;
- browser, core, storage, analysis, and UI boundaries remain aligned;
- permissions and collected/stored data match the privacy contract;
- model output is a validated recommendation and cannot bypass safety;
- failure, denial, cancellation, stale state, partial success, restart, and recovery behavior are handled where relevant;
- keyboard, focus, zoom, contrast, reduced motion, and non-drag paths are checked for visible changes;
- focused tests exist and pass;
- both browser builds still build;
- a real-browser smoke test is recorded when browser behavior changed;
- synthetic data is used in tests, screenshots, and logs;
- directly affected documentation is current and does not overclaim;
- the diff contains no unrelated changes or sensitive data;
- remaining limitations are stated plainly.

A release is done only when the complete first-useful-release gate in Phase 8 passes.

## 23. The exact first work session

When implementation begins, do this in order:

1. Confirm the Git worktree is clean or identify unrelated changes.
2. Re-read [`docs/ARCHITECTURE.md` sections 2–5](docs/ARCHITECTURE.md#2-runtime-shape), [`docs/PRIVACY_SECURITY.md` permissions](docs/PRIVACY_SECURITY.md#3-permissions), and [`docs/TESTING_PERFORMANCE.md` Stage 1](docs/TESTING_PERFORMANCE.md#stage-1-local-foundation).
3. Verify current official Chromium and Firefox extension setup requirements using the platform references in [`docs/README.md`](docs/README.md#platform-references).
4. Initialize the TypeScript/Vite/Preact toolchain and lockfile.
5. Create the two manifest sources with no host permissions.
6. Build one shared extension page and one background entry.
7. Add the minimal `BrowserAdapter` type with `queryTabs()` and `getCapabilities()` only.
8. Implement the first adapter and a fake adapter for a focused unit test.
9. Display a read-only list of normalized fictional/test-profile tab metadata.
10. Build and load the extension in an isolated browser profile.
11. Record the exact permission prompt and observed behavior.
12. Implement the second browser adapter against the same contract.
13. Add IndexedDB only after the adapter can inventory tabs.
14. Add the idempotent reconciliation test before wiring restart reconciliation.
15. Stop the first change there. Do not add organization, lifecycle mutation, a model, page extraction, or visual spectacle to the initial pull request.

The first meaningful proof is simple: **the same shared code can safely observe tabs in two browsers, persist stable local records, survive restart, and tell the user the truth.** Everything else builds on that.

## 24. Reference index

- Product destination and full release scope: [`README.md`](README.md)
- Documentation map and open decisions: [`docs/README.md`](docs/README.md)
- Runtime, adapters, durable flow, policy, and memory: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Durable records, operations, state, reconciliation, and deletion: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
- Context, heuristics, local model, search, duplicates, corrections, and uncertainty: [`docs/AI_PIPELINE.md`](docs/AI_PIPELINE.md)
- Local-only boundary, permissions, threat model, private windows, and transparency: [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md)
- Information architecture, interactions, copy, accessibility, responsive behavior, and edge states: [`docs/DESIGN.md`](docs/DESIGN.md)
- Invariants, performance budgets, failure tests, browser gates, and release stages: [`docs/TESTING_PERFORMANCE.md`](docs/TESTING_PERFORMANCE.md)
