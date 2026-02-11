import { supabase } from '@/lib/supabase';
import { Company } from '@/types/database';

export const companyService = {
    /**
     * Gets full details of a company including metadata.
     */
    async getCompanyDetails(companyId: string) {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (error) throw error;
        return data as Company;
    },

    /**
     * Updates company details.
     */
    async updateCompany(companyId: string, updates: Partial<Company>) {
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', companyId)
            .select();

        if (error) throw error;

        // If data is empty, it means RLS blocked the update or ID was not found
        if (!data || data.length === 0) {
            throw new Error('Update failed: You might not have permission or the company was not found.');
        }

        return data[0];
    },

    /**
     * Gets organizational stats for a company.
     * Counts of clusters, sites, clients, and active users.
     */
    async getOrgStats(companyId: string) {
        // We use parallel queries for efficiency
        const [
            clusters,
            sites,
            clients,
            users
        ] = await Promise.all([
            supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
            supabase.from('sites').select('id', { count: 'exact', head: true }).filter('cluster_id', 'in',
                supabase.from('clusters').select('id').eq('company_id', companyId)
            ),
            supabase.from('clients').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true)
        ]);

        return {
            clustersCount: clusters.count || 0,
            sitesCount: sites.count || 0,
            clientsCount: clients.count || 0,
            activeUsersCount: users.count || 0
        };
    }
};
