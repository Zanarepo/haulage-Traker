"use client";

import React from 'react';
import Modal from '@/components/Modal/Modal';
import {
    AlertTriangle,
    CalendarClock,
    ChevronRight,
    MapPin,
    Gauge,
    Clock,
    Wrench,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface PMMetricModalProps {
    isOpen: boolean;
    onClose: () => void;
    metric: 'overdue' | 'due_week' | 'compliance' | null;
    assets: any[];
    onAssetClick: (asset: any) => void;
}

export default function PMMetricModal({
    isOpen,
    onClose,
    metric,
    assets,
    onAssetClick
}: PMMetricModalProps) {
    if (!metric) return null;

    const titles: Record<string, { label: string; icon: any; color: string; sub: string }> = {
        overdue: {
            label: "Critical Attention Required",
            icon: <AlertTriangle size={20} />,
            color: "#ef4444",
            sub: "Assets that have exceeded their recommended service limits."
        },
        due_week: {
            label: "Scheduled for this Week",
            icon: <CalendarClock size={20} />,
            color: "#f59e0b",
            sub: "Assets predicted to hit their limit within the next 7 days."
        },
        compliance: {
            label: "PM Compliance Audit",
            icon: <TrendingUp size={20} />,
            color: "#10b981",
            sub: "Overall maintenance health and cluster performance."
        }
    };

    const config = titles[metric];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: `${config.color}15`,
                        color: config.color,
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex'
                    }}>
                        {config.icon}
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{config.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{config.sub}</div>
                    </div>
                </div>
            }
            maxWidth="600px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {assets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No assets found in this category.</p>
                    </div>
                ) : (
                    assets.map(asset => {
                        const dueDate = asset.projections?.estimatedDueDate ? new Date(asset.projections.estimatedDueDate) : null;
                        const hoursOver = asset.projections?.hoursSinceService - (asset.pm_interval_hours || 250);

                        return (
                            <div
                                key={asset.id}
                                onClick={() => {
                                    onAssetClick(asset);
                                    onClose();
                                }}
                                style={{
                                    background: 'var(--bg-hover)',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 0.2s',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${config.color}40`}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-muted)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {asset.type}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{asset.make_model}</h4>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <MapPin size={12} />
                                            <span>{asset.site?.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <Gauge size={12} />
                                            <span>Current: {asset.hour_meter}h</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        marginTop: '8px',
                                        paddingTop: '8px',
                                        borderTop: '1px solid var(--border-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        {metric === 'overdue' ? (
                                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                                                {hoursOver > 0 ? `+${hoursOver.toFixed(0)}h exceeded` : "Overdue (Date)"}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                                                Due {dueDate ? format(dueDate, 'MMM dd') : 'Soon'}
                                            </span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            <Clock size={12} />
                                            <span>Velocity: {asset.projections?.avgDailyRuntime.toFixed(1)}h/day</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        );
                    })
                )}
            </div>
        </Modal>
    );
}
