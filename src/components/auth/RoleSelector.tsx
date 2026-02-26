'use client';

import React from 'react';
import { useRoleSelection } from '@/hooks/useRoleSelection';
import {
    LayoutDashboard,
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
    onClick: () => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ title, description, icon: Icon, type, onClick }) => (
    <button onClick={onClick} className={`workspace-card ${type}`}>
        <div className="card-icon">
            <Icon size={24} />
        </div>
        <div className="card-content">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
        <div className="card-arrow">
            <ArrowRight size={20} />
        </div>
    </button>
);

export default function RoleSelector() {
    const { availableProfiles, selectWorkspace } = useRoleSelection();

    return (
        <div className="role-selector-container">
            <div className="selection-header">
                <h2>Select Your Workspace</h2>
                <p>We found multiple accounts associated with your credentials. Choose which environment you want to access.</p>
            </div>

            <div className="workspace-grid">
                {availableProfiles?.map((p) => {
                    const isPlatform = p.type === 'platform';
                    return (
                        <WorkspaceCard
                            key={`${p.id}-${p.type}`}
                            type={p.type}
                            title={isPlatform ? 'NexHaul Mission Control' : (p.company_name || 'Fleet Dashboard')}
                            description={isPlatform
                                ? `System Administration (${p.role.replace('nex', '')})`
                                : `Manage logistics for ${p.company_name || 'your company'}`
                            }
                            icon={isPlatform ? ShieldCheck : Building2}
                            onClick={() => selectWorkspace(p.id, p.type)}
                        />
                    );
                })}
            </div>

            <style jsx>{`
                .role-selector-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 4rem 2rem;
                    animation: fadeIn 0.4s ease-out;
                }
                .selection-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }
                .selection-header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 1rem;
                }
                .selection-header p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .workspace-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
                    gap: 1.5rem;
                }
                .workspace-card {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 2rem;
                    background: #1e293b;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 1.5rem;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    width: 100%;
                }
                .workspace-card:hover {
                    transform: translateY(-4px);
                    background: #232f45;
                    border-color: rgba(59, 130, 246, 0.3);
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
                }
                .card-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .workspace-card.platform .card-icon {
                    background: rgba(168, 85, 247, 0.1);
                    color: #a78bfa;
                }
                .workspace-card.tenant .card-icon {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                }
                .card-content {
                    flex: 1;
                }
                .card-content h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }
                .card-content p {
                    font-size: 0.9rem;
                    color: #94a3b8;
                }
                .card-arrow {
                    color: #475569;
                    transition: transform 0.3s;
                }
                .workspace-card:hover .card-arrow {
                    transform: translateX(4px);
                    color: #3b82f6;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 640px) {
                    .workspace-grid { grid-template-columns: 1fr; }
                    .workspace-card { padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
