import React from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';

interface SuppliesHeaderProps {
    isEngineer: boolean;
    isAdmin: boolean;
    canManageReceive: boolean;
    onAddInflow: () => void;
    onIssueToEngineer: () => void;
}

export default function SuppliesHeader({ isEngineer, isAdmin, canManageReceive, onAddInflow, onIssueToEngineer }: SuppliesHeaderProps) {
    return (
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-info">
                <h1>Supply & Inventory Tracking</h1>
                <p>
                    {isEngineer
                        ? "Manage your cluster's floating stock and track usage."
                        : "Monitor central warehouse inflow and fleet allocation across all clusters."}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                {canManageReceive && (
                    <button className="btn-maintain-action" onClick={onAddInflow} style={{ background: '#10b981' }}>
                        <ArrowRightLeft size={18} /> Add Stock Inflow
                    </button>
                )}
                {isAdmin && (
                    <button className="btn-maintain-action" onClick={onIssueToEngineer}>
                        <Plus size={18} /> Issue to Clusters
                    </button>
                )}
            </div>
        </header>
    );
}
