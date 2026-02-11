/**
 * IndexedDB Wrapper for HaulageTracker Offline Storage
 * 
 * Provides a typed, promise-based API over IndexedDB for storing:
 * - Auth sessions (user + profile)
 * - Dashboard data (stats, activities)
 * - Sync queue (pending operations for when back online)
 * 
 * All methods are SSR-safe — they return null/empty on the server.
 */

const DB_NAME = 'HaulageTrackerDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
    AUTH: 'auth',
    DASHBOARD: 'dashboard',
    APP_STATE: 'appState',
    SYNC_QUEUE: 'syncQueue',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

/** Check if we're in a browser environment where IndexedDB is available */
function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

let dbInstance: IDBDatabase | null = null;

/**
 * Opens (or creates) the IndexedDB database.
 * Returns null on the server (SSR).
 */
function openDB(): Promise<IDBDatabase | null> {
    if (!isBrowser()) return Promise.resolve(null);
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORES.AUTH)) {
                db.createObjectStore(STORES.AUTH);
            }
            if (!db.objectStoreNames.contains(STORES.DASHBOARD)) {
                db.createObjectStore(STORES.DASHBOARD);
            }
            if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
                db.createObjectStore(STORES.APP_STATE);
            }
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = (event.target as IDBOpenDBRequest).result;
            dbInstance.onclose = () => { dbInstance = null; };
            resolve(dbInstance);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Get a value by key from a store.
 */
export async function getItem<T = any>(storeName: StoreName, key: string): Promise<T | null> {
    try {
        const db = await openDB();
        if (!db) return null;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`[IndexedDB] Failed to get "${key}" from "${storeName}":`, error);
        return null;
    }
}

/**
 * Set a value by key in a store.
 */
export async function setItem<T = any>(storeName: StoreName, key: string, value: T): Promise<void> {
    try {
        const db = await openDB();
        if (!db) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`[IndexedDB] Failed to set "${key}" in "${storeName}":`, error);
    }
}

/**
 * Delete a value by key from a store.
 */
export async function deleteItem(storeName: StoreName, key: string): Promise<void> {
    try {
        const db = await openDB();
        if (!db) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`[IndexedDB] Failed to delete "${key}" from "${storeName}":`, error);
    }
}

/**
 * Get all values from a store.
 */
export async function getAllItems<T = any>(storeName: StoreName): Promise<T[]> {
    try {
        const db = await openDB();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result ?? []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`[IndexedDB] Failed to getAll from "${storeName}":`, error);
        return [];
    }
}

/**
 * Clear all data from a store.
 */
export async function clearStore(storeName: StoreName): Promise<void> {
    try {
        const db = await openDB();
        if (!db) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn(`[IndexedDB] Failed to clear "${storeName}":`, error);
    }
}

/**
 * Add an item to the sync queue for later processing.
 */
export async function addToSyncQueue(operation: {
    type: string;
    url: string;
    method: string;
    body?: any;
}): Promise<void> {
    await setItem(STORES.SYNC_QUEUE, `sync_${Date.now()}`, {
        ...operation,
        timestamp: new Date().toISOString(),
        retries: 0,
    });
}

/**
 * Creates a Zustand-compatible async storage adapter backed by IndexedDB.
 * SSR-safe: returns null on the server, letting Zustand use defaults.
 * Use with `createJSONStorage(() => createIDBStorage(...))` in Zustand persist.
 */
export function createIDBStorage(storeName: StoreName) {
    return {
        getItem: async (name: string): Promise<string | null> => {
            if (!isBrowser()) return null;
            const value = await getItem<any>(storeName, name);
            if (value === null) return null;
            return JSON.stringify(value);
        },
        setItem: async (name: string, value: string): Promise<void> => {
            if (!isBrowser()) return;
            try {
                const parsed = JSON.parse(value);
                await setItem(storeName, name, parsed);
            } catch {
                await setItem(storeName, name, value);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            if (!isBrowser()) return;
            await deleteItem(storeName, name);
        },
    };
}
