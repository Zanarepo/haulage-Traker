/**
 * Plan Configuration — Single Source of Truth
 * 
 * Defines limits and feature gates for each subscription plan.
 * "Teams" = active users linked to a company_id.
 */

export type PlanId = 'trial' | 'free' | 'small_business' | 'enterprise';

export interface PlanLimits {
    maxUsers: number;
    maxClusters: number;
    maxClients: number;
    maxSites: number;
}

export interface PlanFeatures {
    advancedReconciliation: boolean;
    fullDocumentAudit: boolean;
    multiClusterAnalytics: boolean;
    liveTracking: boolean;
    prioritySupport: boolean;
}

export interface PlanConfig {
    id: PlanId;
    name: string;
    price: number; // Monthly in Naira, 0 for free/trial
    paystackPlanCode?: string; // Paystack plan code for subscription
    limits: PlanLimits;
    features: PlanFeatures;
}

/**
 * Trial gets full Enterprise access for 21 days.
 * After expiry, drops to 'free' tier.
 */
export const PLANS: Record<PlanId, PlanConfig> = {
    trial: {
        id: 'trial',
        name: 'Enterprise Trial',
        price: 0,
        limits: { maxUsers: 999, maxClusters: 999, maxClients: 999, maxSites: 999 },
        features: {
            advancedReconciliation: true,
            fullDocumentAudit: true,
            multiClusterAnalytics: true,
            liveTracking: true,
            prioritySupport: false,
        },
    },
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        limits: { maxUsers: 2, maxClusters: 1, maxClients: 0, maxSites: 0 },
        features: {
            advancedReconciliation: false,
            fullDocumentAudit: false,
            multiClusterAnalytics: false,
            liveTracking: false,
            prioritySupport: false,
        },
    },
    small_business: {
        id: 'small_business',
        name: 'Small Business',
        price: 25000,
        limits: { maxUsers: 7, maxClusters: 7, maxClients: 7, maxSites: 7 },
        features: {
            advancedReconciliation: false,
            fullDocumentAudit: false,
            multiClusterAnalytics: false,
            liveTracking: true,
            prioritySupport: false,
        },
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 40000,
        limits: { maxUsers: 999, maxClusters: 999, maxClients: 999, maxSites: 999 },
        features: {
            advancedReconciliation: true,
            fullDocumentAudit: true,
            multiClusterAnalytics: true,
            liveTracking: true,
            prioritySupport: true,
        },
    },
};

export const TRIAL_DURATION_DAYS = 21;

/**
 * Get the effective plan for a subscription.
 * If trial has expired, returns 'free'.
 */
export function getEffectivePlanId(
    plan: string,
    status: string,
    trialEnd?: string | null
): PlanId {
    if (status === 'cancelled' || status === 'expired') {
        return 'free';
    }
    if (plan === 'trial' && trialEnd) {
        const isExpired = new Date(trialEnd) < new Date();
        return isExpired ? 'free' : 'trial';
    }
    return (plan as PlanId) || 'free';
}

/**
 * Get the plan config for a given plan ID.
 */
export function getPlanConfig(planId: PlanId): PlanConfig {
    return PLANS[planId] || PLANS.free;
}
