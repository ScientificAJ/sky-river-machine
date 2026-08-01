import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { refreshInventory, sendMessage } from '../browser/extension-client';
import type { InventoryResponse, Operation, SuggestionBatch, TabRecord, Workspace } from '../shared/types';
import { searchMetadata } from '../core/search';
import './styles.css';

function App() {
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [query, setQuery] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionBatch[]>([]);
  const [recovery, setRecovery] = useState<Operation[]>([]);
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = async () => {
    setStatus('loading');
    try {
      const [response, workspaceResponse, suggestionResponse, recoveryResponse] = await Promise.all([refreshInventory(), sendMessage({ type: 'list-workspaces' }), sendMessage({ type: 'get-suggestions' }), sendMessage({ type: 'get-recovery' })]);
      if (!response.ok) throw new Error(response.error);
      if (!('records' in response)) throw new Error('Inventory response was incomplete');
      if (!workspaceResponse.ok) throw new Error(workspaceResponse.error);
      if (!('workspaces' in workspaceResponse)) throw new Error('Workspace response was incomplete');
      setRecords(response.records);
      setWorkspaces(workspaceResponse.workspaces);
      if (suggestionResponse.ok && 'suggestions' in suggestionResponse) setSuggestions(suggestionResponse.suggestions);
      if (recoveryResponse.ok && 'recovery' in recoveryResponse) setRecovery(recoveryResponse.recovery);
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

  const visibleRecords = searchMetadata(records, workspaces, query);

  const setProtection = async (record: TabRecord, key: keyof TabRecord['protection']) => {
    const response = await sendMessage({ type: 'set-protection', recordId: record.recordId, [key]: !record.protection[key] });
    if (response.ok && 'records' in response) setRecords(response.records);
  };

  const moveRecord = async (recordId: string, workspaceId: string | null) => {
    const response = await sendMessage({ type: 'move-record', recordId, workspaceId });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const renameWorkspace = async (workspace: Workspace) => {
    const name = window.prompt('Rename workspace', workspace.name)?.trim();
    if (!name) return;
    const response = await sendMessage({ type: 'rename-workspace', workspaceId: workspace.workspaceId, name });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const archiveWorkspace = async (workspace: Workspace) => {
    if (!window.confirm(`Archive “${workspace.name}”? Tabs remain available.`)) return;
    const response = await sendMessage({ type: 'archive-workspace', workspaceId: workspace.workspaceId });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const deleteWorkspace = async (workspace: Workspace) => {
    if (!window.confirm(`Delete “${workspace.name}” and unassign its tabs? This removes only Sky River Machine records.`)) return;
    const response = await sendMessage({ type: 'delete-workspace', workspaceId: workspace.workspaceId, confirm: true });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const lifecycle = async (record: TabRecord, action: 'wake' | 'rest' | 'archive' | 'restore') => {
    const confirm = action === 'archive' ? window.confirm(`Archive “${record.title}”? The record will remain restorable.`) : undefined;
    if (action === 'archive' && !confirm) return;
    const response = await sendMessage({ type: 'lifecycle', recordId: record.recordId, action, ...(confirm === undefined ? {} : { confirm }) });
    if (response.ok && 'records' in response) { setRecords((current) => current.map((item) => response.records.find((updated) => updated.recordId === item.recordId) ?? item)); if ('operation' in response) setLastOperation(response.operation); }
    else if (!response.ok) window.alert(response.error);
    await load();
  };

  const organize = async () => {
    const response = await sendMessage({ type: 'organize-heuristically' });
    if (response.ok && 'suggestions' in response) setSuggestions(response.suggestions);
  };

  const applySuggestion = async (suggestionId: string) => {
    const response = await sendMessage({ type: 'apply-suggestion', suggestionId });
    if (response.ok && 'records' in response) { setRecords(response.records); if ('workspaces' in response) setWorkspaces(response.workspaces); if ('operation' in response) setLastOperation(response.operation); }
    await load();
  };

  const rejectSuggestion = async (suggestionId: string) => {
    const response = await sendMessage({ type: 'reject-suggestion', suggestionId });
    if (response.ok && 'suggestions' in response) setSuggestions((current) => current.map((item) => response.suggestions.find((next) => next.suggestionId === item.suggestionId) ?? item));
  };

  const undo = async (operationId: string) => {
    const response = await sendMessage({ type: 'undo-operation', operationId });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const deleteRecord = async (record: TabRecord) => {
    if (!window.confirm(`Delete the local record for “${record.title}”? This does not affect browser history.`)) return;
    const response = await sendMessage({ type: 'delete-record', recordId: record.recordId, confirm: true });
    if (!response.ok) window.alert(response.error);
    await load();
  };

  const extractContext = async (record: TabRecord) => {
    if (!window.confirm('Read only visible headings and the page description for this selected tab? This stays local and is stored until deleted.')) return;
    const response = await sendMessage({ type: 'extract-visible-context', recordId: record.recordId, confirm: true });
    if (response.ok && 'records' in response) setRecords((current) => current.map((item) => response.records.find((updated) => updated.recordId === item.recordId) ?? item));
    else if (!response.ok) window.alert(response.error);
  };

  const exportData = async () => {
    const response = await sendMessage({ type: 'export-data' });
    if (!response.ok || !('data' in response)) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
    link.download = 'sky-river-machine-local-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const deleteAll = async () => {
    if (!window.confirm('Delete all Sky River Machine local records, suggestions, and recovery data? This cannot erase browser history.')) return;
    const response = await sendMessage({ type: 'delete-all', confirm: true });
    if (response.ok) { setRecords([]); setWorkspaces([]); setSuggestions([]); setRecovery([]); setLastOperation(null); setStatus('ready'); }
  };

  return (
    <main class="shell">
      <p class="eyebrow">Local browser workspace</p>
      <h1>Sky River Machine</h1>
      <p class="lede">This development build is under construction.</p>
      <p class="quiet">Metadata is the default. A separate, confirmed action can read bounded visible headings and a description locally. Consequential tab changes always require review and recovery.</p>
      <nav class="primary-nav" aria-label="Primary"><a href="#home">Home</a><a href="#search">Search</a><a href="#workspaces">Workspaces</a><a href="#recovery">Recovery</a><a href="#settings">Settings</a></nav>
      <span id="home" class="anchor-target" aria-hidden="true"></span>
      <button type="button" onClick={() => void load()} disabled={status === 'loading'}>Refresh local tab metadata</button>
      <button type="button" onClick={() => void organize()} disabled={status !== 'ready'}>Organize tabs (heuristic suggestions)</button>
      <section id="recovery" class="recovery" aria-labelledby="recovery-heading"><h2 id="recovery-heading">Recovery</h2>{recovery.length > 0 ? <><p role="alert">{recovery.length} operation{recovery.length === 1 ? '' : 's'} need review.</p>{recovery.map((operation) => <p key={operation.operationId}>{operation.kind} · {operation.status} <button type="button" onClick={() => void undo(operation.operationId)}>Try undo</button></p>)}</> : <p>No pending recovery actions.</p>}</section>
      {lastOperation && lastOperation.status === 'applied' && <p class="notice" role="status">{lastOperation.kind} completed. <button type="button" onClick={() => void undo(lastOperation.operationId)}>Undo</button></p>}
      <label id="search" class="field">Search local metadata<input value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder="Title, domain, URL, workspace" /></label>
      <p class="status" role="status" aria-live="polite">
        {status === 'loading' && 'Reading permitted tab metadata locally…'}
        {status === 'error' && 'Could not read permitted tab metadata. Check the extension permission and try again.'}
        {status === 'ready' && `${records.length} currently observed record${records.length === 1 ? '' : 's'}.`}
      </p>
      {status === 'ready' && records.length === 0 && <p class="empty">No normal-window tabs are available to show.</p>}
      {status === 'ready' && records.length > 0 && visibleRecords.length === 0 && <p class="empty">No local records match that search.</p>}
      {visibleRecords.length > 0 && <ul class="tab-list" aria-label="Observed tabs">
        {visibleRecords.map((record) => (
          <li key={record.recordId} class="tab-row">
            <strong>{record.title}</strong>
            <span>{record.domain} · {record.state}{Object.values(record.protection).some(Boolean) ? ' · Protected' : ''}{record.state === 'Dormant' ? ' · Browser page may remain loaded' : ''}</span>
            <button type="button" onClick={() => void setProtection(record, 'important')}>{record.protection.important ? 'Remove important' : 'Mark important'}</button>
            <button type="button" onClick={() => void setProtection(record, 'neverSleep')}>{record.protection.neverSleep ? 'Allow sleep' : 'Never sleep'}</button>
            <button type="button" onClick={() => void setProtection(record, 'keepUntilCompleted')}>{record.protection.keepUntilCompleted ? 'Clear completion hold' : 'Keep until completed'}</button>
            <label class="field">Workspace<select value={record.workspaceId ?? ''} onChange={(event) => void moveRecord(record.recordId, (event.currentTarget as HTMLSelectElement).value || null)}><option value="">Unassigned</option>{workspaces.filter((workspace) => !workspace.archivedAt).map((workspace) => <option value={workspace.workspaceId} key={workspace.workspaceId}>{workspace.name}</option>)}</select></label>
            {record.state === 'Dormant' && <button type="button" onClick={() => void lifecycle(record, 'wake')}>Wake tab</button>}
            {record.state === 'Extinct' && <button type="button" onClick={() => void lifecycle(record, 'restore')}>Restore tab</button>}
            {record.state === 'Active' && <button type="button" onClick={() => void lifecycle(record, 'rest')}>Let tab rest</button>}
            {record.state !== 'Extinct' && <button type="button" onClick={() => void lifecycle(record, 'archive')}>Archive tab</button>}
            {record.state !== 'Extinct' && <button type="button" onClick={() => void extractContext(record)}>Read visible context</button>}
            {record.state === 'Extinct' && <button type="button" onClick={() => void deleteRecord(record)}>Delete record</button>}
            {record.context && <span>Visible context stored locally: {record.context.headings.length} heading{record.context.headings.length === 1 ? '' : 's'}</span>}
          </li>
        ))}
      </ul>}
      {suggestions.filter((suggestion) => suggestion.status === 'pending').map((suggestion) => <section class="suggestion" key={suggestion.suggestionId} aria-labelledby={`suggestion-${suggestion.suggestionId}`}>
        <h2 id={`suggestion-${suggestion.suggestionId}`}>Suggested workspace review</h2>
        <p class="quiet">These are bounded metadata suggestions. Review them before applying; no browser tabs move during this step.</p>
        {suggestion.workspaceProposals.slice(0, 6).map((proposal) => <p class="workspace-row" key={`${suggestion.suggestionId}-${proposal.name}`}>{proposal.name} · {proposal.recordIds.length} tabs · {Math.round(proposal.confidence * 100)}% confidence</p>)}
        {suggestion.duplicateCandidates.length > 0 && <p class="quiet">Possible duplicates: {suggestion.duplicateCandidates.length}. Nothing will close automatically.</p>}
        <button type="button" onClick={() => void applySuggestion(suggestion.suggestionId)}>Apply workspace suggestions</button>
        <button type="button" onClick={() => void rejectSuggestion(suggestion.suggestionId)}>Reject suggestion</button>
      </section>)}
      <section id="workspaces" class="workspace-section" aria-labelledby="workspace-heading">
        <h2 id="workspace-heading">Local workspaces</h2>
        <form onSubmit={(event) => void createWorkspace(event)}>
          <label class="field">Create workspace<input value={workspaceName} onInput={(event) => setWorkspaceName((event.currentTarget as HTMLInputElement).value)} placeholder="e.g. Fictional project" /></label>
          <button type="submit">Create workspace</button>
        </form>
        {workspaces.filter((workspace) => !workspace.archivedAt).map((workspace) => <p class="workspace-row" key={workspace.workspaceId}>{workspace.name} <button type="button" onClick={() => void renameWorkspace(workspace)}>Rename</button> <button type="button" onClick={() => void archiveWorkspace(workspace)}>Archive workspace</button> <button type="button" onClick={() => void deleteWorkspace(workspace)}>Delete workspace</button></p>)}
      </section>
      <section id="settings" class="workspace-section" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Local data controls</h2>
        <p class="quiet">Metadata is local by default. Visible context is optional, bounded, and deletable. No private-window data is captured.</p>
        <details><summary>What is stored locally?</summary><p class="quiet">Tab metadata, workspace names, protection choices, operation recovery records, suggestions, corrections, and any user-confirmed visible headings/description. Browser history, cookies, credentials, and prior exports are outside this deletion control.</p></details>
        <p class="quiet">Export includes the stored categories above. Treat the resulting local file as sensitive browsing data.</p>
        <button type="button" onClick={() => void exportData()}>Export local data</button>
        <button type="button" onClick={() => void deleteAll()}>Delete all local data</button>
      </section>
      <p class="quiet">Only local data is stored. Visible context is optional, bounded, and deletable; page context is never read silently.</p>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
