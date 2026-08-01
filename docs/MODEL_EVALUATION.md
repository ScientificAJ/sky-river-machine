# Local model evaluation

The model runner remains replaceable and the extension remains useful without a model. This record captures the first offline candidate evaluation instead of treating a model download or a generated sample as release evidence.

Candidate:

- Repository: [onnx-community/SmolLM2-135M-Instruct-ONNX](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX)
- Artifact revision: `b8a5c0f`
- Artifact: `onnx/model_q4f16.onnx`
- Reported size: 117 MB
- SHA-256: `662d0a9d8d5d56e3746a5bf3b3ede96bd2d4d3594d9b2e282baebd4f34cf3589`
- Runtime: [Transformers.js](https://huggingface.co/docs/transformers.js/main/en/custom_usage) 4.2.0, local files only, remote models disabled

Reproduction:

```bash
npm install --no-save --package-lock=false @huggingface/transformers@4.2.0
MODEL_DIR=/absolute/path/to/SmolLM2-135M-Instruct-ONNX \
MODEL_SHA256=662d0a9d8d5d56e3746a5bf3b3ede96bd2d4d3594d9b2e282baebd4f34cf3589 \
npm run evaluate:model
```

Observed on 2026-08-01, Node v24.13.0, Linux x86_64, CPU mode:

- Checksum passed.
- Model loading failed before inference in ONNX Runtime during session initialization with a graph-fusion input-name error (`InsertedPrecisionFreeCast_...` / `SimplifiedLayerNormFusion`).
- No model output was accepted, no browser action was available to the runner, and no remote fallback was attempted.

Decision: do not bundle or enable this candidate. Keep `UnavailableModelRunner`, the validated response contract, heuristic suggestions, metadata search, and manual organization as the safe base behavior while another artifact/runtime combination is evaluated. This is a measured model-gate failure, not a claim that the candidate is universally unusable.

## q8 CPU follow-up

The same pinned repository revision was evaluated with the CPU-oriented `onnx/model_quantized.onnx` artifact, using the q8 runtime dtype.

- Artifact: `onnx/model_quantized.onnx`
- Size: `135658354` bytes
- SHA-256: `0fab87142e3eb1fcacb881f8282e7473e62ad66920c347b81f088da6fda2da37`
- Runtime: Transformers.js 4.2.0, local files only, remote models disabled
- Device: CPU
- Load time: `1501` ms
- Synthetic runs: `19973` ms and `20959` ms
- Structured-output probe: one of two runs produced JSON-like text; the second did not

Decision: runtime compatibility improved, but this artifact still fails the structured-output and latency gates. It is not bundled or enabled. The extension continues to use the safe model-unavailable path until a candidate passes representative grouping-quality, output-contract, resource, and licensing evaluation.

Reproduction:

```bash
MODEL_DIR=/absolute/path/to/SmolLM2-135M-Instruct-ONNX \
MODEL_FILE=onnx/model_quantized.onnx \
MODEL_SHA256=0fab87142e3eb1fcacb881f8282e7473e62ad66920c347b81f088da6fda2da37 \
MODEL_DTYPE=q8 \
npm run evaluate:model
```

## q8 CPU rerun

On 2026-08-01 with Node v24.18.0 on CPU, the same checksum-pinned artifact loaded in 1,052 ms. The two synthetic runs took 3,305 ms and 3,333 ms; neither output contained a JSON object. The result still fails the structured-output gate and remains unbundled. The evaluator was installed temporarily with remote model loading disabled, and the artifact lived only under /tmp.
