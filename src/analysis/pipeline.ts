import { validateModelRequest, type ModelRunner } from './model';
import { UnavailableModelRunner } from './model';
import { makeHeuristicSuggestion } from './suggestions';
import { safeAnalysisInput } from './normalize';
import { validateSuggestionOutput } from './validation';
import type { SuggestionBatch, TabRecord } from '../shared/types';

export async function suggestWithSafeFallback(records: TabRecord[], runner: ModelRunner = new UnavailableModelRunner()): Promise<{ suggestion: SuggestionBatch; model: 'unavailable' | 'available' }> {
  const fallback = makeHeuristicSuggestion(records, Date.now());
  const request = { task: 'relateTabs' as const, schemaVersion: 1 as const, input: records.map(({ recordId, title, url }) => ({ recordId, ...safeAnalysisInput(title, url) })), recordIds: records.map((record) => record.recordId), revisions: records.map((record) => record.revision), modelId: 'local-unavailable', modelVersion: 'none', artifactChecksum: 'none', strategyVersion: 'metadata-v1', timeBudgetMs: 1500 };
  if (!validateModelRequest(request)) return { suggestion: fallback, model: 'unavailable' };
  let response;
  try { response = await runner.run(request); } catch { return { suggestion: fallback, model: 'unavailable' }; }
  if (!response.ok) return { suggestion: fallback, model: 'unavailable' };
  const validated = validateSuggestionOutput(response.output, new Set(request.recordIds));
  if (!validated.ok || response.confidence < 0 || response.confidence > 1) return { suggestion: fallback, model: 'unavailable' };
  return {
    suggestion: {
      ...fallback,
      workspaceProposals: validated.groups.map((group) => ({ ...group, evidence: ['Local model recommendation; review before applying.'] })),
      analysis: { ...response.metadata, confidence: response.confidence },
    },
    model: 'available',
  };
}
