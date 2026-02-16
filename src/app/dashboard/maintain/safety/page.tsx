"use client";

import '../maintain.css';
import '../../dashboard.css';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export default function SafetyCompliancePage() {
    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Safety Compliance</h1>
                    <p>Safety checklist completion rates and failed checks tracking.</p>
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <h3>Checklists Passed</h3>
                    <p className="value">—</p>
                    <p className="sub">This month</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <XCircle size={20} />
                        </div>
                    </div>
                    <h3>Failed Checks</h3>
                    <p className="value">—</p>
                    <p className="sub">Requires review</p>
                </div>
                <div className="stat-card">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                    <h3>Compliance Rate</h3>
                    <p className="value">—%</p>
                    <p className="sub">Safety standard adherence</p>
                </div>
            </div>

            <div className="activity-list">
                <div className="maintain-empty">
                    <ShieldAlert size={32} />
                    <p>Safety checklists will appear here as engineers complete site visits.</p>
                </div>
            </div>
        </div>
    );
}
