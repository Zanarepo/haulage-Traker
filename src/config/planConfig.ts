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
    // Shared Platform Features
    liveTracking: boolean;
    prioritySupport: boolean;

    // Document Centre (Shared Module)
    documents: {
        maxDocuments: number;            // How many documents a user can view/access
        fullDocumentAudit: boolean;      // Clear unblurred waybill/signature images
        documentDownload: boolean;       // Allow downloading documents
    };

    // InfraSupply Module Features
    infra_supply: {
        maxItineraryStops: number;      // Stops per trip dispatch
        maxTripsPerMonth: number;        // Monthly trip dispatches
        multiClusterDispatch: boolean;   // Cross-cluster delivery
        autoReconciliation: boolean;     // Auto fuel reconciliation
        tripHistoryDays: number;         // How far back trip history goes
    };

    // Maintain Module Features
    maintain: {
        maxAssets: number;               // Asset registry limit
        workOrderLimit: number;          // Total work orders
        preventiveScheduling: boolean;   // PM schedule dashboard
        safetyChecklists: boolean;       // Safety compliance tracking
        visitReports: boolean;           // Before/after photo visit logs
        knowledgeBase: boolean;          // Knowledge base access
        assetHealthProjections: boolean; // Predictive asset health

        // Supply Tracking
        maxStockInflows: number;         // Total stock inflow entries
        maxClusterIssues: number;        // Issue-to-cluster allocations
        maxPendingRequests: number;      // Pending stock requests
        inflowHistoryLimit: number;      // How many inflow records visible
        restockLogDays: number;          // Restock log history window
        clusterReports: boolean;         // Monthly cluster inventory reports
        csvExport: boolean;              // Export inventory as CSV
    };
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
            liveTracking: true,
            prioritySupport: true,
            documents: {
                maxDocuments: 999,
                fullDocumentAudit: true,
                documentDownload: true,
            },
            infra_supply: {
                maxItineraryStops: 999,
                maxTripsPerMonth: 999,
                multiClusterDispatch: true,
                autoReconciliation: true,
                tripHistoryDays: 365,
            },
            maintain: {
                maxAssets: 999,
                workOrderLimit: 999,
                preventiveScheduling: true,
                safetyChecklists: true,
                visitReports: true,
                knowledgeBase: true,
                assetHealthProjections: true,
                maxStockInflows: 999,
                maxClusterIssues: 999,
                maxPendingRequests: 999,
                inflowHistoryLimit: 999,
                restockLogDays: 365,
                clusterReports: true,
                csvExport: true,
            },
        },
    },
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        limits: { maxUsers: 2, maxClusters: 1, maxClients: 0, maxSites: 0 },
        features: {
            liveTracking: false,
            prioritySupport: false,
            documents: {
                maxDocuments: 10,
                fullDocumentAudit: false,
                documentDownload: false,
            },
            infra_supply: {
                maxItineraryStops: 1,
                maxTripsPerMonth: 10,
                multiClusterDispatch: false,
                autoReconciliation: false,
                tripHistoryDays: 7,
            },
            maintain: {
                maxAssets: 5,
                workOrderLimit: 5,
                preventiveScheduling: false,
                safetyChecklists: false,
                visitReports: false,
                knowledgeBase: false,
                assetHealthProjections: false,
                maxStockInflows: 5,
                maxClusterIssues: 1,
                maxPendingRequests: 3,
                inflowHistoryLimit: 3,
                restockLogDays: 7,
                clusterReports: false,
                csvExport: false,
            },
        },
    },
    small_business: {
        id: 'small_business',
        name: 'Small Business',
        price: 18000, // ₦18k per module, ₦25k for both
        limits: { maxUsers: 7, maxClusters: 7, maxClients: 7, maxSites: 7 },
        features: {
            liveTracking: true,
            prioritySupport: false,
            documents: {
                maxDocuments: 100,
                fullDocumentAudit: false,
                documentDownload: true,
            },
            infra_supply: {
                maxItineraryStops: 7,
                maxTripsPerMonth: 100,
                multiClusterDispatch: true,
                autoReconciliation: false,
                tripHistoryDays: 90,
            },
            maintain: {
                maxAssets: 50,
                workOrderLimit: 50,
                preventiveScheduling: true,
                safetyChecklists: true,
                visitReports: true,
                knowledgeBase: false,
                assetHealthProjections: false,
                maxStockInflows: 999,
                maxClusterIssues: 999,
                maxPendingRequests: 999,
                inflowHistoryLimit: 999,
                restockLogDays: 90,
                clusterReports: false,
                csvExport: false,
            },
        },
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 40000,
        limits: { maxUsers: 999, maxClusters: 999, maxClients: 999, maxSites: 999 },
        features: {
            liveTracking: true,
            prioritySupport: true,
            documents: {
                maxDocuments: 999,
                fullDocumentAudit: true,
                documentDownload: true,
            },
            infra_supply: {
                maxItineraryStops: 999,
                maxTripsPerMonth: 999,
                multiClusterDispatch: true,
                autoReconciliation: true,
                tripHistoryDays: 365,
            },
            maintain: {
                maxAssets: 999,
                workOrderLimit: 999,
                preventiveScheduling: true,
                safetyChecklists: true,
                visitReports: true,
                knowledgeBase: true,
                assetHealthProjections: true,
                maxStockInflows: 999,
                maxClusterIssues: 999,
                maxPendingRequests: 999,
                inflowHistoryLimit: 999,
                restockLogDays: 365,
                clusterReports: true,
                csvExport: true,
            },
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

// ─── Hybrid Module Pricing ───────────────────────────

export type ModulePlanId = 'free' | 'small_business';

export const MODULE_PRICING = {
    single: 18000,   // ₦18k/mo for 1 module
    both: 25000,     // ₦25k/mo for 2 modules (save ₦11k)
    enterprise: 40000, // ₦40k/mo for everything
};

/**
 * Merge per-module plan tiers into a single PlanConfig.
 * Enterprise overrides everything. Otherwise each module gets its own tier.
 * Shared features (liveTracking, documents, etc.) take the HIGHEST tier.
 */
export function mergeModulePlans(
    infraPlan: PlanId,
    maintainPlan: PlanId,
    overallPlan: PlanId,
    subscription?: any
): PlanConfig {
    // Enterprise / Trial = full access across everything
    if (overallPlan === 'enterprise' || overallPlan === 'trial') {
        return getPlanConfig(overallPlan);
    }

    const infraConfig = getPlanConfig(infraPlan);
    const maintainConfig = getPlanConfig(maintainPlan);

    // Determine the "higher" tier for shared features
    const tierRank: Record<string, number> = { free: 0, small_business: 1, enterprise: 2, trial: 2 };
    const higherPlan = (tierRank[infraPlan] || 0) >= (tierRank[maintainPlan] || 0)
        ? infraConfig : maintainConfig;

    // Calculate effective price
    const infraPaid = infraPlan !== 'free';
    const maintainPaid = maintainPlan !== 'free';
    const effectivePrice = (infraPaid && maintainPaid)
        ? MODULE_PRICING.both
        : (infraPaid || maintainPaid) ? MODULE_PRICING.single : 0;

    // Determine overall effective ID for display
    const effectiveId: PlanId = (infraPaid || maintainPaid) ? 'small_business' : 'free';

    return {
        id: effectiveId,
        name: higherPlan.name,
        price: effectivePrice,
        limits: higherPlan.limits,
        features: {
            // Shared features take the higher tier
            liveTracking: higherPlan.features.liveTracking,
            prioritySupport: higherPlan.features.prioritySupport,
            documents: higherPlan.features.documents,

            // Module features come from their respective plans
            infra_supply: infraConfig.features.infra_supply,
            maintain: maintainConfig.features.maintain,
        },
    };
}
