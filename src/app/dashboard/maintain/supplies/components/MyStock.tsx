"use client";

import React from 'react';
import { Package, ArrowDownRight, ArrowUpRight, History as HistoryIcon, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import DataTable from '@/components/DataTable/DataTable';
import { useMyStock } from '../hooks/useMyStock';

interface MyStockProps {
    engineerId: string;
    companyId: string;
    adminView?: boolean;
    onRowClick?: (row: any) => void;
    onSuccess?: () => void;
}

export default function MyStock({ engineerId, companyId, adminView, onRowClick, onSuccess }: MyStockProps) {
    const {
        batches,
        ledger,
        loading,
        handleDeleteBatch
    } = useMyStock({ engineerId, companyId, onSuccess });

    if (!engineerId && adminView) {
        return (
            <div className="maintain-empty">
                <Package size={48} style={{ opacity: 0.2 }} />
                <p>Select an engineer from the list above to view their stock wallet.</p>
            </div>
        );
    }

    return (
        <div className="my-stock-container">
            <section className="batch-wallet-section">
                <div className="section-header">
                    <LayoutGrid size={18} />
                    <h2>Cluster Batch Wallet</h2>
                </div>

                {loading ? (
                    <div className="maintain-empty">Loading batches...</div>
                ) : (
                    <div className="batch-wallet-list">
                        <DataTable
                            columns={[
                                {
                                    key: 'batch_name',
                                    label: 'Batch / Reference',
                                    mobileLabel: 'Batch ID',
                                    fullWidth: true,
                                    render: (batch: any) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span className="item-pill" style={{ cursor: 'pointer' }}>
                                                {batch.batch_name || 'Individual Restock'}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {new Date(batch.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'items',
                                    label: 'Items & Quantities',
                                    mobileLabel: 'Inventory Summary',
                                    render: (batch: any) => {
                                        const items = batch.items || [];
                                        if (items.length === 1) {
                                            return (
                                                <div className="batch-items-summary">
                                                    <span className="item-summary-tag">
                                                        <span className="tag-name">{items[0].name}</span>
                                                        <span style={{
                                                            fontSize: '0.6rem',
                                                            opacity: 0.6,
                                                            fontWeight: 800,
                                                            padding: '0px 3px',
                                                            background: items[0].mode === 'unique' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                                            color: items[0].mode === 'unique' ? '#2563eb' : 'inherit',
                                                            borderRadius: '2px',
                                                            border: '1px solid currentColor',
                                                            marginLeft: '4px',
                                                            marginRight: '2px',
                                                            verticalAlign: 'middle',
                                                            display: 'inline-block',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            {items[0].mode === 'unique' ? 'U' : 'B'}
                                                        </span>
                                                        <span className="tag-qty">{items[0].quantity} {items[0].unit}</span>
                                                    </span>
                                                </div>
                                            );
                                        } else if (items.length > 1) {
                                            const totalQty = items.reduce((sum: number, i: any) => sum + Math.abs(i.quantity), 0);
                                            return (
                                                <div className="batch-items-summary">
                                                    <span className="item-summary-tag" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
                                                        <span className="tag-qty" style={{ marginLeft: 0 }}>{totalQty} pcs</span>
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No items</span>;
                                    }
                                },
                                {
                                    key: 'actions',
                                    label: 'Actions',
                                    mobileLabel: 'Review',
                                    align: 'right',
                                    render: (batch: any) => (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRowClick && onRowClick(batch.batch_id || batch.id);
                                                }}
                                                title="View Details"
                                            >
                                                <ArrowUpRight size={14} />
                                            </button>
                                            {adminView && (
                                                <button
                                                    className="btn-icon-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBatch(batch.batch_id || batch.id, batch.batch_name);
                                                    }}
                                                    title="Delete Entire Batch"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                            data={batches}
                            keyExtractor={(item: any) => item.batch_id || item.id}
                            loading={loading}
                            onRowClick={(batch: any) => onRowClick && onRowClick(batch)}
                            emptyMessage={adminView ? "This engineer has no active batches in their wallet." : "No active batches in your wallet yet."}
                            emptyIcon={<Package size={32} />}
                        />
                    </div>
                )}
            </section>

            <section className="ledger-section">
                <div className="section-header">
                    <HistoryIcon size={18} />
                    <h2>Recent Movement</h2>
                </div>
                <div className="activity-list">
                    {ledger.length === 0 ? (
                        <div className="empty-state">No movements recorded yet.</div>
                    ) : (
                        ledger.map((entry: any) => (
                            <div key={entry.id} className="activity-item">
                                <div className="item-left">
                                    <div className={`avatar ${entry.quantity > 0 ? 'up' : 'down'}`}
                                        style={{ background: entry.quantity > 0 ? '#10b98115' : '#ef444415', color: entry.quantity > 0 ? '#10b981' : '#ef4444' }}>
                                        {entry.quantity > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div className="item-info">
                                        <p><strong>{entry.item_name}</strong> {entry.transaction_type}</p>
                                        <span className="time">
                                            {new Date(entry.created_at).toLocaleString()} · {Math.abs(entry.quantity)} {entry.unit}
                                        </span>
                                    </div>
                                </div>
                                <div className="status-tag" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {entry.transaction_type}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
