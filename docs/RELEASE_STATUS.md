# Release status

The repository now contains the implementation path through local foundation, lifecycle safety, bounded heuristic organization, model-unavailable fallback contracts, optional bounded visible context, local data controls, and the main extension-page UI.

This is not a supported release yet. Browser smoke testing is intentionally postponed. Until it is run in isolated Chromium and Firefox profiles, the project must not claim browser support, successful extension-page loading, native discard parity, or restart recovery in real browsers.

The local model artifact is not bundled. The pinned offline candidate evaluations are recorded in [`docs/MODEL_EVALUATION.md`](MODEL_EVALUATION.md); q4f16 failed during CPU runtime initialization and q8 ran but failed the structured-output and latency probes. `UnavailableModelRunner` is the explicit safe fallback; heuristic suggestions and manual organization remain available. A model package is a release gate, not a hidden network fallback.

Current local verification:

- `npm test`: 26 focused tests pass across reconciliation/recovery, safety, operation checkpointing, model fallback, adapter normalization, shell, queue backpressure, and scale fixtures.
- `npm run typecheck`: passes.
- `npm run build:chromium`: passes.
- `npm run build:firefox`: passes.
- `npm run audit`: checks permissions and packaged artifacts for remote code/request patterns, host permissions, content scripts, and tab mutations.
- `docs/PERFORMANCE.md`: records a pure-path synthetic calibration only; it is not representative release performance.
- Search returns a bounded page from the background store, and heuristic analysis is capped at 128 prioritized records; representative browser/UI/storage timings remain unmeasured.
- Suggestion review is local and approval-first; edited proposals are revalidated against the current record revision before application.
- `docs/MODEL_EVALUATION.md`: records the pinned local-model candidates, checksums, runtime measurements, structured-output failure, and replacement decision.
- `MODEL_DIR=/tmp/sky-river-smollm npm run evaluate:model`: reproduces the recorded q4f16 offline model failure with remote loading disabled; set `MODEL_FILE`, `MODEL_SHA256`, and `MODEL_DTYPE=q8` for the q8 follow-up.
- `npm audit --omit=dev --audit-level=high`: reports zero production dependency vulnerabilities.

The evaluator runtime is installed only temporarily for the documented offline experiment; it is not in the committed dependency graph and is not imported into or bundled with either extension build.

Deferred release verification:

- isolated browser installation, successful page opening/reload, restart, and permission denial; the latest Chrome attempt exposed the service worker but failed the extension-page load with `ERR_FILE_NOT_FOUND` and a content-verifier error, while Firefox now starts the corrected ES-module background but direct extension-page navigation remains blocked by the available WebDriver BiDi path;
- side-panel/sidebar capability checks;
- native discard behavior and browser-specific lifecycle recovery;
- large-session timings, memory, storage pressure, and fault injection on representative devices;
- local-model representative grouping quality, cancellation, and licensing evaluation;
- final first-useful-release smoke flow.
