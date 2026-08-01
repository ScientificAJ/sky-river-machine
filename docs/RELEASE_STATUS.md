# Release status

The repository now contains the implementation path through local foundation, lifecycle safety, bounded heuristic organization, model-unavailable fallback contracts, optional bounded visible context, local data controls, and the main extension-page UI.

This is not a supported release yet. Browser smoke testing is intentionally postponed. Until it is run in isolated Chromium and Firefox profiles, the project must not claim browser support, successful extension-page loading, native discard parity, or restart recovery in real browsers.

The local model artifact is also not bundled. `UnavailableModelRunner` is the explicit safe fallback; heuristic suggestions and manual organization remain available. A model package is a release gate, not a hidden network fallback.

Current local verification:

- `npm test`: 18 focused tests pass across reconciliation, safety, model fallback, adapter normalization, shell, queue backpressure, and scale fixtures.
- `npm run typecheck`: passes.
- `npm run build:chromium`: passes.
- `npm run build:firefox`: passes.
- `npm run audit`: checks permissions and packaged artifacts for remote code/request patterns, host permissions, content scripts, and tab mutations.
- `docs/PERFORMANCE.md`: records a pure-path synthetic calibration only; it is not representative release performance.

Deferred release verification:

- isolated browser installation, page opening, reload, restart, and permission denial;
- side-panel/sidebar capability checks;
- native discard behavior and browser-specific lifecycle recovery;
- large-session timings, memory, storage pressure, and fault injection on representative devices;
- local-model artifact quality, size, latency, cancellation, and licensing evaluation;
- final first-useful-release smoke flow.
