"use client";

import './maintain.css';
import '../dashboard.css';
import { useMaintainDashboard } from '@/hooks/useMaintainDashboard';
import {
    ClipboardList,
    Cpu,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Camera,
    CalendarClock,
    Wrench,
    ArrowRight,
    MapPin,
} from 'lucide-react';

function getStatIcon(title: string) {
    if (title.includes('Assigned') || title.includes('Work Order')) return ClipboardList;
    if (title.includes('Asset')) return Cpu;
    if (title.includes('Overdue')) return AlertTriangle;
    if (title.includes('Completed')) return CheckCircle2;
    if (title.includes('Visit')) return Camera;
    return Clock;
}

function getStatColor(color: string) {
    const colors: Record<string, { bg: string; fg: string }> = {
        blue: { bg: 'rgba(59,130,246,0.1)', fg: '#3b82f6' },
        emerald: { bg: 'rgba(16,185,129,0.1)', fg: '#10b981' },
        rose: { bg: 'rgba(239,68,68,0.1)', fg: '#ef4444' },
        purple: { bg: 'rgba(168,85,247,0.1)', fg: '#a855f7' },
    };
    return colors[color] || colors.blue;
}

export default function MaintainDashboardPage() {
    const {
        stats,
        activities,
        failureAnalysis,
        proactiveAlerts,
        loading,
        isManager,
        isEngineer,
        profile
    } = useMaintainDashboard();

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>
                        {isEngineer
                            ? `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Engineer'}`
                            : 'Maintain Dashboard'
                        }
                    </h1>
                    <p>
                        {isEngineer
                            ? 'Your assigned work orders, site visits, and field activity.'
                            : 'Site maintenance operations & asset health at a glance.'
                        }
                    </p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="maintain-stats">
                {stats.map((stat) => {
                    const Icon = getStatIcon(stat.title);
                    const c = getStatColor(stat.color);
                    return (
                        <div key={stat.title} className="stat-card clickable-stat">
                            <div className="card-top">
                                <div className="icon-box" style={{ background: c.bg, color: c.fg }}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <div className="card-content">
                                <h3>{stat.title}</h3>
                                <p className="value">{stat.value}</p>
                                <p className="sub">{stat.sub}</p>
                            </div>
                        </div>
                    );
                })}

                {loading && [1, 2, 3, 4].map(i => (
                    <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
                        <div className="card-top">
                            <div className="icon-box" style={{ background: '#334155', width: 36, height: 36 }} />
                        </div>
                        <h3>Loading…</h3>
                        <p className="value">—</p>
                        <p className="sub">&nbsp;</p>
                    </div>
                ))}
            </div>

            {/* Intelligence Section: Alerts + Breakdown */}
            <div className="main-grid intelligence-grid" style={{ marginBottom: '1.5rem' }}>
                {/* Proactive Alerts */}
                <div className="section-container">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarClock size={18} style={{ color: '#f59e0b' }} />
                        <h2 style={{ fontSize: '1.1rem' }}>Proactive Alerts</h2>
                    </div>
                    <div className="activity-list" style={{ minHeight: '200px' }}>
                        {proactiveAlerts.length === 0 && !loading && (
                            <div className="maintain-empty">All assets are currently healthy.</div>
                        )}
                        {proactiveAlerts.map((asset, idx) => (
                            <div key={idx} className="activity-item" style={{ borderLeft: `3px solid ${asset.projections?.healthStatus === 'overdue' ? '#ef4444' : '#f59e0b'}` }}>
                                <div className="item-left">
                                    <div className="item-info">
                                        <p style={{ fontWeight: 600 }}>{asset.make_model}</p>
                                        <div className="time">
                                            {asset.site?.name} · {asset.projections?.hoursRemaining}h remaining
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`status-tag ${asset.projections?.healthStatus}`} style={{ fontSize: '10px' }}>
                                        {asset.projections?.healthStatus.replace('_', ' ')}
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Due {new Date(asset.projections?.estimatedDueDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Failure breakdown */}
                <div className="section-container">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                        <h2 style={{ fontSize: '1.1rem' }}>Failure Breakdown</h2>
                    </div>
                    <div className="stat-card" style={{ padding: '1.25rem', height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.keys(failureAnalysis).length === 0 ? (
                            <div className="maintain-empty">No failure data yet to analyze.</div>
                        ) : (
                            Object.entries(failureAnalysis).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                                const total = Object.values(failureAnalysis).reduce((a, b) => a + b, 0);
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={cat} style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                            <span>{cat}</span>
                                            <span style={{ fontWeight: 700 }}>{count} ({pct}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                            Based on completed work orders with fault categorization.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main grid: Activity + Quick Actions */}
            <div className="main-grid">
                <div>
                    <div className="section-header">
                        <h2>{isEngineer ? 'My Recent Activity' : 'Recent Work Orders'}</h2>
                    </div>
                    <div className="activity-list">
                        {activities.length === 0 && !loading && (
                            <div className="maintain-empty">
                                {isEngineer
                                    ? 'No assigned work orders yet. Check back later!'
                                    : 'No recent work orders yet.'
                                }
                            </div>
                        )}
                        {activities.map((a, idx) => (
                            <div key={idx} className="activity-item">
                                <div className="item-left">
                                    <div className="avatar" style={{
                                        background: a.priority === 'critical' ? '#ef4444'
                                            : a.priority === 'high' ? '#f59e0b' : '#334155'
                                    }}>
                                        {a.user === 'You' ? '👷' : a.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="item-info">
                                        <p><span>{a.user}</span> — {a.action}</p>
                                        <div className="time">{a.target} · {a.time}</div>
                                    </div>
                                </div>
                                <span className={`status-tag ${a.status}`}>{a.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="action-buttons">
                        {/* Engineer gets field-focused actions */}
                        {isEngineer ? (
                            <>
                                <a href="/dashboard/maintain/work-orders" className="action-btn">
                                    <div className="icon-wrap"><ClipboardList size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">My Work Orders</span>
                                        <span className="sub">View assigned tasks</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/visit-reports" className="action-btn">
                                    <div className="icon-wrap"><Camera size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">Visit Reports</span>
                                        <span className="sub">Submit before/after logs</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/assets" className="action-btn">
                                    <div className="icon-wrap"><Cpu size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">Site Assets</span>
                                        <span className="sub">View equipment at your sites</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/knowledge-base" className="action-btn">
                                    <div className="icon-wrap"><Wrench size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">SOPs & Guides</span>
                                        <span className="sub">Reference procedures</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                            </>
                        ) : (
                            <>
                                <a href="/dashboard/maintain/work-orders" className="action-btn">
                                    <div className="icon-wrap"><ClipboardList size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">Work Orders</span>
                                        <span className="sub">Create & manage tickets</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/assets" className="action-btn">
                                    <div className="icon-wrap"><Cpu size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">Asset Registry</span>
                                        <span className="sub">Manage site equipment</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/visit-reports" className="action-btn">
                                    <div className="icon-wrap"><Camera size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">Visit Reports</span>
                                        <span className="sub">Engineer photo logs</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                                <a href="/dashboard/maintain/schedule" className="action-btn">
                                    <div className="icon-wrap"><CalendarClock size={18} /></div>
                                    <div className="text-wrap">
                                        <span className="label">PM Schedule</span>
                                        <span className="sub">Preventive maintenance calendar</span>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
