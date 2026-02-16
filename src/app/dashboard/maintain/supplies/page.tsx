"use client";

import '../maintain.css';
import '../../dashboard.css';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';
import { useState, useEffect } from 'react';
import { PackageCheck } from 'lucide-react';

export default function SupplyTrackingPage() {
    const { profile } = useAuth();
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.company_id) return;
        loadAllocations();
    }, [profile?.company_id]);

    const loadAllocations = async () => {
        if (!profile?.company_id) return;
        try {
            const data = await maintainService.getSupplyAllocations(profile.company_id);
            setAllocations(data);
        } catch (err) {
            console.error('[Supplies]', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Supply Tracking</h1>
                    <p>Track allocated vs. used vs. returned supplies per work order.</p>
                </div>
            </header>

            <div className="activity-list">
                {loading && <div className="maintain-empty">Loading supply allocations…</div>}
                {!loading && allocations.length === 0 && (
                    <div className="maintain-empty">
                        <PackageCheck size={32} />
                        <p>No supply allocations yet. Supplies are tracked per work order.</p>
                    </div>
                )}
                {allocations.map((a) => {
                    const waste = a.qty_allocated - a.qty_used - a.qty_returned;
                    return (
                        <div key={a.id} className="activity-item">
                            <div className="item-left">
                                <div className="avatar" style={{ background: waste > 0 ? '#ef4444' : '#10b981' }}>
                                    {a.item_category?.slice(0, 2).toUpperCase() || '📦'}
                                </div>
                                <div className="item-info">
                                    <p><span>{a.item_name}</span> — {(a.work_order as any)?.title || 'Work Order'}</p>
                                    <div className="time">
                                        Allocated: {a.qty_allocated} {a.unit} · Used: {a.qty_used} · Returned: {a.qty_returned}
                                        {waste > 0 && ` · ⚠️ Waste: ${waste} ${a.unit}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
