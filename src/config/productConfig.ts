/**
 * Product Configuration — Single Source of Truth
 * 
 * Defines the NexHaul product modules (InfraSupply, Maintain).
 * Each product has its own sidebar items, routes, and dashboard.
 * Shared items (Clusters, Sites, Users, etc.) are visible in all products.
 */

export type ProductId = 'infra_supply' | 'maintain';

export interface ProductModule {
    id: ProductId;
    name: string;
    shortName: string;
    icon: string;
    description: string;
    color: string;       // For App Bar tab styling
    dashboardPath: string;
    sidebarKeys: string[]; // Keys matching SidebarItem.key
}

export const PRODUCTS: Record<ProductId, ProductModule> = {
    infra_supply: {
        id: 'infra_supply',
        name: 'InfraSupply',
        shortName: 'Supply',
        icon: '⛽',
        description: 'Fuel logistics & supply chain tracking',
        color: '#3b82f6', // Blue
        dashboardPath: '/dashboard',
        sidebarKeys: [
            'inventory',
            'trips',
            'financials',
            'reconciliation',
            'tracking',
            'documents',
        ],
    },
    maintain: {
        id: 'maintain',
        name: 'Maintain',
        shortName: 'Maintain',
        icon: '🔧',
        description: 'Preventive & reactive maintenance operations',
        color: '#f59e0b', // Amber
        dashboardPath: '/dashboard/maintain',
        sidebarKeys: [
            'work-orders',
            'assets',
            'visit-reports',
            'supplies',
            'schedule',
            'safety',
            'reports',
            'knowledge-base',
        ],
    },
};

/**
 * Items visible regardless of active product.
 * These appear at the top and bottom of the sidebar.
 */
export const SHARED_SIDEBAR_KEYS = [
    'dashboard',
    'company',
    'users',
    'clusters',
    'sites',
    'settings',
];

/**
 * Check if a sidebar key belongs to the shared core.
 */
export function isSharedItem(key: string): boolean {
    return SHARED_SIDEBAR_KEYS.includes(key);
}

/**
 * Get sidebar keys visible for a given set of active modules.
 */
export function getVisibleSidebarKeys(activeModules: ProductId[]): string[] {
    const productKeys = activeModules.flatMap(mod => PRODUCTS[mod].sidebarKeys);
    return [...SHARED_SIDEBAR_KEYS, ...productKeys];
}

/**
 * Default modules for new companies during trial.
 */
export const DEFAULT_TRIAL_MODULES: ProductId[] = ['infra_supply', 'maintain'];
