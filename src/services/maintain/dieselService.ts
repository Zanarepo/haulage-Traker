import { supabase } from '@/lib/supabase';

export const dieselService = {
    async saveDieselReading(reading: {
        site_id: string;
        work_order_id?: string;
        asset_id?: string;
        company_id: string;
        level: number;
        hour_meter?: number;
        reading_type: 'before' | 'after' | 'refill' | 'periodic';
        recorded_by: string;
    }) {
        const { data, error } = await supabase
            .from('maintain_diesel_readings')
            .insert(reading)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSiteDieselHistory(siteId: string) {
        const { data, error } = await supabase
            .from('maintain_diesel_readings')
            .select('*')
            .eq('site_id', siteId)
            .order('recorded_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async confirmRefuel(logId: string, assetId: string, userId: string, companyId: string, siteId: string, quantity: number) {
        const { error: logError } = await supabase
            .from('dispensing_logs')
            .update({
                confirmed_at: new Date().toISOString(),
                confirmed_by: userId,
                confirmed_asset_id: assetId
            })
            .eq('id', logId);

        if (logError) throw logError;

        const { error: readingError } = await supabase
            .from('maintain_diesel_readings')
            .insert({
                asset_id: assetId,
                company_id: companyId,
                site_id: siteId,
                level: quantity,
                reading_type: 'refill',
                recorded_by: userId,
                recorded_at: new Date().toISOString()
            });

        if (readingError) throw readingError;

        return true;
    },
};
