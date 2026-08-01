import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { refreshInventory } from '../browser/extension-client';
import type { TabRecord } from '../shared/types';
import './styles.css';

function App() {
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = async () => {
    setStatus('loading');
    try {
      const response = await refreshInventory();
      if (!response.ok) throw new Error(response.error);
      setRecords(response.records);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <main class="shell">
      <p class="eyebrow">Local browser workspace</p>
      <h1>Sky River Machine</h1>
      <p class="lede">This development build is under construction.</p>
      <p class="quiet">This early local inventory view reads tab metadata only. It does not move, close, archive, or analyze your tabs.</p>
      <button type="button" onClick={() => void load()} disabled={status === 'loading'}>Refresh local tab metadata</button>
      <p class="status" role="status" aria-live="polite">
        {status === 'loading' && 'Reading permitted tab metadata locally…'}
        {status === 'error' && 'Could not read permitted tab metadata. Check the extension permission and try again.'}
        {status === 'ready' && `${records.length} currently observed record${records.length === 1 ? '' : 's'}.`}
      </p>
      {status === 'ready' && records.length === 0 && <p class="empty">No normal-window tabs are available to show.</p>}
      {records.length > 0 && <ul class="tab-list" aria-label="Observed tabs">
        {records.filter((record) => record.state !== 'Extinct').map((record) => (
          <li key={record.recordId} class="tab-row">
            <strong>{record.title}</strong>
            <span>{record.domain} · {record.state}</span>
          </li>
        ))}
      </ul>}
      <p class="quiet">Only local metadata is stored. Page contents are not read.</p>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
