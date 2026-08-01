# Sky River Machine — Continuation Handoff

## Current state

The extension implementation is substantially complete but the full plan is **not finished** and the project is **not release-ready**.

- Branch: `main`
- This session adds the MiniLM embedding runner, packaged model assets, tests, evaluator, audit policy, and synchronized documentation.
- Remote: `https://github.com/ScientificAJ/sky-river-machine.git`
- Phases 0–7: implemented
- Phase 8: mostly implemented, with release gates still open
- Focused tests: 42 passing across 10 files
- Chromium and Firefox production builds: passing
- Offline production dependency audit: 0 vulnerabilities
- The final commit must include the implementation, model asset, evaluator, audit, and documentation changes together, then be pushed to `main`.

## Judge requirements

The project must demonstrate all of the following, without overstating unfinished gates:

1. A clear quality-of-life improvement.
2. A working and usable project.
3. Effort and thoughtful execution.
4. A clear explanation of the problem being solved.
5. At least three hours of work.
6. Three major quality-of-life improvements.

`JUDGES.md` is the judge-facing brief. It contains the problem explanation, the three concrete improvements, the demo flow, the engineering evidence, current limitations, and a required placeholder for the verified three-hour effort record. Do not invent the final time record; replace the placeholder only after the work log is known.

The three improvements currently presented are:

- task-shaped, reviewable workspaces from tab context;
- Active/Dormant/Extinct lifecycle management that reduces live browser pressure while preserving recovery;
- ranked search, duplicate review, correction, protected-tab handling, and undo for confident cleanup.

## Phase completion matrix

This is an implementation handoff, not a release claim:

| Phase | State | Evidence or remaining gate |
| --- | --- | --- |
| Phase 0 | Implemented | Repository foundation and contracts established |
| Phase 1 | Implemented | Browser adapters, inventory, durable records, reconciliation |
| Phase 2 | Implemented | Lifecycle state, protection, checkpointed actions, recovery |
| Phase 3 | Implemented | Bounded organization fallback, validation, review, corrections |
| Phase 4 | Implemented | Search, duplicates, visible-context controls, local data controls |
| Phase 5 | Implemented | Main extension UI surfaces and recovery/settings flows |
| Phase 6 | Implemented | Focused tests, scale fixtures, packaging and artifact checks |
| Phase 7 | Implemented with partial browser evidence | Firefox core smoke passed; complete cross-browser gates remain |
| Phase 8 | Partially implemented | Chromium smoke, full Firefox gates, browser WASM/model evidence, performance/fault evidence remain |

Approximate progress remains **about 90% of core implementation** and **about 75% of release acceptance**. These are estimates, not plan-defined metrics; the unfinished work is concentrated in high-value release gates.

## What is implemented

- TypeScript/Vite/Preact extension foundation
- Chromium and Firefox manifests and browser adapters
- IndexedDB records for tabs, workspaces, operations, suggestions, and corrections
- Reconciliation and Active/Dormant/Extinct lifecycle handling
- Protected-tab rules and safe action planning
- Checkpointed organization, recovery, restoration, and undo
- Bounded heuristic fallback organization with validated model-output handling
- Bundled MiniLM embedding organization with deterministic cosine clustering and offline evaluator
- Search with exact, token, context, workspace, title, domain, URL, and stored visible-context matching
- User corrections that influence future fallback suggestions
- Duplicate review with keep, dismiss, and archive-selected decisions
- Home, Search, Workspaces, Recovery, and Settings UI
- Privacy controls, visible-context controls, deletion, and export paths
- Model timeout cancellation using the 1500 ms product budget

## Current architecture and safety boundaries

- Browser APIs are accessed through explicit Chromium and Firefox adapters.
- Durable state is local IndexedDB; there is no hosted backend or cloud sync.
- The default analysis context is minimized tab metadata. Visible page context is bounded and user-invoked.
- No host permissions, persistent content scripts, remote model requests, analytics, or runtime-fetched JavaScript are present; the bundled model and ONNX runtime are local assets only.
- The model boundary is explicit. A model recommendation is validated and remains subject to deterministic safety policy and user approval.
- Protected and uncertain tabs are not silently discarded, archived, moved, or closed.
- Recovery information is checkpointed before risky browser mutation; partial success must remain visible.
- Normal and private browsing contexts must remain isolated; private-window handling is not yet fully browser-verified.
- Search, correction, duplicate, recovery, and deletion records must remain local and must not contain real browsing data in fixtures, logs, screenshots, or commits.

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

