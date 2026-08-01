# Release status

The repository now contains the implementation path through local foundation, lifecycle safety, bounded heuristic organization, model-unavailable fallback contracts, optional bounded visible context, local data controls, and the main extension-page UI.

This is not a supported release yet. Firefox smoke has been recorded in an isolated Firefox 153 profile, but Chromium loading is blocked by the managed desktop runner and full browser-restart/private-window release gates remain open. No browser is listed as supported until its complete gate passes.

The local model artifact is not bundled. The pinned offline candidate evaluations are recorded in [`docs/MODEL_EVALUATION.md`](MODEL_EVALUATION.md); q4f16 failed during CPU runtime initialization and q8 ran but failed the structured-output and latency probes. `UnavailableModelRunner` is the explicit safe fallback; heuristic suggestions and manual organization remain available. A model package is a release gate, not a hidden network fallback.

Current local verification:

- `npm test`: 38 focused tests pass across reconciliation/recovery, safety, operation checkpointing, model fallback/cancellation, adapter normalization/capability fallback, shell, queue backpressure, search, duplicate review, and scale fixtures.
- On 2026-08-01, the q8 rerun passed checksum and CPU initialization but took 3,305 ms and 3,333 ms for the two synthetic prompts; neither output contained a JSON object. The candidate remains disqualified.
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

Recorded Firefox smoke (Firefox 153.0, geckodriver 0.37.0, isolated temporary profile, synthetic `example.com`/`.org`/`.net` tabs):

- the packaged XPI installed and its ES-module background started without syntax errors;
- inventory returned four user tabs and excluded the extension's own `moz-extension://` page;
- a protected synthetic payment tab refused archive, an eligible tab became Dormant with `discarded: true`, and an archived tab remained searchable as Extinct;
- restore and undo both completed, and the Extinct record remained searchable after an extension runtime reload and page reopen;
- the Firefox native discard API's void response is normalized safely; unavailable visible-context execution falls back to metadata mode;
- this is a Firefox smoke result, not a complete Firefox support-gate or cross-browser release claim.

The evaluator runtime is installed only temporarily for the documented offline experiment; it is not in the committed dependency graph and is not imported into or bundled with either extension build.

Deferred release verification:

- isolated Chromium installation/page/reload/restart/permission verification; Chrome developer-mode loading is managed and did not expose the unpacked build (the observed workers were unrelated preloaded extensions, including Google Network Speech);
- full Firefox browser restart, private-window review, explicit permission-denial prompt, and sidebar capability review; the Firefox extension reload and metadata fallback were verified, but these are narrower checks;
- large-session timings, memory, storage pressure, and fault injection on representative devices;
- local-model representative grouping quality, cancellation, and licensing evaluation;
- final first-useful-release smoke flow.
