# Local AI and analysis pipeline

## 1. Goal

The model is a small contextual assistant, not a general chatbot. It helps with relatedness, workspace naming, duplicate hints, lifecycle recommendations, remembered search, and learning from corrections.

The product remains useful with no model installed. Deterministic heuristics provide a slower, less semantic fallback.

## 2. Context levels

The user chooses how much page context is allowed:

1. **Metadata:** title, URL, domain, favicon, browser signals. Default.
2. **Visible context:** bounded page title, headings, description, and selected visible text after explicit permission.
3. **Stored summary:** a local summary retained for search and recovery.

Passwords, form values, cookies, page scripts, private messages, and hidden DOM content are never collected by the default pipeline. Sensitive pages can be excluded by URL pattern, page type, private-window policy, or a one-click protection rule.

## 3. Pipeline

```text
Signals -> normalize -> cheap heuristics -> bounded model call
       -> validate structured output -> safety/policy checks -> UI or action
```

### Stage A: normalization

- Canonicalize URLs without destroying query parameters that identify a document.
- Remove tracking parameters only for duplicate comparison, never for restoration.
- Normalize title/domain tokens.
- Redact obvious secrets and high-risk fields before model input.
- Limit text by characters/tokens and discard oversized input.

### Stage B: cheap heuristics

Use deterministic signals first:

- Exact URL and canonical URL matches.
- Same-domain and path similarity.
- Title token overlap.
- Recent co-activation.
- Explicit user workspace/protection rules.
- Audible, active, loading, download, form, and discard flags.

This keeps trivial work off the model and makes the system usable on weak hardware.

### Stage C: local model tasks

The model runner accepts one narrow task at a time:

- `relateTabs`: rank related records with evidence.
- `nameWorkspace`: produce a short name from selected records.
- `classifyPage`: identify likely document/form/dashboard/media/reference risk.
- `rankLifecycle`: suggest a state, never apply one.
- `searchIntent`: turn a natural-language query into local tokens and filters.

Responses must be structured, schema-validated, size-limited, and discarded if malformed. No free-form model text drives browser APIs.

## 4. Model/runtime strategy

### Selected first model

Use **Qwen2.5-0.5B-Instruct** as the first implementation and evaluation baseline. `ModelRunner` should load the ONNX conversion `onnx-community/Qwen2.5-0.5B-Instruct` through Transformers.js and ONNX Runtime Web.

This model is the best current fit because it is small enough to test on-device (0.49B parameters), is Apache-2.0 licensed, supports more than 29 languages, and was explicitly trained to follow instructions and produce structured output, especially JSON. Transformers.js documents this exact ONNX model running with 4-bit quantization on WebGPU and supports local model paths, CPU inference through WebAssembly, and disabling remote model access.

Start evaluation with `q4f16` on WebGPU and `q8` on WebAssembly. These are runtime artifacts of the same model, not separate organization behaviors. Pin the chosen artifact revision and checksum, package the model and matching WASM runtime locally, and disable remote model loading. Never fall back to a hosted model.

The public ONNX artifacts are currently about 483 MB for `q4f16` and 512 MB for `q8`, before tokenizer and runtime files. Treat the model as the optional local model package described below rather than silently inflating the base extension. Do not ship both artifacts unless cross-browser measurements prove that both are necessary.

This is an implementation baseline, not a release-quality claim. It must pass the representative fixture evaluation in [TESTING_PERFORMANCE.md](TESTING_PERFORMANCE.md) on low-end CPU-only and normal WebGPU profiles. Measure grouping quality, structured-output validity, multilingual behavior, cold start, task latency, peak memory, cancellation, and adversarial metadata handling. Replace it behind `ModelRunner` if it misses the measured budgets or quality bar; heuristic mode remains available throughout.

Sources checked 2026-08-01:

- [Qwen2.5-0.5B-Instruct model card](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)
- [Transformers.js quantization guide](https://huggingface.co/docs/transformers.js/en/guides/dtypes)
- [Transformers.js local-model configuration](https://huggingface.co/docs/transformers.js/main/en/custom_usage)
- [ONNX artifact sizes](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/tree/main/onnx)

The first implementation should target a very small quantized model that can run:

- CPU-only through WebAssembly.
- With WebGPU acceleration when available.
- Offline, with no model download after installation.
- In a bounded worker with one active model instance.

If packaging the model inside the extension makes the install too large, ship a small base capability and let the user explicitly install an additional local model package. The feature must still run in heuristic mode.

A native local service is deferred. If it becomes necessary, it must remain optional, local-only, signed/discoverable, and hidden behind the same `ModelRunner` interface.

## 5. Queue and backpressure

- One priority queue for active/recent tabs and one low-priority queue for archives.
- One model call at a time initially; increase only after measured benefit.
- Coalesce repeated updates for the same record.
- Cancel stale work when a tab changes.
- Persist queued work and retry metadata.
- Stop or reduce work at memory and battery thresholds.
- Never create an unbounded promise list.

## 6. Search

Search is local and layered:

1. Exact/prefix title, URL, workspace, and domain matches.
2. Token-based inverted index over permitted context.
3. Optional local model query interpretation and reranking.
4. Optional local embeddings only if package size and memory measurements justify them.

The system must not require embeddings to find a tab. Search returns state, workspace, evidence, and a restore action for Dormant/Extinct records.

## 7. Duplicate detection

Use the cheapest reliable test first:

- Same restoration URL: exact duplicate candidate.
- Same canonical URL/title tokens: repeated-page candidate.
- Same domain plus high title/content token overlap: near-duplicate candidate.
- Model similarity: optional tie-breaker, never an automatic close decision.

The user sees why records were grouped and can keep all, archive selected records, or dismiss the suggestion.

## 8. Learning from corrections

Corrections update local ranking features such as:

- Project-word to workspace association.
- Domain/path preference within a workspace.
- A tab/page type's protection tendency.
- Co-occurrence of records.

The first release does not retrain model weights. This keeps behavior inspectable, storage bounded, and deletion meaningful.

## 9. Quality and uncertainty

Every recommendation carries:

- Confidence: how strongly the system prefers it.
- Evidence: the signals a user can understand.
- Alternatives: when multiple workspaces or states are plausible.
- Freshness: when the input was last observed.

Low confidence means “ask the user,” not “act anyway.”
