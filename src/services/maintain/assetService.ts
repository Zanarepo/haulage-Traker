import { supabase } from '@/lib/supabase';
import { maintenanceIntelligence } from './maintenanceIntelligence';

export const assetService = {
    async getAssets(companyId: string, options?: { siteId?: string; clusterIds?: string[] }) {
        let query = supabase
            .from('maintain_assets')
            .select('*, site:sites!inner(id, name, cluster_id, site_id_code, is_hybrid, solar_offset_hours, clusters(id, name, state))')
            .eq('company_id', companyId);

        if (options?.siteId) {
            query = query.eq('site_id', options.siteId);
        }

        if (options?.clusterIds && options.clusterIds.length > 0) {
            query = query.in('sites.cluster_id', options.clusterIds);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Enrich with Proactive Intelligence
        const enriched = (data || []).map(asset => {
            const projections = maintenanceIntelligence.calculateAssetProjections(asset, asset.site);
            return {
                ...asset,
                projections
            };
        });

        return enriched;
    },

    async createAsset(asset: any) {
        const cleanAsset = { ...asset };
        const dateFields = [
            'manufacturing_date', 'installation_date', 'purchase_date', 'warranty_expiry_date',
            'last_pm_date', 'last_service_date'
        ];
        dateFields.forEach(field => {
            if (cleanAsset[field] === '') cleanAsset[field] = null;
        });

        const { data, error } = await supabase
            .from('maintain_assets')
            .insert(cleanAsset)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateAsset(id: string, updates: any) {
        const cleanUpdates = { ...updates };
        const dateFields = [
            'manufacturing_date', 'installation_date', 'purchase_date', 'warranty_expiry_date',
            'last_pm_date', 'last_service_date'
        ];
        dateFields.forEach(field => {
            if (cleanUpdates[field] === '') cleanUpdates[field] = null;
        });

        const { data, error } = await supabase
            .from('maintain_assets')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteAsset(id: string) {
        const { error } = await supabase
            .from('maintain_assets')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async getAssetHistory(assetId: string) {
        // 1. Fetch Work Orders with their latest visit reports
        const { data: workOrders } = await supabase
            .from('maintain_work_orders')
            .select(`
                id, title, status, type, priority, completed_at, updated_at, engineer_id,
                reports:maintain_visit_reports(hour_meter_before, hour_meter_after, diesel_level_after)
            `)
            .eq('asset_id', assetId)
            .order('updated_at', { ascending: false });

        // 2. Fetch User Names
        const engineerIds = [...new Set((workOrders || []).map(wo => wo.engineer_id).filter(Boolean))];
        let userNames: Record<string, string> = {};

        if (engineerIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', engineerIds);
            if (usersData) {
                userNames = Object.fromEntries(usersData.map(u => [u.id, u.full_name]));
            }
        }

        // 3. Fetch Diesel/Meter Readings
        const { data: readings } = await supabase
            .from('maintain_diesel_readings')
            .select('*')
            .eq('asset_id', assetId)
            .order('recorded_at', { ascending: false });

        // Add users who recorded readings to userNames
        const recorderIds = [...new Set((readings || []).map(r => r.recorded_by).filter(Boolean))];
        const missingRecorders = recorderIds.filter(id => !userNames[id]);
        if (missingRecorders.length > 0) {
            const { data: uData } = await supabase.from('users').select('id, full_name').in('id', missingRecorders);
            uData?.forEach(u => userNames[u.id] = u.full_name);
        }

        // 4. Combine and Sort Chronologically for Calculation
        let combined: any[] = [];

        // Add Work Orders
        (workOrders || []).forEach(wo => {
            const report = (wo as any).reports?.[0];
            combined.push({
                id: wo.id,
                date: wo.completed_at || wo.updated_at,
                source: `${wo.type.toUpperCase()}: ${wo.title}`,
                type: 'work_order',
                is_pm: wo.type === 'preventive',
                user: wo.engineer_id ? userNames[wo.engineer_id] : 'System',
                new_meter: report?.hour_meter_after || null,
                fuel: report?.diesel_level_after || null,
                status: wo.status
            });
        });

        // Add Readings
        (readings || []).forEach(r => {
            combined.push({
                id: r.id,
                date: r.recorded_at,
                source: r.reading_type.toUpperCase() === 'REFILL' ? 'FUEL REFILL' : 'METER READING',
                type: 'reading',
                is_pm: false,
                user: r.recorded_by ? userNames[r.recorded_by] : 'System',
                new_meter: r.hour_meter || null,
                fuel: r.level || null,
                status: 'recorded'
            });
        });

        // Sort ascending for calculation
        combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 5. Calculate Deltas
        let lastMeter: number | null = null;
        const processedHistory = combined.map(entry => {
            const hasMeter = entry.new_meter !== null;
            const currentMeter = hasMeter ? Number(entry.new_meter) : null;

            const prev_meter = lastMeter;
            const delta = (currentMeter !== null && prev_meter !== null) ? currentMeter - prev_meter : null;

            if (currentMeter !== null) {
                lastMeter = currentMeter;
            }

            return {
                ...entry,
                prev_meter,
                delta
            };
        });

        // 6. Return Sorted Descending for UI
        return processedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
};
