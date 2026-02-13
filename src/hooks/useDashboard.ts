"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getItem, setItem, STORES } from '@/lib/indexedDB';
import { dashboardService } from '@/services/dashboardService';

const IDB_STATS_KEY = 'dashboard_stats';
const IDB_ACTIVITIES_KEY = 'dashboard_activities';

export function useDashboard() {
    const { profile } = useAuth();
    const isOnline = useOnlineStatus();
    const [stats, setStats] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // On mount: load cached data from IndexedDB immediately
    useEffect(() => {
        (async () => {
            try {
                const cachedStats = await getItem<any[]>(STORES.DASHBOARD, IDB_STATS_KEY);
                const cachedActivities = await getItem<any[]>(STORES.DASHBOARD, IDB_ACTIVITIES_KEY);
                const cachedTime = await getItem<string>(STORES.DASHBOARD, 'lastUpdated');

                if (cachedStats && cachedStats.length > 0) {
                    setStats(cachedStats);
                }
                if (cachedActivities && cachedActivities.length > 0) {
                    setActivities(cachedActivities);
                }
                if (cachedTime) {
                    setLastUpdated(cachedTime);
                }
                console.log('[Dashboard] Loaded from IndexedDB cache');
            } catch (err) {
                console.warn('[Dashboard] IndexedDB cache read failed:', err);
            }
        })();
    }, []);

    // When online: fetch fresh data and persist to IndexedDB
    useEffect(() => {
        if (!isOnline || !profile?.company_id) return;

        (async () => {
            try {
                const [realStats, realActivities] = await Promise.all([
                    dashboardService.getStats(profile.company_id, profile.role, profile.id),
                    dashboardService.getActivities(profile.company_id, profile.role, profile.id)
                ]);

                const now = new Date().toISOString();

                setStats(realStats);
                setActivities(realActivities);
                setLastUpdated(now);

                // Persist to IndexedDB for offline use
                await setItem(STORES.DASHBOARD, IDB_STATS_KEY, realStats);
                await setItem(STORES.DASHBOARD, IDB_ACTIVITIES_KEY, realActivities);
                await setItem(STORES.DASHBOARD, 'lastUpdated', now);
                console.log('[Dashboard] Fresh data fetched and cached');
            } catch (err) {
                console.error('[Dashboard] Fetch failed:', err);
            }
        })();
    }, [isOnline, profile?.role, profile?.company_id, profile?.id]);

    return useMemo(() => ({
        profile,
        isOnline,
        stats,
        activities,
        lastUpdated
    }), [profile, isOnline, stats, activities, lastUpdated]);
}
