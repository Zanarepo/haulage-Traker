"use client";

import '../maintain.css';
import '../../dashboard.css';
import { CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PMSchedulePage() {
    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>PM Schedule</h1>
                    <p>Calendar view of upcoming preventive maintenance tasks.</p>
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <h3>Overdue PMs</h3>
                    <p className="value">—</p>
                    <p className="sub">Requires immediate attention</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            <CalendarClock size={20} />
                        </div>
                    </div>
                    <h3>Due This Week</h3>
                    <p className="value">—</p>
                    <p className="sub">Scheduled maintenance</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <h3>PM Compliance</h3>
                    <p className="value">—%</p>
                    <p className="sub">On-time completion rate</p>
                </div>
            </div>

            <div className="activity-list">
                <div className="maintain-empty">
                    <CalendarClock size={32} />
                    <p>PM Schedule calendar will populate as assets and service intervals are configured.</p>
                </div>
            </div>
        </div>
    );
}
