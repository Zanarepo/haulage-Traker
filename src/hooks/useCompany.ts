"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/database';
import { useToast } from '@/hooks/useToast';

export function useCompany() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [company, setCompany] = useState<Company | null>(null);
    const [stats, setStats] = useState({
        clustersCount: 0,
        sitesCount: 0,
        clientsCount: 0,
        activeUsersCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchCompanyData = useCallback(async () => {
        if (!profile?.company_id) return;

        try {
            setLoading(true);
            const [details, orgStats] = await Promise.all([
                companyService.getCompanyDetails(profile.company_id),
                companyService.getOrgStats(profile.company_id)
            ]);

            setCompany(details);
            setStats(orgStats);
        } catch (error: any) {
            console.error('Error fetching company data:', error);
            showToast('Failed to load company details', 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const handleUpdateCompany = async (newName: string) => {
        if (!company) return;

        try {
            setSubmitting(true);
            const updated = await companyService.updateCompany(company.id, { name: newName });
            setCompany(updated);
            setIsEditing(false);
            showToast('Company name updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating company:', error);
            showToast(error.message || 'Failed to update company', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        company,
        stats,
        loading,
        submitting,
        isEditing,
        setIsEditing,
        handleUpdateCompany,
        refresh: fetchCompanyData
    };
}
