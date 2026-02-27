'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, Subscription } from '@/services/subscriptionService';
import { PlanId, getEffectivePlanId, getPlanConfig, PlanConfig, PlanFeatures, mergeModulePlans } from '@/config/planConfig';

interface UseSubscriptionReturn {
    subscription: Subscription | null;
    plan: PlanConfig;
    effectivePlanId: PlanId;
    infraPlanId: PlanId;
    maintainPlanId: PlanId;
    loading: boolean;
    error: string | null;
    trialDaysRemaining: number;
    isTrialActive: boolean;
    isFreePlan: boolean;
    canAddUser: () => Promise<{ allowed: boolean; current: number; max: number }>;
    canAddCluster: () => Promise<{ allowed: boolean; current: number; max: number }>;
    canAddClient: () => Promise<{ allowed: boolean; current: number; max: number }>;
    canAddSite: () => Promise<{ allowed: boolean; current: number; max: number }>;
    isFeatureEnabled: (feature: 'liveTracking' | 'prioritySupport') => boolean;
    refresh: () => Promise<void>;
}

export function useSubscription(companyId: string | null): UseSubscriptionReturn {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = useCallback(async () => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const sub = await subscriptionService.getSubscription(companyId);
            setSubscription(sub);
        } catch (err: any) {
            setError(err.message || 'Failed to load subscription');
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Compute overall effective plan (for trial/expiry handling)
    const effectivePlanId = subscription
        ? getEffectivePlanId(subscription.plan, subscription.status, subscription.trial_end)
        : 'free' as PlanId;

    // Per-module plan tiers (read from DB columns, fallback to overall plan)
    const infraPlanId: PlanId = (() => {
        if (effectivePlanId === 'enterprise' || effectivePlanId === 'trial') return effectivePlanId;
        if (subscription?.infra_supply_plan && subscription.infra_supply_plan !== 'free') {
            return subscription.infra_supply_plan as PlanId;
        }
        return 'free';
    })();

    const maintainPlanId: PlanId = (() => {
        if (effectivePlanId === 'enterprise' || effectivePlanId === 'trial') return effectivePlanId;
        if (subscription?.maintain_plan && subscription.maintain_plan !== 'free') {
            return subscription.maintain_plan as PlanId;
        }
        return 'free';
    })();

    // Merge per-module plans into a single PlanConfig (the magic adapter)
    const plan = mergeModulePlans(infraPlanId, maintainPlanId, effectivePlanId, subscription);

    const trialDaysRemaining = subscription
        ? subscriptionService.getTrialDaysRemaining(subscription.trial_end)
        : 0;

    const isTrialActive = subscription?.plan === 'trial' && trialDaysRemaining > 0;
    const isFreePlan = effectivePlanId === 'free' && infraPlanId === 'free' && maintainPlanId === 'free';

    const canAddUser = useCallback(async () => {
        if (!companyId) return { allowed: false, current: 0, max: 0 };
        const check = await subscriptionService.checkUserLimit(companyId);
        return { allowed: check.allowed, current: check.current, max: check.max };
    }, [companyId]);

    const canAddCluster = useCallback(async () => {
        if (!companyId) return { allowed: false, current: 0, max: 0 };
        const check = await subscriptionService.checkClusterLimit(companyId);
        return { allowed: check.allowed, current: check.current, max: check.max };
    }, [companyId]);

    const canAddClient = useCallback(async () => {
        if (!companyId) return { allowed: false, current: 0, max: 0 };
        const check = await subscriptionService.checkClientLimit(companyId);
        return { allowed: check.allowed, current: check.current, max: check.max };
    }, [companyId]);

    const canAddSite = useCallback(async () => {
        if (!companyId) return { allowed: false, current: 0, max: 0 };
        const check = await subscriptionService.checkSiteLimit(companyId);
        return { allowed: check.allowed, current: check.current, max: check.max };
    }, [companyId]);

    // For top-level boolean features (liveTracking, prioritySupport)
    const isFeatureEnabled = useCallback(
        (feature: 'liveTracking' | 'prioritySupport'): boolean => {
            return plan.features[feature] ?? false;
        },
        [plan]
    );

    return {
        subscription,
        plan,
        effectivePlanId,
        infraPlanId,
        maintainPlanId,
        loading,
        error,
        trialDaysRemaining,
        isTrialActive,
        isFreePlan,
        canAddUser,
        canAddCluster,
        canAddClient,
        canAddSite,
        isFeatureEnabled,
        refresh: fetchSubscription,
    };
}
