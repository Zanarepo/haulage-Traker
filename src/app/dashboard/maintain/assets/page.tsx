"use client";

import React, { useState } from 'react';
import './assets.css';
import '../maintain.css';
import '../../dashboard.css';
import '../supplies/supplies.css'; // Leverage shared search bar styles
import { useAssets } from '@/hooks/useAssets';
import {
    Plus,
    Search,
    MapPin,
    Gauge,
    Hash,
    Package,
    Edit2,
    Trash2,
    LayoutGrid,
    Activity,
    RefreshCcw
} from 'lucide-react';
import NewAssetModal from './components/NewAssetModal';
import AssetDetailsModal from './components/AssetDetailsModal';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';

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

export default function AssetRegistryPage() {
    const {
        assets,
        loading,
        searchTerm,
        setSearchTerm,
        isManager,
        isCreateModalOpen,
        setIsCreateModalOpen,
        selectedAsset,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        openDetails,
        handleCreate,
        handleUpdate,
        handleDelete,
        stats
    } = useAssets();

    const [submitting, setSubmitting] = useState(false);

    const filteredAssets = assets.filter(a =>
        a.make_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.site?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: DataTableColumn<any>[] = [
        {
            key: 'asset_info',
            label: 'Asset / Equipment',
            mobileLabel: 'Item Details',
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
            key: 'metrics',
            label: 'Performance',
            mobileLabel: 'Performance',
            render: (asset) => (
                <div className="metrics-group">
                    <div className="metric-item">
                        <span className="metric-label">Runtime</span>
                        <div className="metric-value">
                            <Gauge size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{asset.hour_meter?.toLocaleString() || 0}h</span>
                        </div>
                    </div>
                    <div className="metric-item">
                        <span className="metric-label">Status</span>
                        {asset.projections ? (
                            <span className="status-badge" style={{
                                background: HEALTH_STATUS_COLORS[asset.projections.healthStatus]?.bg,
                                color: HEALTH_STATUS_COLORS[asset.projections.healthStatus]?.color
                            }}>
                                {HEALTH_STATUS_COLORS[asset.projections.healthStatus]?.label}
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No data</span>
                        )}
                    </div>
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
                    {isManager && (
                        <>
                            <button
                                className="btn-action"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openDetails(asset);
                                }}
                                title="Edit Asset"
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
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="maintain-page asset-registry-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>Asset Registry</h1>
                    <p>Comprehensive tracking of technical infrastructure across all sites.</p>
                </div>
                <div className="header-actions">
                    {isManager && (
                        <button className="btn-maintain-action" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={18} /> Register Asset
                        </button>
                    )}
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card">
                    <div className="card-content">
                        <h3>Total Assets</h3>
                        <p className="value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="card-content">
                        <h3>Healthy</h3>
                        <p className="value" style={{ color: '#10b981' }}>{stats.healthy}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="card-content">
                        <h3>Due Soon</h3>
                        <p className="value" style={{ color: '#f59e0b' }}>{stats.dueSoon}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="card-content">
                        <h3>Overdue</h3>
                        <p className="value" style={{ color: '#ef4444' }}>{stats.overdue}</p>
                    </div>
                </div>
            </div>

            {/* Premium Search Bar Pattern */}
            <div className="inventory-controls">
                <div className="search-pill-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by model, serial, or site..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="inventory-search-input"
                    />
                </div>
                <button
                    className="btn-refresh-pill"
                    onClick={() => window.location.reload()}
                    title="Refresh List"
                >
                    <RefreshCcw size={18} />
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filteredAssets}
                keyExtractor={(asset) => asset.id}
                loading={loading}
                onRowClick={openDetails}
                emptyMessage="No matching assets found in the registry."
            />

            <NewAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                submitting={submitting}
            />

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
