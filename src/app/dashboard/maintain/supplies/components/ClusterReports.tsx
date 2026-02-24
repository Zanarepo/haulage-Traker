"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

interface ClusterReportsProps {
    companyId: string;
    allEngineers: any[];
}

export default function ClusterReports({ companyId, allEngineers }: ClusterReportsProps) {
    const [selectedClusterId, setSelectedClusterId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (selectedClusterId && selectedMonth) {
            loadReport();
        }
    }, [selectedClusterId, selectedMonth]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const data = await maintainService.getMonthlyClusterInventory(companyId, selectedClusterId, selectedMonth);
            setReport(data);
        } catch (err) {
            console.error('[loadReport]', err);
            showToast('Failed to load inventory report.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cluster-reports">
            <div className="report-controls">
                <div className="form-group">
                    <label>SELECT CLUSTER</label>
                    <select
                        value={selectedClusterId}
                        onChange={(e) => setSelectedClusterId(e.target.value)}
                    >
                        <option value="">Choose cluster...</option>
                        {allEngineers.map(eng => <option key={eng.id} value={eng.id}>{eng.full_name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>SELECT MONTH</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
                <button className="btn-maintain-action" onClick={loadReport} disabled={loading || !selectedClusterId}>
                    <Refresh size={16} /> Generate
                </button>
            </div>

            {loading ? (
                <div className="maintain-empty">Calculating inventory balances...</div>
            ) : report ? (
                <div className="report-display">
                    <div className="stat-card-grid">
                        <div className="stat-card">
                            <span className="label">OPENING BALANCE</span>
                            <span className="value">{report.opening} <small>pcs</small></span>
                        </div>
                        <div className="stat-card received">
                            <span className="label">RECEIVED(+)</span>
                            <span className="value">{report.received} <small>pcs</small></span>
                            <TrendingUp size={14} className="trend-icon" />
                        </div>
                        <div className="stat-card used">
                            <span className="label">USED(-)</span>
                            <span className="value">{report.used} <small>pcs</small></span>
                            <TrendingDown size={14} className="trend-icon" />
                        </div>
                        <div className="stat-card closing">
                            <span className="label">CLOSING BALANCE</span>
                            <span className="value">{report.closing} <small>pcs</small></span>
                        </div>
                    </div>

                    <div className="maintain-empty download-box">
                        <p>Detailed itemized breakdown per cluster month coming soon.</p>
                        <button className="btn-cancel">
                            <Download size={14} /> Export CSV Report
                        </button>
                    </div>
                </div>
            ) : (
                <div className="maintain-empty">
                    <FileText size={48} style={{ opacity: 0.2 }} />
                    <p>Select a cluster and month to view inventory movement reports.</p>
                </div>
            )}
        </div>
    );
}

function Refresh({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>;
}
