import React from 'react';
import { Warehouse, ArrowRightLeft, ArrowUpRight } from 'lucide-react';

interface SuppliesStatsProps {
    inflowBatches: number;
    unitsReceived: number;
    allocations: number;
}

export default function SuppliesStats({ inflowBatches, unitsReceived, allocations }: SuppliesStatsProps) {
    return (
        <div className="supplies-stats">
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Warehouse size={24} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{inflowBatches}</span>
                    <span className="stat-label">Inflow Batches</span>
                </div>
            </div>
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <ArrowRightLeft size={24} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{unitsReceived}</span>
                    <span className="stat-label">Units Received</span>
                </div>
            </div>
            <div className="stat-chip">
                <div className="chip-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <ArrowUpRight size={24} />
                </div>
                <div className="stat-info">
                    <span className="stat-value">{allocations}</span>
                    <span className="stat-label">Allocations</span>
                </div>
            </div>
        </div>
    );
}
