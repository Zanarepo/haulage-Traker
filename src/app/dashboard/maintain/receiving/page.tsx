'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';
import {
    Barcode,
    History,
    TrendingUp,
    Package,
    Search
} from 'lucide-react';
import ReceivingDashboard from '../supplies/components/ReceivingDashboard';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import '../supplies/supplies.css';

export default function ReceivingDashboardPage() {
    const { profile } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (profile?.company_id) {
            loadHistory();
        }
    }, [profile?.company_id, refreshKey]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await maintainService.getReceivingHistory(profile!.company_id);
            setHistory(data);
        } catch (err) {
            console.error('[ReceivingHistory]', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalBatches: history.length,
        totalItems: history.reduce((acc, b) => acc + (b.total_items || 0), 0),
        totalValue: history.reduce((acc, b) => acc + (b.total_value || 0), 0)
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'reference_no',
            label: 'Reference / Invoice',
            render: (batch) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="item-pill">{batch.reference_no || 'No Ref'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{batch.supplier_name || 'Generic Supplier'}</span>
                </div>
            )
        },
        {
            key: 'total_items',
            label: 'Qty',
            render: (batch) => <span style={{ fontWeight: 600 }}>{batch.total_items} units</span>
        },
        {
            key: 'total_value',
            label: 'Est. Value',
            render: (batch) => <span>{formatCurrency(batch.total_value)}</span>
        },
        {
            key: 'receiver',
            label: 'Received By',
            render: (batch) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem' }}>{batch.receiver?.full_name || 'System'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(batch.created_at).toLocaleString()}</span>
                </div>
            )
        }
    ];

    return (
        <div className="receiving-page-wrapper">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div className="header-info">
                    <h1>Stock Receiving Dashboard</h1>
                    <p>Register new inventory, scan barcodes, and track warehouse inflows.</p>
                </div>
            </header>

            <div className="supplies-stats" style={{ marginBottom: '2rem' }}>
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Barcode size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalBatches}</span>
                        <span className="stat-label">Total Batches</span>
                    </div>
                </div>
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalItems}</span>
                        <span className="stat-label">Items Received</span>
                    </div>
                </div>
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
                        <span className="stat-label">Total Value</span>
                    </div>
                </div>
            </div>

            <div className="receiving-content-grid">
                {/* Main Scanning Interface */}
                <div className="card-elevated" style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <ReceivingDashboard
                        companyId={profile?.company_id || ''}
                        userId={profile?.id || ''}
                        onSuccess={() => setRefreshKey(prev => prev + 1)}
                    />
                </div>

                {/* History Table */}
                <div className="card-elevated" style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <History size={20} color="var(--primary-color)" />
                        <h3 style={{ margin: 0 }}>Recent Receiving History</h3>
                    </div>
                    <DataTable
                        columns={columns}
                        data={history}
                        keyExtractor={(item) => item.id}
                        loading={loading}
                        emptyMessage="No receiving records found."
                        emptyIcon={<Barcode size={48} opacity={0.2} />}
                    />
                </div>
            </div>
        </div>
    );
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
};
