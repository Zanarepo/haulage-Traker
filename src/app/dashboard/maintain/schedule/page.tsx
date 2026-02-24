"use client";

import React, { useMemo, useState } from 'react';
import './schedule.css';
import '../maintain.css';
import '../../dashboard.css';
import '../supplies/supplies.css'; // Leverage shared search bar styles
import {
    CalendarClock,
    AlertTriangle,
    CheckCircle2,
    Clock,
    MapPin,
    Gauge,
    Loader2,
    Search,
    Trash2,
    Calendar,
    X,
    Filter,
    RefreshCcw,
    Hash,
    Edit2
} from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useClusters } from '@/hooks/useClusters';
import { format, startOfDay, endOfDay } from 'date-fns';
import PMMetricModal from './components/PMMetricModal';
import AssetDetailsModal from '../assets/components/AssetDetailsModal';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';

type MetricType = 'overdue' | 'due_week' | 'compliance';

const TYPE_ICONS: Record<string, any> = {
    generator: '⚡',
    inverter: '🔌',
    ac_unit: '❄️',
    rectifier: '🔋',
    battery_bank: '🪫',
    ups: '🔄',
    solar_panel: '☀️',
    other: '🔧'
};

const HEALTH_STATUS_COLORS: Record<string, { bg: string, color: string, label: string }> = {
    healthy: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'Healthy' },
    due_soon: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'Due Soon' },
    overdue: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Overdue' }
};

