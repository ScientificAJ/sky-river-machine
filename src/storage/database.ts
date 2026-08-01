import type { TabRecord } from '../shared/types';

const DATABASE_NAME = 'sky-river-machine';
const DATABASE_VERSION = 1;
const TAB_STORE = 'tabRecords';

export class IndexedDbTabStore {
  private database?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.createObjectStore(TAB_STORE, { keyPath: 'recordId' });
        store.createIndex('state', 'state');
        store.createIndex('domain', 'domain');
        store.createIndex('browserTabId', ['windowId', 'browserTabId']);
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
}
