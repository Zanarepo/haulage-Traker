"use client";

import React from 'react';
import { usePlatformDashboard } from '@/hooks/usePlatformDashboard';
import LoadingScreen from '@/components/common/LoadingScreen';
import {
    Building2,
    ShieldCheck,
    Zap,
    Wrench,
    TrendingUp,
    Activity,
    AlertCircle,
    Package
} from 'lucide-react';
import PlatformChart from '@/components/NexHaul/PlatformChart';
import { useAuth } from '@/hooks/useAuth';
import './Overview.css';

export default function NexHaulOverview() {
    const { profile, platformProfile } = useAuth();
    const { metrics, growth, loading, error } = usePlatformDashboard();
    const isSuper = platformProfile?.role === 'nexsuper';

    if (loading && !metrics) {
        return <LoadingScreen message="Loading platform overview..." />;
    }

    if (error) {
        return (
            <div className="p-8 bg-red-900/10 border border-red-900/20 rounded-2xl flex items-center gap-4 text-red-500">
                <AlertCircle />
                <div>
                    <div className="font-bold">Failed to load system data</div>
                    <div className="text-sm opacity-80">{error}</div>
                </div>
            </div>
        );
    }

    const statCards = [
        { title: 'Total Registered', value: metrics?.totalCompanies || 0, icon: <Building2 size={22} className="text-blue-500" />, trend: '+12% this month' },
        { title: 'Network Trips', value: metrics?.totalTrips || 0, icon: <Activity size={22} className="text-green-500" />, trend: 'Aggregated volume' },
        { title: 'Active Assets', value: metrics?.totalWorkOrders || 0, icon: <Package size={22} className="text-orange-500" />, trend: 'Maintain ecosystem' },
        { title: 'System Uptime', value: '99.9%', icon: <Zap size={22} className="text-yellow-500" />, trend: 'Real-time monitoring' },
    ];

    const moduleData = [
        { label: 'Logistics Only', value: metrics?.moduleDistribution.logistics || 0, color: '#3b82f6' },
        { label: 'Maintain Only', value: metrics?.moduleDistribution.maintenance || 0, color: '#a855f7' },
        { label: 'Full Suite', value: metrics?.moduleDistribution.both || 0, color: '#22c55e' },
    ];

    return (
        <div className="overview-page">
            <div className="metrics-grid">
                {statCards.map((card, i) => (
                    <div key={i} className="metric-card">
                        <div className="card-top">
                            <span className="icon-wrapper">{card.icon}</span>
                            <span className="rt-badge">Real-time</span>
                        </div>
                        <div className="metric-label">{card.title}</div>
                        <div className="metric-value">
                            {loading ? '...' : card.value}
                        </div>
                        <div className="trend-badge">
                            <TrendingUp size={14} />
                            {card.trend}
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="chart-item">
                    <PlatformChart
                        title="Module Adoption Distribution"
                        data={moduleData}
                        type="pie"
                    />
                </div>

                <div className="pulse-section">
                    <div className="pulse-header">
                        <div>
                            <h3>
                                <TrendingUp size={20} className="text-blue-400" />
                                Ecosystem Activity Pulse
                            </h3>
                            <p className="pulse-desc">Platform-wide logistics & maintenance events (Last 30 days)</p>
                        </div>
                        <button className="view-report">Full Report</button>
                    </div>

                    <div className="pulse-content">
                        {loading ? (
                            <div className="loading-shimmer">
                                {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl mb-3 animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="pulse-metrics">
                                <div className="pulse-item logistics">
                                    <span className="label">Total System Transactions</span>
                                    <span className="value">{growth?.trips.length || 0}</span>
                                </div>
                                <div className="pulse-item maintenance">
                                    <span className="label">New Onboarded Companies</span>
                                    <span className="value">{growth?.newCompanies.length || 0}</span>
                                </div>
                                <div className="placeholder-graph">
                                    <p>Visual activity graph will render here as data points accumulate.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
