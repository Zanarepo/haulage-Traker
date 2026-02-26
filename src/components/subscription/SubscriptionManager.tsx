'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import PlanBadge from './PlanBadge';
import UpgradeModal from './UpgradeModal';
import { Crown, Sparkles, Calendar, ShieldCheck } from 'lucide-react';

export default function SubscriptionManager({ companyId, email, fullName }: {
    companyId: string;
    email: string;
    fullName: string;
}) {
    const { effectivePlanId, trialDaysRemaining, isTrialActive, isFreePlan } = useSubscription(companyId);
    const [showUpgrade, setShowUpgrade] = useState(false);

    const showUpgradeButton = isTrialActive || isFreePlan;

    return (
        <section className="subscription-card">
            <div className="sub-header">
                <div className="profile-capsule">
                    <div className="avatar">{fullName[0]?.toUpperCase()}</div>
                    <div className="profile-details">
                        <span className="user-name">{fullName}</span>
                        <span className="user-email">{email}</span>
                    </div>
                </div>
                <div className="plan-status">
                    <PlanBadge
                        plan={effectivePlanId}
                        trialDaysRemaining={trialDaysRemaining}
                        onClick={() => setShowUpgrade(true)}
                    />
                </div>
            </div>

            <div className="sub-body">
                <div className="sub-info-item">
                    <ShieldCheck size={18} className="info-icon" />
                    <div className="info-text">
                        <label>Current Status</label>
                        <span>Verified Account</span>
                    </div>
                </div>

                {isTrialActive && (
                    <div className="sub-info-item">
                        <Calendar size={18} className="info-icon" />
                        <div className="info-text">
                            <label>Trial Period</label>
                            <span>{trialDaysRemaining} days remaining</span>
                        </div>
                    </div>
                )}

                <div className="sub-info-item">
                    <Crown size={18} className="info-icon" />
                    <div className="info-text">
                        <label>Subscription Tier</label>
                        <span className="capitalize">{effectivePlanId} Plan</span>
                    </div>
                </div>
            </div>

            {showUpgradeButton && (
                <div className="sub-footer">
                    <button className="upgrade-action-btn" onClick={() => setShowUpgrade(true)}>
                        <Crown size={18} />
                        Upgrade to Lifetime / Enterprise
                        <Sparkles size={16} />
                    </button>
                    <p className="upgrade-note">Unlock unlimited sites, advanced analytics, and priority support.</p>
                </div>
            )}

            {showUpgrade && (
                <UpgradeModal
                    isOpen={showUpgrade}
                    onClose={() => setShowUpgrade(false)}
                    currentPlan={effectivePlanId}
                    companyId={companyId}
                    userEmail={email}
                />
            )}

            <style jsx>{`
                .subscription-card {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 1.5rem;
                    padding: 2rem;
                    margin-top: 3rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    border-left: 4px solid #a855f7;
                }
                .sub-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #334155;
                }
                .profile-capsule {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 800;
                    font-size: 1.25rem;
                }
                .profile-details {
                    display: flex;
                    flex-direction: column;
                }
                .user-name {
                    color: white;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .user-email {
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .sub-body {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .sub-info-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .info-icon {
                    color: #a855f7;
                    margin-top: 0.2rem;
                }
                .info-text {
                    display: flex;
                    flex-direction: column;
                }
                .info-text label {
                    color: #64748b;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 700;
                }
                .info-text span {
                    color: white;
                    font-weight: 600;
                }
                .sub-footer {
                    background: rgba(168, 85, 247, 0.05);
                    border: 1px dashed rgba(168, 85, 247, 0.3);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    text-align: center;
                }
                .upgrade-action-btn {
                    background: linear-gradient(135deg, #a855f7, #6366f1);
                    color: white;
                    border: none;
                    padding: 0.85rem 2rem;
                    border-radius: 0.75rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                    margin-bottom: 0.75rem;
                }
                .upgrade-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.4);
                }
                .upgrade-note {
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .capitalize {
                    text-transform: capitalize;
                }
            `}</style>
        </section>
    );
}
