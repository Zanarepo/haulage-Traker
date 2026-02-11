"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { clusterService } from '@/services/clusterService';
import { Cluster } from '@/types/database';

interface UseClustersReturn {
    clusters: Cluster[];
    filteredClusters: Cluster[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    stateFilter: string;
    setStateFilter: (v: string) => void;
    // Modal
    isModalOpen: boolean;
    editingCluster: Cluster | null;
    openAddModal: () => void;
    openEditModal: (cluster: Cluster) => void;
    closeModal: () => void;
    // Actions
    handleCreateCluster: (input: { name: string; state?: string }) => Promise<void>;
    handleUpdateCluster: (clusterId: string, fields: { name?: string; state?: string }) => Promise<void>;
    handleDeleteCluster: (clusterId: string) => Promise<void>;
    submitting: boolean;
}

// Nigerian states for filter dropdown
export const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nassarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export function useClusters(): UseClustersReturn {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);

    // Fetch clusters on mount
    useEffect(() => {
        if (profile?.company_id) {
            loadClusters();
        }
    }, [profile?.company_id]);

    const loadClusters = useCallback(async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const data = await clusterService.getClusters(profile.company_id);
            setClusters(data || []);
        } catch (err: any) {
            showToast(`Failed to load clusters: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    // Filtered clusters
    const filteredClusters = clusters.filter((c) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                c.name.toLowerCase().includes(q) ||
                c.state?.toLowerCase().includes(q);
            if (!matchesSearch) return false;
        }
        if (stateFilter && c.state !== stateFilter) return false;
        return true;
    });

    // Modal controls
    const openAddModal = () => { setEditingCluster(null); setIsModalOpen(true); };
    const openEditModal = (cluster: Cluster) => { setEditingCluster(cluster); setIsModalOpen(true); };
    const closeModal = () => { setEditingCluster(null); setIsModalOpen(false); };

    // Create cluster
    const handleCreateCluster = async (input: { name: string; state?: string }) => {
        if (!profile?.company_id) return;
        setSubmitting(true);
        try {
            await clusterService.createCluster(input.name, profile.company_id, input.state);
            showToast(`Cluster "${input.name}" created successfully`, 'success');
            closeModal();
            await loadClusters();
        } catch (err: any) {
            showToast(`Failed to create cluster: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Update cluster
    const handleUpdateCluster = async (clusterId: string, fields: { name?: string; state?: string }) => {
        setSubmitting(true);
        try {
            // We need to add an updateCluster method — use supabase directly for now
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase
                .from('clusters')
                .update(fields)
                .eq('id', clusterId);
            if (error) throw error;
            showToast('Cluster updated successfully', 'success');
            closeModal();
            await loadClusters();
        } catch (err: any) {
            showToast(`Failed to update cluster: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete cluster
    const handleDeleteCluster = async (clusterId: string) => {
        try {
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase
                .from('clusters')
                .delete()
                .eq('id', clusterId);
            if (error) throw error;
            showToast('Cluster deleted', 'info');
            await loadClusters();
        } catch (err: any) {
            showToast(`Failed to delete cluster: ${err.message}`, 'error');
        }
    };

    return {
        clusters,
        filteredClusters,
        loading,
        searchQuery,
        setSearchQuery,
        stateFilter,
        setStateFilter,
        isModalOpen,
        editingCluster,
        openAddModal,
        openEditModal,
        closeModal,
        handleCreateCluster,
        handleUpdateCluster,
        handleDeleteCluster,
        submitting,
    };
}
