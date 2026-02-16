"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { maintainService } from '@/services/maintainService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useAssets() {
    const { profile } = useAuth();
    const { showToast } = useToast();

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
            const data = await maintainService.getAssets(profile.company_id);
            setAssets(data || []);
        } catch (error: any) {
            console.error('[Assets] Load failed:', error);
            showToast('Failed to load assets: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const openDetails = (asset: any) => {
        setSelectedAsset(asset);
        setIsDetailsModalOpen(true);
    };

    const handleCreate = async (data: any) => {
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
        inactive: assets.filter(a => a.status === 'inactive').length,
        decommissioned: assets.filter(a => a.status === 'decommissioned').length,
        overdue: assets.filter(a => a.warranty_expiry_date && new Date(a.warranty_expiry_date) < new Date()).length,
    }), [assets]);

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
    };
}
