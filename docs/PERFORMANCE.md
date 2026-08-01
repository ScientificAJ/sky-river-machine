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
| 12 | 5 ms |
| 100 | 2 ms |
| 1,000 | 8 ms |
| 10,000 | 56 ms |

The 10,000-record pure-path test has a 500 ms guard. IndexedDB transactions, extension startup, UI rendering, model inference, memory use, storage pressure, and real-browser behavior remain unmeasured here.
