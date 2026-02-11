import { supabase } from '@/lib/supabase';
import { Client } from '@/types/database';

export const inventoryService = {
    /**
     * Fetches all clients for a company.
     */
    async getClients(companyId: string) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;
        return data as Client[];
    },

    /**
     * Records a new diesel purchase from the manufacturer.
     */
    async recordDepotPurchase(purchaseData: {
        company_id: string;
        manufacturer_name: string;
        total_quantity: number;
    }) {
        const { data, error } = await supabase
            .from('depot_purchases')
            .insert({
                ...purchaseData,
                remaining_quantity: purchaseData.total_quantity
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Allocates quantity from a depot purchase to a specific client.
     */
    async allocateToClient(allocationData: {
        depot_purchase_id: string;
        client_id: string;
        quantity_allocated: number;
    }) {
        // 1. Create allocation
        const { data, error } = await supabase
            .from('client_allocations')
            .insert(allocationData)
            .select()
            .single();

        if (error) throw error;

        // 2. Update remaining quantity in depot_purchases
        // (In a production app, this should be a DB trigger or RPC for atomicity)
        const { error: updateError } = await supabase.rpc('decrement_depot_quantity', {
            purchase_id: allocationData.depot_purchase_id,
            amount: allocationData.quantity_allocated
        });

        if (updateError) console.warn('Manual update needed if RPC not found');

        return data;
    }
};
