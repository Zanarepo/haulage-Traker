"use client";

import '../dashboard.css';
import { useDashboard } from '@/hooks/useDashboard';
import {
    Truck,
    Package,
    Users as UsersIcon,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    BarChart3,
    RefreshCcw,
    Database
} from 'lucide-react';

// Map icons at render time — React components can't survive JSON serialization
function getStatIcon(title: string) {
    if (title.includes('Trip')) return Truck;
    if (title.includes('Product') || title.includes('Supplies') || title.includes('Fuel') || title.includes('Delivery')) return Package;
    if (title.includes('Alert')) return AlertTriangle;
    if (title.includes('Clusters')) return UsersIcon;
    if (title.includes('Completed')) return CheckCircle2;
    return Clock;
}

export default function DashboardPage() {
    const {
        profile,
        isOnline,
        stats,
        activities,
        lastUpdated
    } = useDashboard();

    return (
        <div className="dashboard-content">
            <header className="page-header">
                <div className="header-main">
                    <h1>Welcome, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
                    {!isOnline && (
                        <div className="offline-badge">
                            <Database size={12} />
                            <span>Offline Mode (Cached)</span>
                        </div>
                    )}
                </div>
                <div className="header-meta">
                    <p>Your control center for supply monitoring and logistics.</p>
                    {lastUpdated && (
                        <span className="sync-time">
                            <Clock size={10} /> Last synced: {new Date(lastUpdated).toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((s: any, idx: number) => {
                    const IconComponent = getStatIcon(s.title);
                    return <StatCard key={idx} {...s} icon={<IconComponent size={22} />} />;
                })}
            </div>

            <div className="main-grid">
                <section className="activities-section">
                    <div className="section-header">
                        <h2>Recent Activities</h2>
                        <button className="text-btn">View All</button>
                    </div>
                    <div className="activity-list">
                        {activities.length > 0 ? (
                            activities.map((act: any, idx: number) => (
                                <ActivityItem key={idx} {...act} />
                            ))
                        ) : (
                            <div className="empty-state">No activities cached yet.</div>
                        )}
                    </div>
                </section>

                <section className="actions-section">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                        {isOnline ? (
                            <div className="online-indicator">
                                <RefreshCcw size={12} className="spinning" />
                                <span>Live System</span>
                            </div>
                        ) : (
                            <div className="offline-indicator">Limited Actions</div>
                        )}
                    </div>
                    <div className={`action-buttons ${!isOnline ? 'offline' : ''}`}>
                        {profile?.role !== 'driver' ? (
                            <>
                                <ActionButton label="Dispatch Trip" sub="Assign driver" icon={<Truck size={18} />} color="blue" />
                                <ActionButton label="Finance Review" sub="Approve haulage" icon={<BarChart3 size={18} />} color="purple" />
                                <ActionButton label="Site Audit" sub="Verify levels" icon={<AlertTriangle size={18} />} color="rose" />
                            </>
                        ) : (
                            <>
                                <a href="/dashboard/reconciliation" style={{ textDecoration: 'none' }}>
                                    <ActionButton label="My Balance" sub="View reconciliation" icon={<RefreshCcw size={18} />} color="blue" />
                                </a>
                                <a href="/dashboard/trips" style={{ textDecoration: 'none' }}>
                                    <ActionButton label="Recent Trips" sub="View history" icon={<Truck size={18} />} color="purple" />
                                </a>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ title, value, sub, icon, trend, color }: any) {
    const colors: any = {
        blue: '#3b82f6',
        emerald: '#10b981',
        rose: '#ef4444',
        purple: '#a855f7'
    };

    return (
        <div className="stat-card">
            <div className="card-top">
                <div className="icon-box" style={{ background: `${colors[color]}15`, color: colors[color] }}>
                    {icon}
                </div>
                {trend && (
                    <div className={`trend ${trend.startsWith('+') ? 'up' : 'down'}`}>
                        {trend} {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </div>
                )}
            </div>
            <div className="card-bottom">
                <h3>{title}</h3>
                <p className="value">{value}</p>
                <p className="sub">{sub}</p>
            </div>
        </div>
    );
}

function ActivityItem({ user, action, target, time, status }: any) {
    return (
        <div className="activity-item">
            <div className="item-left">
                <div className="avatar">{user[0]}</div>
                <div className="item-info">
                    <p><strong>{user}</strong> {action} <span>{target}</span></p>
                    <span className="time">{time}</span>
                </div>
            </div>
            <div className={`status-tag ${status}`}>{status}</div>
        </div>
    );
}

function ActionButton({ label, sub, icon, color }: any) {
    const colors: any = {
        blue: '#3b82f6',
        purple: '#a855f7',
        rose: '#ef4444'
    };

    return (
        <button className="action-btn">
            <div className="icon-wrap" style={{ color: colors[color] }}>{icon}</div>
            <div className="text-wrap">
                <span className="label">{label}</span>
                <span className="sub">{sub}</span>
            </div>
        </button>
    );
}
