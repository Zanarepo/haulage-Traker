import { supabase } from '@/lib/supabase';

export const documentService = {
    /**
     * Upload an image (signature or waybill) to Supabase Storage
     */
    async uploadDocument(file: File | Blob, path: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('alldocs')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('alldocs')
            .getPublicUrl(data.path);

        return publicUrl;
    },

    /**
     * Upload a base64 signature
     */
    async uploadSignature(base64: string, prefix: string): Promise<string> {
        const res = await fetch(base64);
        const blob = await res.blob();
        const fileName = `${prefix}_${Date.now()}.png`;
        const path = `signatures/${fileName}`;

        return this.uploadDocument(blob, path);
    },

    /**
     * Get all delivery documents (dispensing logs with documents)
     */
    async getDeliveryDocuments() {
        const { data, error } = await supabase
            .from('dispensing_logs')
            .select(`
                *,
                trips (
                    truck_plate_number,
                    driver:users!driver_id (full_name),
                    clients (name)
                ),
                sites (name)
            `)
            .or('waybill_photo_url.not.is.null,driver_signature_url.not.is.null,engineer_signature_url.not.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
