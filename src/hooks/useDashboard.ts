"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getItem, setItem, STORES } from '@/lib/indexedDB';

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
        if (!isOnline) return;

        const demoStats = {
            superadmin: [
                { title: "Active Trips", value: "12", sub: "4 pending approval", color: "blue", trend: "+2" },
                { title: "Fuel Dispensed", value: "45,200L", sub: "Current month", color: "emerald", trend: "+15%" },
                { title: "Audit Alerts", value: "3", sub: "Requires attention", color: "rose", trend: "-1" },
                { title: "Active Clusters", value: "8", sub: "Across 3 regions", color: "purple" }
            ],
            driver: [
                { title: "Active Trip", value: "TR-9021", sub: "MTN Site: LAG-402", color: "blue" },
                { title: "Completed", value: "8", sub: "Target: 10", color: "emerald", trend: "+3" },
                { title: "Next Delivery", value: "1,500L", sub: "Scheduled: 2pm", color: "blue" }
            ]
        };

        const demoActivities = [
            { user: "John Driver", action: "Dispensed 1,500L", target: "LAG-001", time: "12m ago", status: "reconciled" },
            { user: "Sarah Admin", action: "Allocated 10kL", target: "Lagos", time: "45m ago", status: "completed" },
            { user: "System", action: "Audit Flag: Variance", target: "TR-8822", time: "2h ago", status: "alert" }
        ];

        const roleStats = profile?.role === 'driver' ? demoStats.driver : demoStats.superadmin;
        const now = new Date().toISOString();

        setStats(roleStats);
        setActivities(demoActivities);
        setLastUpdated(now);

        // Persist to IndexedDB for offline use
        (async () => {
            try {
                await setItem(STORES.DASHBOARD, IDB_STATS_KEY, roleStats);
                await setItem(STORES.DASHBOARD, IDB_ACTIVITIES_KEY, demoActivities);
                await setItem(STORES.DASHBOARD, 'lastUpdated', now);
                console.log('[Dashboard] Cached to IndexedDB');
            } catch (err) {
                console.warn('[Dashboard] IndexedDB write failed:', err);
            }
        })();
    }, [isOnline, profile?.role]);

    return useMemo(() => ({
        profile,
        isOnline,
        stats,
        activities,
        lastUpdated
    }), [profile, isOnline, stats, activities, lastUpdated]);
}
