export type ModelTask = 'relateTabs' | 'nameWorkspace' | 'classifyPage' | 'rankLifecycle' | 'searchIntent';

export type ModelRequest = {
  task: ModelTask;
  schemaVersion: 1;
  input: unknown;
  recordIds: string[];
  revisions: number[];
  modelId: string;
  modelVersion: string;
  artifactChecksum: string;
  strategyVersion: string;
  timeBudgetMs: number;
};

export type ModelResponse = {
  ok: true;
  output: unknown;
  confidence: number;
  metadata: Pick<ModelRequest, 'modelId' | 'modelVersion' | 'artifactChecksum' | 'strategyVersion'>;
} | { ok: false; reason: 'unavailable' | 'timeout' | 'malformed' | 'stale' | 'oversized' };

export type ModelRunner = { run(request: ModelRequest, signal?: AbortSignal): Promise<ModelResponse> };

export function validateModelRequest(request: ModelRequest): boolean {
  if (request.schemaVersion !== 1 || request.recordIds.length !== request.revisions.length || request.recordIds.length > 128 || request.timeBudgetMs < 1 || request.timeBudgetMs > 10_000) return false;
  try { return JSON.stringify(request.input).length <= 20_000; } catch { return false; }
}

export class UnavailableModelRunner implements ModelRunner {
  async run(): Promise<ModelResponse> {
    return { ok: false, reason: 'unavailable' };
  }
}
