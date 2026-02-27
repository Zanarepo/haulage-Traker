'use client';

import React, { useState, useEffect } from 'react';
import { useRoleSelection } from '@/hooks/useRoleSelection';
import { useAuth } from '@/hooks/useAuth';
import {
    ShieldCheck,
    Building2,
    ArrowRight,
    LucideIcon
} from 'lucide-react';

interface WorkspaceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    type: 'platform' | 'tenant';
    features: string[];
    onClick: () => void;
    delay: number;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ title, description, icon: Icon, type, features, onClick, delay }) => {
    const [visible, setVisible] = useState(false);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <button
            onClick={onClick}
            className={`ws-card ${type} ${visible ? 'ws-card--visible' : ''}`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div className="ws-card__inner">
                <div className="ws-card__header">
                    <span className={`ws-card__badge ${type}`}>
                        {type === 'platform' ? 'Admin Control' : 'Fleet Workspace'}
                    </span>
                </div>

                <div className={`ws-card__icon-wrap ${type}`}>
                    <Icon size={32} strokeWidth={1.5} />
                </div>

                <div className="ws-card__body">
                    <h3 className="ws-card__title">{title}</h3>
                    <p className="ws-card__desc">{description}</p>
                </div>

                <div className="ws-card__features">
                    {features.map((f, i) => (
                        <span key={i} className="ws-card__tag">{f}</span>
                    ))}
                </div>

                <div className="ws-card__footer">
                    <span className="ws-card__cta">Enter Workspace</span>
                    <ArrowRight size={18} className={`ws-card__arrow ${hovering ? 'active' : ''}`} />
                </div>
            </div>

            <style jsx>{`
                .ws-card {
                    position: relative;
                    padding: 0;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    width: 100%;
                    outline: none;
                }
                .ws-card--visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .ws-card__inner {
                    display: flex;
                    flex-direction: column;
                    padding: 2.5rem;
                    background: rgba(30, 41, 59, 0.4);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 2rem;
                    height: 100%;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .ws-card:hover .ws-card__inner {
                    background: rgba(30, 41, 59, 0.7);
                    border-color: rgba(96, 165, 250, 0.4);
                    transform: translateY(-8px);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .ws-card__header {
                    margin-bottom: 1.5rem;
                }
                .ws-card__badge {
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    padding: 0.4rem 1rem;
                    border-radius: 2rem;
                    text-transform: uppercase;
                }
                .ws-card__badge.tenant { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                .ws-card__badge.platform { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
                
                .ws-card__icon-wrap {
                    width: 64px;
                    height: 64px;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    transition: all 0.4s ease;
                }
                .ws-card__icon-wrap.tenant { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(30,41,59,0.5)); color: #60a5fa; }
                .ws-card__icon-wrap.platform { background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(30,41,59,0.5)); color: #c084fc; }
                .ws-card:hover .ws-card__icon-wrap { transform: scale(1.1) rotate(5deg); }

                .ws-card__title {
                    font-size: 1.625rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }
                .ws-card__desc {
                    font-size: 1rem;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }
                .ws-card__features {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    margin-bottom: 2.5rem;
                }
                .ws-card__tag {
                    font-size: 0.85rem;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 0.875rem;
                    background: rgba(255, 255, 255, 0.05);
                    color: #cbd5e1;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }
                .ws-card:hover .ws-card__tag {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .ws-card__footer {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                .ws-card__cta {
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                }
                .ws-card__arrow {
                    color: #64748b;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .ws-card__arrow.active {
                    transform: translateX(8px);
                    color: #60a5fa;
                }
            `}</style>
        </button>
    );
};

export default function RoleSelector() {
    const { availableProfiles, selectWorkspace } = useRoleSelection();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Member';

    return (
        <div className="role-selector">
            <div className="role-selector__bg">
                <div className="orb orb--primary" />
                <div className="orb orb--secondary" />
                <div className="grid-overlay" />
            </div>

            <div className={`role-selector__content ${mounted ? 'visible' : ''}`}>
                <div className="brand-section">
                    <img src="/logo1.png" alt="NexHaul" className="brand-logo" />
                    <h1 className="brand-name">NexHaul</h1>
                </div>

                <div className="header-section">
                    <p className="greeting">Welcome back, {firstName} 👋</p>
                    <h2 className="title">Select Your Workspace</h2>
                    <p className="subtitle">Choose the environment you want to manage today.</p>
                </div>

                <div className="workspace-grid">
                    {availableProfiles?.map((p, idx) => (
                        <WorkspaceCard
                            key={`${p.id}-${p.type}`}
                            type={p.type}
                            delay={200 + idx * 100}
                            title={p.type === 'platform' ? 'Mission Control' : (p.company_name || 'Fleet Dashboard')}
                            description={p.type === 'platform'
                                ? 'Full system administration, security controls, and global analytics.'
                                : `Operational workspace for ${p.company_name || 'your company fleet management'}.`
                            }
                            features={p.type === 'platform'
                                ? ['Security', 'Users', 'Analytics']
                                : ['Fleet', 'Trips', 'Revenue']
                            }
                            icon={p.type === 'platform' ? ShieldCheck : Building2}
                            onClick={() => selectWorkspace(p.id, p.type)}
                        />
                    ))}
                </div>

                <p className="footer-hint">Need help? Contact support@nexhaul.com</p>
            </div>

            <style jsx>{`
                .role-selector {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0f172a;
                    padding: 4rem 2rem;
                    overflow: hidden;
                    font-family: var(--font-geist-sans);
                }

                .role-selector__bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.15;
                    animation: float 20s ease-in-out infinite alternate;
                }
                .orb--primary { width: 600px; height: 600px; background: #3b82f6; top: -10%; left: -10%; }
                .orb--secondary { width: 500px; height: 500px; background: #a855f7; bottom: -10%; right: -10%; animation-delay: -5s; }
                
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(60px, 40px) scale(1.1); }
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 80px 80px;
                    mask-image: radial-gradient(circle at center, black, transparent 80%);
                }

                .role-selector__content {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 1000px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .role-selector__content.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .brand-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }
                .brand-logo { width: 48px; height: 48px; border-radius: 12px; }
                .brand-name { font-size: 1.75rem; font-weight: 800; color: white; letter-spacing: -0.04em; }

                .header-section { text-align: center; margin-bottom: 4rem; }
                .greeting { font-size: 1.125rem; color: #60a5fa; font-weight: 600; margin-bottom: 0.75rem; }
                .title { font-size: 3rem; font-weight: 850; color: white; letter-spacing: -0.05em; margin-bottom: 1rem; line-height: 1; }
                .subtitle { font-size: 1.25rem; color: #94a3b8; max-width: 600px; margin: 0 auto; }

                .workspace-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
                    gap: 2.5rem;
                    width: 100%;
                    margin-bottom: 4rem;
                }

                .footer-hint { color: #64748b; font-size: 0.875rem; font-weight: 500; }

                @media (max-width: 768px) {
                    .role-selector { padding: 4rem 1.5rem; }
                    .title { font-size: 2.25rem; }
                    .workspace-grid { grid-template-columns: 1fr; }
                    .header-section { margin-bottom: 2.5rem; }
                }
            `}</style>
        </div>
    );
}
