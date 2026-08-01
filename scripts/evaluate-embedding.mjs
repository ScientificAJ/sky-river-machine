import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const transformers = await import('@huggingface/transformers');
const modelDir = process.env.MODEL_DIR ? resolve(process.env.MODEL_DIR) : resolve('public/models/minilm');
const modelRelativePath = process.env.MODEL_FILE || 'onnx/model_quantized.onnx';
const modelFile = join(modelDir, modelRelativePath);
const expectedSha256 = process.env.MODEL_SHA256 || 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1';
const bytes = await readFile(modelFile);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const sizeBytes = (await stat(modelFile)).size;
if (sha256 !== expectedSha256) throw new Error(`model checksum mismatch: expected ${expectedSha256}, got ${sha256}`);

const { env, pipeline } = transformers;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = modelDir;
const device = process.env.MODEL_DEVICE || 'cpu';
const started = performance.now();
const extractor = await pipeline('feature-extraction', modelDir, { dtype: 'q8', device });
const loadedAt = performance.now();
const texts = [
  'Browser extension build\nhttps://example.test/browser-extension',
  'WebExtension API integration\nhttps://example.test/browser-extension-api',
  'Pasta recipe with tomatoes\nhttps://example.test/recipes/pasta',
];
const tensor = await extractor(texts, { pooling: 'mean', normalize: true });
const rows = tensor.tolist();
const cosine = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
console.log(JSON.stringify({
  ok: Array.isArray(rows) && rows.length === texts.length,
  modelDir,
  modelRelativePath,
  sizeBytes,
  sha256,
  device,
  dimensions: Array.isArray(rows?.[0]) ? rows[0].length : 0,
  loadMs: Math.round(loadedAt - started),
  inferenceMs: Math.round(performance.now() - loadedAt),
  totalMs: Math.round(performance.now() - started),
  relatedSimilarity: cosine(rows[0], rows[1]),
  unrelatedSimilarity: cosine(rows[0], rows[2]),
}));
