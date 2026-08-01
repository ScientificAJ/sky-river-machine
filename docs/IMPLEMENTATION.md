# Implementation record

This file records observed implementation state. The design and plan documents remain the product contract; this file must not turn a planned capability into a shipped claim.

## Phase 0 and first slice

Status: build and focused automated checks pass. Real-browser page-opening verification remains incomplete in the managed desktop environment.

Build commands:

```bash
npm install
npm run build:chromium
npm run build:firefox
```

The unpacked outputs are `dist/chromium` and `dist/firefox`. The Chromium manifest uses a Manifest V3 service worker. The Firefox manifest uses a background script entry. Both request only `tabs`; there are no host permissions, content scripts, model assets, remote URLs, analytics, or tab mutations.

Permission record:

| Permission | Feature that needs it | Requested now? | Behavior when denied/absent |
| --- | --- | --- | --- |
| `tabs` | Query permitted normal-window tab metadata | Yes | Show the local inventory error state and allow retry |
| `storage` | Small settings/bootstrap markers | No | Not applicable in this slice |
| `alarms` | Scheduled reconciliation | No | Startup and relevant observed events only |
| `activeTab` | User-invoked page context | No | Metadata-only view remains the whole available surface |
| Host access | Continuous page-context analysis | No | Metadata-only view remains the whole available surface |

Observed smoke notes:

- Chrome 145.0.7632.75 is installed, but the managed Chrome runner loaded its preloaded extension set and did not expose this unpacked build as a target, so page-opening verification is blocked by the environment.
- Firefox 153.0 accepted the unpacked `dist/firefox` directory as a temporary extension through WebDriver BiDi. The protocol used here rejects direct `moz-extension://` navigation, so page-opening and reload assertions remain pending.
- No cross-browser support claim is made from these partial observations.
