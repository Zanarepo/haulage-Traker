import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

interface useStockRequestProps {
    companyId: string;
    engineerId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function useStockRequest({ companyId, engineerId, isOpen, onClose, onSuccess }: useStockRequestProps) {
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [stagedItems, setStagedItems] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({
        item_name: '',
        quantity: 1,
        unit: 'pcs',
        master_id: null as string | null,
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [masterInventory, setMasterInventory] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadMasterInventory();
            setStagedItems([]);
            setNotes('');
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadMasterInventory = async () => {
        try {
            const data = await maintainService.getCentralInventory(companyId);
            setMasterInventory(data || []);
        } catch (err) {
            console.error('[loadMasterInventory]', err);
        }
    };

    const filteredItems = masterInventory.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_no?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const exactMatch = masterInventory.find(i => i.product_name.toLowerCase() === searchTerm.toLowerCase());

    const handleAddItem = () => {
        if (!searchTerm) {
            showToast('Please select or enter an item name.', 'warning');
            return;
        }

        const itemToAdd = {
            id: crypto.randomUUID(),
            item_name: exactMatch ? exactMatch.product_name : searchTerm,
            master_id: exactMatch ? exactMatch.id : null,
            quantity: newItem.quantity,
            unit: exactMatch ? exactMatch.unit : newItem.unit,
        };

        setStagedItems([...stagedItems, itemToAdd]);
        setNewItem({
            item_name: '',
            quantity: 1,
            unit: 'pcs',
            master_id: null,
        });
        setSearchTerm('');
        setShowOptions(false);
    };

    const handleRemoveItem = (id: string) => {
        setStagedItems(stagedItems.filter(item => item.id !== id));
    };

    const selectOption = (item: any) => {
        setSearchTerm(item.product_name);
        setNewItem({
            ...newItem,
            item_name: item.product_name,
            unit: item.unit,
            master_id: item.id
        });
        setShowOptions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (stagedItems.length === 0) {
            showToast('Please add at least one item to your request.', 'warning');
            return;
        }

        try {
            setLoading(true);
            await maintainService.createStockRequest(
                companyId,
                engineerId,
                stagedItems.map(i => ({
                    master_id: i.master_id,
                    item_name: i.item_name,
                    quantity: i.quantity,
                    unit: i.unit
                })),
                notes
            );
            showToast('Stock request submitted successfully.', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('[handleSubmit]', err);
            showToast('Failed to submit stock request.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        notes,
        setNotes,
        stagedItems,
        newItem,
        setNewItem,
        searchTerm,
        setSearchTerm,
        showOptions,
        setShowOptions,
        dropdownRef,
        filteredItems,
        exactMatch,
        handleAddItem,
        handleRemoveItem,
        selectOption,
        handleSubmit
    };
}