export default function PMSchedulePage() {
    const {
        assets,
        loading: assetsLoading,
        stats,
        openDetails,
        selectedAsset,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        handleUpdate,
        handleDelete,
        submitting
    } = useAssets();

    const { clusters, loading: clustersLoading } = useClusters();

    // Metric Modal State
    const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

    // Advanced Filter State
    const [clusterFilter, setClusterFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loading = assetsLoading || clustersLoading;

    // Calculate PM Compliance
    const compliance = useMemo(() => {
        if (loading || assets.length === 0) return 0;
        const total = assets.filter(a => a.status === 'active').length;
        if (total === 0) return 100;
        const overdueCount = assets.filter(a => a.projections?.healthStatus === 'overdue').length;
        return Math.round(((total - overdueCount) / total) * 100);
    }, [assets, loading]);

    // Assets due this week
    const dueThisWeekAssets = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return assets.filter(a => {
            if (!a.projections?.estimatedDueDate) return false;
            const dueDate = new Date(a.projections.estimatedDueDate);
            return dueDate >= today && dueDate <= nextWeek;
        });
    }, [assets]);

    // Filtered assets based on selected metric for the drill-down modal
    const metricAssets = useMemo(() => {
        if (selectedMetric === 'overdue') {
            return assets.filter(a => a.projections?.healthStatus === 'overdue');
        }
        if (selectedMetric === 'due_week') {
            return dueThisWeekAssets;
        }
        return [];
    }, [selectedMetric, assets, dueThisWeekAssets]);

    // Apply Advanced Filters & Sorting
    const filteredAndSortedAssets = useMemo(() => {
        let result = [...assets].filter(a => a.status === 'active' && a.projections);

        // Cluster Filter
        if (clusterFilter !== 'all') {
            result = result.filter(a => a.site?.cluster_id === clusterFilter);
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                (a.site?.name || '').toLowerCase().includes(query) ||
                (a.site?.clusters?.name || '').toLowerCase().includes(query) ||
                (a.make_model || '').toLowerCase().includes(query) ||
                (a.serial_number || '').toLowerCase().includes(query)
            );
        }

        // Date Filter
        if (startDate || endDate) {
            result = result.filter(a => {
                if (!a.projections?.estimatedDueDate) return false;
                const dueDate = new Date(a.projections.estimatedDueDate);
                const start = startDate ? startOfDay(new Date(startDate)) : new Date(0);
                const end = endDate ? endOfDay(new Date(endDate)) : new Date(8640000000000000);
                return dueDate >= start && dueDate <= end;
            });
        }

        // Sort by due date
        return result.sort((a, b) => {
            const dateA = a.projections?.estimatedDueDate ? new Date(a.projections.estimatedDueDate).getTime() : Infinity;
            const dateB = b.projections?.estimatedDueDate ? new Date(b.projections.estimatedDueDate).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [assets, clusterFilter, searchQuery, startDate, endDate]);

    const handleMetricClick = (metric: MetricType) => {
        if (metric === 'compliance') return;
        setSelectedMetric(metric);
        setIsMetricModalOpen(true);
    };

    const resetFilters = () => {
        setClusterFilter('all');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
    };

    const columns: DataTableColumn<any>[] = [
        {
            key: 'asset_info',
            label: 'Asset / Equipment',
            mobileLabel: 'Service Item',
            fullWidth: true,
            render: (asset) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="type-icon-wrapper">
                        {TYPE_ICONS[asset.type] || '🔧'}
                    </div>
                    <div>
                        <h3 className="model-name">{asset.make_model}</h3>
                        <div className="detail-line">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Hash size={12} />
                                <span>{asset.serial_number || 'No S/N'}</span>
                            </div>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span className="category-pill" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, fontSize: '10px' }}>
                                {asset.type.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'location',
            label: 'Location',
            mobileLabel: 'Location',
            render: (asset) => {
                const cluster = asset.site?.clusters;
                return (
                    <div className="location-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{asset.site?.name || 'Unassigned'}</span>
                        </div>
                        {cluster?.name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', paddingLeft: '20px' }}>
                                {cluster.name} {cluster.state && `• ${cluster.state}`}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'service_status',
            label: 'Timeline',
            mobileLabel: 'Service Window',
            render: (asset) => {
                const isOverdue = asset.projections.healthStatus === 'overdue';
                const isSoon = asset.projections.healthStatus === 'due_soon';
                const dueDate = asset.projections.estimatedDueDate ? new Date(asset.projections.estimatedDueDate) : null;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className={`service-status ${asset.projections.healthStatus}`}>
                            {isOverdue ? 'OVERDUE' : (dueDate ? `Due ${format(dueDate, 'MMM dd, yyyy')}` : 'No date')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Clock size={12} />
                            <span>{asset.projections.hoursRemaining.toFixed(0)}h left</span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'performance',
            label: 'Metrics',
            mobileLabel: 'Technical Info',
            render: (asset) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        <Gauge size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{asset.hour_meter?.toLocaleString() || 0}h Current</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg use: {asset.avg_use_rate?.toFixed(1) || 0}h/day</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Actions',
            align: 'right',
            render: (asset) => (
                <div className="actions-group">
                    <button
                        className="btn-action"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDetails(asset);
                        }}
                        title="Edit Asset Details"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        className="btn-action delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset.id);
                        }}
                        title="Delete Asset"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    if (loading && assets.length === 0) {
        return (
            <div className="maintain-page">
                <div className="maintain-empty">
                    <Loader2 className="animate-spin" />
                    <p>Fetching PM data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="maintain-page schedule-page-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>PM Schedule</h1>
                    <p>Intelligent service forecasting across all clusters and sites.</p>
                </div>
            </header>

            <div className="maintain-stats">
                <div
                    className="stat-card clickable-stat"
                    onClick={() => handleMetricClick('overdue')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="icon-box" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="card-content">
                        <h3>Overdue PMs</h3>
                        <p className="value">{stats.overdue}</p>
                        <p className="sub">Immediate action</p>
                    </div>
                </div>
                <div
                    className="stat-card clickable-stat"
                    onClick={() => handleMetricClick('due_week')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <CalendarClock size={18} />
                    </div>
                    <div className="card-content">
                        <h3>Due This Week</h3>
                        <p className="value">{dueThisWeekAssets.length}</p>
                        <p className="sub">Upcoming services</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="card-content">
                        <h3>PM Compliance</h3>
                        <p className="value">{compliance}%</p>
                        <p className="sub">On-time execution</p>
                    </div>
                </div>
            </div>

            <div className="inventory-controls" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="search-pill-wrapper" style={{ flex: '1 1 300px' }}>
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search site, cluster, or model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="inventory-search-input"
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
                    <select
                        value={clusterFilter}
                        onChange={(e) => setClusterFilter(e.target.value)}
                        className="inventory-search-input"
                        style={{ paddingLeft: '1.25rem', width: 'auto', flex: 1, minWidth: '160px' }}
                    >
                        <option value="all">All Clusters</option>
                        {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <div className="search-pill-wrapper" style={{ flex: 1.5, minWidth: '240px' }}>
                        <Calendar size={16} className="search-icon" />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            paddingLeft: '3rem',
                            paddingRight: '1rem'
                        }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', width: '100%' }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>TO</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', width: '100%' }}
                            />
                        </div>
                    </div>

                    {(clusterFilter !== 'all' || searchQuery || startDate || endDate) && (
                        <button
                            className="btn-refresh-pill"
                            onClick={resetFilters}
                            title="Clear Filters"
                            style={{ color: '#ef4444' }}
                        >
                            <X size={18} />
                        </button>
                    )}

                    <button
                        className="btn-refresh-pill"
                        onClick={() => window.location.reload()}
                        title="Refresh Data"
                    >
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredAndSortedAssets}
                keyExtractor={(item) => item.id}
                loading={loading}
                onRowClick={openDetails}
                emptyMessage="No matching services found."
                getRowClassName={(item) => item.projections.healthStatus === 'overdue' ? 'overdue-row' : (item.projections.healthStatus === 'due_soon' ? 'due-soon-row' : '')}
            />

            {/* Drill-down Modal */}
            <PMMetricModal
                isOpen={isMetricModalOpen}
                onClose={() => setIsMetricModalOpen(false)}
                metric={selectedMetric}
                assets={metricAssets}
                onAssetClick={openDetails}
            />

            {/* Asset Details Modal */}
            <AssetDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                asset={selectedAsset}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                submitting={submitting}
            />
        </div>
    );
}
