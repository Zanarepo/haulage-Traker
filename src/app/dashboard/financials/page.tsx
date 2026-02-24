"use client";

import React from 'react';
import './financials.css';
import {
    Wallet,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Truck,
    Clock,
    User,
    MapPin
} from 'lucide-react';

import { useFinancials } from '@/hooks/useFinancials';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import RowActions from '@/components/RowActions/RowActions';
import FinancialDetailsModal from './components/FinancialDetailsModal';

export default function FinancialsDashboard() {
    const {
        financials,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        stats,
        isAccountant,
        isAuditor,
        handleApproval,
        handleFlag
    } = useFinancials();

    const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

    const columns: DataTableColumn<any>[] = [
        {
            label: 'Date',
            key: 'created_at',
            fullWidth: true,
            render: (it) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{new Date(it.created_at).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            label: 'Asset',
            key: 'truck_plate_number',
            render: (it) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={14} className="text-primary" />
                    <span className="truck-pill">{it.dispensing_logs?.trips?.truck_plate_number}</span>
                </div>
            )
        },
        {
            label: 'Haulage Fee',
            key: 'calculated_haulage_fee',
            render: (it) => (
                <div className="haulage-pill">
                    ₦ {it.calculated_haulage_fee?.toLocaleString()}
                </div>
            )
        },
        {
            label: 'Compliance',
            key: 'status',
            render: (it) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={`status-dot ${it.accountant_approval ? 'active' : 'pending'}`} title="Accountant Approval" />
                    <div className={`status-dot ${it.auditor_approval ? 'active' : 'pending'}`} title="Auditor Audit" />
                    {it.is_audit_flagged && <AlertCircle size={12} color="#ef4444" />}
                </div>
            )
        },
        {
            label: 'Actions',
            key: 'actions',
            fullWidth: true,
            render: (it) => (
                <RowActions
                    actions={[
                        {
                            label: 'Details',
                            icon: <ArrowUpRight size={14} />,
                            onClick: () => {
                                setSelectedRecord(it);
                                setIsDetailsOpen(true);
                            },
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="financials-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Financial Oversight</h1>
                    <p>Monitor haulage earnings, reconcile losses, and manage transaction approvals</p>
                </div>
            </header>

            <div className="financials-stats">
                <StatCard
                    label="Total Haulage Fee"
                    value={`₦ ${stats.totalHaulage.toLocaleString()}`}
                    icon={<Wallet size={24} />}
                    color="rgba(16, 185, 129, 0.1)"
                    iconColor="#10b981"
                    trend={"+12% vs last month"}
                    trendUp={true}
                />
                <StatCard
                    label="Total Estimated Loss"
                    value={`₦ ${stats.totalLoss.toLocaleString()}`}
                    icon={<TrendingUp size={24} />}
                    color="rgba(239, 68, 68, 0.1)"
                    iconColor="#ef4444"
                    trend={"-2% improvement"}
                    trendUp={false}
                />
                <StatCard
                    label="Pending Approvals"
                    value={stats.pendingAccountant + stats.pendingAuditor}
                    icon={<Clock size={24} />}
                    color="rgba(245, 158, 11, 0.1)"
                    iconColor="#f59e0b"
                />
                <StatCard
                    label="Audit Flagged"
                    value={stats.flagged}
                    icon={<AlertCircle size={24} />}
                    color="rgba(239, 68, 68, 0.1)"
                    iconColor="#ef4444"
                />
            </div>

            <div className="controls-section">
                <div className="search-box">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by truck, client, or site..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="financials-content">
                <DataTable
                    columns={columns}
                    data={financials}
                    loading={loading}
                    keyExtractor={it => it.id}
                    emptyMessage="No financial records found. Dispense fuel to generate records."
                />
            </div>

            <FinancialDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                record={selectedRecord}
                onApprove={handleApproval}
                onFlag={handleFlag}
                isAccountant={isAccountant}
                isAuditor={isAuditor}
                submitting={submitting}
            />
        </div>
    );
}

function StatCard({ label, value, icon, color, iconColor, trend, trendUp }: any) {
    return (
        <div className="fin-card">
            <div className="icon-box" style={{ background: color, color: iconColor }}>
                {icon}
            </div>
            <div className="fin-info">
                <h3>{label}</h3>
                <p className="value">{value}</p>
                {trend && (
                    <p className={`trend ${trendUp ? 'up' : 'down'}`}>
                        {trend}
                    </p>
                )}
            </div>
        </div>
    );
}
