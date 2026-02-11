/**
 * HaulageTracker Service Worker
 * 
 * Caches the app shell and static assets so the dashboard works offline.
 * Uses Cache API for pages/assets and works alongside IndexedDB for data.
 */

const CACHE_NAME = 'ht-cache-v1';
const OFFLINE_URL = '/offline.html';

// Critical pages and assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/dashboard',
    '/offline.html',
];

// ─── INSTALL: Pre-cache the app shell ────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Cache the offline fallback first (always works)
            await cache.add(OFFLINE_URL);
            // Try to cache other pages — don't fail install if they error
            for (const url of PRECACHE_URLS) {
                try {
                    await cache.add(url);
                    console.log('[SW] Pre-cached:', url);
                } catch (err) {
                    console.warn('[SW] Failed to pre-cache:', url, err);
                }
            }
        })
    );
    // Activate immediately, don't wait for old SW to die
    self.skipWaiting();
});

// ─── ACTIVATE: Clean up old caches ──────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// ─── FETCH: Network-first for navigations, cache-first for assets ───
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests (POST, PUT, etc.)
    if (request.method !== 'GET') return;

    // Skip chrome-extension, webpack HMR, and other non-http requests
    if (!request.url.startsWith('http')) return;

    // Skip Next.js HMR/dev requests in development
    if (request.url.includes('_next/webpack-hmr') ||
        request.url.includes('__nextjs') ||
        request.url.includes('_next/static/development')) {
        return;
    }

    // Navigation requests (HTML pages): Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful page responses for offline use
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Network failed — try cache, then offline fallback
                    return caches.match(request).then((cached) => {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // Static assets (JS, CSS, images, fonts): Cache-first
    if (request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?|ttf|eot)(\?.*)?$/)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                }).catch(() => {
                    // Asset unavailable offline — return empty response
                    return new Response('', { status: 503 });
                });
            })
        );
        return;
    }

    // Next.js chunks (_next/static/chunks): Cache-first
    if (request.url.includes('/_next/static/')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // API / Supabase requests: Network-first, cache as fallback
    if (request.url.includes('/api/') || request.url.includes('supabase')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || new Response(
                            JSON.stringify({ error: 'Offline' }),
                            { headers: { 'Content-Type': 'application/json' }, status: 503 }
                        );
                    });
                })
        );
        return;
    }

    // Everything else: Network-first
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, clone);
                });
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// ─── MESSAGE: Allow skip-waiting from the app ───────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
