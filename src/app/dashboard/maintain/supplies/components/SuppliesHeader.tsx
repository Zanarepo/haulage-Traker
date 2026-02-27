import React from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';

interface SuppliesHeaderProps {
    isEngineer: boolean;
    isAdmin: boolean;
    canManageReceive: boolean;
    onAddInflow: () => void;
    onIssueToEngineer: () => void;
    onRequestStock: () => void;
    canAddInflow?: boolean;
    canIssueToCluster?: boolean;
    canRequestStock?: boolean;
    onUpgrade?: () => void;
}

export default function SuppliesHeader({
    isEngineer, isAdmin, canManageReceive,
    onAddInflow, onIssueToEngineer, onRequestStock,
    canAddInflow = true, canIssueToCluster = true, canRequestStock = true,
    onUpgrade,
}: SuppliesHeaderProps) {
    return (
        <header className="page-header">
            <div className="header-info">
                <h1>Supply &amp; Inventory Tracking</h1>
                <p>
                    {isEngineer
                        ? "Manage your cluster's floating stock and track usage."
                        : "Monitor central warehouse inflow and fleet allocation across all clusters."}
                </p>
            </div>
            <div className="header-actions">
                {canManageReceive && (
                    <button
                        className="btn-maintain-action"
                        onClick={canAddInflow ? onAddInflow : (onUpgrade || onAddInflow)}
                        style={{ background: '#10b981', opacity: canAddInflow ? 1 : 0.7 }}
                        title={!canAddInflow ? 'Inflow limit reached — upgrade your plan' : ''}
                    >
                        <ArrowRightLeft size={18} />
                        {canAddInflow ? 'Add Stock Inflow' : 'Inflow Limit Hit'}
                    </button>
                )}
                {isAdmin && (
                    <button
                        className="btn-maintain-action"
                        onClick={canIssueToCluster ? onIssueToEngineer : (onUpgrade || onIssueToEngineer)}
                        style={{ opacity: canIssueToCluster ? 1 : 0.7 }}
                        title={!canIssueToCluster ? 'Issue limit reached — upgrade your plan' : ''}
                    >
                        <Plus size={18} />
                        {canIssueToCluster ? 'Issue to Clusters' : 'Issue Limit Hit'}
                    </button>
                )}
                {isEngineer && (
                    <button
                        className="btn-maintain-action"
                        onClick={canRequestStock ? onRequestStock : (onUpgrade || onRequestStock)}
                        style={{ background: 'var(--brand-main)', opacity: canRequestStock ? 1 : 0.7 }}
                        title={!canRequestStock ? 'Request limit reached — upgrade your plan' : ''}
                    >
                        <Plus size={18} />
                        {canRequestStock ? 'Request Stock' : 'Request Limit Hit'}
                    </button>
                )}
            </div>
        </header>
    );
}
