import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';
import { supabase } from '@/lib/supabase';

export type TabType = 'stock' | 'inventory' | 'history' | 'receiving_history' | 'requests' | 'reports';

export function useSupplies() {
    const { profile } = useAuth();
    const [allocations, setAllocations] = useState<any[]>([]);
    const [restockHistory, setRestockHistory] = useState<any[]>([]);
    const [receivingHistory, setReceivingHistory] = useState<any[]>([]);
    const [stockRequests, setStockRequests] = useState<any[]>([]);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('stock');
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [restockProduct, setRestockProduct] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);
    const [allEngineers, setAllEngineers] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [fulfillmentData, setFulfillmentData] = useState<any | null>(null);

    const [selectedBatch, setSelectedBatch] = useState<{ id: string; name: string; type: 'issuance' | 'inflow' } | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    const isEngineer = profile?.role === 'site_engineer';
    const isAdmin = ['superadmin', 'admin', 'accountant', 'warehouse_manager', 'storekeeper'].includes(profile?.role || '');
    const canManageReceive = ['superadmin', 'admin', 'warehouse_manager', 'storekeeper'].includes(profile?.role || '');

    useEffect(() => {
        if (isAdmin && activeTab === 'stock' && !isEngineer) {
            setActiveTab('inventory');
        }
    }, [profile?.role, isAdmin, isEngineer]);

    const [stats, setStats] = useState({
        inflowCount: 0,
        unitsReceived: 0,
        unitsOutbound: 0,
        currentBalance: 0
    });

    useEffect(() => {
        if (!profile?.company_id) return;
        loadData();
    }, [profile?.company_id, refreshKey, selectedEngineerId, startDate, endDate]);

    const loadData = async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const commonFilters = {
                engineerId: isEngineer ? profile.id : (selectedEngineerId || undefined),
                startDate,
                endDate
            };

            const loadEngineers = async () => {
                const { data } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('company_id', profile.company_id)
                    .eq('role', 'site_engineer')
                    .eq('is_active', true);
                setAllEngineers(data || []);
            };

            const loadRestockHistory = async () => {
                const data = await maintainService.getRestockHistory(profile.company_id, commonFilters);
                setRestockHistory(data);
            };

            const loadReceivingHistory = async () => {
                const data = await maintainService.getReceivingHistory(profile.company_id, {
                    startDate,
                    endDate
                });
                setReceivingHistory(data);
            };

            const loadAllocations = async () => {
                const data = await maintainService.getSupplyAllocations(
                    profile.company_id,
                    commonFilters
                );
                setAllocations(data || []);
            };

            const loadStockRequests = async () => {
                const data = await maintainService.getStockRequests(profile.company_id, {
                    engineerId: commonFilters.engineerId
                });
                setStockRequests(data);
                if (isAdmin) {
                    const pending = data.filter((r: any) => r.status === 'pending').length;
                    setPendingRequestsCount(pending);
                }
            };

            const loadStats = async () => {
                const data = await maintainService.getUnifiedSuppliesStats(profile.company_id, commonFilters);
                setStats(data);
            };

            const promises = [loadRestockHistory(), loadAllocations(), loadStockRequests(), loadStats()];
            if (isAdmin) promises.push(loadReceivingHistory());
            if (!isEngineer) promises.push(loadEngineers());

            await Promise.all(promises);
        } catch (err) {
            console.error('[loadData]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async (batch: any) => {
        if (!confirm(`Are you sure you want to delete the entire batch "${batch.batch_name || 'Individual Restock'}"? This will restore balances for all items in it.`)) return;
        try {
            if (batch.batch_id) {
                await maintainService.deleteBatch(batch.batch_id);
            } else {
                await maintainService.deleteLedgerEntry(batch.id);
            }
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error('[DeleteBatch]', err);
        }
    };

    return {
        profile,
        allocations,
        restockHistory,
        receivingHistory,
        loading,
        activeTab,
        setActiveTab,
        isIssueModalOpen,
        setIsIssueModalOpen,
        isReceiveModalOpen,
        setIsReceiveModalOpen,
        restockProduct,
        setRestockProduct,
        refreshKey,
        setRefreshKey,
        selectedEngineerId,
        setSelectedEngineerId,
        allEngineers,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedBatch,
        setSelectedBatch,
        isProductModalOpen,
        setIsProductModalOpen,
        selectedProduct,
        setSelectedProduct,
        isEngineer,
        isAdmin,
        canManageReceive,
        handleDeleteBatch,
        stockRequests,
        pendingRequestsCount,
        fulfillmentData,
        setFulfillmentData,
        isRequestModalOpen,
        setIsRequestModalOpen,
        stats
    };
}
