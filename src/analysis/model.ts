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

export class UnavailableModelRunner implements ModelRunner {
  async run(): Promise<ModelResponse> {
    return { ok: false, reason: 'unavailable' };
  }
}
