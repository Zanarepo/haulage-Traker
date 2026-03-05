"use client";

import '../maintain.css';
import '../../dashboard.css';
import { ShieldAlert, CheckCircle2, XCircle, Clock, MapPin, User, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useCompliance } from '@/hooks/useCompliance';
import { formatDistanceToNow } from 'date-fns';

export default function SafetyCompliancePage() {
    const { stats, loading } = useCompliance();

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Safety Compliance</h1>
                    <p>Safety checklist completion rates and failed checks tracking.</p>
                </div>
            </header>

            <div className="maintain-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <h3>Checklists Passed</h3>
                    <p className="value">{loading ? '...' : (stats?.checklistsPassed || 0)}</p>
                    <p className="sub">This month</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <XCircle size={20} />
                        </div>
                    </div>
                    <h3>Failed Checks</h3>
                    <p className="value">{loading ? '...' : (stats?.failedChecks || 0)}</p>
                    <p className="sub">Requires review</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                    <h3>Compliance Rate</h3>
                    <p className="value">{loading ? '...' : (stats?.complianceRate || 0)}%</p>
                    <p className="sub">Safety standard adherence</p>
                </div>
            </div>

            <div className="compliance-activity-list" style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} style={{ color: 'var(--text-muted)' }} />
                    Recent Activity Logs
                </h2>

                <div className="activity-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        <div className="maintain-empty">
                            <Clock className="animate-spin" size={32} />
                            <p>Loading compliance logs...</p>
                        </div>
                    ) : stats?.recentEvents && stats.recentEvents.length > 0 ? (
                        stats.recentEvents.map((event) => (
                            <div
                                key={event.id}
                                className="activity-row"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto',
                                    alignItems: 'center',
                                    gap: '1.25rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: event.status === 'pass' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: event.status === 'pass' ? '#10b981' : '#ef4444'
                                }}>
                                    {event.type === 'sop' ? <ClipboardCheck size={20} /> : <ShieldAlert size={20} />}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{event.title}</h4>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '20px',
                                            background: event.status === 'pass' ? 'rgba(16,185,129,0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: event.status === 'pass' ? '#10b981' : '#ef4444',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${event.status === 'pass' ? 'rgba(16,185,129,0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {event.status === 'pass' ? 'PASSED' : 'FAILED / BREACH'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <User size={12} />
                                            <span>{event.userName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} />
                                            <span>{event.siteName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            <span>{formatDistanceToNow(new Date(event.submitted_at))} ago</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ color: 'var(--text-muted)' }}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="maintain-empty">
                            <ShieldAlert size={32} />
                            <p>Safety checklists will appear here as engineers complete site visits.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
