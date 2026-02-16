'use client';

import { useState, useEffect, useCallback } from 'react';
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

    useEffect(() => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        const fetchModules = async () => {
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('active_modules')
                    .eq('id', companyId)
                    .single();

                if (error) throw error;

                const modules = (data?.active_modules as ProductId[]) || ['infra_supply'];
                setActiveModules(modules);

                // Restore last-used product from localStorage
                const lastUsed = localStorage.getItem(LAST_PRODUCT_KEY) as ProductId | null;
                if (lastUsed && modules.includes(lastUsed)) {
                    setActiveProductState(lastUsed);
                } else {
                    setActiveProductState(modules[0]);
                }
            } catch (err) {
                console.error('[Modules] Failed to fetch active modules:', err);
                setActiveModules(['infra_supply']);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
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
        activeProduct,
        setActiveProduct,
        hasModule,
        isMultiProduct: activeModules.length > 1,
        loading,
    };
}
