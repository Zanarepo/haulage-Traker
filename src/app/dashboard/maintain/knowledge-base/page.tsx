"use client";

import '../maintain.css';
import '../../dashboard.css';
import { BookOpen, Plus } from 'lucide-react';

export default function KnowledgeBasePage() {
    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Knowledge Base</h1>
                    <p>Standard Operating Procedures and step-by-step maintenance guides.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-maintain-action">
                        <Plus size={18} />
                        New SOP
                    </button>
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '1.25rem' }}>
                            ⚡
                        </div>
                    </div>
                    <h3>Generator SOPs</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>Startup, shutdown, servicing</p>
                    <p className="sub">Step-by-step guides</p>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '1.25rem' }}>
                            🔌
                        </div>
                    </div>
                    <h3>Electrical SOPs</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>Inverters, rectifiers, UPS</p>
                    <p className="sub">Safety-critical procedures</p>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '1.25rem' }}>
                            ❄️
                        </div>
                    </div>
                    <h3>HVAC SOPs</h3>
                    <p className="value" style={{ fontSize: '1rem' }}>AC units, cooling systems</p>
                    <p className="sub">Maintenance checklists</p>
                </div>
            </div>

            <div className="activity-list">
                <div className="maintain-empty">
                    <BookOpen size={32} />
                    <p>Create your first SOP to build your team&apos;s knowledge base.</p>
                </div>
            </div>
        </div>
    );
}
