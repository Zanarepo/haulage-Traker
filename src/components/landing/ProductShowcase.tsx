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
        title: 'Super Admin Dashboard',
        description: 'Complete system overview with KPIs, team management, and security controls.',
        url: 'app.nexhaul.com/dashboard'
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: Package,
        image: '/screenshots/Inventory.png',
        title: 'Inventory Management',
        description: 'Real-time fuel levels, asset monitoring, and supply chain visibility.',
        url: 'app.nexhaul.com/dashboard/inventory'
    },
    {
        id: 'trips',
        label: 'Trips & Logistics',
        icon: Truck,
        image: '/screenshots/Trips&logistics.png',
        title: 'Trips & Logistics',
        description: 'Active trip dispatching, driver assignments, and delivery tracking.',
        url: 'app.nexhaul.com/dashboard/trips'
    },
    {
        id: 'reconciliation',
        label: 'Reconciliation',
        icon: RotateCcw,
        image: '/screenshots/reconciliation.png',
        title: 'Supplies Reconciliation',
        description: 'Period-based audits, shortage/overage detection, and verified reports.',
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
