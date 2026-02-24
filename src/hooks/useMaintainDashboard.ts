"use client";

import { useState, useEffect } from 'react';
import { maintainService } from '@/services/maintainService';
import { useAuth } from '@/hooks/useAuth';

interface DashStat {
    title: string;
    value: string;
    sub: string;
    color: string;
}

interface Activity {
    user: string;
    action: string;
    target: string;
    time: string;
    status: string;
    priority?: string;
}

export function useMaintainDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<DashStat[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [failureAnalysis, setFailureAnalysis] = useState<Record<string, number>>({});
    const [proactiveAlerts, setProactiveAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isManager = ['superadmin', 'admin', 'md'].includes(profile?.role || '');
    const isEngineer = profile?.role === 'site_engineer';

    useEffect(() => {
        if (!profile?.company_id) return;

        const load = async () => {
            try {
                const clusterIds = (profile?.role === 'admin' || profile?.role === 'site_engineer')
                    ? profile?.cluster_ids
                    : undefined;

                if (isEngineer) {
                    const [statsData, activityData, assetsData] = await Promise.all([
                        maintainService.getEngineerStats(profile.id),
                        maintainService.getEngineerActivities(profile.id),
                        maintainService.getAssets(profile.company_id, { clusterIds })
                    ]);
                    setStats(statsData);
                    setActivities(activityData);

                    // Filter alerts for engineer's assets
                    const alerts = assetsData.filter(a => a.projections?.healthStatus !== 'healthy');
                    setProactiveAlerts(alerts);
                } else {
                    const [statsData, activityData, analysisData, assetsData] = await Promise.all([
                        maintainService.getDashboardStats(profile.company_id, clusterIds),
                        maintainService.getRecentActivities(profile.company_id, clusterIds),
                        maintainService.getFailureAnalysis(profile.company_id, clusterIds),
                        maintainService.getAssets(profile.company_id, { clusterIds })
                    ]);
                    setStats(statsData);
                    setActivities(activityData);
                    setFailureAnalysis(analysisData);

                    // Filter alerts for high-priority health issues
                    const alerts = assetsData.filter(a => a.projections?.healthStatus !== 'healthy');
                    setProactiveAlerts(alerts);
                }
            } catch (err) {
                console.error('[Maintain Dashboard]', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [profile?.company_id, profile?.id, isEngineer, profile?.role, profile?.cluster_ids]);

    return {
        stats,
        activities,
        failureAnalysis,
        proactiveAlerts,
        loading,
        isManager,
        isEngineer,
        profile,
    };
}
