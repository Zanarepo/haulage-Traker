import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

export default function NexHaulLogo({ className = "", size = 48, showText = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
                width={size}
                height={size * 0.8}
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Globe Background */}
                <circle cx="60" cy="40" r="35" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
                <path d="M60 5 V75 M25 40 H95" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
                <ellipse cx="60" cy="40" rx="15" ry="35" stroke="#3b82f6" strokeWidth="1" opacity="0.3" fill="none" />

                {/* Truck Silhouette (Left) */}
                <path
                    d="M15 65 V55 Q15 50 20 50 H45 L55 58 V65 H15Z"
                    fill="#477baa"
                />
                <path d="M15 65 H55 L58 72 H18 L15 65Z" fill="#334155" />
                <circle cx="25" cy="72" r="3.5" fill="#1e293b" stroke="#477baa" strokeWidth="1" />
                <circle cx="45" cy="72" r="3.5" fill="#1e293b" stroke="#477baa" strokeWidth="1" />

                {/* Ship Silhouette (Right) */}
                <path
                    d="M60 62 L105 55 L95 68 H60 V62Z"
                    fill="#477baa"
                />
                <path d="M65 52 H85 V62 H65 V52Z" fill="#477baa" />
                <path d="M68 45 H82 V52 H68 V45Z" fill="#477baa" />

                {/* Waves / Base Swoosh */}
                <path
                    d="M10 75 Q60 85 110 75"
                    stroke="#477baa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                />
            </svg>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{
                            fontSize: '1.8rem',
                            fontWeight: '800',
                            color: '#FFFFFF',
                            letterSpacing: '-0.02em',
                        }}>
                            Nex
                        </span>
                        <span style={{
                            fontSize: '1.8rem',
                            fontWeight: '800',
                            color: '#f49454',
                            letterSpacing: '-0.02em',
                        }}>
                            Haul
                        </span>
                    </div>
                    <span style={{
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'none',
                        letterSpacing: '0.02em',
                        marginTop: '0px'
                    }}>
                        by Sellytics
                    </span>
                    <span style={{
                        fontSize: '0.55rem',
                        color: '#64748b',
                        fontWeight: '700',
                        textTransform: '',
                        letterSpacing: '0.15em',
                        marginTop: '4px'
                    }}>
                        Effortless Tracking
                    </span>
                </div>
            )}
        </div>
    );
}
