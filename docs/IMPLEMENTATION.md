# Implementation record

This file records observed implementation state. The design and plan documents remain the product contract; this file must not turn a planned capability into a shipped claim.

## Current implementation

Status: the buildable shell, local inventory, workspace/search, protection, and refresh serialization slices exist. Real-browser page-opening verification remains incomplete in the managed desktop environment, so neither browser is called supported.

Implemented locally:

- normalized normal-window tab metadata through separate Chromium and Firefox adapters;
- browser-specific visible-context calls stay inside adapters (`scripting.executeScript` for Chromium and `tabs.executeScript` for Firefox);
- IndexedDB tab records with stable local IDs, schema migration to workspaces, and idempotent reconciliation;
- read-only inventory, local workspace creation/editing, metadata search, record deletion, and all three protection controls;
- a centralized mutation guard and approval-first lifecycle operations; automation remains off;
- serialized inventory refreshes so overlapping browser events cannot write stale snapshots concurrently.
- checkpointed lifecycle operations, restore/archive/rest/delete paths, bounded heuristic suggestions, model-unavailable contracts, validated model-response fallback, correction records, and explicit visible-context/export/delete controls.

Focused automated tests are part of implementation verification. Real-browser smoke testing remains deferred by the project owner; a passing focused test suite does not establish browser support.

Build commands:

```bash
npm install
npm run build:chromium
npm run build:firefox
```

The unpacked outputs are `dist/chromium` and `dist/firefox`. The Chromium manifest uses a Manifest V3 service worker. The Firefox manifest uses a background script entry. Both request only the documented tab metadata and user-invoked context permissions; there are no host permissions, persistent content scripts, model assets, remote URLs, or analytics.

Permission record:

| Permission | Feature that needs it | Requested now? | Behavior when denied/absent |
| --- | --- | --- | --- |
| `tabs` | Query permitted normal-window tab metadata and lifecycle handles | Yes | Show the local inventory error state and allow retry |
| `activeTab` | User-invoked visible headings/description extraction | Yes | Metadata-only mode remains usable |
| `scripting` | Execute the bounded user-invoked extraction | Yes | Metadata-only mode remains usable |
| `storage` | Small settings/bootstrap markers | No | Not applicable in this slice |
| `alarms` | Scheduled reconciliation | No | Startup and relevant observed events only |
| Host access | Continuous page-context analysis | No | Metadata-only view remains the whole available surface |

Observed smoke notes:

- Chrome 145.0.7632.75 is installed, but the managed Chrome runner loaded its preloaded extension set and did not expose this unpacked build as a target, so page-opening verification is blocked by the environment.
- Firefox 153.0 accepted the unpacked `dist/firefox` directory as a temporary extension through WebDriver BiDi. The protocol used here rejects direct `moz-extension://` navigation, so page-opening and reload assertions remain pending.
- No cross-browser support claim is made from these partial observations.
