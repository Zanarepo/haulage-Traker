import { supabase } from '@/lib/supabase';

export interface VisitReport {
    id: string;
    company_id: string;
    work_order_id?: string;
    site_id?: string;
    engineer_id: string;

    before_photos: string[];
    hour_meter_before?: number;
    diesel_level_before?: number;
    site_condition_notes?: string;

    after_photos: string[];
    hour_meter_after?: number;
    diesel_level_after?: number;

    geo_lat?: number;
    geo_lng?: number;
    geofence_valid?: boolean;

    arrived_at: string;
    departed_at?: string;

    created_at: string;
}

export const visitService = {
    async startVisit(params: {
        companyId: string;
        siteId: string;
        engineerId: string;
        workOrderId?: string;
        lat?: number;
        lng?: number;
        geofenceValid?: boolean;
        hourMeterBefore?: number;
        dieselLevelBefore?: number;
        beforePhotos?: string[];
        site_condition_notes?: string;
    }) {
        const { data, error } = await supabase
            .from('maintain_visit_reports')
            .insert([{
                company_id: params.companyId,
                site_id: params.siteId,
                work_order_id: params.workOrderId || null,
                engineer_id: params.engineerId,
                geo_lat: params.lat,
                geo_lng: params.lng,
                geofence_valid: params.geofenceValid || false,
                hour_meter_before: params.hourMeterBefore,
                diesel_level_before: params.dieselLevelBefore,
                before_photos: params.beforePhotos || [],
                site_condition_notes: params.site_condition_notes,
                arrived_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data as VisitReport;
    },

    async updateCoordinates(visitId: string, lat: number, lng: number) {
        const { error } = await supabase
            .from('maintain_visit_reports')
            .update({
                geo_lat: lat,
                geo_lng: lng,
                geofence_valid: true // Assume valid for now if they identifying
            })
            .eq('id', visitId);

        if (error) throw error;
    },

    async submitSafetyCheck(params: {
        visitId: string;
        companyId: string;
        checklistJson: any;
        passed: boolean;
        signedBy: string;
    }) {
        const { error } = await supabase
            .from('maintain_safety_checklists')
            .insert([{
                visit_report_id: params.visitId,
                company_id: params.companyId,
                checklist_json: params.checklistJson,
                passed: params.passed,
                signed_by: params.signedBy
            }]);

        if (error) throw error;
    },

    async completeVisit(visitId: string, data: {
        beforePhotos?: string[];
        afterPhotos?: string[];
        hourMeterAfter?: number;
        dieselLevelAfter?: number;
    }) {
        const { error } = await supabase
            .from('maintain_visit_reports')
            .update({
                before_photos: data.beforePhotos,
                after_photos: data.afterPhotos,
                hour_meter_after: data.hourMeterAfter,
                diesel_level_after: data.dieselLevelAfter,
                departed_at: new Date().toISOString()
            })
            .eq('id', visitId);

        if (error) throw error;
    },

    async uploadVisitMedia(file: File, visitId: string, companyId: string, userId: string, type: 'before' | 'after' | 'other', header?: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${Date.now()}.${fileExt}`;
        const filePath = `companies/${companyId}/visits/${visitId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('sitedoc')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('sitedoc')
            .getPublicUrl(filePath);

        const { data, error: dbError } = await supabase
            .from('maintain_visit_report_media')
            .insert({
                visit_report_id: visitId,
                company_id: companyId,
                type,
                file_url: publicUrl,
                header: header || null,
                uploaded_by: userId
            })
            .select()
            .single();

        if (dbError) throw dbError;
        return data;
    },

    async getVisitMedia(visitId: string) {
        const { data, error } = await supabase
            .from('maintain_visit_report_media')
            .select('*')
            .eq('visit_report_id', visitId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async deleteVisitMedia(mediaId: string, fileUrl: string) {
        const path = fileUrl.split('/storage/v1/object/public/sitedoc/').pop();
        if (path) {
            await supabase.storage.from('sitedoc').remove([path]);
        }

        const { error } = await supabase
            .from('maintain_visit_report_media')
            .delete()
            .eq('id', mediaId);

        if (error) throw error;
        return true;
    },

    async getVisitReport(visitId: string) {
        const { data, error } = await supabase
            .from('maintain_visit_reports')
            .select(`
                *,
                engineer:users!maintain_visit_reports_engineer_id_fkey(full_name),
                work_order:maintain_work_orders(title, type),
                site:sites(name, site_id_code)
            `)
            .eq('id', visitId)
            .single();

        if (error) throw error;
        return data;
    },

    async getVisitReports(companyId: string, engineerId?: string) {
        let query = supabase
            .from('maintain_visit_reports')
            .select(`
                *,
                engineer:users!maintain_visit_reports_engineer_id_fkey(full_name),
                work_order:maintain_work_orders(title, type),
                site:sites(name, site_id_code)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (engineerId) {
            query = query.eq('engineer_id', engineerId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updateVisitReport(visitId: string, updates: Partial<VisitReport>) {
        const { error } = await supabase
            .from('maintain_visit_reports')
            .update(updates)
            .eq('id', visitId);

        if (error) throw error;
    },

    async deleteVisitReport(visitId: string) {
        // 1. Get media to delete from storage
        const media = await this.getVisitMedia(visitId);
        for (const m of media) {
            const path = m.file_url.split('/storage/v1/object/public/sitedoc/').pop();
            if (path) {
                await supabase.storage.from('sitedoc').remove([path]);
            }
        }

        // 2. Delete the record (cascading will handle safety checklists and media table entries Usually)
        const { error } = await supabase
            .from('maintain_visit_reports')
            .delete()
            .eq('id', visitId);

        if (error) throw error;
    }
};
