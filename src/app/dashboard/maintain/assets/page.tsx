"use client";

import React, { useState } from 'react';
import '../maintain.css';
import '../../dashboard.css';
import { useAssets } from '@/hooks/useAssets';
import {
    Plus,
    Search,
    MapPin,
    Gauge,
    Hash,
    Package,
    Loader2,
    Edit2,
    Trash2
} from 'lucide-react';
import NewAssetModal from './components/NewAssetModal';
import AssetDetailsModal from './components/AssetDetailsModal';

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

const STATUS_COLORS: Record<string, { bg: string, color: string }> = {
    active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
    inactive: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
    decommissioned: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
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

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const onCreateSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            await handleCreate(data);
            setIsCreateModalOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdateAsset = async (id: string, data: any) => {
        setSubmitting(true);
        try {
            await handleUpdate(id, data);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="maintain-page">
            <header className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div className="header-info">
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Asset Registry</h1>
                    <p style={{ fontSize: '0.85rem' }}>Comprehensive tracking of technical infrastructure across all sites.</p>
                </div>
                <div className="header-actions">
                    {isManager && (
                        <button className="btn-maintain-action" onClick={() => setIsCreateModalOpen(true)} style={{ height: '38px', padding: '0 1rem' }}>
                            <Plus size={16} /> Register Asset
                        </button>
                    )}
                </div>
            </header>

            {/* Quick Stats - more compact */}
            <div className="maintain-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <h3 style={{ fontSize: '0.7rem' }}>Total Assets</h3>
                    <p className="value" style={{ fontSize: '1.25rem' }}>{stats.total}</p>
                </div>
                <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <h3 style={{ fontSize: '0.7rem' }}>Operational</h3>
                    <p className="value" style={{ fontSize: '1.25rem', color: '#10b981' }}>{stats.active}</p>
                </div>
                <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <h3 style={{ fontSize: '0.7rem' }}>Service Due</h3>
                    <p className="value" style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{stats.overdue}</p>
                </div>
                <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <h3 style={{ fontSize: '0.7rem' }}>Inactive</h3>
                    <p className="value" style={{ fontSize: '1.25rem', color: '#6b7280' }}>{stats.inactive}</p>
                </div>
            </div>

            {/* Search Controls */}
            <div style={{ marginBottom: '1rem' }}>
                <div className="search-field" style={{
                    maxWidth: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-hover)',
                    padding: '0 0.75rem',
                    height: '38px',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by model, serial, or site..."
                        value={searchTerm}
                        onChange={onSearchChange}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            width: '100%',
                            outline: 'none',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>
            </div>

            {/* Asset List - Full Width Row based layout */}
            <div className="asset-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loading && <div className="maintain-empty">Loading assets...</div>}
                {!loading && filteredAssets.length === 0 && (
                    <div className="maintain-empty">
                        <Package size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>No matches found in your registry.</p>
                    </div>
                )}
                {filteredAssets.map(asset => {
                    const statusStyle = STATUS_COLORS[asset.status] || STATUS_COLORS.active;
                    const cluster = asset.site?.clusters;

                    return (
                        <div
                            key={asset.id}
                            className="stat-card asset-row"
                            style={{
                                cursor: 'pointer',
                                padding: '0.75rem 1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                width: '100%',
                                minHeight: 'auto',
                                transition: 'all 0.2s ease',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)'
                            }}
                            onClick={() => openDetails(asset)}
                        >
                            {/* Type Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--bg-hover)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                flexShrink: 0
                            }}>
                                {TYPE_ICONS[asset.type] || '🔧'}
                            </div>

                            {/* Equipment info */}
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {asset.make_model}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    <Hash size={12} />
                                    <span>{asset.serial_number || 'No S/N'}</span>
                                    <span style={{ opacity: 0.3 }}>•</span>
                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{asset.type.replace('_', ' ')}</span>
                                </div>
                            </div>

                            {/* Location info */}
                            <div style={{ flex: 1.2, minWidth: '200px' }}>
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

                            {/* Metrics */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Runtime</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                        <Gauge size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span>{asset.hour_meter?.toLocaleString() || 0}h</span>
                                    </div>
                                </div>
                                <div style={{ minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Status</span>
                                    <span className="status-tag" style={{
                                        background: statusStyle.bg,
                                        color: statusStyle.color,
                                        border: `1px solid ${statusStyle.color}20`,
                                        fontSize: '8px',
                                        margin: 0
                                    }}>
                                        {asset.status}
                                    </span>
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)', flexShrink: 0 }}>
                                {isManager && (
                                    <>
                                        <button
                                            title="Edit Asset"
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                background: 'var(--bg-hover)',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDetails(asset);
                                                // We could potentially set a flag to open the modal in "edit mode" directly
                                                // But openDetails handles the standard modal trigger.
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            title="Delete Asset"
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                background: 'var(--bg-hover)',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(asset.id);
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <NewAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={onCreateSubmit}
                submitting={submitting}
            />

            <AssetDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                asset={selectedAsset}
                onUpdate={onUpdateAsset}
                onDelete={handleDelete}
                submitting={submitting}
            />
        </div>
    );
}
