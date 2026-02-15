'use client';

import React from 'react';
import { Crown, Clock, Sparkles } from 'lucide-react';
import { PlanId, getPlanConfig } from '@/config/planConfig';
import './subscription.css';

interface PlanBadgeProps {
    plan: PlanId;
    trialDaysRemaining?: number;
    compact?: boolean;
    onClick?: () => void;
}

export default function PlanBadge({ plan, trialDaysRemaining = 0, compact = false, onClick }: PlanBadgeProps) {
    const config = getPlanConfig(plan);

    const getBadgeClass = () => {
        switch (plan) {
            case 'trial': return 'plan-badge trial';
            case 'free': return 'plan-badge free';
            case 'small_business': return 'plan-badge business';
            case 'enterprise': return 'plan-badge enterprise';
            default: return 'plan-badge free';
        }
    };

    const getIcon = () => {
        switch (plan) {
            case 'trial': return <Clock size={compact ? 12 : 14} />;
            case 'enterprise': return <Crown size={compact ? 12 : 14} />;
            case 'small_business': return <Sparkles size={compact ? 12 : 14} />;
            default: return null;
        }
    };

    return (
        <button
            className={`${getBadgeClass()} ${compact ? 'compact' : ''}`}
            onClick={onClick}
            title={plan === 'trial' ? `${trialDaysRemaining} days left in trial` : `${config.name} Plan`}
        >
            {getIcon()}
            <span>{compact ? config.name : (
                plan === 'trial'
                    ? `Trial · ${trialDaysRemaining}d left`
                    : config.name
            )}</span>
        </button>
    );
}
