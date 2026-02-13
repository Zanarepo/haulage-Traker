import { supabase } from '@/lib/supabase';

export interface Site {
    id: string;
    cluster_id: string;
    client_id: string;
    name: string;
    site_id_code: string;
    tank_capacity: number;
    host_community?: string;
    created_at: string;
}

export const siteService = {
    async getSites() {
        const { data, error } = await supabase
            .from('sites')
            .select('*, clusters(name, state), clients(name)')
            .order('name');
        if (error) throw error;
        return data;
    },

    async createSite(site: Partial<Site>) {
        const { data, error } = await supabase
            .from('sites')
            .insert([site])
            .select()
            .single();
        if (error) throw error;
        return data as Site;
    },

    async updateSite(id: string, updates: Partial<Site>) {
        const { data, error } = await supabase
            .from('sites')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Site;
    },

    async deleteSite(id: string) {
        const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
