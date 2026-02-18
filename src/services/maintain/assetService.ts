import { supabase } from '@/lib/supabase';

export const assetService = {
    async getAssets(companyId: string, siteId?: string, clusterId?: string) {
        let query = supabase
            .from('maintain_assets')
            .select('*')
            .eq('company_id', companyId);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        if (clusterId) {
            query = query.eq('cluster_id', clusterId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const enriched = await Promise.all((data || []).map(async (asset) => {
            const siteRes = asset.site_id
                ? await supabase.from('sites').select('id, name, site_id_code, clusters(name, state)').eq('id', asset.site_id).single()
                : null;
            return { ...asset, site: siteRes?.data || null };
        }));

        return enriched;
    },

    async createAsset(asset: any) {
        const cleanAsset = { ...asset };
        ['manufacturing_date', 'installation_date', 'purchase_date', 'warranty_expiry_date'].forEach(field => {
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
        ['manufacturing_date', 'installation_date', 'purchase_date', 'warranty_expiry_date'].forEach(field => {
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
        const { data: workOrders } = await supabase
            .from('maintain_work_orders')
            .select(`
                id, title, status, type, priority, completed_at, updated_at, engineer_id
            `)
            .eq('asset_id', assetId)
            .order('updated_at', { ascending: false });

        const engineerIds = [...new Set((workOrders || []).map(wo => wo.engineer_id).filter(Boolean))];
        let engineerNames: Record<string, string> = {};

        if (engineerIds.length > 0) {
            const { data: pData } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', engineerIds);

            if (pData) {
                engineerNames = Object.fromEntries(pData.map(u => [u.id, u.full_name]));
            }
        }

        const { data: readings } = await supabase
            .from('maintain_diesel_readings')
            .select('*')
            .eq('asset_id', assetId);

        const recorderIds = [...new Set((readings || []).map(r => r.recorded_by).filter(Boolean))];
        let recorderNames: Record<string, string> = {};

        if (recorderIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', recorderIds);

            if (usersData) {
                recorderNames = Object.fromEntries(usersData.map(u => [u.id, u.full_name]));
            }
        }

        let lastHours: number | null = null;
        const sortedReadings = (readings || []).sort((a, b) =>
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );

        const readingsWithDelta = sortedReadings.map(r => {
            const delta = (lastHours !== null && r.hour_meter !== null) ? Number(r.hour_meter) - lastHours : null;
            if (r.hour_meter !== null) lastHours = Number(r.hour_meter);
            return {
                ...r,
                delta,
                recorder_name: r.recorded_by ? recorderNames[r.recorded_by] : 'System'
            };
        }).reverse();

        const logs = [
            ...(workOrders || []).map(wo => ({
                id: wo.id,
                type: 'maintenance',
                title: wo.title,
                status: wo.status,
                priority: (wo as any).priority,
                time: (wo as any).completed_at || (wo as any).updated_at,
                user: (wo as any).engineer_id ? engineerNames[(wo as any).engineer_id] : 'System',
                details: `${(wo as any).type.toUpperCase()} ticket`
            })),
            ...readingsWithDelta.map(r => {
                const isRefill = String(r.reading_type).toLowerCase() === 'refill';
                return {
                    id: r.id,
                    type: 'reading',
                    time: r.recorded_at,
                    user: (r as any).recorder_name || 'System',
                    details: isRefill
                        ? `FUEL REFILL: ${r.level}L confirmed`
                        : `${String(r.reading_type).toUpperCase()}: ${r.hour_meter ? `${r.hour_meter} hrs` : ''}${r.delta ? ` (+${r.delta}h run)` : ''}${r.hour_meter && r.level ? ' | ' : ''}${r.level ? `${r.level}L fuel` : ''}`
                };
            })
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return logs;
    },

    async getAssetsForEngineer(companyId: string, engineerId: string) {
        const { data: clusters } = await supabase
            .from('user_cluster_assignments')
            .select('cluster_id')
            .eq('user_id', engineerId);

        if (!clusters || clusters.length === 0) return [];

        const clusterIds = clusters.map(c => c.cluster_id);

        const { data: sites } = await supabase
            .from('sites')
            .select('id')
            .in('cluster_id', clusterIds);

        if (!sites || sites.length === 0) return [];

        const siteIds = sites.map(s => s.id);

        let query = supabase
            .from('maintain_assets')
            .select('*')
            .eq('company_id', companyId)
            .in('site_id', siteIds);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const enriched = await Promise.all((data || []).map(async (asset) => {
            const siteRes = asset.site_id
                ? await supabase.from('sites').select('id, name, site_id_code, clusters(name, state)').eq('id', asset.site_id).single()
                : null;
            return { ...asset, site: siteRes?.data || null };
        }));

        return enriched;
    },
};
