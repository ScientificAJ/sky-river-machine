import type { TabRecord, Workspace } from '../shared/types';

export function searchMetadata(records: TabRecord[], workspaces: Workspace[], query: string): TabRecord[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return records;
  const workspaceNames = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace.name.toLocaleLowerCase()]));
  return records.filter((record) => [record.title, record.domain, record.url, record.workspaceId ? workspaceNames.get(record.workspaceId) ?? '' : '']
    .some((value) => value.toLocaleLowerCase().includes(needle)));
}
