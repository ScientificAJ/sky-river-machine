# Implementation record

This file records observed implementation state. The design and plan documents remain the product contract; this file must not turn a planned capability into a shipped claim.

## Current implementation

Status: the buildable shell, local inventory, workspace/search, protection, refresh serialization, and Firefox smoke slices exist. Chromium page-opening verification remains incomplete in the managed desktop environment, so neither browser is called supported.

Implemented locally:

- normalized normal-window tab metadata through separate Chromium and Firefox adapters;
- browser-specific visible-context calls stay inside adapters (`scripting.executeScript` for Chromium and `tabs.executeScript` for Firefox);
- IndexedDB tab records with stable local IDs, schema migration to workspaces, and idempotent reconciliation;
- read-only inventory, local workspace creation/editing, metadata search, record deletion, and all three protection controls;
- a centralized mutation guard and approval-first lifecycle operations; automation remains off;
- serialized inventory refreshes so overlapping browser events cannot write stale snapshots concurrently.
- checkpointed lifecycle operations, restore/archive/rest/delete paths, bounded heuristic fallback, local MiniLM embedding suggestions, validated model-response fallback, correction records, and explicit visible-context/export/delete controls.
- strict extension-message validation, explicit workspace deletion/data inspection, bounded model requests, paged background search, conservative startup recovery for planned/applying operations, a reproducible embedding evaluation command, and bundled offline model assets.
- manual workspace/protection changes are journaled; deleting a record prunes its suggestion and correction references; pinned and loading tabs are protected from lifecycle mutation.
- Permanent record deletion journals no reversible URL snapshot, and startup recovery scrubs any legacy delete snapshot before retaining its outcome.
- heuristic proposal review supports bounded rename, reassignment, split/merge-by-assignment, reject, and leave-unchanged decisions before local application.
- token- and stored-context-ranked local search, correction-informed heuristic naming, and explicit duplicate keep/dismiss/archive review are implemented; extension-owned pages stay out of the inventory.

Focused automated tests are part of implementation verification. `npm run evaluate:model` records rejected generative candidates and `npm run evaluate:embedding` qualifies the bundled MiniLM artifact; Firefox 153 smoke is recorded below. A passing focused suite or one browser smoke run does not establish cross-browser support.

Build commands:

```bash
npm install
npm run build:chromium
npm run build:firefox
npm run package:all
```

The unpacked outputs are `dist/chromium` and `dist/firefox`. The Chromium manifest uses a Manifest V3 service worker. The Firefox manifest uses a background script entry. Both request only the documented tab metadata and user-invoked context permissions; the MiniLM model, tokenizer/config, and ONNX runtime are packaged locally, with no host permissions, persistent content scripts, remote model loading, or analytics.

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
- Firefox 153.0 installed the packaged XPI in an isolated profile. The smoke flow verified normal-tab inventory, extension-page exclusion, protection refusal, Dormant/native discard, archive/search, restore, undo, and extension-reload persistence using fictional example URLs. Full browser restart, private-window, sidebar, and explicit permission-denial gates remain open.
- A separate isolated Chrome 145 profile did not expose the unpacked build because developer-mode extension loading is managed. The observed `fignfifoniblkonapihmkfakmlgkbkcf` service worker was verified through `chrome.runtime.getManifest()` as the preloaded Google Network Speech extension, not Sky River Machine; navigating its unrelated `extension.html` returned `ERR_FILE_NOT_FOUND`. This is recorded as an environment blocker, not as extension support or a product-page failure.
- Firefox 153.0 accepted the packaged build as a temporary extension through WebDriver. The first run exposed a real manifest bug (the ES-module background was loaded as classic script); adding Firefox `background.type: "module"` removed that startup syntax error. The classic direct-navigation endpoint rejects `moz-extension://` URLs, so the smoke used the available WebDriver BiDi/chrome-context route to open and exercise the page.
- No cross-browser support claim is made from these partial observations.
- On 2026-08-01, Chrome 150.0.7871.186 did not list the unpacked build on chrome://extensions; Firefox 153.0.1 accepted the XPI through geckodriver 0.37.0, but the isolated WebDriver rejected direct moz-extension:// navigation. These are environment/harness limits, not support evidence.