4. Finish browser-model qualification through `npm run evaluate:embedding` and the real extension runtime. The model must satisfy representative grouping, cancellation, browser-WASM, resource, multilingual, privacy, and licensing requirements before any supported-release claim.

   Existing evidence:

   - q4f16/q8 SmolLM2 generative candidates: rejected for runtime/structured-output/latency failures.
   - MiniLM checksum and CPU embedding probe: passed; 121 ms load, 16 ms synthetic inference, 384 dimensions.
   - The MiniLM model and ONNX runtime are bundled locally with remote model loading disabled.
   - Heuristic fallback remains active for unavailable, malformed, cancelled, or over-budget inference.

5. Run representative performance and fault-injection checks for large sessions, IndexedDB/storage corruption or recovery, stale tab IDs, partial multi-tab failure, service-worker reload, and model timeout/unavailability.

6. Update `plan.md`, `README.md`, `docs/IMPLEMENTATION.md`, and `docs/RELEASE_STATUS.md` together only after evidence changes. Keep proposed, implemented, tested, and supported claims distinct.

7. Run the final local gates, commit scoped changes, push `main`, and verify the remote branch with:

   ```bash
   git status --short
   git log -1 --oneline
   git ls-remote origin refs/heads/main
   ```

## Long-term continuation protocol

When starting a new session on another machine:

1. Pull the current branch and read this file, `AGENTS.md`, `plan.md`, `JUDGES.md`, and `docs/RELEASE_STATUS.md`.

   ```bash
   git pull origin main
   sed -n '1,320p' CONTINUE.md
   sed -n '1,260p' JUDGES.md
   ```

2. Check the real local state before changing anything:

   ```bash
   git status --short
   git branch --show-current
   git log -5 --oneline
   git remote -v
   node --version
   npm --version
   ```

3. Run the focused local baseline before browser work:

   ```bash
   npm ci
   npm run check
   npm audit --offline --omit=dev --audit-level=high
   ```

4. Determine whether the machine can load unpacked Chromium/Chrome extensions. If it is managed and refuses the build, record the blocker and move to Firefox/model/recovery work; do not claim Chromium support.

5. Use isolated browser profiles and synthetic URLs only. Keep browser smoke evidence in `docs/RELEASE_STATUS.md`, including browser versions, profile type, exact flow, result, and limitations.

6. For model work, inspect the existing evaluation harness and candidate evidence before downloading anything. Do not bundle an artifact until it passes initialization, latency, structured-output, semantic-quality, privacy, and licensing gates.

7. After each meaningful slice, update the smallest governing documents together. Never turn a planned feature into an implemented or supported claim without observed evidence.

8. Before handoff, review the diff, run the smallest relevant checks, commit only scoped work, push `main`, and verify both local and remote commit hashes.

## Long-term product direction

The next sessions should continue toward a trustworthy first useful release, not merely a larger feature list:

- Keep semantic organization configurable and model-adapter based; never replace it with permanent keyword/category trees.
- Keep all consequential tab actions reviewable, attributable, reversible, and safe under partial browser failure.
- Keep local-only processing as the default and make every new permission or retained field justify itself.
- Preserve the distinction between Active, Dormant, Extinct, safe-to-suspend, suggested-for-archive, and user-protected.
- Make uncertain AI output easy to inspect and correct; never present it as perfect.
- Measure large-session responsiveness, memory, model latency, storage pressure, and recovery before making performance claims.
- Treat Chromium and Firefox as separate support gates; loading is not support.
- Prefer a small reliable release slice over speculative model downloads, remote services, broad permissions, or automation that cannot be recovered.

## Final definition of done

Do not mark the full plan complete until all of these have evidence:

- the focused test/build/audit gates pass;
- Chromium completes the synthetic end-to-end flow on a normal development machine;
- Firefox completes its documented support gates;
- permissions, privacy boundaries, private-window isolation, and unsupported capabilities behave truthfully;
- organization, correction, duplicate review, lifecycle actions, restore, undo, restart recovery, and partial failure are verified;
- a local model qualifies, or the release documentation explicitly and prominently states fallback-only behavior;
- representative large-session performance and fault evidence exists;
- `JUDGES.md` has its three-hour effort placeholder replaced with verified evidence;
- README, plan, implementation, release status, and judge-facing claims agree;
- the final commit is pushed and remotely verified.

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
- `scripts/evaluate-embedding.mjs` — bundled MiniLM checksum and CPU qualification harness
