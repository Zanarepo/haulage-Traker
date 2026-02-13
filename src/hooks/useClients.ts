import { useState, useEffect, useCallback } from 'react';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export function useClients() {
    const { profile } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { showToast } = useToast();

    const loadClients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await clientService.getClients();
            setClients(data);
        } catch (err: any) {
            showToast('Failed to load clients: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadClients(); }, [loadClients]);

    const handleCreateClient = async (name: string, rate: number) => {
        if (!profile?.company_id) {
            showToast('Authentication error: Company ID not found', 'error');
            return false;
        }

        try {
            setSubmitting(true);
            const newClient = await clientService.createClient({
                name,
                haulage_rate_per_liter: rate,
                company_id: profile.company_id
            });
            setClients(prev => [...prev, newClient]);
            showToast('Client created successfully', 'success');
            return true;
        } catch (err: any) {
            showToast('Failed to create client: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateClient = async (id: string, name: string, rate: number) => {
        try {
            setSubmitting(true);
            const updated = await clientService.updateClient(id, { name, haulage_rate_per_liter: rate });
            setClients(prev => prev.map(c => c.id === id ? updated : c));
            showToast('Client updated successfully', 'success');
            return true;
        } catch (err: any) {
            showToast('Failed to update client: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClient = async (id: string) => {
        setSubmitting(true);
        try {
            await clientService.deleteClient(id);
            showToast('Client deleted successfully', 'success');
            await loadClients();
            return true;
        } catch (err: any) {
            showToast('Failed to delete client: ' + err.message, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        clients,
        loading,
        submitting,
        refresh: loadClients,
        handleCreateClient,
        handleUpdateClient,
        handleDeleteClient
    };
}
