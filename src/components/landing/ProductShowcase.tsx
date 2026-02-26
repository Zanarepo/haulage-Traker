"use client";

import React, { useState } from 'react';
import {
    ShieldCheck,
    Package,
    Truck,
    RotateCcw,
    Lock
} from 'lucide-react';
import './showcase.css';

const SHOWCASE_VIEWS = [
    {
        id: 'admin',
        label: 'Super Admin',
        icon: ShieldCheck,
        image: '/screenshots/Superadmin.png',
        title: 'Enterprise Mission Control',
        description: 'Complete visibility over every site and team. Catch anomalies and verify audits from a single unified dashboard.',
        url: 'app.nexhaul.com/dashboard'
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: Package,
        image: '/screenshots/Inventory.png',
        title: 'Precision Asset Tracking',
        description: 'Real-time fuel levels and asset monitoring. Stop theft and leakage before they impact your bottom line.',
        url: 'app.nexhaul.com/dashboard/inventory'
    },
    {
        id: 'trips',
        label: 'Trips & Logistics',
        icon: Truck,
        image: '/screenshots/Trips&logistics.png',
        title: 'Automated Dispatch',
        description: 'Smart driver assignment and tamper-proof delivery tracking. Know where your product is every second of the trip.',
        url: 'app.nexhaul.com/dashboard/trips'
    },
    {
        id: 'reconciliation',
        label: 'Reconciliation',
        icon: RotateCcw,
        image: '/screenshots/reconciliation.png',
        title: 'Instant Financial Closure',
        description: 'Turn weeks of manual reconciliation into seconds. Automatically detect shortages and generate verified reports.',
        url: 'app.nexhaul.com/dashboard/reconciliation'
    },
];

export default function ProductShowcase() {
    const [activeView, setActiveView] = useState('admin');

    const currentView = SHOWCASE_VIEWS.find(v => v.id === activeView) || SHOWCASE_VIEWS[0];

    return (
        <section className="showcase-section">
            <div className="section-header">
                <h2>Inside NexHaul InfraSupply</h2>
                <p>A powerful, centralized mission control for your entire infrastructure supply chain.</p>
            </div>

            <div className="showcase-tabs">
                {SHOWCASE_VIEWS.map(view => (
                    <button
                        key={view.id}
                        className={`showcase-tab ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        <view.icon size={16} />
                        {view.label}
                    </button>
                ))}
            </div>

            <div className="showcase-browser">
                <div className="browser-toolbar">
                    <div className="toolbar-dot dot-red"></div>
                    <div className="toolbar-dot dot-yellow"></div>
                    <div className="toolbar-dot dot-green"></div>
                    <div className="toolbar-url">
                        <Lock size={10} className="lock-icon" />
                        {currentView.url}
                    </div>
                </div>
                <div className="screenshot-container">
                    <img
                        src={currentView.image}
                        alt={currentView.title}
                        loading="lazy"
                    />
                    <div className="screenshot-label">
                        <h4>{currentView.title}</h4>
                        <p>{currentView.description}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
