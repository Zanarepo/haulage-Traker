"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { maintainService } from '@/services/maintainService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useWorkOrders() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters & UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const isManager = ['superadmin', 'admin', 'md'].includes(profile?.role || '');
    const isEngineer = profile?.role === 'site_engineer';

    const loadWorkOrders = useCallback(async () => {
        if (!profile?.company_id) return;

        try {
            setLoading(true);
            const filters: any = {};
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (typeFilter !== 'all') filters.type = typeFilter;

            let data;
            if (isEngineer) {
                // Engineers only see their assigned work orders
                data = await maintainService.getEngineerWorkOrders(profile.id, filters);
            } else {
                data = await maintainService.getWorkOrders(profile.company_id, filters);
            }

            setWorkOrders(data || []);
        } catch (error: any) {
            console.error('[WorkOrders] Load failed:', error);
            showToast('Failed to load work orders: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, profile?.id, profile?.role, statusFilter, typeFilter, showToast, isEngineer]);

    useEffect(() => {
        loadWorkOrders();
    }, [loadWorkOrders]);

    const handleCreate = async (data: any) => {
        try {
            setSubmitting(true);
            await maintainService.createWorkOrder({
                ...data,
                company_id: profile?.company_id,
                created_by: profile?.id,
            });
            showToast('Work order created successfully', 'success');
            await loadWorkOrders();
            setIsCreateModalOpen(false);
        } catch (error: any) {
            console.error('[WorkOrders] Create failed:', error);
            showToast('Failed to create work order: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (woId: string, updates: any) => {
        try {
            setSubmitting(true);
            await maintainService.updateWorkOrder(woId, updates);
            showToast('Work order updated successfully', 'success');
            await loadWorkOrders();
            setIsDetailsModalOpen(false);
        } catch (error: any) {
            console.error('[WorkOrders] Update failed:', error);
            showToast('Failed to update work order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (woId: string, status: string) => {
        try {
            setSubmitting(true);
            const updates: any = { status };
            if (status === 'completed') updates.completed_at = new Date().toISOString();
            await maintainService.updateWorkOrder(woId, updates);
            showToast(`Work order updated to ${status}`, 'success');
            await loadWorkOrders();
        } catch (error: any) {
            console.error('[WorkOrders] Update failed:', error);
            showToast('Failed to update work order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (woId: string) => {
        if (!window.confirm('Are you sure you want to delete this work order?')) return;
        try {
            setSubmitting(true);
            await maintainService.deleteWorkOrder(woId);
            showToast('Work order deleted successfully', 'success');
            await loadWorkOrders();
            setIsDetailsModalOpen(false);
        } catch (error: any) {
            console.error('[WorkOrders] Delete failed:', error);
            showToast('Failed to delete work order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openDetails = (wo: any) => {
        setSelectedWorkOrder(wo);
        setIsDetailsModalOpen(true);
    };

    const filteredWorkOrders = useMemo(() => {
        return workOrders.filter(wo => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                wo.title?.toLowerCase().includes(term) ||
                wo.site?.name?.toLowerCase().includes(term) ||
                wo.engineer?.full_name?.toLowerCase().includes(term)
            );
        });
    }, [workOrders, searchTerm]);

    const stats = useMemo(() => ({
        total: workOrders.length,
        open: workOrders.filter(wo => wo.status === 'open').length,
        inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
        completed: workOrders.filter(wo => wo.status === 'completed').length,
        overdue: workOrders.filter(wo =>
            ['open', 'assigned', 'in_progress'].includes(wo.status) &&
            wo.scheduled_date && new Date(wo.scheduled_date) < new Date()
        ).length,
    }), [workOrders]);

    return {
        workOrders,
        filteredWorkOrders,
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
        selectedWorkOrder,
        setSelectedWorkOrder,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        openDetails,
        handleCreate,
        handleUpdate,
        handleUpdateStatus,
        handleDelete,
        stats,
        isManager,
        isEngineer,
        loadWorkOrders,
    };
}
