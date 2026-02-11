// @ts-nocheck
// This file runs in a ServiceWorker context, not in the browser.
// TypeScript types are intentionally relaxed here.

/**
 * Custom worker extensions for HaulageTracker PWA.
 * This file is merged into the main service worker by @ducanh2912/next-pwa.
 * 
 * Adds IndexedDB-aware offline handling and background sync support.
 */

// Listen for messages from the main app
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Background sync: retry failed requests when connection is restored
self.addEventListener("sync", (event) => {
    if (event.tag === "sync-pending-operations") {
        event.waitUntil(syncPendingOperations());
    }
});

async function syncPendingOperations() {
    // Open IndexedDB and check for pending operations in the syncQueue store
    const db = await openIDB();
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const allItems = await idbGetAll(store);

    for (const item of allItems) {
        try {
            await fetch(item.url, {
                method: item.method,
                headers: { "Content-Type": "application/json" },
                body: item.body ? JSON.stringify(item.body) : undefined,
            });
            // If successful, remove from queue
            store.delete(item.id);
        } catch {
            // Will retry on next sync event
            console.log("[SW] Sync failed for:", item.url, "— will retry");
        }
    }
}

function openIDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("HaulageTrackerDB", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function idbGetAll(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result ?? []);
        request.onerror = () => reject(request.error);
    });
}
