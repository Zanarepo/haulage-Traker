'use client';

import { useState, useEffect } from 'react';
import { platformService } from '@/services/platformService';

export function usePlatformDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [growth, setGrowth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [metricsData, growthData] = await Promise.all([
                platformService.getGlobalMetrics(),
                platformService.getPlatformGrowth()
            ]);

            setMetrics(metricsData);
            setGrowth(growthData);
            setError(null);
        } catch (err: any) {
            console.error('[PlatformDashboard] Load failed:', err);
            setError(err.message || 'Failed to load platform data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    return {
        metrics,
        growth,
        loading,
        error,
        refresh: loadDashboardData
    };
}
