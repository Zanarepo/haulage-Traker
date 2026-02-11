import { supabase } from '@/lib/supabase';
import { Cluster, Site } from '@/types/database';

export const clusterService = {
    /**
     * Fetches all clusters for a company.
     */
    async getClusters(companyId: string) {
        const { data, error } = await supabase
            .from('clusters')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;
        return data as Cluster[];
    },

    /**
     * Creates a new cluster (Superadmin only).
     */
    async createCluster(name: string, companyId: string, state?: string) {
        const { data, error } = await supabase
            .from('clusters')
            .insert({ name, company_id: companyId, state })
            .select()
            .single();

        if (error) throw error;
        return data as Cluster;
    },

    /**
     * Fetches all sites for a specific cluster.
     */
    async getSites(clusterId: string) {
        const { data, error } = await supabase
            .from('sites')
            .select('*, clients(name)')
            .eq('cluster_id', clusterId)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Creates a new site within a cluster.
     */
    async createSite(siteData: Partial<Site>) {
        const { data, error } = await supabase
            .from('sites')
            .insert(siteData)
            .select()
            .single();

        if (error) throw error;
        return data as Site;
    }
};
