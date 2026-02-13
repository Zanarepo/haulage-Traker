"use client";

import React from 'react';
import './inventory.css';
import {
    Plus,
    Search,
    Package,
    History,
    ArrowUpRight,
    Filter,
    Trash2,
    Edit3
} from 'lucide-react';

import { useInventory } from '@/hooks/useInventory';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';

// Modular Components
import HistoryModal from './components/HistoryModal';
import SupplyModal from './components/SupplyModal';
import RowActions from '@/components/RowActions/RowActions';

export default function ClientSuppliesDashboard() {
    const {
        isManager,
        clients,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        clientFilter,
        setClientFilter,
        isSupplyModalOpen,
        setIsSupplyModalOpen,
        selectedHistoryClient,
        setSelectedHistoryClient,
        editingSupply,
        setEditingSupply,
        deletingSupply,
        setDeletingSupply,
        clearingAll,
        setClearingAll,
        loadData,
        handleSaveSupply,
        handleDelete,
        handleClearAll,
        handleClearClientHistory,
        aggregatedData,
        totalVolume,
        remainingStock,
        handleViewHistory
    } = useInventory();

    const mainColumns: DataTableColumn<any>[] = [
        {
            label: 'Client Name',
            key: 'client_name',
            render: (item) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="client-pill">{item.client_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to view history</span>
                </div>
            )
        },
        {
            label: 'Cumulative Supplied',
            key: 'total_quantity',
            render: (item) => <span style={{ fontWeight: 700 }}>{item.total_quantity?.toLocaleString()} L</span>
        },
        {
            label: 'Current Balance (Stock)',
            key: 'remaining_quantity',
            render: (item) => {
                const percent = (item.remaining_quantity / item.total_quantity) * 100;
                let status = percent < 20 ? 'low' : percent < 50 ? 'med' : '';
                return (
                    <div className="stock-meter">
                        <div className="meter-header">
                            <span>{item.remaining_quantity?.toLocaleString()} L</span>
                            <span style={{ opacity: 0.6 }}>{Math.round(percent)}%</span>
                        </div>
                        <div className="meter-bar">
                            <div className={`meter-fill ${status}`} style={{ width: `${percent}%` }}></div>
                        </div>
                    </div>
                );
            }
        },
        {
            label: 'Record Count',
            key: 'history',
            render: (item) => <span>{item.history.length} supplies</span>
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (item) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <RowActions
                        actions={[
                            {
                                label: 'Restock',
                                icon: <Plus size={14} />,
                                onClick: () => {
                                    setEditingSupply({ client_id: item.client_id });
                                    setIsSupplyModalOpen(true);
                                }
                            },
                            {
                                label: 'Manage Last Record',
                                icon: <Edit3 size={14} />,
                                onClick: () => {
                                    const lastRecord = [...item.history].sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0];
                                    if (lastRecord) {
                                        setEditingSupply(lastRecord);
                                        setIsSupplyModalOpen(true);
                                    }
                                }
                            },
                            {
                                label: 'Clear History',
                                icon: <Trash2 size={14} />,
                                variant: 'danger',
                                onClick: () => handleClearClientHistory(item.client_id)
                            }
                        ]}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="inventory-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Client Depot Supplies</h1>
                    <p>Track supply inflows and stock history for all operational clients</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isManager && (
                        <button className="btn-add-supply" onClick={() => { setEditingSupply(null); setIsSupplyModalOpen(true); }}>
                            <Plus size={18} />
                            Restock Depot
                        </button>
                    )}
                </div>
            </header>

            <div className="supplies-stats">
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalVolume.toLocaleString()} L</span>
                        <span className="stat-label">Total Volume Supplied</span>
                    </div>
                </div>
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <ArrowUpRight size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{remainingStock.toLocaleString()} L</span>
                        <span className="stat-label">Stock at Depot</span>
                    </div>
                </div>
                <div className="stat-chip">
                    <div className="chip-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <History size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{aggregatedData.length}</span>
                        <span className="stat-label">Integrated Clients</span>
                    </div>
                </div>
            </div>

            <div className="controls-container">
                <div className="search-field">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by client name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <div className="filter-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={16} color="var(--text-muted)" />
                        <select
                            className="filter-select"
                            value={clientFilter}
                            onChange={e => setClientFilter(e.target.value)}
                        >
                            <option value="">All Clients</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="history-section">
                <DataTable
                    columns={mainColumns}
                    data={aggregatedData}
                    loading={loading}
                    keyExtractor={item => item.client_id}
                    onRowClick={(item) => handleViewHistory(item)}
                    emptyMessage="No aggregated data found. Record a new supply to start tracking."
                />
            </div>

            <SupplyModal
                isOpen={isSupplyModalOpen}
                onClose={() => setIsSupplyModalOpen(false)}
                onSave={handleSaveSupply}
                editingSupply={editingSupply}
                clients={clients}
                submitting={submitting}
            />

            <HistoryModal
                client={selectedHistoryClient}
                isOpen={!!selectedHistoryClient}
                onClose={() => setSelectedHistoryClient(null)}
                onClear={() => {
                    if (selectedHistoryClient?.client_id) {
                        handleClearClientHistory(selectedHistoryClient.client_id);
                    }
                }}
            />

            <ConfirmationModal
                isOpen={clearingAll}
                onClose={() => setClearingAll(false)}
                onConfirm={handleClearAll}
                title="Clear All Inventory History"
                message="Are you sure you want to delete ALL supply records? This will reset all client balances to zero. This action is permanent."
                loading={submitting}
            />

            <ConfirmationModal
                isOpen={!!deletingSupply}
                onClose={() => setDeletingSupply(null)}
                onConfirm={handleDelete}
                title="Delete Supply Record"
                message={`Are you sure you want to delete this specific supply record? Total client balance will be adjusted.`}
                loading={submitting}
            />
        </div>
    );
}
