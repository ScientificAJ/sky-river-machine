import { clusterEmbeddings } from './embeddings';
import type { ModelRequest, ModelResponse, ModelRunner } from './model';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const MODEL_VERSION = '751bff37182d3f1213fa05d7196b954e230abad9';
const ARTIFACT_CHECKSUM = 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1';

type FeatureTensor = { dims: number[]; tolist(): unknown };
type FeatureExtractor = (texts: string[], options: { pooling: 'mean'; normalize: true }) => Promise<FeatureTensor>;

export type MiniLmRunnerOptions = {
  modelPath?: string;
  threshold?: number;
  device?: 'wasm' | 'cpu' | 'webgpu';
};

function extensionModelPath(): string {
  const location = (globalThis as typeof globalThis & { location?: Location }).location;
  return location ? new URL('models/minilm/', location.href).href : 'models/minilm';
}

function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error('Local embedding inference was cancelled.'));
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

function inputRecords(request: ModelRequest): Array<{ recordId: string; text: string }> | null {
  if (!Array.isArray(request.input) || request.input.length !== request.recordIds.length) return null;
  const records = request.input as Array<{ recordId?: unknown; title?: unknown; url?: unknown }>;
  const result = records.map((record, index) => {
    if (record.recordId !== request.recordIds[index] || typeof record.title !== 'string' || typeof record.url !== 'string') return null;
    return { recordId: record.recordId, text: String(record.title).slice(0, 400) + '\n' + String(record.url).slice(0, 200) };
  });
  return result.every(Boolean) ? result as Array<{ recordId: string; text: string }> : null;
}

export class MiniLmEmbeddingRunner implements ModelRunner {
  private readonly options: Required<MiniLmRunnerOptions>;
  private extractorPromise: Promise<FeatureExtractor> | undefined;

  constructor(options: MiniLmRunnerOptions = {}) {
    this.options = {
      modelPath: options.modelPath ?? extensionModelPath(),
      threshold: options.threshold ?? 0.52,
      device: options.device ?? 'wasm',
    };
  }

  private async extractor(): Promise<FeatureExtractor> {
    this.extractorPromise ??= (async () => {
      const transformers = await import('@huggingface/transformers');
      transformers.env.allowRemoteModels = false;
      transformers.env.allowLocalModels = true;
      const pipeline = transformers.pipeline as unknown as (task: 'feature-extraction', modelPath: string, options: { dtype: 'q8'; device: 'wasm' | 'cpu' | 'webgpu' }) => Promise<FeatureExtractor>;
      return await pipeline('feature-extraction', this.options.modelPath, { dtype: 'q8', device: this.options.device });
    })();
    return await this.extractorPromise;
  }

  async run(request: ModelRequest, signal?: AbortSignal): Promise<ModelResponse> {
    const input = inputRecords(request);
    if (request.task !== 'relateTabs' || !input) return { ok: false, reason: 'malformed' };
    if (!input.length) {
      return { ok: true, output: { groups: [] }, confidence: 1, metadata: { modelId: MODEL_ID, modelVersion: MODEL_VERSION, artifactChecksum: ARTIFACT_CHECKSUM, strategyVersion: 'embedding-cluster-v1' } };
    }
    try {
      const tensor = await abortable((await this.extractor())(input.map((record) => record.text), { pooling: 'mean', normalize: true }), signal);
      const rows = tensor.tolist();
      if (!Array.isArray(rows) || rows.length !== input.length || !rows.every((row) => Array.isArray(row) && row.every((value) => typeof value === 'number'))) return { ok: false, reason: 'malformed' };
      const groups = clusterEmbeddings(rows as number[][], this.options.threshold).map((indexes, index) => ({
        name: 'Suggested workspace ' + (index + 1),
        recordIds: indexes.map((item) => input[item]?.recordId).filter((recordId): recordId is string => Boolean(recordId)),
        confidence: indexes.length > 1 ? 0.7 : 0.5,
      }));
      return { ok: true, output: { groups }, confidence: 0.7, metadata: { modelId: MODEL_ID, modelVersion: MODEL_VERSION, artifactChecksum: ARTIFACT_CHECKSUM, strategyVersion: 'embedding-cluster-v1' } };
    } catch {
      return { ok: false, reason: signal?.aborted ? 'timeout' : 'unavailable' };
    }
  }
}
