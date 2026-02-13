import { supabase } from '@/lib/supabase';

export const financialService = {
    /**
     * Get all financial records with related data
     */
    async getFinancials(companyId: string) {
        const { data, error } = await supabase
            .from('financials')
            .select(`
                *,
                dispensing_logs!dispensing_log_id (
                    *,
                    trips!trip_id (
                        *,
                        clients!client_id (name, haulage_rate_per_liter),
                        driver:users!driver_id (full_name)
                    ),
                    sites!site_id (name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter by company_id through dispensing_logs -> trips -> users
        // Since RLS is enabled, we already get only allowed data, 
        // but it's good to ensure it.
        return data;
    },

    /**
     * Approve or Flag a financial record
     */
    async updateApproval(id: string, updates: {
        accountant_approval?: boolean;
        auditor_approval?: boolean;
        is_audit_flagged?: boolean;
        approved_by_id?: string;
    }) {
        const { data, error } = await supabase
            .from('financials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get high-level stats
     */
    async getFinancialStats() {
        // We can use a RPC or just calculate from fetched data in the hook
        // For efficiency, we just fetch basic sums
        const { data, error } = await supabase
            .from('financials')
            .select('calculated_haulage_fee, loss_amount');

        if (error) throw error;

        const totalHaulage = data.reduce((acc, curr) => acc + (Number(curr.calculated_haulage_fee) || 0), 0);
        const totalLoss = data.reduce((acc, curr) => acc + (Number(curr.loss_amount) || 0), 0);

        return {
            totalHaulage,
            totalLoss,
            totalRecords: data.length
        };
    }
};
