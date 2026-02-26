"use client";

import React, { useEffect, useState } from 'react';
import { platformService } from '@/services/platformService';
import {
    DollarSign,
    TrendingUp,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    PieChart
} from 'lucide-react';
import PlatformChart from '@/components/NexHaul/PlatformChart';

export default function RevenuePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRevenue() {
            try {
                setLoading(true);
                const data = await platformService.getRevenueStats();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadRevenue();
    }, []);

    const kpis = [
        { title: 'Monthly Recurring Revenue', value: `$${stats?.mrr.toLocaleString() || '0'}`, icon: <DollarSign className="text-green-400" />, trend: '+8.4%' },
        { title: 'Annual Run Rate', value: `$${stats?.totalRevenue.toLocaleString() || '0'}`, icon: <TrendingUp className="text-blue-400" />, trend: '+12.1%' },
        { title: 'Active Subscriptions', value: stats?.activeSubscriptions || 0, icon: <Users className="text-purple-400" />, trend: '+2 new' },
        { title: 'Avg. Revenue Per Unit', value: `$${Math.round((stats?.mrr || 0) / (stats?.activeSubscriptions || 1))}`, icon: <CreditCard className="text-orange-400" />, trend: '+3.2%' },
    ];

    return (
        <div className="revenue-page">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white">Financial Mission Control</h2>
                    <p className="text-gray-400 mt-1 text-lg">Monitor platform growth, MRR, and subscription health.</p>
                </div>
                <button className="bg-white text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-gray-200 transition-all flex items-center gap-2">
                    <DollarSign size={18} />
                    Export Financial Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl group hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-gray-800 rounded-2xl group-hover:scale-110 transition-transform">
                                {kpi.icon}
                            </div>
                            <span className="flex items-center gap-1 text-xs font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={14} />
                                {kpi.trend}
                            </span>
                        </div>
                        <div className="text-gray-500 text-sm font-bold uppercase tracking-widest">{kpi.title}</div>
                        <div className="text-4xl font-black mt-2 text-white">
                            {loading ? '...' : kpi.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <PlatformChart
                        title="Revenue by Tier"
                        data={stats?.tierDistribution || []}
                        type="pie"
                    />
                </div>

                <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-2">
                        <PieChart size={20} className="text-purple-400" />
                        Subscription Health
                    </h3>

                    <div className="space-y-6">
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between text-sm">
                                <span className="text-purple-400 font-bold uppercase tracking-wider">Retention Rate</span>
                                <span className="text-white font-black">94%</span>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                                <div style={{ width: "94%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                            </div>
                        </div>

                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between text-sm">
                                <span className="text-blue-400 font-bold uppercase tracking-wider">Growth Target</span>
                                <span className="text-white font-black">68%</span>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                                <div style={{ width: "68%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl">
                            <h4 className="font-bold text-white mb-2">Revenue Insight</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Professional tier (Logistics) remains the strongest growth driver.
                                Consider expanding Enterprise bundle features to increase ASP (Average Selling Price).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .revenue-page {
                    animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
