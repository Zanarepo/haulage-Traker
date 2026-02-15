import { supabase } from '@/lib/supabase';
import { PlanId, getEffectivePlanId, getPlanConfig, PLANS } from '@/config/planConfig';

export interface Subscription {
    id: string;
    company_id: string;
    plan: string;
    status: string;
    trial_start: string;
    trial_end: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    paystack_customer_code: string | null;
    paystack_subscription_code: string | null;
    created_at: string;
    updated_at: string;
}

export interface LimitCheck {
    allowed: boolean;
    current: number;
    max: number;
    planName: string;
}

export const subscriptionService = {
    /**
     * Fetch the subscription for a company.
     */
    async getSubscription(companyId: string): Promise<Subscription | null> {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('company_id', companyId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('[Subscription] getSubscription error:', error.message);
                return null;
            }

            // Auto-downgrade: if trial has expired, update DB to reflect 'free'
            if (data && data.plan === 'trial' && data.trial_end) {
                const isExpired = new Date(data.trial_end) < new Date();
                if (isExpired) {
                    console.log('[Subscription] Trial expired — auto-downgrading to free in DB');
                    await supabase
                        .from('subscriptions')
                        .update({ plan: 'free', status: 'expired', updated_at: new Date().toISOString() })
                        .eq('company_id', companyId);
                    // Return the updated data
                    return { ...data, plan: 'free', status: 'expired' };
                }
            }

            return data as Subscription | null;
        } catch (err) {
            console.warn('[Subscription] getSubscription failed:', err);
            return null;
        }
    },

    /**
     * Get the effective plan for a company (handles trial expiry).
     */
    async getEffectivePlan(companyId: string): Promise<PlanId> {
        const sub = await this.getSubscription(companyId);
        if (!sub) return 'free';
        return getEffectivePlanId(sub.plan, sub.status, sub.trial_end);
    },

    /**
     * Check if a company can add more team members (users).
     */
    async checkUserLimit(companyId: string): Promise<LimitCheck> {
        const [sub, usersResult] = await Promise.all([
            this.getSubscription(companyId),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('is_active', true)
        ]);

        const effectivePlan = sub
            ? getEffectivePlanId(sub.plan, sub.status, sub.trial_end)
            : 'free';
        const config = getPlanConfig(effectivePlan);
        const currentCount = usersResult.count || 0;

        console.log('[Subscription] checkUserLimit:', { effectivePlan, currentCount, max: config.limits.maxUsers, hasSub: !!sub });

        return {
            allowed: currentCount < config.limits.maxUsers,
            current: currentCount,
            max: config.limits.maxUsers,
            planName: config.name,
        };
    },

    /**
     * Check if a company can add more clusters.
     */
    async checkClusterLimit(companyId: string): Promise<LimitCheck> {
        const [sub, clustersResult] = await Promise.all([
            this.getSubscription(companyId),
            supabase
                .from('clusters')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
        ]);

        const effectivePlan = sub
            ? getEffectivePlanId(sub.plan, sub.status, sub.trial_end)
            : 'free';
        const config = getPlanConfig(effectivePlan);
        const currentCount = clustersResult.count || 0;

        return {
            allowed: currentCount < config.limits.maxClusters,
            current: currentCount,
            max: config.limits.maxClusters,
            planName: config.name,
        };
    },

    /**
     * Check if a company can add more clients.
     */
    async checkClientLimit(companyId: string): Promise<LimitCheck> {
        const [sub, clientsResult] = await Promise.all([
            this.getSubscription(companyId),
            supabase
                .from('clients')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
        ]);

        const effectivePlan = sub
            ? getEffectivePlanId(sub.plan, sub.status, sub.trial_end)
            : 'free';
        const config = getPlanConfig(effectivePlan);
        const currentCount = clientsResult.count || 0;

        return {
            allowed: currentCount < config.limits.maxClients,
            current: currentCount,
            max: config.limits.maxClients,
            planName: config.name,
        };
    },

    /**
     * Check if a company can add more sites.
     */
    async checkSiteLimit(companyId: string): Promise<LimitCheck> {
        const [sub, sitesResult] = await Promise.all([
            this.getSubscription(companyId),
            supabase
                .from('sites')
                .select('id, clusters!inner(company_id)', { count: 'exact', head: true })
                .eq('clusters.company_id', companyId)
        ]);

        const effectivePlan = sub
            ? getEffectivePlanId(sub.plan, sub.status, sub.trial_end)
            : 'free';
        const config = getPlanConfig(effectivePlan);
        const currentCount = sitesResult.count || 0;

        return {
            allowed: currentCount < config.limits.maxSites,
            current: currentCount,
            max: config.limits.maxSites,
            planName: config.name,
        };
    },

    /**
     * Check if a specific feature is enabled for the company.
     */
    async isFeatureEnabled(companyId: string, feature: keyof typeof PLANS.enterprise.features): Promise<boolean> {
        const effectivePlan = await this.getEffectivePlan(companyId);
        const config = getPlanConfig(effectivePlan);
        return config.features[feature] ?? false;
    },

    /**
     * Calculate days remaining in trial.
     */
    getTrialDaysRemaining(trialEnd: string | null): number {
        if (!trialEnd) return 0;
        const diff = new Date(trialEnd).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    /**
     * Initialize Paystack checkout for plan upgrade.
     * Calls our backend API route which creates a Paystack transaction.
     */
    async initializePaystackCheckout(
        companyId: string,
        email: string,
        plan: 'small_business' | 'enterprise'
    ): Promise<{ authorization_url: string; reference: string }> {
        const planConfig = getPlanConfig(plan);

        const response = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                amount: planConfig.price * 100, // Paystack uses kobo
                plan: plan,
                company_id: companyId,
                metadata: {
                    company_id: companyId,
                    plan: plan,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to initialize payment');
        }

        const data = await response.json();
        return data.data;
    },

    /**
     * Update subscription after successful payment (called from webhook or verification).
     */
    async upgradePlan(companyId: string, newPlan: PlanId) {
        const now = new Date().toISOString();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('subscriptions')
            .update({
                plan: newPlan,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now,
            })
            .eq('company_id', companyId);

        if (error) throw error;
    },
};
