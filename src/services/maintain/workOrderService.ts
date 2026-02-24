import { supabase } from '@/lib/supabase';
import { formatTimeAgo } from './utils';

export const workOrderService = {
    async getDashboardStats(companyId: string, clusterIds?: string[]) {
        let woQuery = supabase
            .from('maintain_work_orders')
            .select('*, sites!inner(cluster_id)', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .in('status', ['open', 'assigned', 'in_progress']);

        let assetQuery = supabase
            .from('maintain_assets')
            .select('*, sites!inner(cluster_id)', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'active');

        let overdueQuery = supabase
            .from('maintain_work_orders')
            .select('*, sites!inner(cluster_id)', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .in('status', ['open', 'assigned', 'in_progress'])
            .lt('scheduled_date', new Date().toISOString());

        if (clusterIds && clusterIds.length > 0) {
            woQuery = woQuery.in('sites.cluster_id', clusterIds);
            assetQuery = assetQuery.in('sites.cluster_id', clusterIds);
            overdueQuery = overdueQuery.in('sites.cluster_id', clusterIds);
        }

        const [workOrders, assets, overdue] = await Promise.all([
            woQuery,
            assetQuery,
            overdueQuery
        ]);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let completedQuery = supabase
            .from('maintain_work_orders')
            .select('*, sites!inner(cluster_id)', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'completed')
            .gte('completed_at', startOfMonth.toISOString());

        if (clusterIds && clusterIds.length > 0) {
            completedQuery = completedQuery.in('sites.cluster_id', clusterIds);
        }

        const { count: completedThisMonth } = await completedQuery;

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

    async getWorkOrders(companyId: string, filters?: { status?: string; type?: string; clusterIds?: string[] }) {
        let query = supabase
            .from('maintain_work_orders')
            .select('*, sites!inner(cluster_id)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.type) query = query.eq('type', filters.type);
        if (filters?.clusterIds && filters.clusterIds.length > 0) {
            query = query.in('sites.cluster_id', filters.clusterIds);
        }

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

    async getFailureAnalysis(companyId: string, clusterIds?: string[]) {
        let query = supabase
            .from('maintain_work_orders')
            .select('fault_category, type, assets(make_model), sites!inner(cluster_id)')
            .eq('company_id', companyId)
            .eq('status', 'completed')
            .not('fault_category', 'is', null);

        if (clusterIds && clusterIds.length > 0) {
            query = query.in('sites.cluster_id', clusterIds);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Group by category
        const analysis = (data || []).reduce((acc: any, curr: any) => {
            const cat = curr.fault_category || 'Other';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        return analysis;
    },

    async deleteWorkOrder(id: string) {
        const { error } = await supabase
            .from('maintain_work_orders')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async uploadWorkOrderMedia(file: File, workOrderId: string, companyId: string, userId: string, type: 'before' | 'after' | 'other', header?: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${workOrderId}/${type}_${Date.now()}.${fileExt}`;
        const filePath = `workorder/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('workorder')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('workorder')
            .getPublicUrl(fileName);

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
        const path = fileUrl.split('/storage/v1/object/public/workorder/').pop();
        if (path) {
            await supabase.storage.from('workorder').remove([path]);
        }

        const { error } = await supabase
            .from('maintain_workorder_media')
            .delete()
            .eq('id', mediaId);

        if (error) throw error;
        return true;
    },

    async getVisitReports(companyId: string, engineerId?: string) {
        let woQuery = supabase
            .from('maintain_work_orders')
            .select('id')
            .eq('company_id', companyId);

        if (engineerId) {
            woQuery = woQuery.eq('engineer_id', engineerId);
        }

        const { data: woIds } = await woQuery;

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

    async getRecentActivities(companyId: string, clusterIds?: string[]) {
        let query = supabase
            .from('maintain_work_orders')
            .select('id, title, type, status, priority, updated_at, engineer_id, site_id, sites!inner(cluster_id)')
            .eq('company_id', companyId)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (clusterIds && clusterIds.length > 0) {
            query = query.in('sites.cluster_id', clusterIds);
        }

        const { data, error } = await query;

        if (error) return [];

        const enriched = await Promise.all((data || []).map(async (wo: any) => {
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
};
