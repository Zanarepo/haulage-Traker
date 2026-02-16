"use client";

import '../maintain.css';
import '../../dashboard.css';
import { FileBarChart, Download, Calendar } from 'lucide-react';

export default function ReportsCentrePage() {
    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Reports Centre</h1>
                    <p>Generate, export, and schedule PDF/CSV maintenance reports.</p>
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            <FileBarChart size={20} />
                        </div>
                    </div>
                    <h3>Visit Summary</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>Engineer visit logs</p>
                    <p className="sub">PDF / CSV export</p>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <h3>PM Compliance</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>On-time vs overdue</p>
                    <p className="sub">Monthly breakdown</p>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            <Download size={20} />
                        </div>
                    </div>
                    <h3>Engineer Performance</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>Tickets / response time</p>
                    <p className="sub">Team analytics</p>
                </div>
            </div>

            <div className="activity-list">
                <div className="maintain-empty">
                    <FileBarChart size={32} />
                    <p>Generated reports will appear here. Click a report type above to generate.</p>
                </div>
            </div>
        </div>
    );
}
