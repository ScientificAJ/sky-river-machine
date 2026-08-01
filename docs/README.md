# Sky River Machine documentation

Sky River Machine is a privacy-first, local-only browser extension that turns a large tab collection into a recoverable workspace.

The product understands browsing context, suggests meaningful workspaces, tracks tabs through `Active`, `Dormant`, and `Extinct`, protects important work, searches by remembered meaning, and keeps the live browser footprint bounded.

This documentation describes what we are going to build. It is an implementation contract for the builder, a contributor guide, and an architecture/product explanation for reviewers.

## Documents

- [Implementation plan](../plan.md) — ordered build phases, acceptance gates, verification, and a junior-developer starting path.
- [Technical architecture](ARCHITECTURE.md) — runtime, browser adapters, data flow, lifecycle engine, and decisions.
- [Data model](DATA_MODEL.md) — durable records, state transitions, versioning, and persistence rules.
- [AI pipeline](AI_PIPELINE.md) — local inference, heuristics, analysis queues, search, and learning from corrections.
- [Privacy and security](PRIVACY_SECURITY.md) — data boundaries, permissions, threat model, and deletion behavior.
- [Product and interface design](DESIGN.md) — user flows, information architecture, visual language, accessibility, and automation controls.
- [Testing and performance](TESTING_PERFORMANCE.md) — browser matrix, invariants, memory budgets, failure tests, and release gates.

## Decisions already made

- The product is local-only. No account, cloud sync, analytics, or remote AI is required.
- Chromium and Firefox are equal first-class targets. Other browsers use the same core through capability adapters where their WebExtensions implementation permits it.
- The system must work without GPU acceleration and without a large model.
- Automation is available, but opt-in. Approval-first is the default.
- Every destructive or potentially disruptive operation is explainable, reversible where possible, and checkpointed before mutation.

## What remains deliberately open

- Qwen2.5-0.5B-Instruct is the first implementation baseline; release inclusion and the exact runtime artifact still depend on measured package size, cold-start time, CPU use, and quality on representative tabs.
- A native companion process is not part of the first architecture. It may be added later behind the same model-runner interface if browser-only inference is insufficient.
- Exact default thresholds are calibration values, not product identity. They belong in settings and performance tests.

## Platform references

The implementation should verify its capability matrix against the current [WebExtensions documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions), [Chrome extension APIs](https://developer.chrome.com/docs/extensions/reference/), [Chrome extension service-worker model](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers), and [tab-discarding behavior](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/discard).
