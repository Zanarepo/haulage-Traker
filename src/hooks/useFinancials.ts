"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { financialService } from '@/services/financialService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useFinancials() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [financials, setFinancials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isAccountant = profile?.role === 'accountant' || profile?.role === 'superadmin';
    const isAuditor = profile?.role === 'auditor' || profile?.role === 'superadmin';
    const isMD = profile?.role === 'md' || profile?.role === 'superadmin';

    const loadData = useCallback(async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const data = await financialService.getFinancials(profile.company_id);

            // Filter by cluster if regional admin
            let visibleFinancials = data || [];
            if (profile?.role === 'admin' && profile?.cluster_ids) {
                visibleFinancials = visibleFinancials.filter(f =>
                    profile.cluster_ids?.includes(f.dispensing_logs?.sites?.cluster_id)
                );
            }

            setFinancials(visibleFinancials);
        } catch (error: any) {
            console.error('Failed to load financials:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApproval = async (id: string, type: 'accountant' | 'auditor') => {
        try {
            setSubmitting(true);
            const updates: any = { approved_by_id: profile?.id };
            if (type === 'accountant') updates.accountant_approval = true;
            if (type === 'auditor') updates.auditor_approval = true;

            await financialService.updateApproval(id, updates);
            showToast('Approved successfully', 'success');
            await loadData();
        } catch (error: any) {
            console.error('Approval failed:', error);
            showToast('Approval failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFlag = async (id: string) => {
        try {
            setSubmitting(true);
            await financialService.updateApproval(id, { is_audit_flagged: true });
            showToast('Record flagged for review', 'warning');
            await loadData();
        } catch (error: any) {
            showToast('Failed to flag record', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFinancials = useMemo(() => {
        return financials.filter(f => {
            const trip = f.dispensing_logs?.trips;
            const searchStr = `${trip?.truck_plate_number} ${trip?.clients?.name} ${f.dispensing_logs?.sites?.name}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }, [financials, searchTerm]);

    const stats = useMemo(() => {
        return {
            totalHaulage: financials.reduce((acc, curr) => acc + (Number(curr.calculated_haulage_fee) || 0), 0),
            totalLoss: financials.reduce((acc, curr) => acc + (Number(curr.loss_amount) || 0), 0),
            pendingAccountant: financials.filter(f => !f.accountant_approval).length,
            pendingAuditor: financials.filter(f => !f.auditor_approval).length,
            flagged: financials.filter(f => f.is_audit_flagged).length
        };
    }, [financials]);

    return {
        financials: filteredFinancials,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        stats,
        isAccountant,
        isAuditor,
        isMD,
        handleApproval,
        handleFlag,
        refresh: loadData
    };
}
