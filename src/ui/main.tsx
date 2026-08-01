import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { refreshInventory, sendMessage } from '../browser/extension-client';
import type { InventoryResponse, Operation, SuggestionBatch, TabRecord, Workspace } from '../shared/types';
import { BUDGETS } from '../shared/budgets';
import './styles.css';

type SuggestionDraft = { name: string; recordIds: string[] };

function draftFromSuggestion(suggestion: SuggestionBatch): SuggestionDraft[] {
  return suggestion.workspaceProposals.map(({ name, recordIds }) => ({ name, recordIds: [...recordIds] }));
}

function App() {
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [searchRecords, setSearchRecords] = useState<TabRecord[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [searchVersion, setSearchVersion] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [query, setQuery] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionBatch[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SuggestionDraft[]>>({});
  const [duplicateSelections, setDuplicateSelections] = useState<Record<string, string[]>>({});
  const [recovery, setRecovery] = useState<Operation[]>([]);
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const [view, setView] = useState<'home' | 'search' | 'workspaces' | 'recovery' | 'settings'>('home');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = async () => {
    setStatus('loading');
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const [response, workspaceResponse, suggestionResponse, recoveryResponse] = await Promise.race([
        Promise.all([refreshInventory(), sendMessage({ type: 'list-workspaces' }), sendMessage({ type: 'get-suggestions' }), sendMessage({ type: 'get-recovery' })]),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('The extension background worker did not respond.')), 5000); }),
      ]);
      if (!response.ok) throw new Error(response.error);
      if (!('records' in response)) throw new Error('Inventory response was incomplete');
      if (!workspaceResponse.ok) throw new Error(workspaceResponse.error);
      if (!('workspaces' in workspaceResponse)) throw new Error('Workspace response was incomplete');
      setRecords(response.records);
      setRecordCount('total' in response ? response.total : response.records.length);
      setWorkspaces(workspaceResponse.workspaces);
      if (suggestionResponse.ok && 'suggestions' in suggestionResponse) setSuggestions(suggestionResponse.suggestions);
      if (recoveryResponse.ok && 'recovery' in recoveryResponse) setRecovery(recoveryResponse.recovery);
      setStatus('ready');
      setSearchVersion((value) => value + 1);
    } catch {
      setStatus('error');
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setSearchRecords([]);
      setSearchTotal(0);
      setSearchStatus('idle');
      return;
    }
    let current = true;
    setSearchStatus('loading');
    void sendMessage({ type: 'search-metadata', query: normalizedQuery, offset: 0, limit: BUDGETS.searchPageSize }).then((response) => {
      if (!current) return;
      if (response.ok && 'records' in response && 'total' in response) {
        setSearchRecords(response.records);
        setSearchTotal(response.total);
        setSearchStatus('ready');
      } else setSearchStatus('error');
    }).catch(() => { if (current) setSearchStatus('error'); });
    return () => { current = false; };
  }, [query, searchVersion]);

  const createWorkspace = async (event: Event) => {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    const response = await sendMessage({ type: 'create-workspace', name });
    if (response.ok && 'workspace' in response) setWorkspaces((items) => [...items, response.workspace]);
    setWorkspaceName('');
  };

  const visibleRecords = query.trim() ? searchRecords : records;
  const renderedRecords = visibleRecords.slice(0, BUDGETS.searchPageSize);

  const setProtection = async (record: TabRecord, key: keyof TabRecord['protection']) => {
    const response = await sendMessage({ type: 'set-protection', recordId: record.recordId, [key]: !record.protection[key] });
    if (response.ok && 'records' in response) { setRecords(response.records); if ('total' in response) setRecordCount(response.total); }
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
    if (response.ok && 'suggestions' in response) {
      setSuggestions(response.suggestions);
      setDrafts((current) => ({ ...current, ...Object.fromEntries(response.suggestions.map((suggestion) => [suggestion.suggestionId, draftFromSuggestion(suggestion)])) }));
    } else if (!response.ok) window.alert(response.error);
  };

  const updateDraft = (suggestion: SuggestionBatch, update: (draft: SuggestionDraft[]) => SuggestionDraft[]) => {
    setDrafts((current) => ({ ...current, [suggestion.suggestionId]: update(current[suggestion.suggestionId] ?? draftFromSuggestion(suggestion)) }));
  };

  const toggleDraftRecord = (suggestion: SuggestionBatch, proposalIndex: number, recordId: string) => {
    updateDraft(suggestion, (draft) => {
      const selected = draft[proposalIndex]?.recordIds.includes(recordId) ?? false;
      return draft.map((proposal, index) => ({ ...proposal, recordIds: proposal.recordIds.filter((id) => id !== recordId).concat(!selected && index === proposalIndex ? [recordId] : []) }));
    });
  };

  const saveSuggestionDraft = async (suggestion: SuggestionBatch): Promise<boolean> => {
    const draft = drafts[suggestion.suggestionId];
    if (!draft) return true;
    const response = await sendMessage({ type: 'review-suggestion', suggestionId: suggestion.suggestionId, workspaceProposals: draft });
    if (!response.ok) { window.alert(response.error); return false; }
    if ('suggestions' in response) setSuggestions((current) => current.map((item) => response.suggestions.find((updated) => updated.suggestionId === item.suggestionId) ?? item));
    return true;
  };

  const applySuggestion = async (suggestionId: string) => {
    const currentSuggestion = suggestions.find((suggestion) => suggestion.suggestionId === suggestionId);
    if (currentSuggestion && !(await saveSuggestionDraft(currentSuggestion))) return;
    const response = await sendMessage({ type: 'apply-suggestion', suggestionId });
    if (response.ok && 'records' in response) { setRecords(response.records); if ('total' in response) setRecordCount(response.total); if ('workspaces' in response) setWorkspaces(response.workspaces); if ('operation' in response) setLastOperation(response.operation); }
    await load();
  };

  const rejectSuggestion = async (suggestionId: string) => {
    const response = await sendMessage({ type: 'reject-suggestion', suggestionId });
    if (response.ok && 'suggestions' in response) setSuggestions((current) => current.map((item) => response.suggestions.find((next) => next.suggestionId === item.suggestionId) ?? item));
  };

  const decideDuplicate = async (suggestion: SuggestionBatch, candidateIndex: number, decision: 'keep' | 'archive' | 'dismiss') => {
    const candidate = suggestion.duplicateCandidates[candidateIndex];
    if (!candidate) return;
    const key = `${suggestion.suggestionId}:${candidateIndex}`;
    const recordIds = decision === 'archive' ? (duplicateSelections[key] ?? candidate.recordIds) : candidate.recordIds;
    if (decision === 'archive' && !recordIds.length) { window.alert('Select at least one tab to archive.'); return; }
    if (decision === 'archive' && !window.confirm('Archive the selected duplicate records? They remain restorable.')) return;
    const response = await sendMessage({ type: 'duplicate-decision', suggestionId: suggestion.suggestionId, recordIds, decision, ...(decision === 'archive' ? { confirm: true } : {}) });
    if (!response.ok) window.alert(response.error);
    await load();
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
    if (response.ok) { setRecords([]); setRecordCount(0); setWorkspaces([]); setSuggestions([]); setDrafts({}); setRecovery([]); setLastOperation(null); setStatus('ready'); }
  };

  return (
    <main class="shell">
      <p class="eyebrow">Local browser workspace</p>
      <h1>Sky River Machine</h1>
      <p class="lede">This development build is under construction.</p>
      <p class="quiet">Metadata is the default. A separate, confirmed action can read bounded visible headings and a description locally. Consequential tab changes always require review and recovery.</p>
      <nav class="primary-nav" aria-label="Primary">{(['home', 'search', 'workspaces', 'recovery', 'settings'] as const).map((destination) => <button type="button" key={destination} aria-current={view === destination ? 'page' : undefined} onClick={() => setView(destination)}>{destination[0]!.toUpperCase() + destination.slice(1)}</button>)}</nav>
      <section id="home" hidden={view !== 'home'} class="home-section" aria-labelledby="home-heading"><h2 id="home-heading">Home</h2><button type="button" onClick={() => void load()} disabled={status === 'loading'}>Refresh local tab metadata</button><button type="button" onClick={() => void organize()} disabled={status === 'loading'}>Suggest workspaces locally</button><p class="quiet">Local semantic model: MiniLM embeddings. If it cannot load, bounded heuristic suggestions remain available. Review every suggestion before applying it.</p>{recovery.length > 0 && <p class="recovery" role="alert">{recovery.length} operation{recovery.length === 1 ? '' : 's'} need review. Open Recovery to inspect them.</p>}</section>
      <section id="recovery" hidden={view !== 'recovery'} class="recovery" aria-labelledby="recovery-heading"><h2 id="recovery-heading">Recovery</h2>{recovery.length > 0 ? <><p role="alert">{recovery.length} operation{recovery.length === 1 ? '' : 's'} need review.</p>{recovery.map((operation) => <p key={operation.operationId}><strong>{operation.kind} · {operation.status}</strong>{operation.error && <> · {operation.error}</>}{(operation.status === 'partial' || operation.status === 'applied') && <button type="button" onClick={() => void undo(operation.operationId)}>Try undo</button>}</p>)}</> : <p>No pending recovery actions.</p>}</section>
      {lastOperation && lastOperation.status === 'applied' && <p class="notice" role="status">{lastOperation.kind} completed. <button type="button" onClick={() => void undo(lastOperation.operationId)}>Undo</button></p>}
      <section id="search" hidden={view !== 'search'} class="search-section" aria-labelledby="search-heading"><h2 id="search-heading">Search</h2><label class="field">Search local metadata<input value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder="Title, domain, URL, workspace" /></label>
      <p class="status" role="status" aria-live="polite">
        {status === 'loading' && 'Reading permitted tab metadata locally…'}
        {status === 'error' && 'Could not read permitted tab metadata. Check the extension permission, reload the extension, and try again.'}
        {status === 'ready' && `${recordCount} currently observed record${recordCount === 1 ? '' : 's'}.`}
      </p>
      {query.trim() && searchStatus === 'loading' && <p class="quiet" role="status">Searching local metadata…</p>}
      {query.trim() && searchStatus === 'error' && <p class="empty" role="alert">Local search is unavailable. Try again.</p>}
      {status === 'ready' && visibleRecords.length === 0 && searchStatus !== 'loading' && <p class="empty">{query.trim() ? 'No local records match that search.' : 'No normal-window tabs are available to show.'}</p>}
      {visibleRecords.length > 0 && <><p class="quiet">Showing {renderedRecords.length} of {query.trim() ? searchTotal : recordCount} matching records.</p><ul class="tab-list" aria-label="Observed tabs">
        {renderedRecords.map((record) => (
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
      </ul></>}</section>
      {view === 'home' && suggestions.filter((suggestion) => suggestion.status === 'pending').map((suggestion) => {
        const draft = drafts[suggestion.suggestionId] ?? draftFromSuggestion(suggestion);
        const recordIds = [...new Set(draft.flatMap((proposal) => proposal.recordIds))];
        return <section class="suggestion" key={suggestion.suggestionId} aria-labelledby={`suggestion-${suggestion.suggestionId}`}>
          <h2 id={`suggestion-${suggestion.suggestionId}`}>Suggested workspace review</h2>
          <p class="quiet">Review names and assignments before applying. Unchecking a tab leaves it unchanged; no browser tabs move during this step.</p>
          {draft.slice(0, 24).map((proposal, proposalIndex) => <div class="proposal-editor" key={`${suggestion.suggestionId}-${proposalIndex}`}>
            <label class="field">Workspace name<input value={proposal.name} onInput={(event) => updateDraft(suggestion, (current) => current.map((item, index) => index === proposalIndex ? { ...item, name: (event.currentTarget as HTMLInputElement).value } : item))} /></label>
            <p class="quiet">{proposal.recordIds.length} assigned tab{proposal.recordIds.length === 1 ? '' : 's'} · {Math.round((suggestion.workspaceProposals[proposalIndex]?.confidence ?? 0.5) * 100)}% confidence</p>
            <div class="proposal-records">{recordIds.map((recordId) => { const record = records.find((item) => item.recordId === recordId); return <label key={recordId}><input type="checkbox" checked={proposal.recordIds.includes(recordId)} onChange={() => toggleDraftRecord(suggestion, proposalIndex, recordId)} /> {record?.title ?? recordId}</label>; })}</div>
          </div>)}
          {suggestion.duplicateCandidates.length > 0 && <div class="duplicate-review"><p class="quiet">Possible duplicates: {suggestion.duplicateCandidates.length}. Nothing closes automatically.</p>{suggestion.duplicateCandidates.map((candidate, candidateIndex) => {
            const key = `${suggestion.suggestionId}:${candidateIndex}`;
            const selected = duplicateSelections[key] ?? candidate.recordIds;
            return <div class="duplicate-row" key={`${key}-${candidate.recordIds.join('-')}`}><p>{candidate.recordIds.map((recordId) => records.find((record) => record.recordId === recordId)?.title ?? recordId).join(' · ')}</p><div>{candidate.recordIds.map((recordId) => <label key={recordId}><input type="checkbox" checked={selected.includes(recordId)} onChange={() => setDuplicateSelections((current) => ({ ...current, [key]: selected.includes(recordId) ? selected.filter((id) => id !== recordId) : [...selected, recordId] }))} /> Keep available</label>)}</div><button type="button" onClick={() => void decideDuplicate(suggestion, candidateIndex, 'keep')}>Keep both</button><button type="button" onClick={() => void decideDuplicate(suggestion, candidateIndex, 'dismiss')}>Dismiss</button><button type="button" onClick={() => void decideDuplicate(suggestion, candidateIndex, 'archive')}>Archive selected</button></div>;
          })}</div>}
          <button type="button" onClick={() => updateDraft(suggestion, (current) => [...current, { name: `Suggested workspace ${current.length + 1}`, recordIds: [] }])}>Split into another workspace</button>
          <button type="button" onClick={() => void saveSuggestionDraft(suggestion)}>Save review</button>
          <button type="button" onClick={() => void applySuggestion(suggestion.suggestionId)}>Apply workspace suggestions</button>
          <button type="button" onClick={() => void rejectSuggestion(suggestion.suggestionId)}>Reject suggestion</button>
        </section>;
      })}
      <section id="workspaces" hidden={view !== 'workspaces'} class="workspace-section" aria-labelledby="workspace-heading">
        <h2 id="workspace-heading">Local workspaces</h2>
        <form onSubmit={(event) => void createWorkspace(event)}>
          <label class="field">Create workspace<input value={workspaceName} onInput={(event) => setWorkspaceName((event.currentTarget as HTMLInputElement).value)} placeholder="e.g. Fictional project" /></label>
          <button type="submit">Create workspace</button>
        </form>
        {workspaces.filter((workspace) => !workspace.archivedAt).map((workspace) => {
          const assigned = records.filter((record) => record.workspaceId === workspace.workspaceId);
          return <article class="workspace-card" key={workspace.workspaceId} aria-labelledby={`workspace-${workspace.workspaceId}`}><h3 id={`workspace-${workspace.workspaceId}`}>{workspace.name}</h3><p class="quiet">{assigned.length} visible record{assigned.length === 1 ? '' : 's'} · {assigned.filter((record) => record.state === 'Active').length} Active · {assigned.filter((record) => record.state === 'Dormant').length} Dormant · {assigned.filter((record) => record.state === 'Extinct').length} Extinct</p><button type="button" onClick={() => { setSelectedWorkspaceId(workspace.workspaceId); setQuery(workspace.name); setView('search'); }}>Open workspace</button><button type="button" onClick={() => void renameWorkspace(workspace)}>Rename</button><button type="button" onClick={() => void archiveWorkspace(workspace)}>Archive workspace</button><button type="button" onClick={() => void deleteWorkspace(workspace)}>Delete workspace</button>{selectedWorkspaceId === workspace.workspaceId && <p class="quiet" role="status">Workspace filter is active in Search.</p>}</article>;
        })}
      </section>
      <section id="settings" hidden={view !== 'settings'} class="workspace-section" aria-labelledby="privacy-heading">
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
