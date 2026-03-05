'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductId, PRODUCTS, DEFAULT_TRIAL_MODULES } from '@/config/productConfig';

const LAST_PRODUCT_KEY = 'nexhaul_last_product';

/**
 * Hook to manage which product modules are active for a company.
 * 
 * Returns:
 * - activeModules: ProductId[] — which products the company has
 * - activeProduct: ProductId — currently selected product tab
 * - setActiveProduct: switch between products
 * - hasModule(id): check if a specific module is enabled
 * - isMultiProduct: true if company has more than one module
 * - loading: still fetching from DB
 */
export function useCompanyModules(companyId: string | null) {
    const [activeModules, setActiveModules] = useState<ProductId[]>(['infra_supply']);
    const [activeProduct, setActiveProductState] = useState<ProductId>('infra_supply');
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    // Automatically switch active product if URL matches a product's dashboard path
    useEffect(() => {
        if (!pathname) return;

        Object.values(PRODUCTS).forEach((product) => {
            // Check if current path matches this product's dashboard prefix
            if (pathname.startsWith(product.dashboardPath)) {
                if (activeProduct !== product.id && activeModules.includes(product.id)) {
                    setActiveProductState(product.id);
                    localStorage.setItem(LAST_PRODUCT_KEY, product.id);
                }
            }
        });
    }, [pathname, activeProduct, activeModules]);

    useEffect(() => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        const applyModules = (modules: ProductId[]) => {
            setActiveModules(modules);
            const lastUsed = localStorage.getItem(LAST_PRODUCT_KEY) as ProductId | null;
            if (lastUsed && modules.includes(lastUsed)) {
                setActiveProductState(lastUsed);
            } else {
                setActiveProductState(modules[0]);
            }
        };

        const fetchModules = async () => {
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('active_modules')
                    .eq('id', companyId)
                    .single();

                if (error) throw error;

                const modules = (data?.active_modules as ProductId[]) || ['infra_supply'];
                applyModules(modules);
            } catch (err) {
                console.error('[Modules] Failed to fetch active modules:', err);
                setActiveModules(['infra_supply']);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchModules();

        // Listen for updates dispatched by App Center after a successful toggle
        const handleModulesUpdated = () => fetchModules();
        window.addEventListener('nexhaul:modules-updated', handleModulesUpdated);

        return () => {
            window.removeEventListener('nexhaul:modules-updated', handleModulesUpdated);
        };
    }, [companyId]);

    const setActiveProduct = useCallback((productId: ProductId) => {
        setActiveProductState(productId);
        localStorage.setItem(LAST_PRODUCT_KEY, productId);
    }, []);

    const hasModule = useCallback((id: ProductId) => {
        return activeModules.includes(id);
    }, [activeModules]);

    return {
        activeModules,
        setActiveModules,
        activeProduct,
        setActiveProduct,
        hasModule,
        isMultiProduct: activeModules.length > 1,
        loading,
    };
}
