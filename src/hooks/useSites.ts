import { useState, useEffect, useCallback } from 'react';
import { siteService, Site } from '@/services/siteService';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export function useSites() {
    const { profile } = useAuth();
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { showToast } = useToast();

    const loadSites = useCallback(async () => {
        try {
            setLoading(true);
            const data = await siteService.getSites();
            setSites(data);
        } catch (err: any) {
            showToast('Failed to load sites: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadSites(); }, [loadSites]);

    const handleCreateSite = async (siteData: Partial<Site>, clientName?: string) => {
        try {
            setSubmitting(true);
            let clientId = siteData.client_id;

            // Handle specific requirement: if clientName is provided and no clientId, create client first
            if (clientName && !clientId) {
                if (!profile?.company_id) {
                    showToast('Authentication error: Company ID not found', 'error');
                    return false;
                }
                const newClient = await clientService.createClient({
                    name: clientName,
                    haulage_rate_per_liter: 45,
                    company_id: profile.company_id
                }); // Default rate
                clientId = newClient.id;
            }

            const newSite = await siteService.createSite({ ...siteData, client_id: clientId });
            await loadSites(); // Refresh list to get joined data
            showToast('Site created successfully', 'success');
            return true;
        } catch (err: any) {
            showToast('Failed to create site: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateSite = async (id: string, updates: Partial<Site>) => {
        try {
            setSubmitting(true);
            await siteService.updateSite(id, updates);
            await loadSites();
            showToast('Site updated successfully', 'success');
            return true;
        } catch (err: any) {
            showToast('Failed to update site: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSite = async (id: string) => {
        setSubmitting(true);
        try {
            await siteService.deleteSite(id);
            showToast('Site deleted successfully', 'success');
            await loadSites();
            return true;
        } catch (err: any) {
            showToast('Failed to delete site: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        sites,
        loading,
        submitting,
        refresh: loadSites,
        handleCreateSite,
        handleUpdateSite,
        handleDeleteSite
    };
}
