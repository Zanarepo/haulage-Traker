import { useState, useRef, useEffect } from 'react';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export interface StagedUnit {
    barcode: string;
    sku?: string;
}

export interface StagedItem {
    id: string; // Internal local ID
    productName: string;
    partNo: string;
    category: string;
    unit: string;
    price: number;
    manufacturer?: string;
    barcodes: StagedUnit[];
    quantity: number;
    mode: 'unique' | 'bulk';
    sku?: string; // Metadata for bulk items
}

interface UseReceivingProps {
    companyId: string;
    userId: string;
    onSuccess?: () => void;
    prefillProduct?: any;
}

export function useReceiving({ companyId, userId, onSuccess, prefillProduct }: UseReceivingProps) {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
    const [scanBuffer, setScanBuffer] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [duplicateAlert, setDuplicateAlert] = useState<{ msg: string; type: 'inline' | 'db' } | null>(null);
    const [lastAddedBarcode, setLastAddedBarcode] = useState<string | null>(null);
    const [inclusionMode, setInclusionMode] = useState<'unique' | 'bulk'>('unique');
    const [bulkQuantity, setBulkQuantity] = useState<number>(1);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [currentProduct, setCurrentProduct] = useState({
        productName: '',
        partNo: '',
        category: 'Parts',
        unit: 'pcs',
        price: 0,
        manufacturer: '',
        sku: '' // General SKU for bulk
    });

    // Handle pre-fill
    useEffect(() => {
        if (prefillProduct && companyId) {
            setCurrentProduct({
                productName: prefillProduct.product_name || '',
                partNo: prefillProduct.part_no || '',
                category: prefillProduct.item_category || 'Parts',
                unit: prefillProduct.unit || 'pcs',
                price: prefillProduct.last_purchase_price || 0,
                manufacturer: prefillProduct.manufacturer || '',
                sku: ''
            });

            // NEW: Auto-detect if product is unique/serialized
            maintainService.checkIsProductSerialized(companyId, prefillProduct.product_name, prefillProduct.part_no)
                .then(isSerialized => {
                    setInclusionMode(isSerialized ? 'unique' : 'bulk');
                })
                .catch(err => {
                    console.error('[useReceiving] Serialization check failed:', err);
                    setInclusionMode('bulk'); // Default to bulk on error
                });
        }
    }, [prefillProduct, companyId]);

    const scannerRef = useRef<HTMLInputElement>(null);

    // Auto-focus scanner on mount if in unique mode
    useEffect(() => {
        if (inclusionMode === 'unique' && !editingItemId) {
            scannerRef.current?.focus();
        }
    }, [inclusionMode, editingItemId]);

    const validateBarcode = async (barcode: string): Promise<boolean> => {
        // 1. Inline Check
        const allStagedBarcodes = stagedItems.flatMap(item => item.barcodes.map(b => b.barcode));
        if (allStagedBarcodes.includes(barcode)) {
            setDuplicateAlert({ msg: `Barcode "${barcode}" is already in this batch!`, type: 'inline' });
            setTimeout(() => setDuplicateAlert(null), 4000);
            return false;
        }

        // 2. Database Check
        const exists = await maintainService.checkBarcodeExists(barcode);
        if (exists) {
            const masterName = Array.isArray(exists.master)
                ? (exists.master[0]?.product_name || 'Inventory')
                : (exists.master as any)?.product_name || 'Inventory';

            setDuplicateAlert({
                msg: `Barcode "${barcode}" already exists in ${masterName}!`,
                type: 'db'
            });
            setTimeout(() => setDuplicateAlert(null), 5000);
            return false;
        }

        return true;
    };

    const handleBarcodeScan = async (e: React.KeyboardEvent | string) => {
        if (typeof e !== 'string' && e.key !== 'Enter') return;

        const barcode = typeof e === 'string' ? e.trim() : scanBuffer.trim();
        if (!barcode) return;

        if (!currentProduct.productName) {
            showToast('Please enter a Product Name before scanning.', 'warning');
            setScanBuffer('');
            return;
        }

        setLoading(true);
        const isValid = await validateBarcode(barcode);
        setLoading(false);

        if (!isValid) {
            setScanBuffer('');
            return;
        }

        const existingIdx = stagedItems.findIndex(item =>
            item.productName.toLowerCase() === currentProduct.productName.toLowerCase() &&
            item.partNo === currentProduct.partNo &&
            item.mode === 'unique'
        );

        if (existingIdx > -1) {
            const updated = [...stagedItems];
            updated[existingIdx].barcodes.push({ barcode, sku: '' });
            updated[existingIdx].quantity = updated[existingIdx].barcodes.length;
            setStagedItems(updated);
        } else {
            const newItem: StagedItem = {
                id: Math.random().toString(36).substr(2, 9),
                productName: currentProduct.productName,
                partNo: currentProduct.partNo,
                category: currentProduct.category,
                unit: currentProduct.unit,
                price: currentProduct.price,
                manufacturer: currentProduct.manufacturer,
                barcodes: [{ barcode, sku: '' }],
                quantity: 1,
                mode: 'unique'
            };
            setStagedItems([newItem, ...stagedItems]);
        }

        setLastAddedBarcode(barcode);
        setTimeout(() => setLastAddedBarcode(null), 2500);
        showToast(`Added serial: ${barcode}`, 'success');
        setScanBuffer('');
    };

    const updateBarcodeSku = (itemId: string, barcode: string, sku: string) => {
        setStagedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const barcodes = item.barcodes.map(bc =>
                    bc.barcode === barcode ? { ...bc, sku } : bc
                );
                return { ...item, barcodes };
            }
            return item;
        }));
    };

    const deleteBarcode = (itemId: string, barcode: string) => {
        setStagedItems(prev => {
            const updated = prev.map(item => {
                if (item.id === itemId) {
                    const filtered = item.barcodes.filter(bc => bc.barcode !== barcode);
                    return { ...item, barcodes: filtered, quantity: filtered.length };
                }
                return item;
            });
            return updated.filter(item => item.mode === 'bulk' || item.quantity > 0);
        });
        showToast(`Removed serial: ${barcode}`, 'info');
    };

    const addBulkItem = () => {
        if (!currentProduct.productName || bulkQuantity <= 0) {
            showToast('Please enter a Product Name and valid quantity.', 'warning');
            return;
        }

        const existingIdx = stagedItems.findIndex(item =>
            item.productName.toLowerCase() === currentProduct.productName.toLowerCase() &&
            item.partNo === currentProduct.partNo &&
            item.sku === currentProduct.sku &&
            item.mode === 'bulk'
        );

        if (existingIdx > -1) {
            const updated = [...stagedItems];
            updated[existingIdx].quantity += bulkQuantity;
            setStagedItems(updated);
        } else {
            const newItem: StagedItem = {
                id: Math.random().toString(36).substr(2, 9),
                productName: currentProduct.productName,
                partNo: currentProduct.partNo,
                category: currentProduct.category,
                unit: currentProduct.unit,
                price: currentProduct.price,
                manufacturer: currentProduct.manufacturer,
                barcodes: [],
                quantity: bulkQuantity,
                mode: 'bulk',
                sku: currentProduct.sku
            };
            setStagedItems([newItem, ...stagedItems]);
        }
        setBulkQuantity(1);
    };

    const startEditing = (item: StagedItem) => {
        setEditingItemId(item.id);
        setCurrentProduct({
            productName: item.productName,
            partNo: item.partNo || '',
            category: item.category,
            unit: item.unit,
            price: item.price,
            manufacturer: item.manufacturer || '',
            sku: item.sku || ''
        });
        setInclusionMode(item.mode);
        if (item.mode === 'bulk') setBulkQuantity(item.quantity);
    };

    const updateStagedItem = () => {
        if (!editingItemId) return;

        const updated = stagedItems.map(item => {
            if (item.id === editingItemId) {
                return {
                    ...item,
                    productName: currentProduct.productName,
                    partNo: currentProduct.partNo,
                    category: currentProduct.category,
                    unit: currentProduct.unit,
                    price: currentProduct.price,
                    manufacturer: currentProduct.manufacturer,
                    sku: currentProduct.sku,
                    quantity: item.mode === 'bulk' ? bulkQuantity : item.quantity
                };
            }
            return item;
        });

        setStagedItems(updated);
        setEditingItemId(null);
        setCurrentProduct({ productName: '', partNo: '', category: 'Parts', unit: 'pcs', price: 0, manufacturer: '', sku: '' });
    };

    const deleteStagedItem = (id: string) => {
        setStagedItems(stagedItems.filter(item => item.id !== id));
    };

    const cancelEditing = () => {
        setEditingItemId(null);
        setCurrentProduct({ productName: '', partNo: '', category: 'Parts', unit: 'pcs', price: 0, manufacturer: '', sku: '' });
    };

    const handleCommit = async () => {
        if (stagedItems.length === 0) return;

        try {
            setLoading(true);

            // Determine cluster ID for tagging
            const isSuperadmin = (profile as any)?.role === 'superadmin';
            const assignedClusterIds = (profile as any)?.cluster_ids || [];
            const clusterId = (!isSuperadmin && assignedClusterIds.length > 0) ? assignedClusterIds[0] : undefined;

            await maintainService.receiveStock(companyId, userId, {
                supplierName,
                referenceNo,
                items: stagedItems.map(item => ({
                    productName: item.productName,
                    partNo: item.partNo,
                    category: item.category,
                    unit: item.unit,
                    price: item.price,
                    manufacturer: item.manufacturer,
                    unitObjects: item.barcodes.map(b => ({ barcode: b.barcode, sku: b.sku })),
                    quantity: item.quantity,
                    sku: item.sku
                }))
            }, clusterId);

            showToast(`Successfully received delivery batch.`, 'success');
            setStagedItems([]);
            setSupplierName('');
            setReferenceNo('');
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('[useReceiving] Commit failed:', err);
            showToast(err.message || 'Failed to commit receiving batch. Check console for details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        stagedItems,
        setStagedItems,
        scanBuffer,
        setScanBuffer,
        supplierName,
        setSupplierName,
        referenceNo,
        setReferenceNo,
        loading,
        duplicateAlert,
        lastAddedBarcode,
        inclusionMode,
        setInclusionMode,
        bulkQuantity,
        setBulkQuantity,
        currentProduct,
        setCurrentProduct,
        scannerRef,
        handleBarcodeScan,
        addBulkItem,
        startEditing,
        updateStagedItem,
        updateBarcodeSku,
        cancelEditing,
        editingItemId,
        deleteStagedItem,
        deleteBarcode,
        handleCommit
    };
}
