"use client";

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * Drop this component into the root layout.
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => {
                    console.log('[App] Service Worker registered, scope:', reg.scope);
                })
                .catch((err) => {
                    console.error('[App] Service Worker registration failed:', err);
                });
        }
    }, []);

    return null;
}
