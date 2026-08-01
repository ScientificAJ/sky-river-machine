# Sky River Machine — Continuation Handoff

## Current state

The extension implementation is substantially complete but the full plan is **not finished** and the project is **not release-ready**.

- Branch: `main`
- Latest commit: `0d6298990221957628f5acacb6e0051f1f0a97d040` (`enforce local model time budget`)
- Remote: `https://github.com/ScientificAJ/sky-river-machine.git`
- Phases 0–7: implemented
- Phase 8: mostly implemented, with release gates still open
- Focused tests: 38 passing across 8 files
- Chromium and Firefox production builds: passing
- Offline production dependency audit: 0 vulnerabilities
- Worktree was clean before this handoff file was created

## What is implemented

- TypeScript/Vite/Preact extension foundation
- Chromium and Firefox manifests and browser adapters
- IndexedDB records for tabs, workspaces, operations, suggestions, and corrections
- Reconciliation and Active/Dormant/Extinct lifecycle handling
- Protected-tab rules and safe action planning
- Checkpointed organization, recovery, restoration, and undo
- Bounded heuristic fallback organization with validated model-output handling
- Search with exact, token, context, workspace, title, domain, URL, and stored visible-context matching
- User corrections that influence future fallback suggestions
- Duplicate review with keep, dismiss, and archive-selected decisions
- Home, Search, Workspaces, Recovery, and Settings UI
- Privacy controls, visible-context controls, deletion, and export paths
- Model timeout cancellation using the 1500 ms product budget

## Verified browser evidence

Firefox core smoke passed on an isolated temporary profile using synthetic tabs. It covered inventory, extension-page exclusion, protected-tab refusal, discard, archive, search, restore, undo, extension reload persistence, and safe metadata-only fallback when visible context was unavailable.

Chromium smoke is still blocked by the current managed desktop environment: Chrome refuses to expose the unpacked extension through the tested loading flags. Do not claim Chromium support until a normal development machine proves the flow.

## Remaining work, in order

1. On a machine where Chromium/Chrome allows unpacked extensions, install dependencies and run the local checks:

   ```bash
   npm ci
   npm run check
   ```

2. Build and load the extension in Chromium/Chrome using the supported development workflow. Exercise the complete synthetic flow:

   - mixed tab inventory
   - organization preview and correction
   - apply organization
   - protected-tab refusal
   - discard/archive recommendation and action
   - restore
   - undo
   - browser restart and extension reload recovery
   - permission denial and unsupported URL behavior

3. Finish Firefox release-gate checks: browser restart, private-window isolation, explicit permission-denial behavior, sidebar/entry-point behavior where supported, and degraded capability paths.

4. Qualify a local model through `scripts/evaluate-model.mjs`. The model must satisfy the existing latency, structured-output, semantic-quality, privacy, and licensing requirements before it is bundled or described as supported.

   Existing evidence:

   - q4f16 SmolLM2 ONNX candidate: CPU initialization failed.
   - q8 SmolLM2 ONNX candidate: approximately 20-second task times and unreliable JSON-like output; failed the current gate.
   - No model is bundled.
   - `UnavailableModelRunner` remains the safe fallback.

5. Run representative performance and fault-injection checks for large sessions, IndexedDB/storage corruption or recovery, stale tab IDs, partial multi-tab failure, service-worker reload, and model timeout/unavailability.

6. Update `plan.md`, `README.md`, `docs/IMPLEMENTATION.md`, and `docs/RELEASE_STATUS.md` together only after evidence changes. Keep proposed, implemented, tested, and supported claims distinct.

7. Run the final local gates, commit scoped changes, push `main`, and verify the remote branch with:

   ```bash
   git status --short
   git log -1 --oneline
   git ls-remote origin refs/heads/main
   ```

## Safety rules for the next session

- Use only synthetic browsing data for smoke tests.
- Do not test destructive actions against the user's real browser session.
- Do not download or bundle a model speculatively; qualify the exact artifact first.
- Do not broaden browser permissions without updating the privacy/security documentation and checking the plan gate.
- Do not claim universal browser support because the extension merely loads.
- Do not mark the plan complete until Chromium, Firefox, model, recovery, privacy, and performance gates have evidence.
- Preserve unrelated user changes in the shared worktree.

## Useful source files

- `AGENTS.md` — operating and product safety instructions
- `plan.md` — phased implementation plan and acceptance gates
- `docs/RELEASE_STATUS.md` — current release evidence and blockers
- `docs/IMPLEMENTATION.md` — implemented behavior map
- `docs/TESTING_PERFORMANCE.md` — testing, performance, and release expectations
- `scripts/evaluate-model.mjs` — local model qualification harness

