import { useState, useEffect, useMemo, useRef } from 'react';
import { maintainService } from '@/services/maintainService';
import { clusterService } from '@/services/clusterService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';

export interface StagedItem {
    id: string; // Local ID
    master_id: string; // From central inventory
    item_name: string;
    item_category: string;
    quantity: number;
    unit: string;
    notes: string;
    barcodes: string[]; // For serialized items
}

interface UseIssueStockProps {
    companyId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function useIssueStock({ companyId, isOpen, onClose, onSuccess }: UseIssueStockProps) {
    const { showToast } = useToast();
    const [clusters, setClusters] = useState<any[]>([]);
    const [engineers, setEngineers] = useState<any[]>([]);
    const [availableItems, setAvailableItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Batch State
    const [batchName, setBatchName] = useState('');

    // Cascading Filter State
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedClusterId, setSelectedClusterId] = useState('');
    const [selectedEngineerId, setSelectedEngineerId] = useState('');

    // Item Staging State
    const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
    const [selectedMasterItem, setSelectedMasterItem] = useState<any | null>(null);
    const [newItem, setNewItem] = useState({
        item_name: '',
        item_category: 'Parts',
        quantity: 1,
        unit: 'pcs',
        notes: ''
    });

    // Search/Creatable State
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle Click Outside & Focus Loss
    useEffect(() => {
        if (!showOptions) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowOptions(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showOptions]);

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        try {
            const [clusterData, itemsData] = await Promise.all([
                clusterService.getClusters(companyId),
                maintainService.getCentralInventory(companyId)
            ]);

            setClusters(clusterData || []);
            setAvailableItems(itemsData || []);

            const { data: engData, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    full_name, 
                    user_cluster_assignments(cluster_id)
                `)
                .eq('company_id', companyId)
                .eq('role', 'site_engineer')
                .eq('is_active', true);

            if (error) throw error;

            // Flatten cluster assignments for each engineer
            const flattenedEngineers = engData.map((eng: any) => ({
                id: eng.id,
                full_name: eng.full_name,
                cluster_ids: eng.user_cluster_assignments?.map((a: any) => a.cluster_id) || []
            }));

            setEngineers(flattenedEngineers);
        } catch (err) {
            console.error('[LoadData]', err);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return availableItems;
        return availableItems.filter(item =>
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [availableItems, searchTerm]);

    const exactMatch = useMemo(() => {
        return availableItems.find(item => item.product_name.toLowerCase() === searchTerm.toLowerCase());
    }, [availableItems, searchTerm]);

    // Derived Regions
    const regions = useMemo(() => {
        const uniqueRegions = new Set(clusters.map(c => c.state).filter(Boolean));
        return Array.from(uniqueRegions).sort();
    }, [clusters]);

    // Derived Clusters for Region
    const filteredClusters = useMemo(() => {
        if (!selectedRegion) return [];
        return clusters.filter(c => c.state === selectedRegion);
    }, [clusters, selectedRegion]);

    // Derived Engineers for Cluster
    const filteredEngineers = useMemo(() => {
        if (!selectedClusterId || !Array.isArray(engineers)) return [];
        return engineers.filter((eng: any) =>
            Array.isArray(eng.cluster_ids) && eng.cluster_ids.includes(selectedClusterId)
        );
    }, [engineers, selectedClusterId]);

    const handleAddItem = () => {
        if (!searchTerm || newItem.quantity <= 0) return;

        // If exact match found, use it. Otherwise use the search term as name
        const finalName = exactMatch ? exactMatch.name : searchTerm;

        // Check for duplicates in staged list
        if (stagedItems.find(i => i.item_name.toLowerCase() === finalName.toLowerCase())) {
            showToast(`"${finalName}" is already in the staged list.`, 'warning');
            return;
        }

        const item: StagedItem = {
            ...newItem,
            master_id: exactMatch?.id || '',
            item_name: finalName,
            id: crypto.randomUUID(),
            barcodes: [] // Feature check: scanning specifically in staging list later if needed
        };
        setStagedItems([...stagedItems, item]);

        // Reset entry fields
        setSearchTerm('');
        setNewItem({
            item_name: '',
            item_category: 'Parts',
            quantity: 1,
            unit: 'pcs',
            notes: ''
        });
        setShowOptions(false);
    };

    const handleRemoveItem = (id: string) => {
        setStagedItems(stagedItems.filter(item => item.id !== id));
    };

    const selectOption = (item: any) => {
        setSearchTerm(item.product_name);
        setSelectedMasterItem(item);
        setNewItem({
            ...newItem,
            item_name: item.product_name,
            item_category: item.item_category || 'Parts',
            unit: item.unit || 'pcs'
        });
        setShowOptions(false);
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Only close if the new focus target is NOT inside our dropdown container
        if (!dropdownRef.current?.contains(e.relatedTarget)) {
            // Small delay to let clicks land first if they were hitting a dropdown item
            setTimeout(() => setShowOptions(false), 150);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEngineerId || stagedItems.length === 0) {
            showToast('Please select an engineer and add at least one item.', 'warning');
            return;
        }

        if (!batchName.trim()) {
            showToast('Please provide a Batch Name/Reference (e.g., Jan Supplies)', 'warning');
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // 2. Execute unified issuance
            await maintainService.issueStock(companyId, user?.id || '', {
                engineerId: selectedEngineerId,
                batchName: batchName,
                items: stagedItems.map(item => ({
                    masterId: item.master_id,
                    quantity: item.quantity,
                    itemName: item.item_name,
                    category: item.item_category,
                    unit: item.unit,
                    notes: item.notes,
                    barcodes: item.barcodes
                }))
            });

            showToast(`Successfully issued batch "${batchName}" with ${stagedItems.length} items.`, 'success');
            onSuccess();
            onClose();

            // Reset state
            setStagedItems([]);
            setBatchName('');
            setSelectedRegion('');
            setSelectedClusterId('');
            setSelectedEngineerId('');
        } catch (err) {
            console.error('[IssueStock]', err);
            showToast('Failed to issue stock. Please check your connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        clusters,
        engineers,
        availableItems,
        loading,
        batchName,
        setBatchName,
        selectedRegion,
        setSelectedRegion,
        selectedClusterId,
        setSelectedClusterId,
        selectedEngineerId,
        setSelectedEngineerId,
        stagedItems,
        setStagedItems,
        selectedMasterItem,
        newItem,
        setNewItem,
        searchTerm,
        setSearchTerm,
        showOptions,
        setShowOptions,
        dropdownRef,
        filteredItems,
        exactMatch,
        regions,
        filteredClusters,
        filteredEngineers,
        handleAddItem,
        handleRemoveItem,
        selectOption,
        handleBlur,
        handleSubmit
    };
}
