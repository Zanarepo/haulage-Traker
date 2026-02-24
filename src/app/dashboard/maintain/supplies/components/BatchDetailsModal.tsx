import React, { useState, useEffect } from 'react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import { Package, FileText, Trash2, Edit3, ArrowUpRight, ArrowDownRight, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
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
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const isSuperadmin = profile?.role === 'superadmin';
    const isAdmin = ['superadmin', 'admin', 'warehouse_manager', 'storekeeper'].includes(profile?.role || '');
    const isEngineer = profile?.role === 'site_engineer';
    const assignedClusterIds = (profile as any)?.cluster_ids || [];

    // Helper to check if a record belongs to the user's allowed clusters
    const isAllowedCluster = (itemClusters: string[]) => {
        if (isSuperadmin) return true;
        return itemClusters.some(cid => assignedClusterIds.includes(cid));
    };

    const [canManage, setCanManage] = useState(!isEngineer && isAdmin);

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

            // Update management permission based on clusters if admin
            if (!isEngineer) {
                if (isSuperadmin) {
                    setCanManage(true);
                } else if (batchType === 'inflow' && batchId) {
                    // For inflows, we check the batch's cluster_id
                    const { data: batch } = await supabase
                        .from('maintain_receiving_batches')
                        .select('cluster_id')
                        .eq('id', batchId)
                        .single();

                    if (batch?.cluster_id) {
                        setCanManage(assignedClusterIds.includes(batch.cluster_id));
                    } else {
                        // Global batches might have null cluster_id, restrict to superadmin
                        setCanManage(false);
                    }
                } else if (data.length > 0) {
                    // Check first item's engineer clusters (most items in a batch/history view share the same context)
                    const firstItem = data[0];
                    const itemClusters = firstItem.engineer?.user_cluster_assignments?.map((ca: any) => ca.cluster_id) || [];
                    setCanManage(isAllowedCluster(itemClusters));
                }
            }
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
            if (batchType === 'inflow') {
                await maintainService.deleteReceivingBatch(batchId!);
            } else {
                await maintainService.deleteBatch(batchId!);
            }
            showToast('Batch deleted successfully.', 'success');
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('[DeleteBatch]', err);
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
        }
    ];

    // Conditionally add Actions column for non-engineers
    if (canManage) {
        columns.push({
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
        });
    }

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'batch' ? `${batchType === 'inflow' ? 'Inflow Batch' : 'Issuance Batch'}: ${batchName || 'Details'}` : `History: ${itemName}`}
            maxWidth="750px"
            footer={mode === 'batch' && canManage ? (
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
