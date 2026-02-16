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
    const [loading, setLoading] = useState(true);

    const isManager = ['superadmin', 'admin', 'md'].includes(profile?.role || '');
    const isEngineer = profile?.role === 'site_engineer';

    useEffect(() => {
        if (!profile?.company_id) return;

        const load = async () => {
            try {
                if (isEngineer) {
                    // Engineer sees their own stats
                    const [statsData, activityData] = await Promise.all([
                        maintainService.getEngineerStats(profile.id),
                        maintainService.getEngineerActivities(profile.id),
                    ]);
                    setStats(statsData);
                    setActivities(activityData);
                } else {
                    // Manager / superadmin sees company-wide
                    const [statsData, activityData] = await Promise.all([
                        maintainService.getDashboardStats(profile.company_id),
                        maintainService.getRecentActivities(profile.company_id),
                    ]);
                    setStats(statsData);
                    setActivities(activityData);
                }
            } catch (err) {
                console.error('[Maintain Dashboard]', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [profile?.company_id, profile?.id, isEngineer]);

    return {
        stats,
        activities,
        loading,
        isManager,
        isEngineer,
        profile,
    };
}
