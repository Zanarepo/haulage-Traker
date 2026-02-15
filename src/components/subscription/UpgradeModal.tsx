'use client';

import React from 'react';
import { X, Check, Crown, Zap, ArrowRight } from 'lucide-react';
import { PlanId, PLANS, getPlanConfig } from '@/config/planConfig';
import { subscriptionService } from '@/services/subscriptionService';
import './subscription.css';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: PlanId;
    companyId: string;
    userEmail: string;
    limitType?: 'users' | 'clusters' | 'feature';
    currentUsage?: number;
    maxAllowed?: number;
    featureName?: string;
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
}: UpgradeModalProps) {
    const [loading, setLoading] = React.useState<string | null>(null);

    if (!isOpen) return null;

    const currentConfig = getPlanConfig(currentPlan);

    const getMessage = () => {
        switch (limitType) {
            case 'users':
                return `You've reached your team member limit (${currentUsage}/${maxAllowed}). Upgrade to add more.`;
            case 'clusters':
                return `You've reached your cluster limit (${currentUsage}/${maxAllowed}). Upgrade for more clusters.`;
            case 'feature':
                return `${featureName || 'This feature'} requires a higher plan.`;
            default:
                return 'Upgrade to unlock more features.';
        }
    };

    const handleUpgrade = async (plan: 'small_business' | 'enterprise') => {
        try {
            setLoading(plan);
            const { authorization_url } = await subscriptionService.initializePaystackCheckout(
                companyId,
                userEmail,
                plan
            );
            // Redirect to Paystack checkout
            window.location.href = authorization_url;
        } catch (err: any) {
            console.error('Payment initialization failed:', err);
            alert('Failed to start payment. Please try again.');
            setLoading(null);
        }
    };

    const upgradePlans = [PLANS.small_business, PLANS.enterprise];

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
                    </p>
                </div>

                <div className="upgrade-plans">
                    {upgradePlans.map((plan) => {
                        const isCurrentOrLower =
                            currentPlan === plan.id ||
                            (currentPlan === 'enterprise' && plan.id === 'small_business');
                        const isRecommended = plan.id === 'enterprise';

                        return (
                            <div
                                key={plan.id}
                                className={`upgrade-plan-card ${isRecommended ? 'recommended' : ''}`}
                            >
                                {isRecommended && (
                                    <div className="recommended-badge">
                                        <Zap size={12} /> Recommended
                                    </div>
                                )}
                                <h3>{plan.name}</h3>
                                <div className="upgrade-price">
                                    <span className="currency">₦</span>
                                    {plan.price.toLocaleString()}
                                    <span className="period">/mo</span>
                                </div>
                                <ul className="upgrade-features">
                                    <li><Check size={14} /> Up to {plan.limits.maxUsers} team members</li>
                                    <li><Check size={14} /> {plan.limits.maxClusters === 999 ? 'Unlimited' : `Up to ${plan.limits.maxClusters}`} clusters</li>
                                    {plan.features.liveTracking && <li><Check size={14} /> Live Tracking</li>}
                                    {plan.features.advancedReconciliation && <li><Check size={14} /> Advanced Reconciliation</li>}
                                    {plan.features.fullDocumentAudit && <li><Check size={14} /> Full Document Audit</li>}
                                    {plan.features.multiClusterAnalytics && <li><Check size={14} /> Multi-Cluster Analytics</li>}
                                    {plan.features.prioritySupport && <li><Check size={14} /> Priority 24/7 Support</li>}
                                </ul>
                                <button
                                    className={`upgrade-btn ${isRecommended ? 'primary' : 'secondary'}`}
                                    onClick={() => handleUpgrade(plan.id as 'small_business' | 'enterprise')}
                                    disabled={isCurrentOrLower || loading !== null}
                                >
                                    {loading === plan.id ? (
                                        'Processing...'
                                    ) : isCurrentOrLower ? (
                                        'Current Plan'
                                    ) : (
                                        <>Upgrade <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
