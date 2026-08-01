import type { SuggestionBatch, TabRecord } from '../shared/types';
import { duplicateScore, relatedScore } from './heuristics';

export function makeHeuristicSuggestion(records: TabRecord[], now: number): SuggestionBatch {
  const proposals: SuggestionBatch['workspaceProposals'] = [];
  const duplicates: SuggestionBatch['duplicateCandidates'] = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const left = records[i]!;
      const right = records[j]!;
      const duplicate = duplicateScore(left, right);
      if (duplicate >= 0.9) duplicates.push({ recordIds: [left.recordId, right.recordId], evidence: ['Matching restoration URL or very high metadata overlap.'] });
      const related = relatedScore(left, right);
      if (related >= 0.45) proposals.push({ name: `${left.domain} and related work`, recordIds: [left.recordId, right.recordId], confidence: related, evidence: ['Shared title/path signals; review before applying.'] });
    }
  }
  return { suggestionId: crypto.randomUUID(), sourceRevision: records.reduce((total, record) => total + record.revision, 0), workspaceProposals: proposals.slice(0, 24), duplicateCandidates: duplicates.slice(0, 24), uncertainRecords: records.filter((record) => !record.title || !record.url).map((record) => record.recordId), status: 'pending', createdAt: now };
}
