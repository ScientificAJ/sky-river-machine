import type { TabRecord, Workspace } from '../shared/types';

const DATABASE_NAME = 'sky-river-machine';
const DATABASE_VERSION = 2;
const TAB_STORE = 'tabRecords';
const WORKSPACE_STORE = 'workspaces';

export class IndexedDbTabStore {
  private database?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(TAB_STORE)) {
          const store = database.createObjectStore(TAB_STORE, { keyPath: 'recordId' });
          store.createIndex('state', 'state');
          store.createIndex('domain', 'domain');
          store.createIndex('browserTabId', ['windowId', 'browserTabId']);
        }
        if (!database.objectStoreNames.contains(WORKSPACE_STORE)) {
          const store = database.createObjectStore(WORKSPACE_STORE, { keyPath: 'workspaceId' });
          store.createIndex('archivedAt', 'archivedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Local tab storage could not be opened'));
    });
    return this.database;
  }

  async list(): Promise<TabRecord[]> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(TAB_STORE, 'readonly').objectStore(TAB_STORE).getAll();
      request.onsuccess = () => resolve(request.result as TabRecord[]);
      request.onerror = () => reject(new Error('Local tab records could not be read'));
    });
  }

  async replaceAll(records: TabRecord[]): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TAB_STORE, 'readwrite');
      const store = transaction.objectStore(TAB_STORE);
      store.clear();
      for (const record of records) store.put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Local tab records could not be saved'));
      transaction.onabort = () => reject(new Error('Local tab records save was aborted'));
    });
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readonly').objectStore(WORKSPACE_STORE).getAll();
      request.onsuccess = () => resolve(request.result as Workspace[]);
      request.onerror = () => reject(new Error('Local workspaces could not be read'));
    });
  }

  async putWorkspace(workspace: Workspace): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readwrite').objectStore(WORKSPACE_STORE).put(workspace);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Workspace could not be saved'));
    });
  }

  async updateRecordWorkspace(recordId: string, workspaceId: string | null): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TAB_STORE, 'readwrite');
      const store = transaction.objectStore(TAB_STORE);
      const request = store.get(recordId);
      request.onsuccess = () => {
        const record = request.result as TabRecord | undefined;
        if (!record) { reject(new Error('Tab record no longer exists')); return; }
        store.put({ ...record, workspaceId, updatedAt: Date.now(), revision: record.revision + 1 });
      };
      request.onerror = () => reject(new Error('Tab record could not be read for workspace move'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Tab record workspace could not be saved'));
    });
  }
}
