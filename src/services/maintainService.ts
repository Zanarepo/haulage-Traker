import { supabase } from '@/lib/supabase';

/**
 * Maintain Module — Service Layer
 * 
 * All tables now reside in the 'public' schema with 'maintain_' prefix.
 * This simplifies API access and ensures visibility in Supabase.
 */

export const maintainService = {
    // ── Dashboard Stats ──
    async getDashboardStats(companyId: string) {
        const [workOrders, assets, overdue] = await Promise.all([
            // Open work orders
            supabase
                .from('maintain_work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .in('status', ['open', 'assigned', 'in_progress']),

            // Total active assets
            supabase
                .from('maintain_assets')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('status', 'active'),

            // Overdue work orders (past SLA)
            supabase
                .from('maintain_work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .in('status', ['open', 'assigned', 'in_progress'])
                .lt('scheduled_date', new Date().toISOString()),
        ]);

        // Completed this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: completedThisMonth } = await supabase
            .from('maintain_work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'completed')
            .gte('completed_at', startOfMonth.toISOString());

        return [
            {
                title: "Open Work Orders",
                value: workOrders.count?.toString() || "0",
                sub: "Pending / In Progress",
                color: "blue"
            },
            {
                title: "Active Assets",
                value: assets.count?.toString() || "0",
                sub: "Across all sites",
                color: "emerald"
            },
            {
                title: "Overdue",
                value: overdue.count?.toString() || "0",
                sub: "Past scheduled date",
                color: "rose"
            },
            {
                title: "Completed",
                value: completedThisMonth?.toString() || "0",
                sub: "This month",
                color: "purple"
            }
        ];
    },

    // ── Work Orders ──
    async getWorkOrders(companyId: string, filters?: { status?: string; type?: string }) {
        let query = supabase
            .from('maintain_work_orders')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.type) query = query.eq('type', filters.type);

        const { data, error } = await query;
        if (error) throw error;

        // Enrich with site and engineer names from public schema
        const enriched = await Promise.all((data || []).map(async (wo) => {
            const [siteRes, engineerRes] = await Promise.all([
                wo.site_id ? supabase.from('sites').select('name, site_id_code, clusters(name)').eq('id', wo.site_id).single() : null,
                wo.engineer_id ? supabase.from('users').select(`
                    full_name,
                    user_cluster_assignments(
                        clusters(name)
                    )
                `).eq('id', wo.engineer_id).single() : null,
            ]);

            // Transform engineer clusters into a flat list of names
            const engineerData = engineerRes?.data as any;
            const engineerClusterNames = engineerData?.user_cluster_assignments?.map(
                (uca: any) => uca.clusters?.name
            ).filter(Boolean) || [];

            return {
                ...wo,
                site: siteRes?.data || null,
                engineer: engineerData ? { ...engineerData, cluster_names: engineerClusterNames } : null,
            };
        }));

        return enriched;
    },

    async createWorkOrder(workOrder: any) {
        const { data, error } = await supabase
            .from('maintain_work_orders')
            .insert(workOrder)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateWorkOrder(id: string, updates: any) {
        const { data, error } = await supabase
            .from('maintain_work_orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteWorkOrder(id: string) {
        const { error } = await supabase
            .from('maintain_work_orders')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // ── Work Order Media ──
    async uploadWorkOrderMedia(file: File, workOrderId: string, companyId: string, userId: string, type: 'before' | 'after' | 'other', header?: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${workOrderId}/${type}_${Date.now()}.${fileExt}`;
        const filePath = `workorder/${fileName}`;

        // 1. Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('workorder')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('workorder')
            .getPublicUrl(fileName);

        // 3. Save to DB
        const { data, error: dbError } = await supabase
            .from('maintain_workorder_media')
            .insert({
                work_order_id: workOrderId,
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

    async getWorkOrderMedia(workOrderId: string) {
        const { data, error } = await supabase
            .from('maintain_workorder_media')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async deleteWorkOrderMedia(mediaId: string, fileUrl: string) {
        // 1. Extract path from URL
        const path = fileUrl.split('/storage/v1/object/public/workorder/').pop();
        if (path) {
            await supabase.storage.from('workorder').remove([path]);
        }

        // 2. Delete from DB
        const { error } = await supabase
            .from('maintain_workorder_media')
            .delete()
            .eq('id', mediaId);

        if (error) throw error;
        return true;
    },

    // ── Diesel Tracking ──
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

    // ── Inventory Logs ──
    async saveInventoryLog(companyId: string, workOrderId: string, userId: string, items: Array<{ item_name: string; quantity: number; notes?: string }>) {
        const logs = items.map(item => ({
            work_order_id: workOrderId,
            company_id: companyId,
            recorded_by: userId,
            ...item
        }));

        const { data, error } = await supabase
            .from('maintain_inventory_logs')
            .insert(logs)
            .select();

        if (error) throw error;
        return data;
    },

    async getInventoryLogs(workOrderId: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_logs')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async deleteInventoryLog(logId: string) {
        const { error } = await supabase
            .from('maintain_inventory_logs')
            .delete()
            .eq('id', logId);
        if (error) throw error;
        return true;
    },

    // ── Assets ──
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

        // Enrich with site names and cluster state
        const enriched = await Promise.all((data || []).map(async (asset) => {
            const siteRes = asset.site_id
                ? await supabase.from('sites').select('id, name, site_id_code, clusters(name, state)').eq('id', asset.site_id).single()
                : null;
            return { ...asset, site: siteRes?.data || null };
        }));

        return enriched;
    },

    async createAsset(asset: any) {
        // Clean up dates - if empty string, set to null
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
        // Clean up dates - if empty string, set to null
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
        // 1. Get Maintenance Logs (Work Orders)
        const { data: workOrders } = await supabase
            .from('maintain_work_orders')
            .select(`
                id, title, status, type, priority, completed_at, updated_at, engineer_id
            `)
            .eq('asset_id', assetId)
            .order('updated_at', { ascending: false });

        // 1b. Manually resolve engineer names
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

        // 2. Get Fuel & Hour Meter Logs
        const { data: readings } = await supabase
            .from('maintain_diesel_readings')
            .select('*')
            .eq('asset_id', assetId);

        // 2b. Manually resolve user names for readings if they exist
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

        // 2c. Calculate Hour Meter Deltas
        let lastHours: number | null = null;
        // Sort in JS to ensure it works even if recorded_at column is weird in SQL sort
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
        }).reverse(); // Reverse for UI (desc)

        // 3. Combine and sort
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

    // ── Visit Reports ──
    async getVisitReports(companyId: string) {
        const { data: woIds } = await supabase
            .from('maintain_work_orders')
            .select('id')
            .eq('company_id', companyId);

        if (!woIds || woIds.length === 0) return [];

        const { data, error } = await supabase
            .from('maintain_visit_reports')
            .select('*')
            .in('work_order_id', woIds.map(w => w.id))
            .order('created_at', { ascending: false });
        if (error) throw error;

        const enriched = await Promise.all((data || []).map(async (report) => {
            const [engineerRes, woRes] = await Promise.all([
                supabase.from('users').select('full_name').eq('id', report.engineer_id).single(),
                supabase.from('maintain_work_orders').select('title, type, priority, site_id').eq('id', report.work_order_id).single(),
            ]);

            let siteName = null;
            if (woRes.data?.site_id) {
                const siteRes = await supabase.from('sites').select('name').eq('id', woRes.data.site_id).single();
                siteName = siteRes.data?.name;
            }

            return {
                ...report,
                engineer: engineerRes.data,
                work_order: { ...woRes.data, site: { name: siteName } },
            };
        }));

        return enriched;
    },

    // ── Supply Allocations ──
    async getSupplyAllocations(companyId: string) {
        const { data, error } = await supabase
            .from('maintain_supply_allocations')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Enrich with work order titles
        const enriched = await Promise.all((data || []).map(async (alloc) => {
            const woRes = await supabase
                .from('maintain_work_orders')
                .select('title, type')
                .eq('id', alloc.work_order_id)
                .single();
            return { ...alloc, work_order: woRes.data };
        }));

        return enriched;
    },

    // ── Recent Activities (for dashboard) ──
    async getRecentActivities(companyId: string) {
        const { data, error } = await supabase
            .from('maintain_work_orders')
            .select('id, title, type, status, priority, updated_at, engineer_id, site_id')
            .eq('company_id', companyId)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (error) return [];

        const enriched = await Promise.all((data || []).map(async (wo) => {
            const [engineerRes, siteRes] = await Promise.all([
                wo.engineer_id ? supabase.from('users').select('full_name').eq('id', wo.engineer_id).single() : null,
                wo.site_id ? supabase.from('sites').select('name').eq('id', wo.site_id).single() : null,
            ]);

            return {
                user: engineerRes?.data?.full_name || 'Unassigned',
                action: `${wo.type} — ${wo.status}`,
                target: siteRes?.data?.name || 'Unknown',
                time: formatTimeAgo(new Date(wo.updated_at)),
                status: wo.status,
                priority: wo.priority,
            };
        }));

        return enriched;
    },

    // ══════════════════════════════════════════════════════════
    // ENGINEER-SPECIFIC METHODS
    // ══════════════════════════════════════════════════════════

    async getEngineerWorkOrders(engineerId: string, filters?: { status?: string; type?: string }) {
        let query = supabase
            .from('maintain_work_orders')
            .select('*')
            .eq('engineer_id', engineerId)
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.type) query = query.eq('type', filters.type);

        const { data, error } = await query;
        if (error) throw error;

        const enriched = await Promise.all((data || []).map(async (wo) => {
            const [siteRes, engineerRes] = await Promise.all([
                wo.site_id ? supabase.from('sites').select('name, site_id_code, clusters(name)').eq('id', wo.site_id).single() : null,
                wo.engineer_id ? supabase.from('users').select(`
                    full_name,
                    user_cluster_assignments(
                        clusters(name)
                    )
                `).eq('id', wo.engineer_id).single() : null,
            ]);

            // Transform engineer clusters into a flat list of names
            const engineerData = engineerRes?.data as any;
            const engineerClusterNames = engineerData?.user_cluster_assignments?.map(
                (uca: any) => uca.clusters?.name
            ).filter(Boolean) || [];

            return {
                ...wo,
                site: siteRes?.data || null,
                engineer: engineerData ? { ...engineerData, cluster_names: engineerClusterNames } : null,
            };
        }));

        return enriched;
    },

    async getEngineerStats(engineerId: string) {
        const [assigned, completed, overdue] = await Promise.all([
            supabase
                .from('maintain_work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('engineer_id', engineerId)
                .in('status', ['assigned', 'in_progress']),

            supabase
                .from('maintain_work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('engineer_id', engineerId)
                .eq('status', 'completed'),

            supabase
                .from('maintain_work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('engineer_id', engineerId)
                .in('status', ['assigned', 'in_progress'])
                .lt('scheduled_date', new Date().toISOString()),
        ]);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: visitsThisMonth } = await supabase
            .from('maintain_visit_reports')
            .select('*', { count: 'exact', head: true })
            .eq('engineer_id', engineerId)
            .gte('created_at', startOfMonth.toISOString());

        return [
            { title: "My Assigned", value: assigned.count?.toString() || "0", sub: "Active work orders", color: "blue" },
            { title: "Completed", value: completed.count?.toString() || "0", sub: "All time", color: "emerald" },
            { title: "Overdue", value: overdue.count?.toString() || "0", sub: "Past scheduled date", color: "rose" },
            { title: "Site Visits", value: visitsThisMonth?.toString() || "0", sub: "This month", color: "purple" }
        ];
    },

    async getEngineerActivities(engineerId: string) {
        const { data, error } = await supabase
            .from('maintain_work_orders')
            .select('id, title, type, status, priority, updated_at, site_id')
            .eq('engineer_id', engineerId)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (error) return [];

        const enriched = await Promise.all((data || []).map(async (wo) => {
            const siteRes = wo.site_id
                ? await supabase.from('sites').select('name').eq('id', wo.site_id).single()
                : null;

            return {
                user: 'You',
                action: `${wo.type} — ${wo.status}`,
                target: siteRes?.data?.name || 'Unknown',
                time: formatTimeAgo(new Date(wo.updated_at)),
                status: wo.status,
                priority: wo.priority,
            };
        }));

        return enriched;
    },

    // ── Supply Confirmation (Infra Integration) ──
    async confirmRefuel(logId: string, assetId: string, userId: string, companyId: string, siteId: string, quantity: number) {
        // 1. Update the dispensing log as confirmed
        const { error: logError } = await supabase
            .from('dispensing_logs')
            .update({
                confirmed_at: new Date().toISOString(),
                confirmed_by: userId,
                confirmed_asset_id: assetId
            })
            .eq('id', logId);

        if (logError) throw logError;

        // 2. Create a maintenance diesel reading record
        const { error: readingError } = await supabase
            .from('maintain_diesel_readings')
            .insert({
                asset_id: assetId,
                company_id: companyId,
                site_id: siteId,
                level: quantity, // The quantity supplied becomes the level reading (or delta)
                reading_type: 'refill',
                recorded_by: userId,
                recorded_at: new Date().toISOString()
            });

        if (readingError) throw readingError;

        return true;
    }
};

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
}
