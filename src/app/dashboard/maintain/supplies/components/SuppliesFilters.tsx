import React from 'react';
import { Warehouse, Package, History, ArrowRightLeft, ChevronDown, ClipboardList, FileText } from 'lucide-react';
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
    pendingRequestsCount: number;
}

export default function SuppliesFilters({
    activeTab,
    setActiveTab,
    isAdmin,
    isEngineer,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pendingRequestsCount
}: SuppliesFiltersProps) {
    return (
        <div className="maintain-filters">
            <div className="filter-pills-group">
                {isAdmin && (
                    <button
                        className={`filter-pill ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <Warehouse size={16} />
                        Central Inventory
                    </button>
                )}
                <button
                    className={`filter-pill ${activeTab === 'stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stock')}
                >
                    <Package size={16} />
                    {isEngineer ? 'My Cluster Stock' : 'Issue to Clusters'}
                </button>
                <button
                    className={`filter-pill ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={16} />
                    Restock Logs
                </button>
                {isAdmin && (
                    <button
                        className={`filter-pill ${activeTab === 'receiving_history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('receiving_history')}
                    >
                        <ArrowRightLeft size={16} />
                        Inflow History
                    </button>
                )}
                <button
                    className={`filter-pill ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                    style={{ position: 'relative' }}
                >
                    <ClipboardList size={16} />
                    Requests
                    {isAdmin && pendingRequestsCount > 0 && (
                        <span className="tab-badge">
                            {pendingRequestsCount}
                        </span>
                    )}
                </button>
                <button
                    className={`filter-pill ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <FileText size={16} />
                    Reports
                </button>
            </div>

            <div className="filter-date-group">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="filter-date-input"
                />
                <ChevronDown size={14} color="var(--text-muted)" />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="filter-date-input"
                />
            </div>
        </div>
    );
}
