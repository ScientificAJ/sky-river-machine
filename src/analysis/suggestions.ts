import type { SuggestionBatch, TabRecord, UserCorrection, Workspace } from '../shared/types';
import { duplicateScore, relatedScore } from './heuristics';
import { tokenize } from './normalize';

export function makeHeuristicSuggestion(records: TabRecord[], now: number, sourceRecords: TabRecord[] = records, workspaces: Workspace[] = [], corrections: UserCorrection[] = []): SuggestionBatch {
  const proposals: SuggestionBatch['workspaceProposals'] = [];
  const duplicates: SuggestionBatch['duplicateCandidates'] = [];
  const workspaceNames = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace.name]));
  const learned = new Map<string, Set<string>>();
  for (const correction of corrections) {
    const workspaceId = correction.features.find((feature) => feature.startsWith('workspace:'))?.slice('workspace:'.length) ?? correction.features.find((feature) => workspaceNames.has(feature));
    if (!workspaceId || workspaceId === 'unassigned') continue;
    const tokens = learned.get(workspaceId) ?? new Set<string>();
    for (const feature of correction.features) if (feature.startsWith('token:') || feature.startsWith('domain:')) tokens.add(feature.slice(feature.indexOf(':') + 1));
    learned.set(workspaceId, tokens);
  }
  const preferredWorkspace = (left: TabRecord, right: TabRecord): string | undefined => {
    if (left.workspaceId && left.workspaceId === right.workspaceId) return workspaceNames.get(left.workspaceId);
    const pairTokens = new Set([...tokenize(left.title), ...tokenize(left.domain), ...tokenize(right.title), ...tokenize(right.domain)]);
    let best: { name: string; score: number } | undefined;
    for (const [workspaceId, tokens] of learned) {
      const score = [...tokens].filter((token) => pairTokens.has(token)).length / Math.max(1, tokens.size);
      const name = workspaceNames.get(workspaceId);
      if (name && score > (best?.score ?? 0.25)) best = { name, score };
    }
    return best?.name;
  };
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const left = records[i]!;
      const right = records[j]!;
      const duplicate = duplicateScore(left, right);
      if (duplicate >= 0.9) duplicates.push({ recordIds: [left.recordId, right.recordId], evidence: ['Matching restoration URL or very high metadata overlap.'] });
      const related = relatedScore(left, right);
      if (related >= 0.45) {
        const name = preferredWorkspace(left, right) ?? `${left.domain} and related work`;
        const existing = proposals.find((proposal) => proposal.name === name);
        if (existing) {
          existing.recordIds = [...new Set([...existing.recordIds, left.recordId, right.recordId])].slice(0, 64);
          existing.confidence = Math.max(existing.confidence, related);
        } else proposals.push({ name, recordIds: [left.recordId, right.recordId], confidence: related, evidence: ['Shared title/path signals; review before applying.'] });
      }
    }
  }
  return { suggestionId: crypto.randomUUID(), sourceRevision: sourceRecords.reduce((total, record) => total + record.revision, 0), workspaceProposals: proposals.slice(0, 24), duplicateCandidates: duplicates.slice(0, 24), uncertainRecords: records.filter((record) => !record.title || !record.url).map((record) => record.recordId), status: 'pending', createdAt: now };
}
