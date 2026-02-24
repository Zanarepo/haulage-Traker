import React, { useState, useEffect } from 'react';
import { Package, Hash, Tag, Layers, RefreshCcw, Search, Trash2, Edit2, Plus } from 'lucide-react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';
import EditProductModal from './EditProductModal';

interface CentralInventoryProps {
    companyId: string;
    refreshKey: number;
    canManage: boolean;
    onRestock?: (product: any) => void;
    onViewDetails?: (product: any) => void;
}

export default function CentralInventory({ companyId, refreshKey, canManage, onRestock, onViewDetails }: CentralInventoryProps) {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditProduct, setSelectedEditProduct] = useState<any | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (companyId) loadCentralInventory();
    }, [companyId, refreshKey]);

    const loadCentralInventory = async () => {
        try {
            setLoading(true);
            const data = await maintainService.getCentralInventory(companyId);
            setInventory(data);
        } catch (err) {
            console.error('[CentralInventory]', err);
            showToast('Failed to load central inventory.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (product: any) => {
        if (!confirm(`Are you sure you want to delete "${product.product_name}"? This will remove all associated stock units and historical links.`)) return;

        try {
            setLoading(true);
            await maintainService.deleteMasterProduct(product.id);
            showToast('Product deleted successfully.', 'success');
            loadCentralInventory();
        } catch (err: any) {
            console.error('[CentralInventory] Delete failed:', err);
            showToast(err.message || 'Failed to delete product.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'product_name',
            label: 'Product Details',
            mobileLabel: 'Product Name',
            fullWidth: true,
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.product_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.part_no || 'No Part #'} · {row.manufacturer || 'Generic'}</span>
                </div>
            )
        },
        {
            key: 'total_in_stock',
            label: 'Warehouse Stock',
            mobileLabel: 'In Stock',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`qty-tag ${row.total_in_stock <= row.low_stock_threshold ? 'low-stock' : ''}`} style={{ position: 'relative' }}>
                        <strong>{row.total_in_stock}</strong> {row.unit}
                        <span style={{
                            marginLeft: '6px',
                            fontSize: '0.6rem',
                            opacity: 0.6,
                            fontWeight: 800,
                            padding: '1px 4px',
                            background: row.is_unique ? 'rgba(37, 99, 235, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: row.is_unique ? '#2563eb' : 'inherit',
                            borderRadius: '3px',
                            border: '1px solid currentColor',
                            lineHeight: 1
                        }}>
                            {row.is_unique ? 'U' : 'B'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'last_purchase_price',
            label: 'Latest Cost',
            mobileLabel: 'Latest Cost',
            render: (row) => (
                <span style={{ fontWeight: 600 }}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(row.last_purchase_price || 0)}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Quick Actions',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                    {canManage && (
                        <>
                            <button className="row-action-btn edit" onClick={(e) => { e.stopPropagation(); onRestock?.(row); }} title="Add to Batch / Restock">
                                <Plus size={14} />
                            </button>
                            <button className="row-action-btn edit" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEditProduct(row);
                                setIsEditModalOpen(true);
                            }} title="Edit Product">
                                <Edit2 size={14} />
                            </button>
                            <button className="row-action-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(row); }}>
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const filteredInventory = inventory.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="central-inventory-view">
            <div className="inventory-controls">
                <div className="search-pill-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search master inventory (name, part number)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="inventory-search-input"
                    />
                </div>
                <button className="btn-refresh-pill" onClick={loadCentralInventory} title="Refresh Inventory">
                    <RefreshCcw size={18} />
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filteredInventory}
                loading={loading}
                keyExtractor={(item) => item.id}
                onRowClick={(row) => onViewDetails?.(row)}
                emptyMessage="No master inventory records found."
                emptyIcon={<Package size={48} />}
            />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedEditProduct(null);
                }}
                product={selectedEditProduct}
                onSuccess={loadCentralInventory}
            />
        </div>
    );
}
