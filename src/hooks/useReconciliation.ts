"use client";

import { useState, useEffect } from 'react';
import { reconciliationService, ReconciliationSummary } from '@/services/reconciliationService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useReconciliation() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReconciliationSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const now = new Date();
    const [dateMode, setDateMode] = useState<'monthly' | 'quarterly' | 'custom'>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(now.getMonth() / 3));
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [customRange, setCustomRange] = useState({
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedDetailedRecon, setSelectedDetailedRecon] = useState<ReconciliationSummary | null>(null);
    const [supplyHistory, setSupplyHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const allowedRoles = ['superadmin', 'admin', 'md', 'accountant', 'driver'];
    const hasAccess = profile?.role && allowedRoles.includes(profile.role);
    const isSuperAdmin = profile?.role === 'superadmin';
    const isDriver = profile?.role === 'driver';

    const getPeriodDates = () => {
        let start: string;
        let end: string;

        if (dateMode === 'monthly') {
            start = new Date(selectedYear, selectedMonth, 1).toISOString();
            end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
        } else if (dateMode === 'quarterly') {
            start = new Date(selectedYear, selectedQuarter * 3, 1).toISOString();
            end = new Date(selectedYear, (selectedQuarter + 1) * 3, 0, 23, 59, 59).toISOString();
        } else {
            start = new Date(customRange.start).toISOString();
            const e = new Date(customRange.end);
            e.setHours(23, 59, 59);
            end = e.toISOString();
        }
        return { start, end };
    };

    const loadData = async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const { start, end } = getPeriodDates();

            const summaries = await reconciliationService.getPendingReconciliations(
                profile.company_id,
                start,
                end,
                isDriver ? profile.id : undefined,
                profile.role === 'admin' ? profile.cluster_ids : undefined
            );
            setData(summaries);
            setCurrentPage(1);
        } catch (error) {
            console.error('Failed to load reconciliations:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (recon: ReconciliationSummary) => {
        try {
            setSelectedDetailedRecon(recon);
            setShowHistoryModal(true);
            setLoadingHistory(true);
            const { start, end } = getPeriodDates();

            const history = await reconciliationService.getSupplyHistory(
                profile!.company_id!,
                recon.driver_id,
                start,
                end
            );
            setSupplyHistory(history);
        } catch (error) {
            console.error('Failed to load history:', error);
            showToast('Failed to load supply history', 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCloseCycle = async (recon: ReconciliationSummary) => {
        if (!window.confirm(`Are you sure you want to close the reconciliation cycle for ${recon.full_name}? This will mark related trips as completed.`)) {
            return;
        }

        try {
            const { start, end } = getPeriodDates();
            await reconciliationService.closeCycle({
                company_id: profile!.company_id!,
                driver_id: recon.driver_id,
                period_start: start,
                period_end: end,
                total_allocated: recon.total_allocated,
                total_supplied: recon.total_supplied,
                reconciled_by: profile!.id
            });

            showToast(`Reconciliation cycle closed for ${recon.full_name}`, 'success');
            loadData();
        } catch (error) {
            console.error('Failed to close cycle:', error);
            showToast('Failed to close reconciliation cycle', 'error');
        }
    };

    const handleDeleteRow = async (recon: ReconciliationSummary) => {
        if (!window.confirm(`Admin: Are you sure you want to delete this reconciliation entry?`)) {
            return;
        }
        showToast('Only recorded reconciliations can be deleted. Pending ones are calculated from raw data.', 'info');
    };

    useEffect(() => {
        loadData();
    }, [profile?.company_id, selectedMonth, selectedYear, selectedQuarter, dateMode]);

    const filteredData = data.filter(d => {
        if (isDriver) {
            return d.driver_id === profile?.id || d.full_name === profile?.full_name;
        }
        const matchesSearch = d.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDriver = selectedDriver === 'all' || d.full_name === selectedDriver;
        return matchesSearch && matchesDriver;
    });

    const stats = {
        totalAllocated: filteredData.reduce((sum, d) => sum + d.total_allocated, 0),
        totalSupplied: filteredData.reduce((sum, d) => sum + d.total_supplied, 0),
        totalCommunity: filteredData.reduce((sum, d) => sum + d.total_community, 0),
        netBalance: filteredData.reduce((sum, d) => sum + d.balance, 0),
        pendingDrivers: filteredData.length
    };

    const uniqueDrivers = Array.from(new Set(filteredData.map(d => d.full_name))).sort();

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleFilterChange = (setter: (val: string) => void, val: string) => {
        setter(val);
        setCurrentPage(1);
    };

    return {
        profile,
        loading,
        data,
        searchTerm,
        setSearchTerm,
        selectedDriver,
        setSelectedDriver,
        currentPage,
        setCurrentPage,
        pageSize,
        dateMode,
        setDateMode,
        selectedMonth,
        setSelectedMonth,
        selectedQuarter,
        setSelectedQuarter,
        selectedYear,
        setSelectedYear,
        customRange,
        setCustomRange,
        showHistoryModal,
        setShowHistoryModal,
        selectedDetailedRecon,
        supplyHistory,
        loadingHistory,
        hasAccess,
        isSuperAdmin,
        isDriver,
        stats,
        uniqueDrivers,
        filteredData,
        totalPages,
        paginatedData,
        handleViewDetails,
        handleCloseCycle,
        handleDeleteRow,
        handleFilterChange,
        getPeriodDates,
        loadData
    };
}
