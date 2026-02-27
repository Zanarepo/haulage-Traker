"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { maintainService } from '@/services/maintainService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSubscription } from '@/hooks/useSubscription';

export function useAssets() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const { plan } = useSubscription(profile?.company_id || null);

    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters & UI
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    const isManager = ['superadmin', 'admin', 'md'].includes(profile?.role || '');

    const loadAssets = useCallback(async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const clusterIds = (profile?.role === 'admin' || profile?.role === 'site_engineer')
                ? profile?.cluster_ids
                : undefined;

            const data = await maintainService.getAssets(profile.company_id, { clusterIds });
            setAssets(data || []);
        } catch (error: any) {
            console.error('[Assets] Load failed:', error);
            showToast('Failed to load assets: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, profile?.id, profile?.role, profile?.cluster_ids, showToast]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const openDetails = (asset: any) => {
        setSelectedAsset(asset);
        setIsDetailsModalOpen(true);
    };

    const handleCreate = async (data: any) => {
        // Enforce plan-based asset limit
        const maxAssets = plan.features.maintain.maxAssets;
        if (assets.length >= maxAssets) {
            showToast(
                `Asset limit reached (${maxAssets}). Upgrade your plan to register more assets.`,
                'error'
            );
            return;
        }

        try {
            setSubmitting(true);
            await maintainService.createAsset({
                ...data,
                company_id: profile?.company_id,
            });
            showToast('Asset registered successfully', 'success');
            await loadAssets();
            setIsCreateModalOpen(false);
        } catch (error: any) {
            console.error('[Assets] Create failed:', error);
            showToast('Failed to register asset: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id: string, updates: any) => {
        try {
            setSubmitting(true);
            await maintainService.updateAsset(id, updates);
            showToast('Asset updated', 'success');
            await loadAssets();
        } catch (error: any) {
            console.error('[Assets] Update failed:', error);
            showToast('Failed to update asset', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            setSubmitting(true);
            await maintainService.deleteAsset(id);
            showToast('Asset deleted', 'success');
            await loadAssets();
        } catch (error: any) {
            console.error('[Assets] Delete failed:', error);
            showToast('Failed to delete asset', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            const matchesSearch = !searchTerm || [
                a.make_model, a.serial_number, a.site?.name, a.type
            ].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            const matchesType = typeFilter === 'all' || a.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [assets, searchTerm, statusFilter, typeFilter]);

    const stats = useMemo(() => ({
        total: assets.length,
        active: assets.filter(a => a.status === 'active').length,
        healthy: assets.filter(a => a.projections?.healthStatus === 'healthy').length,
        dueSoon: assets.filter(a => a.projections?.healthStatus === 'due_soon').length,
        overdue: assets.filter(a => a.projections?.healthStatus === 'overdue').length,
        inactive: assets.filter(a => a.status === 'inactive').length,
        decommissioned: assets.filter(a => a.status === 'decommissioned').length,
    }), [assets]);

    const assetLimit = plan.features.maintain.maxAssets;
    const canCreateAsset = assets.length < assetLimit;

    return {
        assets,
        filteredAssets,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        selectedAsset,
        openDetails,
        handleCreate,
        handleUpdate,
        handleDelete,
        stats,
        isManager,
        loadAssets,
        assetLimit,
        canCreateAsset,
    };
}
