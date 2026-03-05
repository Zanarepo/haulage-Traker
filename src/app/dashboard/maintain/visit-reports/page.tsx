"use client";

import '../maintain.css';
import '../../dashboard.css';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';
import { useState, useEffect } from 'react';
import { Camera, MapPin, Plus, Edit2, Trash2, MoreHorizontal, Edit3 } from 'lucide-react';
import VisitWizardModal from '../components/VisitWizardModal';
import VisitDetailModal from '../components/VisitDetailModal';
import { useToast } from '@/hooks/useToast';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
export default function VisitReportsPage() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<any>(null);
    const [editVisit, setEditVisit] = useState<any>(null);

    useEffect(() => {
        if (!profile?.company_id) return;
        loadReports();
    }, [profile?.company_id]);

    const loadReports = async () => {
        if (!profile?.company_id) return;
        try {
            const isEngineer = profile?.role === 'site_engineer';
            const data = await maintainService.getVisitReports(
                profile.company_id,
                isEngineer ? profile.id : undefined
            );
            setReports(data || []);
        } catch (err) {
            console.error('[VisitReports]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (e: React.MouseEvent, visit: any) => {
        e.stopPropagation();
        setEditVisit(visit);
        setShowWizard(true);
    };

    const handleDelete = async (e: React.MouseEvent | null, visitId: string) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this visit report? This will also remove any associated photos from storage.')) return;

        try {
            await maintainService.deleteVisitReport(visitId);
            showToast("Report deleted successfully", "success");
            loadReports();
        } catch (err) {
            console.error(err);
            showToast("Failed to delete report", "error");
        }
    };

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Visit Reports</h1>
                    <p>Before/after photo logs with hour meter and diesel level tracking.</p>
                </div>
                {['superadmin', 'admin', 'md', 'site_engineer'].includes(profile?.role || '') && (
                    <button
                        className="btn-maintain-action"
                        onClick={() => setShowWizard(true)}
                    >
                        <Plus size={18} />
                        Start New Visit
                    </button>
                )}
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
                    <div
                        key={r.id}
                        className="activity-item"
                        onClick={() => setSelectedVisit(r)}
                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div className="item-left">
                            <div className="avatar">
                                {(r.engineer as any)?.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                            </div>
                            <div className="item-info">
                                <p>
                                    <span>{(r.engineer as any)?.full_name || 'Unknown'}</span>
                                    {' — '}
                                    {(r.work_order as any)?.title || 'Visit'}
                                </p>
                                <div className="time">
                                    {r.site?.name || (r.work_order as any)?.site?.name || '—'} ·
                                    {r.hour_meter_before != null && ` ${r.hour_meter_before}→${r.hour_meter_after || '?'} hrs`}
                                    {r.diesel_level_before != null && ` · Diesel: ${r.diesel_level_before}→${r.diesel_level_after || '?'}L`}
                                    {' · '}
                                    {new Date(r.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {r.geofence_valid && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.65rem', color: '#10b981' }}><MapPin size={10} /> Verified</div>}
                                {r.before_photos?.length > 0 && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        📷 {r.before_photos.length + (r.after_photos?.length || 0)} photos
                                    </span>
                                )}
                            </div>

                            {(() => {
                                const actions: RowActionItem[] = [];

                                if (profile?.role === 'superadmin' || profile?.id === r.engineer_id) {
                                    actions.push({
                                        label: 'Edit',
                                        icon: <Edit3 size={14} />,
                                        onClick: () => {
                                            setEditVisit(r);
                                            setShowWizard(true);
                                        },
                                        tooltip: 'Edit Report'
                                    });
                                }

                                if (profile?.role === 'superadmin') {
                                    actions.push({
                                        label: 'Delete',
                                        icon: <Trash2 size={14} />,
                                        onClick: () => handleDelete(null as any, r.id),
                                        variant: 'danger',
                                        tooltip: 'Delete Report'
                                    });
                                }

                                return <RowActions actions={actions} />;
                            })()}
                        </div>
                    </div>
                ))}
            </div>

            {selectedVisit && (
                <VisitDetailModal
                    isOpen={!!selectedVisit}
                    onClose={() => setSelectedVisit(null)}
                    visit={selectedVisit}
                    onEdit={(v) => {
                        setSelectedVisit(null);
                        setEditVisit(v);
                        setShowWizard(true);
                    }}
                    onDelete={(id) => {
                        setSelectedVisit(null);
                        handleDelete(null as any, id);
                    }}
                />
            )}

            {profile && (
                <VisitWizardModal
                    isOpen={showWizard}
                    onClose={() => {
                        setShowWizard(false);
                        setEditVisit(null);
                    }}
                    engineerId={profile.id}
                    editVisit={editVisit}
                    onComplete={() => {
                        loadReports();
                        setShowWizard(false);
                        setEditVisit(null);
                    }}
                />
            )}
        </div>
    );
}
