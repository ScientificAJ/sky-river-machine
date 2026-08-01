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
