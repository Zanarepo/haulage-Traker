import React, { useState, useEffect } from 'react';
import { Package, Hash, Tag, Layers, RefreshCcw, Search, Trash2, Edit2, Plus } from 'lucide-react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

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
        // Logic for deleting master product can be added to maintainService
        showToast('Delete functionality is restricted to Superadmins.', 'warning');
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'product_name',
            label: 'Product Details',
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
            render: (row) => (
                <span style={{ fontWeight: 600 }}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(row.last_purchase_price || 0)}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                    {canManage && (
                        <>
                            <button className="row-action-btn edit" onClick={(e) => { e.stopPropagation(); onRestock?.(row); }} title="Add to Batch / Restock">
                                <Plus size={14} />
                            </button>
                            <button className="row-action-btn edit" onClick={(e) => { e.stopPropagation(); showToast('Edit metadata coming soon.', 'info'); }} title="Edit Product">
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
            <div className="inventory-controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="search-pill-wrapper" style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} className="search-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search master inventory (name, part number)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="filter-pill"
                        style={{ width: '100%', paddingLeft: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', height: '44px', borderRadius: '30px' }}
                    />
                </div>
                <button className="btn-refresh" onClick={loadCentralInventory} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
        </div>
    );
}
