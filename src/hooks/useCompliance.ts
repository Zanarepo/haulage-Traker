"use client";

import { useState, useEffect } from 'react';
import { complianceService, ComplianceStats } from '@/services/maintain/complianceService';
import { useLayout } from '@/hooks/useLayout';
import { useToast } from '@/hooks/useToast';

export function useCompliance() {
    const { profile } = useLayout();
    const toast = useToast();
    const showToast = toast?.showToast || ((msg: string) => alert(msg));
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        if (!profile?.company_id) return;

        try {
            setLoading(true);
            const data = await complianceService.getStats(profile.company_id);
            setStats(data);
        } catch (err: any) {
            console.error('Error fetching compliance stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [profile?.company_id]);

    return {
        stats,
        loading,
        error,
        refresh: fetchStats
    };
}
