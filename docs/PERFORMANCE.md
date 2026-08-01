# Local performance evidence

This is a small, reproducible calibration of pure TypeScript paths. It is not a browser, IndexedDB, UI, or model benchmark and must not be read as a release-performance claim.

Environment:

- Date: 2026-08-01
- Runtime: Node v24.13.0, Vitest 3.2.7
- Platform: Linux x86_64, 4 logical CPUs
- Command: `npm test -- --reporter=verbose tests/scale-fixtures.test.ts`

Observed test durations for deterministic synthetic records:

| Records | Search plus reconciliation test |
| ---: | ---: |
| 12 | 9 ms |
| 100 | 2 ms |
| 1,000 | 16 ms |
| 10,000 | 108 ms |

The 10,000-record pure-path test has a 500 ms guard. IndexedDB transactions, extension startup, UI rendering, model inference, memory use, storage pressure, and real-browser behavior remain unmeasured here.

Local safety evidence:

- The heuristic fallback receives at most 128 prioritized records even when the archive contains 10,000 records; the focused test exercises that path and preserves the full source revision for stale-proposal checks.
- The same focused run measured the synthetic 10,000-record fallback path at 436 ms on this desktop runtime; this is a guard/evidence point, not a low-end or browser release budget.
- Recovery tests cover confirmed archive completion, failed stale wake, and partial organization. Pending operations are marked for review after restart rather than replayed blindly.
- These are local pure-logic checks, not representative browser, IndexedDB, memory, or low-end-device measurements.
