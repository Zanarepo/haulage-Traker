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
                <div className="header-actions">
                    <button className="btn-maintain-action">
                        <Plus size={18} />
                        New SOP
                    </button>
                </div>
            </header>

            <div className="maintain-stats">
                <div className="stat-card clickable-stat">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            ⚡
                        </div>
                    </div>
                    <div className="card-content">
                        <h3>Generator SOPs</h3>
                        <p className="value">Startup & Shutdown</p>
                        <p className="sub">Main Warehouse Procedures</p>
                    </div>
                </div>
                <div className="stat-card clickable-stat">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            🔌
                        </div>
                    </div>
                    <div className="card-content">
                        <h3>Electrical SOPs</h3>
                        <p className="value">Inverters & Rectifiers</p>
                        <p className="sub">Safety-critical procedures</p>
                    </div>
                </div>
                <div className="stat-card clickable-stat">
                    <div className="card-top">
                        <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            ❄️
                        </div>
                    </div>
                    <div className="card-content">
                        <h3>HVAC SOPs</h3>
                        <p className="value">AC & Cooling Units</p>
                        <p className="sub">Maintenance checklists</p>
                    </div>
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
