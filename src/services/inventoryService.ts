import { supabase } from '@/lib/supabase';
import { Client } from '@/types/database';

export const inventoryService = {
    /**
     * Fetches all clients for a company.
     */
    async getClients(companyId: string) {
        const { data, error } = await supabase
            .from('clients')
            .select('*, sites(cluster_id)')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;
        return data as (Client & { sites: { cluster_id: string }[] })[];
    },

    /**
     * Client Depot Supplies (Diesel brought into the depot by clients)
     */
    async getClientDepotSupplies(companyId: string) {
        const { data, error } = await supabase
            .from('depot_purchases')
            .select(`
                *,
                clients (name)
            `)
            .eq('company_id', companyId)
            .order('purchase_date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async recordClientSupply(supplyData: {
        company_id: string;
        client_id: string;
        total_quantity: number;
        purchase_date?: string;
    }) {
        const { data: purchase, error: purchaseError } = await supabase
            .from('depot_purchases')
            .insert({
                ...supplyData,
                remaining_quantity: supplyData.total_quantity
            })
            .select()
            .single();

        if (purchaseError) throw purchaseError;

        // Log the 'IN' movement
        const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({
                company_id: supplyData.company_id,
                client_id: supplyData.client_id,
                type: 'IN',
                quantity: supplyData.total_quantity,
                reference_id: purchase.id,
                created_at: supplyData.purchase_date || new Date().toISOString()
            });

        if (logError) console.error('Failed to log inventory movement:', logError);

        return purchase;
    },

    /**
     * Fetches unified inventory logs (IN and OUT) for a client.
     */
    async getInventoryLogs(clientId: string) {
        const { data, error } = await supabase
            .from('inventory_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetches all inventory logs for a company.
     */
    async getAllInventoryLogs(companyId: string) {
        const { data, error } = await supabase
            .from('inventory_logs')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async updateClientSupply(id: string, updateData: { total_quantity: number; remaining_quantity: number; purchase_date: string }) {
        const { data, error } = await supabase
            .from('depot_purchases')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteClientSupply(id: string) {
        const { error } = await supabase
            .from('depot_purchases')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Clear all supply history and logs for the company
     */
    async clearAllSupplies(companyId: string) {
        // Delete logs first
        await supabase.from('inventory_logs').delete().eq('company_id', companyId);

        const { error } = await supabase
            .from('depot_purchases')
            .delete()
            .eq('company_id', companyId);

        if (error) throw error;
        return true;
    },

    /**
     * Clear all supply history and logs for a specific client
     */
    async clearClientSupplies(clientId: string) {
        // Delete logs first
        await supabase.from('inventory_logs').delete().eq('client_id', clientId);

        const { error } = await supabase
            .from('depot_purchases')
            .delete()
            .eq('client_id', clientId);

        if (error) throw error;
        return true;
    }
};
