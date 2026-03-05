"use client";

import React from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Clock,
    MapPin,
    User,
    Camera,
    Fuel,
    Wrench,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    ArrowRight,
    Loader2,
    Edit3,
    Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { maintainService } from '@/services/maintainService';

interface VisitDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: any;
    onEdit?: (visit: any) => void;
    onDelete?: (visitId: string) => void;
}

export default function VisitDetailModal({
    isOpen,
    onClose,
    visit,
    onEdit,
    onDelete
}: VisitDetailModalProps) {
    const { profile } = useAuth();
    const [media, setMedia] = React.useState<any[]>([]);
    const [loadingMedia, setLoadingMedia] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && visit?.id) {
            loadMedia();
        }
    }, [isOpen, visit?.id]);

    const loadMedia = async () => {
        try {
            setLoadingMedia(true);
            const data = await maintainService.getVisitMedia(visit.id);
            setMedia(data || []);
        } catch (error) {
            console.error('Failed to load visit media:', error);
        } finally {
            setLoadingMedia(false);
        }
    };

    if (!visit) return null;

    const arrivedAt = new Date(visit.arrived_at);
    const departedAt = visit.departed_at ? new Date(visit.departed_at) : null;
    const duration = departedAt ? Math.round((departedAt.getTime() - arrivedAt.getTime()) / (1000 * 60)) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Site Visit Documentation"
            maxWidth="800px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        {profile?.role === 'superadmin' && onDelete && (
                            <button
                                className="btn-maintain-action"
                                style={{ background: '#ef444420', color: '#ef4444', border: 'none' }}
                                onClick={() => onDelete(visit.id)}
                            >
                                <Trash2 size={16} /> Delete Report
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-maintain-action secondary" onClick={onClose}>Close</button>
                        {(profile?.role === 'superadmin' || profile?.id === visit.engineer_id) && onEdit && (
                            <button className="btn-maintain-action" onClick={() => onEdit(visit)}>
                                <Edit3 size={16} /> Edit Report
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header Summary Card */}
                <div className="summary-card-grid">
                    <div className="summary-item">
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                            <User size={12} /> ENGINEER
                        </label>
                        <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>{visit.engineer?.full_name || '—'}</p>
                    </div>
                    <div className="summary-item">
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                            <MapPin size={12} /> SITE
                        </label>
                        <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>{visit.site?.name || '—'}</p>
                    </div>
                    <div className="summary-item">
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                            <Calendar size={12} /> DATE
                        </label>
                        <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>{arrivedAt.toLocaleDateString()}</p>
                    </div>
                    <div className="summary-item">
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                            <Info size={12} /> GEOFENCE
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {visit.geofence_valid ? (
                                <span style={{ color: '#10b981', background: '#10b98115', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>VALID</span>
                            ) : (
                                <span style={{ color: '#ef4444', background: '#ef444415', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>BYPASSED</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="detail-grid">

                    {/* Arrival Column */}
                    <div className="data-column">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <ArrowRight size={18} className="text-accent" />
                            Arrival Documentation
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Arrival Time</span>
                                <span style={{ fontWeight: 600 }}>{arrivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Hour Meter (Before)</span>
                                <span style={{ fontWeight: 600 }}>{visit.hour_meter_before || '—'} hrs</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Diesel Level (Before)</span>
                                <span style={{ fontWeight: 600 }}>{visit.diesel_level_before || '—'} L</span>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Before Photos</label>
                                <div className="media-grid">
                                    {loadingMedia ? (
                                        <div style={{ gridColumn: 'span 2', padding: '2rem', textAlign: 'center' }}>
                                            <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Loading photos...</p>
                                        </div>
                                    ) : media.filter(m => m.type === 'before').length > 0 ? (
                                        media.filter(m => m.type === 'before').map((m: any, i: number) => (
                                            <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'white' }}>
                                                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                                                    <img src={m.file_url} alt={m.header || "Before"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                {m.header && (
                                                    <div style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                                                        {m.header}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: 'span 2', padding: '1rem', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            No before photos uploaded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Departure Column */}
                    <div className="data-column">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <ArrowRight size={18} style={{ transform: 'rotate(180deg)', color: '#10b981' }} />
                            Departure Documentation
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Departure Time</span>
                                <span style={{ fontWeight: 600 }}>{departedAt ? departedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Hour Meter (After)</span>
                                <span style={{ fontWeight: 600 }}>{visit.hour_meter_after || '—'} hrs</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Diesel Level (After)</span>
                                <span style={{ fontWeight: 600 }}>{visit.diesel_level_after || '—'} L</span>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>After Photos</label>
                                <div className="media-grid">
                                    {loadingMedia ? (
                                        <div style={{ gridColumn: 'span 2', padding: '2rem', textAlign: 'center' }}>
                                            <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                                        </div>
                                    ) : media.filter(m => m.type === 'after').length > 0 ? (
                                        media.filter(m => m.type === 'after').map((m: any, i: number) => (
                                            <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'white' }}>
                                                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                                                    <img src={m.file_url} alt={m.header || "After"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                {m.header && (
                                                    <div style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                                                        {m.header}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: 'span 2', padding: '1rem', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            No departure photos uploaded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Work Order & Safety */}
                <div className="detail-grid">
                    <div style={{ flex: 1, background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Work Order Relation</h4>
                        {visit.work_order ? (
                            <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>{visit.work_order.title}</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {visit.work_order.type.toUpperCase()} Ticket · Progress Captured
                                </p>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Routine Ad-hoc Visit (No Work Order link)
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Location Proof</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--border-color)'
                            }}>
                                <MapPin size={20} className="text-accent" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>CAPTURED COORDINATES</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {visit.geo_lat}, {visit.geo_lng}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {visit.site_condition_notes && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>ENGINEER NOTES</label>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                            "{visit.site_condition_notes}"
                        </p>
                    </div>
                )}
            </div>

        </Modal>
    );
}
