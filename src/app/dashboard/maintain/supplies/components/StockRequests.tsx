"use client";

import React from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

interface StockRequestsProps {
    requests: any[];
    loading: boolean;
    isAdmin: boolean;
    userId: string;
    onFulfill: (request: any) => void;
    onRefresh: () => void;
}

export default function StockRequests({ requests, loading, isAdmin, userId, onFulfill, onRefresh }: StockRequestsProps) {
    const { showToast } = useToast();

    const handleAction = async (requestId: string, status: 'approved' | 'rejected' | 'fulfilled') => {
        try {
            await maintainService.processStockRequest(requestId, userId, status);
            showToast(`Request ${status} successfully.`, 'success');
            onRefresh();
        } catch (err) {
            console.error('[handleAction]', err);
            showToast('Action failed.', 'error');
        }
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'created_at',
            label: 'Date / Engineer',
            fullWidth: true,
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700 }}>{row.engineer?.full_name || 'Personnel'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(row.created_at).toLocaleString()}
                    </span>
                </div>
            )
        },
        {
            key: 'items',
            label: 'Items Requested',
            render: (row) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {row.items.map((item: any, idx: number) => (
                        <span key={idx} className="qty-tag" style={{ whiteSpace: 'nowrap' }}>
                            {item.quantity} {item.unit} · <strong>{item.item_name}</strong>
                        </span>
                    ))}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                const colors: Record<string, string> = {
                    pending: '#f59e0b',
                    approved: '#3b82f6',
                    fulfilled: '#10b981',
                    rejected: '#ef4444'
                };
                const icons: Record<string, any> = {
                    pending: <Clock size={12} />,
                    approved: <CheckCircle size={12} />,
                    fulfilled: <CheckCircle size={12} />,
                    rejected: <XCircle size={12} />
                };

                return (
                    <div className="status-badge" style={{
                        background: `${colors[row.status]}15`,
                        color: colors[row.status],
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        border: `1px solid ${colors[row.status]}30`
                    }}>
                        {icons[row.status]}
                        {row.status}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                    {isAdmin && row.status === 'pending' && (
                        <>
                            <button className="row-action-btn edit" onClick={() => handleAction(row.id, 'approved')} title="Approve">
                                <CheckCircle size={14} />
                            </button>
                            <button className="row-action-btn delete" onClick={() => handleAction(row.id, 'rejected')} title="Reject">
                                <XCircle size={14} />
                            </button>
                        </>
                    )}
                    {isAdmin && row.status === 'approved' && (
                        <button
                            className="btn-maintain-action"
                            onClick={() => onFulfill(row)}
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                            Fulfill <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="stock-requests-view">
            <DataTable
                columns={columns}
                data={requests}
                loading={loading}
                keyExtractor={(item) => item.id}
                emptyMessage="No stock requests found."
                emptyIcon={<ClipboardList size={48} />}
            />
        </div>
    );
}
