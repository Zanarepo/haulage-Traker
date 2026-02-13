import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import RowActions from '@/components/RowActions/RowActions';
import Modal from '@/components/Modal/Modal';
import { Edit3, Trash2 } from 'lucide-react';

interface HistoryModalProps {
    client: any;
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
}

export default function HistoryModal({ client, isOpen, onClose, onClear }: HistoryModalProps) {
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    if (!client) return null;

    // Calculate running totals (Unified Balance History)
    const sortedAsc = [...client.history].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = 0;
    const historyWithTotals = sortedAsc.map((item: any) => {
        const prevBal = runningBalance;
        if (item.type === 'IN') {
            runningBalance += Number(item.quantity || 0);
        } else {
            runningBalance -= Number(item.quantity || 0);
        }
        return { ...item, prevBal, newTotal: runningBalance };
    });

    // Reverse for display (latest first)
    const displayHistory = historyWithTotals.reverse();

    const totalPages = Math.ceil(displayHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = displayHistory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const columns: DataTableColumn<any>[] = [
        {
            label: 'Date',
            key: 'created_at',
            render: (item) => <span style={{ fontSize: '0.85rem' }}>{new Date(item.created_at).toLocaleDateString()}</span>
        },
        {
            label: 'Prev Balance',
            key: 'prevBal',
            render: (item) => <span style={{ color: 'var(--text-muted)' }}>{item.prevBal.toLocaleString()} L</span>
        },
        {
            label: 'Quantity',
            key: 'quantity',
            render: (item) => (
                <strong style={{ color: item.type === 'IN' ? '#10b981' : '#ef4444' }}>
                    {item.type === 'IN' ? '+' : '-'} {item.quantity.toLocaleString()} L
                </strong>
            )
        },
        {
            label: 'New Balance',
            key: 'newTotal',
            render: (item) => <strong style={{ color: '#3b82f6' }}>{item.newTotal.toLocaleString()} L</strong>
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Supply History: ${client.client_name}`}
            maxWidth="700px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                    <button
                        className="btn-clear-all"
                        onClick={onClear}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            fontWeight: 700
                        }}
                    >
                        <Trash2 size={16} />
                        Clear Client History
                    </button>
                </div>
            }
        >
            <div className="history-modal-content">
                <DataTable
                    columns={columns}
                    data={paginatedHistory}
                    keyExtractor={item => item.id}
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
            </div>
        </Modal>
    );
}
