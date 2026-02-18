import React from 'react';
import { Warehouse, ArrowRightLeft, ArrowUpRight } from 'lucide-react';

interface SuppliesStatsProps {
    inflowCount: number;
    unitsReceived: number;
    unitsOutbound: number;
    currentBalance: number;
    isEngineer?: boolean;
}

export default function SuppliesStats({ inflowCount, unitsReceived, unitsOutbound, currentBalance, isEngineer }: SuppliesStatsProps) {
    return (
        <div className="supplies-stats">
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Warehouse size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{inflowCount}</span>
                    <span className="stat-label">{isEngineer ? 'My Restocks' : 'Inflow Batches'}</span>
                </div>
            </div>
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <ArrowRightLeft size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{unitsReceived}</span>
                    <span className="stat-label">Units Received</span>
                </div>
            </div>
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <ArrowUpRight size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{unitsOutbound}</span>
                    <span className="stat-label">{isEngineer ? 'Units Used' : 'Total Issued'}</span>
                </div>
            </div>
            <div className="stat-chip warehouse-total">
                <div className="chip-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                    <Warehouse size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{currentBalance}</span>
                    <span className="stat-label">{isEngineer ? 'Unused Stock' : 'Warehouse Stock'}</span>
                </div>
            </div>
        </div>
    );
}
