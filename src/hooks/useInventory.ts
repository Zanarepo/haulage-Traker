import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useInventory() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [supplies, setSupplies] = useState<any[]>([]);
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters and UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
    const [selectedHistoryClient, setSelectedHistoryClient] = useState<any>(null);
    const [clientLogs, setClientLogs] = useState<any[]>([]);
    const [editingSupply, setEditingSupply] = useState<any>(null);
    const [deletingSupply, setDeletingSupply] = useState<any>(null);
    const [clearingAll, setClearingAll] = useState(false);

    const isManager = ['superadmin', 'admin', 'md', 'accountant'].includes(profile?.role || '');

    const loadData = useCallback(async () => {
        if (!profile?.company_id) return;

        try {
            setLoading(true);
            let [suppliesData, clientsData, logsData] = await Promise.all([
                inventoryService.getClientDepotSupplies(profile.company_id),
                inventoryService.getClients(profile.company_id),
                inventoryService.getAllInventoryLogs(profile.company_id)
            ]);

            // Filter for regional admins
            if (profile?.role === 'admin' && profile?.cluster_ids) {
                // 1. Filter clients by site presence in clusters
                clientsData = (clientsData as any[]).filter(client =>
                    client.sites?.some((site: any) => profile.cluster_ids?.includes(site.cluster_id))
                );

                const visibleClientIds = new Set(clientsData.map(c => c.id));

                // 2. Filter supplies and logs by these clients
                suppliesData = suppliesData.filter(s => visibleClientIds.has(s.client_id));
                logsData = logsData.filter(l => visibleClientIds.has(l.client_id));
            }

            setSupplies(suppliesData || []);
            setClients(clientsData || []);
            setAllLogs(logsData || []);
        } catch (error: any) {
            console.error('Failed to load inventory data:', error);
            showToast('Failed to load data: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveSupply = async (data: any) => {
        try {
            setSubmitting(true);
            if (editingSupply?.id) {
                await inventoryService.updateClientSupply(editingSupply.id, data);
            } else {
                await inventoryService.recordClientSupply({
                    company_id: profile!.company_id,
                    ...data
                });
            }
            showToast('Stock updated successfully', 'success');
            await loadData();
            setIsSupplyModalOpen(false);
        } catch (error) {
            console.error('Save failed:', error);
            showToast('Failed to save record', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingSupply) return;
        try {
            setSubmitting(true);
            await inventoryService.deleteClientSupply(deletingSupply.id);
            showToast('Record deleted', 'info');
            await loadData();
            setDeletingSupply(null);
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete record', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearAll = async () => {
        try {
            setSubmitting(true);
            await inventoryService.clearAllSupplies(profile!.company_id);
            showToast('All history cleared', 'success');
            await loadData();
            setClearingAll(false);
        } catch (error) {
            console.error('Clear all failed:', error);
            showToast('Failed to clear records', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearClientHistory = async (clientId: string) => {
        if (!clientId) {
            console.error('Missing clientId for history clearing');
            return;
        }
        try {
            setSubmitting(true);
            await inventoryService.clearClientSupplies(clientId);
            showToast('Client history cleared', 'success');
            await loadData();
            setSelectedHistoryClient(null);
        } catch (error) {
            console.error('Clear client history failed:', error);
            showToast('Failed to clear client records', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const aggregatedData = useMemo(() => {
        const groups: Record<string, any> = {};

        supplies.forEach(s => {
            if (!groups[s.client_id]) {
                groups[s.client_id] = {
                    client_id: s.client_id,
                    client_name: s.clients?.name || 'Unknown Client',
                    total_quantity: 0,
                    remaining_quantity: 0,
                    history: []
                };
            }
            groups[s.client_id].total_quantity += Number(s.total_quantity || 0);
            groups[s.client_id].remaining_quantity += Number(s.remaining_quantity || 0);
        });

        return Object.values(groups).map((g: any) => {
            // Use allLogs to populate history for this client
            g.history = allLogs.filter(l => l.client_id === g.client_id);
            return g;
        }).filter((g: any) => {
            const matchesSearch = g.client_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = !clientFilter || g.client_id === clientFilter;
            return matchesSearch && matchesFilter;
        });
    }, [supplies, allLogs, searchTerm, clientFilter]);

    const totalVolume = useMemo(() =>
        aggregatedData.reduce((acc, curr) => acc + Number(curr.total_quantity || 0), 0),
        [aggregatedData]);

    const remainingStock = useMemo(() =>
        aggregatedData.reduce((acc, curr) => acc + Number(curr.remaining_quantity || 0), 0),
        [aggregatedData]);

    return {
        profile,
        isManager,
        supplies,
        clients,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        clientFilter,
        setClientFilter,
        isSupplyModalOpen,
        setIsSupplyModalOpen,
        selectedHistoryClient,
        setSelectedHistoryClient,
        editingSupply,
        setEditingSupply,
        deletingSupply,
        setDeletingSupply,
        clearingAll,
        setClearingAll,
        loadData,
        handleSaveSupply,
        handleDelete,
        handleClearAll,
        handleClearClientHistory,
        aggregatedData,
        totalVolume,
        remainingStock,
        handleViewHistory: async (client: any) => {
            try {
                setLoading(true);
                const logs = await inventoryService.getInventoryLogs(client.client_id);
                setClientLogs(logs || []);
                setSelectedHistoryClient({ ...client, history: logs });
            } catch (error: any) {
                console.error('Failed to load history:', error);
                showToast('Failed to load history', 'error');
            } finally {
                setLoading(false);
            }
        }
    };
}
