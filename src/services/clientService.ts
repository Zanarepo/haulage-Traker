import { supabase } from '@/lib/supabase';

export interface Client {
    id: string;
    company_id: string;
    name: string;
    haulage_rate_per_liter: number;
    created_at: string;
}

export const clientService = {
    async getClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');
        if (error) throw error;
        return data as Client[];
    },

    async createClient(client: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .insert([client])
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    },

    async updateClient(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    },

    async deleteClient(id: string) {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
