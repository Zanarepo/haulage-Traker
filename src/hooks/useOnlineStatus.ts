"use client";

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
    // Start with `true` on both server and client to avoid hydration mismatch.
    // The useEffect will correct it on the client after mount.
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Sync the actual browser status after hydration
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
