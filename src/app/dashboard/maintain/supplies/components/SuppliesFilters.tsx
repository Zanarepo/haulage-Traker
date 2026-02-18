import React from 'react';
import { Warehouse, Package, History, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { TabType } from '../hooks/useSupplies';

interface SuppliesFiltersProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    isAdmin: boolean;
    isEngineer: boolean;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
}

export default function SuppliesFilters({
    activeTab,
    setActiveTab,
    isAdmin,
    isEngineer,
    startDate,
    setStartDate,
    endDate,
    setEndDate
}: SuppliesFiltersProps) {
    return (
        <div className="maintain-filters" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isAdmin && (
                    <button
                        className={`filter-pill ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <Warehouse size={14} style={{ marginRight: '6px' }} />
                        Central Inventory
                    </button>
                )}
                <button
                    className={`filter-pill ${activeTab === 'stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stock')}
                >
                    <Package size={14} style={{ marginRight: '6px' }} />
                    {isEngineer ? 'My Cluster Stock' : 'Issue to Clusters'}
                </button>
                <button
                    className={`filter-pill ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={14} style={{ marginRight: '6px' }} />
                    Restock Logs
                </button>
                {isAdmin && (
                    <button
                        className={`filter-pill ${activeTab === 'receiving_history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('receiving_history')}
                    >
                        <ArrowRightLeft size={14} style={{ marginRight: '6px' }} />
                        Inflow History
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="filter-pill"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', color: 'var(--text-main)' }}
                />
                <ChevronDown size={14} color="var(--text-muted)" />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="filter-pill"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', color: 'var(--text-main)' }}
                />
            </div>
        </div>
    );
}
