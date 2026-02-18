import React, { useState, useEffect } from 'react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import { Package, FileText, Trash2, Edit3, ArrowUpRight, ArrowDownRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import EditEntryModal from './EditEntryModal';

interface BatchDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId?: string | null;
    batchName?: string;
    itemName?: string;
    engineerId?: string;
    mode: 'batch' | 'item';
    batchType?: 'issuance' | 'inflow'; // NEW
    onItemInspect?: (item: any) => void; // NEW
    onSuccess?: () => void;
}

export default function BatchDetailsModal({
    isOpen,
    onClose,
    batchId,
    batchName,
    itemName,
    engineerId,
    mode,
    batchType = 'issuance', // Default to issuance for backward compatibility
    onItemInspect,
    onSuccess
}: BatchDetailsModalProps) {
    const { showToast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, batchId, itemName, engineerId]);

    const loadData = async () => {
        try {
            setLoading(true);
            let data = [];
            if (mode === 'batch' && batchId) {
                if (batchType === 'inflow') {
                    data = await maintainService.getReceivingBatchDetails(batchId);
                } else {
                    data = await maintainService.getBatchDetails(batchId);
                }
            } else if (mode === 'item' && engineerId && itemName) {
                data = await maintainService.getItemHistory(engineerId, itemName);
            }
            setItems(data);
        } catch (err) {
            console.error('[BatchDetails]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async () => {
        if (!confirm(`Are you sure you want to delete this ENTIRE batch? This will restore balances for all items in it.`)) return;
        try {
            setLoading(true);
            await maintainService.deleteBatch(batchId!);
            showToast('Batch deleted successfully.', 'success');
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('Failed to delete batch.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this specific log? This will update the wallet balance.')) return;
        try {
            await maintainService.deleteLedgerEntry(id);
            showToast('Entry deleted successfully.', 'success');
            loadData();
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('Failed to delete entry.', 'error');
        }
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'created_at',
            label: 'Date',
            render: (item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`avatar ${item.quantity > 0 ? 'up' : 'down'}`}
                        style={{ background: item.quantity > 0 ? '#10b98115' : '#ef444415', color: item.quantity > 0 ? '#10b981' : '#ef4444', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.quantity > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: mode === 'batch' ? 'item_name' : 'batch_name',
            label: mode === 'batch' ? 'Item Name' : 'Reference / Batch',
            fullWidth: true,
            render: (item) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{mode === 'batch' ? item.item_name : (item.batch_name || 'Individual Usage')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.notes || 'No notes'}</span>
                </div>
            )
        },
        {
            key: 'quantity',
            label: 'Quantity',
            render: (item) => (
                <strong style={{ color: item.quantity > 0 ? '#10b981' : '#ef4444' }}>
                    {item.quantity > 0 ? '+' : ''}{item.quantity} {item.unit || 'pcs'}
                </strong>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (item) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                    <button
                        className="btn-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(item);
                        }}
                        title="Edit Entry"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        className="btn-icon-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                        }}
                        title="Delete Entry"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'batch' ? `${batchType === 'inflow' ? 'Inflow Batch' : 'Issuance Batch'}: ${batchName || 'Details'}` : `History: ${itemName}`}
            maxWidth="750px"
            footer={mode === 'batch' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                    <button
                        className="btn-clear-all"
                        onClick={handleDeleteBatch}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        <Trash2 size={16} /> Delete Entire Batch
                    </button>
                </div>
            ) : null}
        >
            <div className="history-modal-content">
                <DataTable
                    columns={columns}
                    data={paginatedItems}
                    keyExtractor={(item) => item.id}
                    loading={loading}
                    onRowClick={(row) => onItemInspect?.(row)}
                    emptyMessage="No ledger entries found."
                    emptyIcon={<FileText size={32} />}
                />

                {totalPages > 1 && (
                    <div className="pagination-controls" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Page <strong style={{ color: 'var(--text-main)' }}>{page}</strong> of <strong>{totalPages}</strong>
                        </span>
                        <div className="pagination-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="btn-pagination"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                className="btn-pagination"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                <EditEntryModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    entry={editingItem}
                    onSuccess={loadData}
                />
            </div>
        </Modal>
    );
}
