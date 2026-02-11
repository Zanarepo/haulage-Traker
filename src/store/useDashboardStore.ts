"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createIDBStorage, STORES } from '@/lib/indexedDB';

interface DashboardState {
    stats: any | null;
    activities: any[];
    lastUpdated: string | null;
    setStats: (stats: any) => void;
    setActivities: (activities: any[]) => void;
    clearCache: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            stats: null,
            activities: [],
            lastUpdated: null,
            setStats: (stats) => set({ stats, lastUpdated: new Date().toISOString() }),
            setActivities: (activities) => set({ activities, lastUpdated: new Date().toISOString() }),
            clearCache: () => set({ stats: null, activities: [], lastUpdated: null }),
        }),
        {
            name: 'ht-dashboard-storage',
            storage: createJSONStorage(() => createIDBStorage(STORES.DASHBOARD)),
        }
    )
);
