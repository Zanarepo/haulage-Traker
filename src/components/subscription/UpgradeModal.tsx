'use client';

import React from 'react';
import { X, Check, Crown, Zap, ArrowRight, Package, Wrench } from 'lucide-react';
import { PlanId, PLANS, getPlanConfig, MODULE_PRICING } from '@/config/planConfig';
import { subscriptionService } from '@/services/subscriptionService';
import './subscription.css';

type TargetModule = 'infra_supply' | 'maintain' | 'both';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: PlanId;
    companyId: string;
    userEmail: string;
    limitType?: 'users' | 'clusters' | 'assets' | 'work_orders' | 'feature';
    currentUsage?: number;
    maxAllowed?: number;
    featureName?: string;
    infraPlanId?: PlanId;
    maintainPlanId?: PlanId;
    defaultModule?: TargetModule;
}

export default function UpgradeModal({
    isOpen,
    onClose,
    currentPlan,
    companyId,
    userEmail,
    limitType = 'users',
    currentUsage = 0,
    maxAllowed = 0,
    featureName,
    infraPlanId = 'free',
    maintainPlanId = 'free',
    defaultModule,
}: UpgradeModalProps) {
    const [loading, setLoading] = React.useState<string | null>(null);
    const [selectedModule, setSelectedModule] = React.useState<TargetModule>(
        defaultModule || 'both'
    );

    if (!isOpen) return null;

    const currentConfig = getPlanConfig(currentPlan);

    // Determine which modules are already paid
    const infraAlreadyPaid = infraPlanId === 'small_business' || infraPlanId === 'enterprise';
    const maintainAlreadyPaid = maintainPlanId === 'small_business' || maintainPlanId === 'enterprise';

    const getMessage = () => {
        switch (limitType) {
            case 'users':
                return `You've reached your team member limit (${currentUsage}/${maxAllowed}). Upgrade to add more.`;
            case 'clusters':
                return `You've reached your cluster limit (${currentUsage}/${maxAllowed}). Upgrade for more clusters.`;
            case 'assets':
                return `You've reached your asset registry limit (${currentUsage}/${maxAllowed}). Upgrade to register more assets.`;
            case 'work_orders':
                return `You've reached your work order limit (${currentUsage}/${maxAllowed}). Upgrade to create more.`;
            case 'feature':
                return `${featureName || 'This feature'} requires a higher plan.`;
            default:
                return 'Upgrade to unlock more features.';
        }
    };

    const getSBPrice = () => {
        if (selectedModule === 'both') return MODULE_PRICING.both;
        return MODULE_PRICING.single;
    };

    const handleUpgrade = async (plan: 'small_business' | 'enterprise') => {
        try {
            setLoading(plan);
            const module = plan === 'enterprise' ? 'both' : selectedModule;
            const { authorization_url } = await subscriptionService.initializePaystackCheckout(
                companyId,
                userEmail,
                plan,
                module
            );
            window.location.href = authorization_url;
        } catch (err: any) {
            console.error('Payment initialization failed:', err);
            alert('Failed to start payment. Please try again.');
            setLoading(null);
        }
    };

    const sbPlan = PLANS.small_business;
    const entPlan = PLANS.enterprise;
    const fmt = (n: number) => n >= 999 ? 'Unlimited' : `Up to ${n}`;

    return (
        <div className="upgrade-overlay" onClick={onClose}>
            <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
                <button className="upgrade-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="upgrade-header">
                    <div className="upgrade-icon">
                        <Crown size={32} />
                    </div>
                    <h2>Upgrade Your Plan</h2>
                    <p className="upgrade-reason">{getMessage()}</p>
                    <p className="upgrade-current">
                        Current plan: <span>{currentConfig.name}</span>
                        {(infraAlreadyPaid || maintainAlreadyPaid) && (
                            <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px', color: 'var(--text-muted)' }}>
                                {infraAlreadyPaid && '⛽ InfraSupply: Active'}
                                {infraAlreadyPaid && maintainAlreadyPaid && ' · '}
                                {maintainAlreadyPaid && '🔧 Maintain: Active'}
                            </span>
                        )}
                    </p>
                </div>

                {/* Module Selector for Small Business */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <button
                        onClick={() => setSelectedModule('infra_supply')}
                        disabled={infraAlreadyPaid}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: selectedModule === 'infra_supply' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                            background: selectedModule === 'infra_supply' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                            color: infraAlreadyPaid ? 'var(--text-muted)' : 'var(--text-main)',
                            cursor: infraAlreadyPaid ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}
                    >
                        <Package size={14} /> InfraSupply
                        {infraAlreadyPaid && <Check size={12} style={{ color: '#10b981' }} />}
                    </button>
                    <button
                        onClick={() => setSelectedModule('maintain')}
                        disabled={maintainAlreadyPaid}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: selectedModule === 'maintain' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                            background: selectedModule === 'maintain' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                            color: maintainAlreadyPaid ? 'var(--text-muted)' : 'var(--text-main)',
                            cursor: maintainAlreadyPaid ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}
                    >
                        <Wrench size={14} /> Maintain
                        {maintainAlreadyPaid && <Check size={12} style={{ color: '#10b981' }} />}
                    </button>
                    <button
                        onClick={() => setSelectedModule('both')}
                        disabled={infraAlreadyPaid && maintainAlreadyPaid}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: selectedModule === 'both' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                            background: selectedModule === 'both' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                            color: 'var(--text-main)',
                            cursor: (infraAlreadyPaid && maintainAlreadyPaid) ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}
                    >
                        Both Modules
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>SAVE ₦11k</span>
                    </button>
                </div>

                <div className="upgrade-plans">
                    {/* Small Business Card */}
                    <div className="upgrade-plan-card">
                        <h3>Small Business</h3>
                        <div className="upgrade-price">
                            <span className="currency">₦</span>
                            {getSBPrice().toLocaleString()}
                            <span className="period">/mo</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.75rem', textAlign: 'center' }}>
                            {selectedModule === 'both' ? 'Both modules' : selectedModule === 'infra_supply' ? 'InfraSupply only' : 'Maintain only'}
                        </p>
                        <ul className="upgrade-features">
                            <li><Check size={14} /> {fmt(sbPlan.limits.maxUsers)} team members</li>
                            <li><Check size={14} /> {fmt(sbPlan.limits.maxClusters)} clusters</li>
                            {(selectedModule === 'maintain' || selectedModule === 'both') && (
                                <>
                                    <li><Check size={14} /> {fmt(sbPlan.features.maintain.maxAssets)} assets</li>
                                    <li><Check size={14} /> {fmt(sbPlan.features.maintain.workOrderLimit)} work orders</li>
                                    <li><Check size={14} /> Preventive Scheduling</li>
                                </>
                            )}
                            {(selectedModule === 'infra_supply' || selectedModule === 'both') && (
                                <>
                                    <li><Check size={14} /> {fmt(sbPlan.features.infra_supply.maxItineraryStops)} stops/trip</li>
                                    <li><Check size={14} /> Live GPS Tracking</li>
                                    <li><Check size={14} /> Multi-Cluster Dispatch</li>
                                </>
                            )}
                        </ul>
                        <button
                            className="upgrade-btn secondary"
                            onClick={() => handleUpgrade('small_business')}
                            disabled={loading !== null || (selectedModule === 'infra_supply' && infraAlreadyPaid) || (selectedModule === 'maintain' && maintainAlreadyPaid)}
                        >
                            {loading === 'small_business' ? 'Processing...' : (
                                <>Upgrade <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>

                    {/* Enterprise Card */}
                    <div className="upgrade-plan-card recommended">
                        <div className="recommended-badge">
                            <Zap size={12} /> Best Value
                        </div>
                        <h3>Enterprise</h3>
                        <div className="upgrade-price">
                            <span className="currency">₦</span>
                            {MODULE_PRICING.enterprise.toLocaleString()}
                            <span className="period">/mo</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.75rem', textAlign: 'center' }}>
                            All modules, all features
                        </p>
                        <ul className="upgrade-features">
                            <li><Check size={14} /> Unlimited team members</li>
                            <li><Check size={14} /> Unlimited clusters</li>
                            <li><Check size={14} /> Unlimited assets & work orders</li>
                            <li><Check size={14} /> Full Document Audit</li>
                            <li><Check size={14} /> Auto Reconciliation</li>
                            <li><Check size={14} /> Knowledge Base</li>
                            <li><Check size={14} /> Asset Health Projections</li>
                            <li><Check size={14} /> Cluster Reports & CSV Export</li>
                            <li><Check size={14} /> Priority 24/7 Support</li>
                        </ul>
                        <button
                            className="upgrade-btn primary"
                            onClick={() => handleUpgrade('enterprise')}
                            disabled={loading !== null || currentPlan === 'enterprise'}
                        >
                            {loading === 'enterprise' ? 'Processing...' : currentPlan === 'enterprise' ? 'Current Plan' : (
                                <>Upgrade <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
