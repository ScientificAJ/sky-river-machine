import type { TabRecord, Workspace } from '../shared/types';
import { tokenize } from '../analysis/normalize';

export function searchMetadata(records: TabRecord[], workspaces: Workspace[], query: string): TabRecord[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return records;
  const workspaceNames = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace.name.toLocaleLowerCase()]));
  const exact = records.filter((record) => [record.title, record.domain, record.url, record.workspaceId ? workspaceNames.get(record.workspaceId) ?? '' : '', record.context?.description ?? '', ...(record.context?.headings ?? [])]
    .some((value) => value.toLocaleLowerCase().includes(needle)));
  if (exact.length) return exact;
  const queryTokens = tokenize(needle);
  if (!queryTokens.length) return [];
  return records.map((record, index) => {
    const fields = [
      [record.title, 5],
      [record.workspaceId ? workspaceNames.get(record.workspaceId) ?? '' : '', 4],
      [record.domain, 3],
      [record.context?.description ?? '', 2],
      [(record.context?.headings ?? []).join(' '), 2],
      [record.url, 1],
    ] as const;
    const score = fields.reduce((total, [value, weight]) => {
      const tokens = new Set(tokenize(value));
      return total + queryTokens.reduce((fieldScore, token) => fieldScore + (tokens.has(token) ? weight : 0), 0);
    }, 0);
    return { record, score, index };
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || right.record.updatedAt - left.record.updatedAt || left.index - right.index).map(({ record }) => record);
}
