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

### Selected model: MiniLM embeddings

The current implementation uses **Xenova/all-MiniLM-L6-v2** as a local embedding model, loaded with Transformers.js and ONNX Runtime Web. It produces 384-dimensional normalized vectors instead of free-form text, which removes the unreliable JSON-generation failure observed with the smaller generative candidates.

The packaged artifact is `public/models/minilm/onnx/model_quantized.onnx` (22,972,370 bytes), pinned to revision `751bff37182d3f1213fa05d7196b954e230abad9` with SHA-256 `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`. The model is bundled with its tokenizer/config files and Apache-2.0 license text. Remote model loading is disabled; the extension has no hosted-model fallback.

`relateTabs` embeds bounded title/URL metadata, clusters vectors with cosine similarity at threshold `0.52`, and emits the existing validated suggestion schema. Group names remain deterministic and reviewable; the model chooses relatedness, never a browser action. Empty, malformed, cancelled, oversized, or slow inference falls back to the bounded heuristic path.

The reproducible `npm run evaluate:embedding` probe on Node v24.18.0 loaded the artifact in 121 ms, completed the synthetic batch in 16 ms, and returned 384-dimensional vectors. Related browser-extension texts scored `0.694`; an unrelated recipe scored `0.220`. These are qualification fixtures, not a universal semantic or multilingual quality claim. The model is English-oriented, so multilingual quality and representative browser-scale performance remain release gates.

Sources checked 2026-08-01:

- [all-MiniLM-L6-v2 model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- [Transformers.js local-model configuration](https://huggingface.co/docs/transformers.js/main/en/custom_usage)
- [Transformers.js data types](https://huggingface.co/docs/transformers.js/en/guides/dtypes)

The runtime is selected for old-hardware compatibility:

- CPU-only execution works in the Node qualification harness.
- Browser builds default to the runtime's WebAssembly path; WebGPU is not required.
- All model and ONNX runtime assets are packaged locally after installation.
- One lazy, bounded model instance serves one batch at a time.

The 135M/360M SmolLM and 0.5B Qwen generative candidates remain documented as rejected or unevaluated alternatives. A native local service is deferred and, if ever added, must remain optional, local-only, and hidden behind the same `ModelRunner` interface.

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
