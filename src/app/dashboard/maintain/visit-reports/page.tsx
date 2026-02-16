"use client";

import '../maintain.css';
import '../../dashboard.css';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';
import { useState, useEffect } from 'react';
import { Camera, MapPin } from 'lucide-react';

export default function VisitReportsPage() {
    const { profile } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.company_id) return;
        loadReports();
    }, [profile?.company_id]);

    const loadReports = async () => {
        if (!profile?.company_id) return;
        try {
            const data = await maintainService.getVisitReports(profile.company_id);
            setReports(data);
        } catch (err) {
            console.error('[VisitReports]', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Visit Reports</h1>
                    <p>Before/after photo logs with hour meter and diesel level tracking.</p>
                </div>
            </header>

            <div className="activity-list">
                {loading && <div className="maintain-empty">Loading visit reports…</div>}
                {!loading && reports.length === 0 && (
                    <div className="maintain-empty">
                        <Camera size={32} />
                        <p>No visit reports yet. Reports are created when engineers complete site visits.</p>
                    </div>
                )}
                {reports.map((r) => (
                    <div key={r.id} className="activity-item">
                        <div className="item-left">
                            <div className="avatar">
                                {(r.engineer as any)?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                            </div>
                            <div className="item-info">
                                <p>
                                    <span>{(r.engineer as any)?.full_name || 'Unknown'}</span>
                                    {' — '}
                                    {(r.work_order as any)?.title || 'Visit'}
                                </p>
                                <div className="time">
                                    {(r.work_order as any)?.site?.name || '—'} ·
                                    {r.hour_meter_before != null && ` ${r.hour_meter_before}→${r.hour_meter_after || '?'} hrs`}
                                    {r.diesel_level_before != null && ` · Diesel: ${r.diesel_level_before}→${r.diesel_level_after || '?'}L`}
                                    {' · '}
                                    {new Date(r.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {r.geofence_valid && <MapPin size={14} style={{ color: '#10b981' }} />}
                            {r.before_photos?.length > 0 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    📷 {r.before_photos.length + (r.after_photos?.length || 0)} photos
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
