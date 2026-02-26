'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { PRODUCTS, ProductId } from '@/config/productConfig';
import { supabase } from '@/lib/supabase';
import {
    LayoutGrid,
    CheckCircle2,
    Plus,
    Zap,
    Info,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';

export default function AppCenterPage() {
    const { profile } = useAuth();
    const { activeModules, loading: modulesLoading } = useCompanyModules(profile?.company_id || null);
    const [updating, setUpdating] = useState<ProductId | null>(null);

    const handleToggleModule = async (moduleId: ProductId) => {
        if (!profile?.company_id) return;
        setUpdating(moduleId);

        try {
            const isInstalled = activeModules.includes(moduleId);
            let nextModules: ProductId[];

            if (isInstalled) {
                // Prevent deactivating the last module
                if (activeModules.length <= 1) {
                    alert('You must have at least one active module.');
                    return;
                }
                nextModules = activeModules.filter(m => m !== moduleId);
            } else {
                nextModules = [...activeModules, moduleId];
            }

            const { error } = await supabase
                .from('companies')
                .update({ active_modules: nextModules })
                .eq('id', profile.company_id);

            if (error) throw error;

            // Refresh page to update layout/sidebar
            window.location.reload();
        } catch (err) {
            console.error('Failed to update module:', err);
            alert('Failed to update module. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    if (modulesLoading) return <div className="p-8 text-slate-400">Loading App Center...</div>;

    const availableProducts = Object.values(PRODUCTS);

    return (
        <div className="app-center-container">
            <header className="app-center-header">
                <div>
                    <h1>NexHaul App Center</h1>
                    <p>Discover and activate powerful modules to scale your operations.</p>
                </div>
                <div className="status-badge">
                    <ShieldCheck size={16} />
                    <span>Company ID: {profile?.company_id?.slice(0, 8)}...</span>
                </div>
            </header>

            <div className="apps-grid">
                {availableProducts.map((product) => {
                    const isInstalled = activeModules.includes(product.id);

                    return (
                        <div key={product.id} className={`app-card ${isInstalled ? 'installed' : ''}`}>
                            <div className="app-card-header" style={{ '--theme-color': product.color } as any}>
                                <div className="app-icon-box">
                                    <span className="app-icon-emoji">{product.icon}</span>
                                </div>
                                {isInstalled && (
                                    <span className="active-tag">
                                        <CheckCircle2 size={12} />
                                        Active
                                    </span>
                                )}
                            </div>

                            <div className="app-card-body">
                                <h3>{product.name}</h3>
                                <p className="app-description">{product.description}</p>

                                <div className="features-list">
                                    <div className="feature-item">
                                        <Zap size={14} className="feature-icon" />
                                        <span>Enterprise Ready</span>
                                    </div>
                                    <div className="feature-item">
                                        <Info size={14} className="feature-icon" />
                                        <span>24/7 Support Built-in</span>
                                    </div>
                                </div>
                            </div>

                            <div className="app-card-footer">
                                <button
                                    className={`action-btn ${isInstalled ? 'uninstall' : 'install'}`}
                                    onClick={() => handleToggleModule(product.id)}
                                    disabled={updating === product.id}
                                >
                                    {updating === product.id ? (
                                        'Processing...'
                                    ) : isInstalled ? (
                                        'Deactivate'
                                    ) : (
                                        <>
                                            Activate Module
                                            <Plus size={16} />
                                        </>
                                    )}
                                </button>

                                {isInstalled && (
                                    <a href={product.dashboardPath} className="visit-btn">
                                        Visit Dashboard
                                        <ArrowRight size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {profile?.company_id && (
                <div className="account-section">
                    <div className="section-divider">
                        <span>Account & Subscription</span>
                    </div>
                    <SubscriptionManager
                        companyId={profile.company_id}
                        email={profile.email || ''}
                        fullName={profile.full_name || 'User'}
                    />
                </div>
            )}

            <style jsx>{`
                .app-center-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .account-section {
                    margin-top: 5rem;
                }
                .section-divider {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    color: #475569;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .section-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #334155;
                }
                .app-center-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 3rem;
                }
                h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }
                .app-center-header p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                }
                .status-badge {
                    background: #1e293b;
                    border: 1px solid #334155;
                    padding: 0.5rem 1rem;
                    border-radius: 2rem;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .apps-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 2rem;
                }
                .app-card {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 1.5rem;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .app-card:hover {
                    transform: translateY(-5px);
                    border-color: #475569;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
                }
                .app-card.installed {
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .app-card-header {
                    height: 120px;
                    background: linear-gradient(135deg, var(--theme-color), transparent);
                    padding: 1.5rem;
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    opacity: 0.8;
                }
                .app-icon-box {
                    width: 60px;
                    height: 60px;
                    background: #0f172a;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .active-tag {
                    background: #059669;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .app-card-body {
                    padding: 2rem;
                    flex: 1;
                }
                h3 {
                    color: white;
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                }
                .app-description {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                    min-height: 3rem;
                }
                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #cbd5e1;
                    font-size: 0.85rem;
                }
                .feature-icon {
                    color: #3b82f6;
                }
                .app-card-footer {
                    padding: 1.5rem 2rem;
                    background: #0f172a;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .action-btn {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    border: none;
                }
                .action-btn.install {
                    background: #3b82f6;
                    color: white;
                }
                .action-btn.install:hover {
                    background: #2563eb;
                }
                .action-btn.uninstall {
                    background: transparent;
                    border: 1px solid #334155;
                    color: #ef4444;
                }
                .action-btn.uninstall:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                }
                .visit-btn {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }
                .visit-btn:hover {
                    color: white;
                }
            `}</style>
        </div>
    );
}
