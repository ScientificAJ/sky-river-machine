import type { ModelRunner } from './model';
import { UnavailableModelRunner } from './model';
import { makeHeuristicSuggestion } from './suggestions';
import type { SuggestionBatch, TabRecord } from '../shared/types';

export async function suggestWithSafeFallback(records: TabRecord[], runner: ModelRunner = new UnavailableModelRunner()): Promise<{ suggestion: SuggestionBatch; model: 'unavailable' | 'available' }> {
  const fallback = makeHeuristicSuggestion(records, Date.now());
  const response = await runner.run({ task: 'relateTabs', schemaVersion: 1, input: records.map(({ recordId, title, url, domain }) => ({ recordId, title, url, domain })), recordIds: records.map((record) => record.recordId), revisions: records.map((record) => record.revision), modelId: 'unavailable', modelVersion: 'none', artifactChecksum: 'none', strategyVersion: 'metadata-v1', timeBudgetMs: 1500 });
  return { suggestion: fallback, model: response.ok ? 'available' : 'unavailable' };
}
