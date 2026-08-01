import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { refreshInventory, sendMessage } from '../browser/extension-client';
import type { InventoryResponse, TabRecord, Workspace } from '../shared/types';
import { searchMetadata } from '../core/search';
import './styles.css';

function App() {
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [query, setQuery] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = async () => {
    setStatus('loading');
    try {
      const [response, workspaceResponse] = await Promise.all([refreshInventory(), sendMessage({ type: 'list-workspaces' })]);
      if (!response.ok) throw new Error(response.error);
      if (!('records' in response)) throw new Error('Inventory response was incomplete');
      if (!workspaceResponse.ok) throw new Error(workspaceResponse.error);
      if (!('workspaces' in workspaceResponse)) throw new Error('Workspace response was incomplete');
      setRecords(response.records);
      setWorkspaces(workspaceResponse.workspaces);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { void load(); }, []);

  const createWorkspace = async (event: Event) => {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    const response = await sendMessage({ type: 'create-workspace', name });
    if (response.ok && 'workspace' in response) setWorkspaces((items) => [...items, response.workspace]);
    setWorkspaceName('');
  };

  const visibleRecords = searchMetadata(records, workspaces, query).filter((record) => record.state !== 'Extinct');

  const setProtection = async (record: TabRecord) => {
    const response = await sendMessage({ type: 'set-protection', recordId: record.recordId, important: !record.protection.important });
    if (response.ok && 'records' in response) setRecords(response.records);
  };

  return (
    <main class="shell">
      <p class="eyebrow">Local browser workspace</p>
      <h1>Sky River Machine</h1>
      <p class="lede">This development build is under construction.</p>
      <p class="quiet">This early local inventory view reads tab metadata only. It does not move, close, archive, or analyze your tabs.</p>
      <button type="button" onClick={() => void load()} disabled={status === 'loading'}>Refresh local tab metadata</button>
      <label class="field">Search local metadata<input value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder="Title, domain, URL, workspace" /></label>
      <p class="status" role="status" aria-live="polite">
        {status === 'loading' && 'Reading permitted tab metadata locally…'}
        {status === 'error' && 'Could not read permitted tab metadata. Check the extension permission and try again.'}
        {status === 'ready' && `${records.length} currently observed record${records.length === 1 ? '' : 's'}.`}
      </p>
      {status === 'ready' && records.length === 0 && <p class="empty">No normal-window tabs are available to show.</p>}
      {visibleRecords.length > 0 && <ul class="tab-list" aria-label="Observed tabs">
        {visibleRecords.map((record) => (
          <li key={record.recordId} class="tab-row">
            <strong>{record.title}</strong>
            <span>{record.domain} · {record.state}{record.protection.important ? ' · Protected' : ''}</span>
            <button type="button" onClick={() => void setProtection(record)}>{record.protection.important ? 'Remove protection' : 'Protect tab'}</button>
          </li>
        ))}
      </ul>}
      <section class="workspace-section" aria-labelledby="workspace-heading">
        <h2 id="workspace-heading">Local workspaces</h2>
        <form onSubmit={(event) => void createWorkspace(event)}>
          <label class="field">Create workspace<input value={workspaceName} onInput={(event) => setWorkspaceName((event.currentTarget as HTMLInputElement).value)} placeholder="e.g. Fictional project" /></label>
          <button type="submit">Create workspace</button>
        </form>
        {workspaces.filter((workspace) => !workspace.archivedAt).map((workspace) => <p class="workspace-row" key={workspace.workspaceId}>{workspace.name}</p>)}
      </section>
      <p class="quiet">Only local metadata is stored. Page contents are not read.</p>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
