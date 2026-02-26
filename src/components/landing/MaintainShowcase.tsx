"use client";

import React, { useState } from 'react';
import {
    LayoutDashboard,
    Cpu,
    ClipboardList,
    CalendarClock,
    PackageCheck,
    Lock
} from 'lucide-react';
import './showcase.css';

const MAINTAIN_VIEWS = [
    {
        id: 'engineer',
        label: 'Engineer Dashboard',
        icon: LayoutDashboard,
        image: '/screenshots/EngineerDashboard.png',
        title: 'Mission Control for Field Engineers',
        description: 'Personalized dashboard for site engineers to track active work orders, pending reports, and asset health.',
        url: 'app.nexhaul.com/dashboard'
    },
    {
        id: 'assets',
        label: 'Asset Registry',
        icon: Cpu,
        image: '/screenshots/AssetRegistry.png',
        title: 'Intelligent Asset Registry',
        description: 'Comprehensive database of all equipment (Generators, ACs, Inverters) with full service history and health metrics.',
        url: 'app.nexhaul.com/dashboard/maintain/assets'
    },
    {
        id: 'work-orders',
        label: 'Work Orders',
        icon: ClipboardList,
        image: '/screenshots/Workorder.png',
        title: 'Automated Work Orders',
        description: 'Convert fault reports into actionable tasks. Track progress from dispatch to completion with full audit trails.',
        url: 'app.nexhaul.com/dashboard/maintain/work-orders'
    },
    {
        id: 'schedule',
        label: 'PM Schedule',
        icon: CalendarClock,
        image: '/screenshots/PMSchedule.png',
        title: 'Preventive Maintenance Scheduling',
        description: 'Intelligent calendar view that predicts and schedules services before breakdowns occur, preventing costly downtime.',
        url: 'app.nexhaul.com/dashboard/maintain/schedule'
    },
    {
        id: 'tracking',
        label: 'Supply Tracking',
        icon: PackageCheck,
        image: '/screenshots/SupplyTracking.png',
        title: 'Maintenance Supply Tracking',
        description: 'Granular tracking of spares and materials used during maintenance to ensure zero inventory leakage.',
        url: 'app.nexhaul.com/dashboard/maintain/supplies'
    },
];

export default function MaintainShowcase() {
    const [activeView, setActiveView] = useState('engineer');

    const currentView = MAINTAIN_VIEWS.find(v => v.id === activeView) || MAINTAIN_VIEWS[0];

    return (
        <section className="showcase-section maintain">
            <div className="section-header">
                <h2>Experience NexHaul Maintain</h2>
                <p>An enterprise-grade maintenance management system (CMMS) built for the rigorous needs of Telecom and IT infrastructure.</p>
            </div>

            <div className="showcase-tabs">
                {MAINTAIN_VIEWS.map(view => (
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
