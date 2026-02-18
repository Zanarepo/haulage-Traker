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
            <div className="report-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>SELECT CLUSTER</label>
                    <select
                        value={selectedClusterId}
                        onChange={(e) => setSelectedClusterId(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    >
                        <option value="">Choose cluster...</option>
                        {allEngineers.map(eng => <option key={eng.id} value={eng.id}>{eng.full_name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>SELECT MONTH</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '0.4rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    />
                </div>
                <button className="btn-maintain-action" onClick={loadReport} disabled={loading || !selectedClusterId} style={{ height: '42px' }}>
                    <Refresh size={16} /> Generate
                </button>
            </div>

            {loading ? (
                <div className="maintain-empty">Calculating inventory balances...</div>
            ) : report ? (
                <div className="report-display">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="stat-card">
                            <span className="label">OPENING BALANCE</span>
                            <span className="value">{report.opening} <small>pcs</small></span>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '3px solid #10b981' }}>
                            <span className="label" style={{ color: '#10b981' }}>RECEIVED(+)</span>
                            <span className="value">{report.received} <small>pcs</small></span>
                            <TrendingUp size={14} color="#10b981" />
                        </div>
                        <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
                            <span className="label" style={{ color: '#ef4444' }}>USED(-)</span>
                            <span className="value">{report.used} <small>pcs</small></span>
                            <TrendingDown size={14} color="#ef4444" />
                        </div>
                        <div className="stat-card" style={{ background: 'var(--brand-main)', color: 'white' }}>
                            <span className="label" style={{ opacity: 0.8 }}>CLOSING BALANCE</span>
                            <span className="value" style={{ color: 'white' }}>{report.closing} <small>pcs</small></span>
                        </div>
                    </div>

                    <div className="maintain-empty" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)' }}>
                        <p style={{ fontSize: '0.85rem' }}>Detailed itemized breakdown per cluster month coming soon.</p>
                        <button className="btn-cancel" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

            <style jsx>{`
                .stat-card {
                    background: var(--bg-card);
                    padding: 1.5rem;
                    border-radius: 1rem;
                    border: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    position: relative;
                }
                .stat-card .label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-card .value {
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: var(--text-main);
                }
                .stat-card .value small {
                    font-size: 0.8rem;
                    font-weight: 600;
                    opacity: 0.6;
                }
                .stat-card :global(svg) {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                }
            `}</style>
        </div>
    );
}

function Refresh({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>;
}
