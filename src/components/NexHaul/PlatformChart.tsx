'use client';

import React from 'react';

interface PlatformChartProps {
    data: { label: string; value: number; color: string }[];
    title: string;
    type: 'pie' | 'bar';
}

export default function PlatformChart({ data, title, type }: PlatformChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    // Simple SVG Pie Chart Logic
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="platform-chart" style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '24px',
            borderRadius: '32px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.5s ease'
        }}>
            <h4 style={{
                fontSize: '10px',
                fontWeight: 900,
                color: '#64748b',
                marginBottom: '32px',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                {title}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '40px', flex: 1 }}>
                <div className="chart-container" style={{ position: 'relative', width: '176px', height: '176px', flexShrink: 0 }}>
                    <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ width: '100%', height: '100%' }}>
                        <g transform="rotate(-90)">
                            {data.map((slice, i) => {
                                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                                const percent = slice.value / (total || 1);
                                cumulativePercent += percent;
                                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                                const largeArcFlag = percent > 0.5 ? 1 : 0;
                                const pathData = [
                                    `M ${startX} ${startY}`,
                                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                    `L 0 0`,
                                ].join(' ');

                                return (
                                    <path
                                        key={i}
                                        d={pathData}
                                        fill={slice.color}
                                        style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                    />
                                );
                            })}
                        </g>
                        {/* Perfect Donut Hole with Background Match */}
                        <circle cx="0" cy="0" r="0.75" fill="#0f172a" />

                        {/* Centered Stats - Now Upright */}
                        <text x="0" y="0.08" textAnchor="middle" fill="white" style={{ fontSize: '0.45px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                            {total}
                        </text>
                        <text x="0" y="0.28" textAnchor="middle" fill="#64748b" style={{ fontSize: '0.12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            Total
                        </text>
                    </svg>
                </div>

                <div className="legend" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, width: '100%' }}>
                    {data.map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', background: item.color, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {item.label}
                                    </span>
                                </div>
                                <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>{item.value || 0}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                                        height: '100%',
                                        backgroundColor: item.color,
                                        borderRadius: '10px',
                                        transition: 'all 1s ease-in-out',
                                        opacity: 0.6
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
