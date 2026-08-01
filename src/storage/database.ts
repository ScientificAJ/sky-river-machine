import type { Operation, SuggestionBatch, TabRecord, UserCorrection, Workspace } from '../shared/types';

const DATABASE_NAME = 'sky-river-machine';
const DATABASE_VERSION = 3;
const TAB_STORE = 'tabRecords';
const WORKSPACE_STORE = 'workspaces';
const OPERATION_STORE = 'operations';
const SUGGESTION_STORE = 'suggestions';
const CORRECTION_STORE = 'corrections';

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
        if (!database.objectStoreNames.contains(OPERATION_STORE)) {
          const store = database.createObjectStore(OPERATION_STORE, { keyPath: 'operationId' });
          store.createIndex('status', 'status');
        }
        if (!database.objectStoreNames.contains(SUGGESTION_STORE)) database.createObjectStore(SUGGESTION_STORE, { keyPath: 'suggestionId' });
        if (!database.objectStoreNames.contains(CORRECTION_STORE)) database.createObjectStore(CORRECTION_STORE, { keyPath: 'correctionId' });
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

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([TAB_STORE, WORKSPACE_STORE], 'readwrite');
      const tabs = transaction.objectStore(TAB_STORE);
      const request = tabs.getAll();
      request.onsuccess = () => {
        for (const record of request.result as TabRecord[]) {
          if (record.workspaceId === workspaceId) tabs.put({ ...record, workspaceId: null, updatedAt: Date.now(), revision: record.revision + 1 });
        }
        transaction.objectStore(WORKSPACE_STORE).delete(workspaceId);
      };
      request.onerror = () => reject(new Error('Workspace records could not be read for deletion'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Workspace could not be deleted'));
      transaction.onabort = () => reject(new Error('Workspace deletion was aborted'));
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

  async updateRecordProtection(recordId: string, protection: Partial<TabRecord['protection']>): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TAB_STORE, 'readwrite');
      const store = transaction.objectStore(TAB_STORE);
      const request = store.get(recordId);
      request.onsuccess = () => {
        const record = request.result as TabRecord | undefined;
        if (!record) { reject(new Error('Tab record no longer exists')); return; }
        store.put({ ...record, protection: { ...record.protection, ...protection }, updatedAt: Date.now(), revision: record.revision + 1 });
      };
      request.onerror = () => reject(new Error('Tab record could not be read for protection change'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Tab record protection could not be saved'));
    });
  }

  async updateRecordContext(recordId: string, context: NonNullable<TabRecord['context']>): Promise<TabRecord> {
    const record = await this.get(recordId);
    if (!record) throw new Error('Tab record no longer exists');
    const updated = { ...record, context, updatedAt: Date.now(), revision: record.revision + 1 };
    await this.put(updated);
    return updated;
  }

  async clearAll(): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([TAB_STORE, WORKSPACE_STORE, OPERATION_STORE, SUGGESTION_STORE, CORRECTION_STORE], 'readwrite');
      for (const name of [TAB_STORE, WORKSPACE_STORE, OPERATION_STORE, SUGGESTION_STORE, CORRECTION_STORE]) transaction.objectStore(name).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Local data could not be cleared'));
    });
  }

  async exportAll(): Promise<{ records: TabRecord[]; workspaces: Workspace[]; operations: Operation[]; suggestions: SuggestionBatch[]; corrections: UserCorrection[] }> {
    return { records: await this.list(), workspaces: await this.listWorkspaces(), operations: await this.listOperations(), suggestions: await this.listSuggestions(), corrections: await this.listCorrections() };
  }

  async get(recordId: string): Promise<TabRecord | undefined> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(TAB_STORE, 'readonly').objectStore(TAB_STORE).get(recordId);
      request.onsuccess = () => resolve(request.result as TabRecord | undefined);
      request.onerror = () => reject(new Error('Local tab record could not be read'));
    });
  }

  async put(record: TabRecord): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(TAB_STORE, 'readwrite').objectStore(TAB_STORE).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Local tab record could not be saved'));
    });
  }

  async updateRecordState(recordId: string, state: TabRecord['state'], browserTabId: number | null, windowId: number | null): Promise<TabRecord> {
    const record = await this.get(recordId);
    if (!record) throw new Error('Tab record no longer exists');
    const updated = { ...record, state, browserTabId, windowId, updatedAt: Date.now(), revision: record.revision + 1 };
    await this.put(updated);
    return updated;
  }

  async delete(recordId: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(TAB_STORE, 'readwrite').objectStore(TAB_STORE).delete(recordId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Local tab record could not be deleted'));
    });
  }

  async putOperation(operation: Operation): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(OPERATION_STORE, 'readwrite').objectStore(OPERATION_STORE).put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Operation journal could not be saved'));
    });
  }

  async getOperation(operationId: string): Promise<Operation | undefined> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(OPERATION_STORE, 'readonly').objectStore(OPERATION_STORE).get(operationId);
      request.onsuccess = () => resolve(request.result as Operation | undefined);
      request.onerror = () => reject(new Error('Operation journal could not be read'));
    });
  }

  async listOperations(statuses?: Operation['status'][]): Promise<Operation[]> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(OPERATION_STORE, 'readonly').objectStore(OPERATION_STORE).getAll();
      request.onsuccess = () => {
        const operations = request.result as Operation[];
        resolve(statuses ? operations.filter((operation) => statuses.includes(operation.status)) : operations);
      };
      request.onerror = () => reject(new Error('Operation journal could not be read'));
    });
  }

  async putSuggestion(suggestion: SuggestionBatch): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(SUGGESTION_STORE, 'readwrite').objectStore(SUGGESTION_STORE).put(suggestion);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Suggestion could not be saved'));
    });
  }

  async listSuggestions(): Promise<SuggestionBatch[]> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(SUGGESTION_STORE, 'readonly').objectStore(SUGGESTION_STORE).getAll();
      request.onsuccess = () => resolve(request.result as SuggestionBatch[]);
      request.onerror = () => reject(new Error('Suggestions could not be read'));
    });
  }

  async getSuggestion(suggestionId: string): Promise<SuggestionBatch | undefined> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(SUGGESTION_STORE, 'readonly').objectStore(SUGGESTION_STORE).get(suggestionId);
      request.onsuccess = () => resolve(request.result as SuggestionBatch | undefined);
      request.onerror = () => reject(new Error('Suggestion could not be read'));
    });
  }

  async updateSuggestion(suggestion: SuggestionBatch): Promise<void> {
    await this.putSuggestion(suggestion);
  }

  async putCorrection(correction: UserCorrection): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(CORRECTION_STORE, 'readwrite').objectStore(CORRECTION_STORE).put(correction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Correction could not be saved'));
    });
  }

  async listCorrections(): Promise<UserCorrection[]> {
    const database = await this.open();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(CORRECTION_STORE, 'readonly').objectStore(CORRECTION_STORE).getAll();
      request.onsuccess = () => resolve(request.result as UserCorrection[]);
      request.onerror = () => reject(new Error('Corrections could not be read'));
    });
  }

  async restoreSnapshot(snapshot: Operation['before'][number]): Promise<TabRecord> {
    const record = await this.get(snapshot.recordId);
    if (!record) throw new Error('Tab record no longer exists');
    const restored = { ...record, browserTabId: snapshot.browserTabId, windowId: snapshot.windowId, state: snapshot.state, url: snapshot.url, workspaceId: snapshot.workspaceId, protection: snapshot.protection, updatedAt: Date.now(), revision: record.revision + 1 };
    await this.put(restored);
    return restored;
  }
}
