"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLayout } from '@/hooks/useLayout';
import { useToast } from '@/hooks/useToast';

export interface SOP {
    id: string;
    title: string;
    asset_type: string;
    category: 'generator' | 'electrical' | 'hvac' | 'safety' | 'other';
    steps_json: any; // Using JSONB as per schema
    attachments: string[] | null;
    is_global: boolean;
    created_at: string;
    updated_at: string;
    company_id: string;
}

export function useKnowledgeBase() {
    const { profile } = useLayout();
    const { showToast } = useToast();
    const [sops, setSops] = useState<SOP[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.company_id) {
            fetchSOPs();
        }
    }, [profile?.company_id]);

    const fetchSOPs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('maintain_asset_sops')
                .select('*')
                .eq('company_id', profile?.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSops(data || []);
        } catch (err: any) {
            console.error('Error fetching SOPs:', err);
            setError(err.message);
            showToast('Failed to load SOPs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const createSOP = async (sop: Partial<SOP>) => {
        try {
            const { data, error } = await supabase
                .from('maintain_asset_sops')
                .insert([{
                    ...sop,
                    company_id: profile?.company_id
                }])
                .select()
                .single();

            if (error) throw error;
            setSops(prev => [data, ...prev]);
            showToast('SOP created successfully', 'success');
            return data;
        } catch (err: any) {
            console.error('Error creating SOP:', err);
            showToast('Failed to create SOP: ' + err.message, 'error');
            throw err;
        }
    };

    const deleteSOP = async (id: string) => {
        try {
            const { error } = await supabase
                .from('maintain_asset_sops')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSops(prev => prev.filter(s => s.id !== id));
            showToast('SOP deleted successfully', 'success');
        } catch (err: any) {
            console.error('Error deleting SOP:', err);
            showToast('Failed to delete SOP', 'error');
            throw err;
        }
    };

    const updateSOP = async (id: string, updates: Partial<SOP>) => {
        try {
            const { data, error } = await supabase
                .from('maintain_asset_sops')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setSops(prev => prev.map(s => s.id === id ? data : s));
            showToast('SOP updated successfully', 'success');
            return data;
        } catch (err: any) {
            console.error('Error updating SOP:', err);
            showToast('Failed to update SOP', 'error');
            throw err;
        }
    };

    const fetchExecutionByWorkOrder = async (workOrderId: string, sopId: string) => {
        try {
            const { data, error } = await supabase
                .from('maintain_sop_execution_logs')
                .select('*')
                .eq('work_order_id', workOrderId)
                .eq('sop_id', sopId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching execution log:', err);
            return null;
        }
    };

    const submitExecution = async (sopId: string, executionData: any, workOrderId?: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('Not authenticated');

            // Find current company_id from user profile or metadata
            const company_id = sops[0]?.company_id || profile?.company_id;
            if (!company_id) throw new Error('Company context missing');

            // 1. Check for existing log
            let existingLog = null;
            if (workOrderId) {
                existingLog = await fetchExecutionByWorkOrder(workOrderId, sopId);
            }

            // 2. Check lock status
            if (existingLog?.locked_at && new Date() > new Date(existingLog.locked_at)) {
                throw new Error('This execution record is locked and cannot be edited.');
            }

            const submittedAt = new Date();
            const lockedAt = existingLog?.locked_at || new Date(submittedAt.getTime() + 2 * 60 * 60 * 1000).toISOString();

            const payload: any = {
                company_id,
                sop_id: sopId,
                user_id: session.user.id,
                work_order_id: workOrderId,
                execution_data: executionData,
                submitted_at: submittedAt.toISOString(),
                locked_at: lockedAt
            };

            if (existingLog?.id) {
                payload.id = existingLog.id;
            }

            const { error } = await supabase
                .from('maintain_sop_execution_logs')
                .upsert(payload);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error submitting SOP execution:', err);
            throw err;
        }
    };

    const defaultCategories = [
        { id: 'generator', label: 'Generator', icon: '⚡', color: 'blue' },
        { id: 'electrical', label: 'Electrical', icon: '🔌', color: 'orange' },
        { id: 'hvac', label: 'HVAC', icon: '❄️', color: 'emerald' },
        { id: 'safety', label: 'Safety', icon: '🛡️', color: 'rose' },
        { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️', color: 'purple' },
        { id: 'other', label: 'General', icon: '🔧', color: 'slate' },
    ];

    // Combine defaults with any unique categories found in SOPs
    const dynamicCategories = [
        ...defaultCategories,
        ...sops
            .map(s => s.category)
            .filter(cat => !defaultCategories.find(dc => dc.id === cat))
            .filter((value, index, self) => self.indexOf(value) === index) // Unique
            .map(cat => ({
                id: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
                icon: '🔖',
                color: 'slate'
            }))
    ];

    return {
        sops,
        loading,
        error,
        categories: dynamicCategories,
        createSOP,
        updateSOP,
        deleteSOP,
        submitExecution,
        refresh: fetchSOPs
    };
}
