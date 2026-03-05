import { supabase } from '@/lib/supabase';

export interface ComplianceStats {
    totalWorkOrders: number;
    checklistsPassed: number;
    failedChecks: number;
    complianceRate: number;
    recentEvents: ComplianceLog[];
}

export interface ComplianceLog {
    id: string;
    type: 'sop' | 'safety';
    title: string;
    description: string;
    submitted_at: string;
    userName: string;
    siteName: string;
    status: 'pass' | 'fail';
}

export const complianceService = {
    async getStats(companyId: string): Promise<ComplianceStats> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 1. Fetch Safety Checklists
        const { data: rawSafetyLogs, error: safetyError } = await supabase
            .from('maintain_safety_checklists')
            .select(`
                id, 
                passed, 
                created_at,
                maintain_visit_reports!inner(
                    maintain_work_orders!inner(
                        id,
                        company_id,
                        sites(name),
                        users!maintain_work_orders_engineer_id_fkey(full_name)
                    )
                )
            `)
            .eq('maintain_visit_reports.maintain_work_orders.company_id', companyId)
            .gte('created_at', startOfMonth.toISOString());

        if (safetyError) throw safetyError;
        const safetyLogs = rawSafetyLogs || [];

        // 2. Fetch SOP Logs
        const { data: sopLogs, error: sopError } = await supabase
            .from('maintain_sop_execution_logs')
            .select(`
                id,
                sop_id,
                work_order_id,
                submitted_at,
                execution_data,
                maintain_work_orders(
                    asset_id,
                    sites(name)
                ),
                users(full_name),
                maintain_asset_sops(title)
            `)
            .eq('company_id', companyId)
            .gte('submitted_at', startOfMonth.toISOString());

        if (sopError) throw sopError;

        // 3. Fetch Completed Work Orders for the month
        const { data: completedWOs, error: woError } = await supabase
            .from('maintain_work_orders')
            .select('id, title, completed_at, sites(name), users!maintain_work_orders_engineer_id_fkey(full_name)')
            .eq('company_id', companyId)
            .eq('status', 'completed')
            .gte('completed_at', startOfMonth.toISOString());

        if (woError) throw woError;
        const totalCompleted = completedWOs?.length || 0;

        // Process data
        const passedSafety = safetyLogs.filter(l => l.passed).length || 0;

        // Identify work orders that have logs
        const woIdsWithLogs = new Set([
            ...safetyLogs.map(l => (l.maintain_visit_reports as any)?.maintain_work_orders?.id).filter(Boolean),
            ...(sopLogs?.map(l => l.work_order_id).filter(Boolean) || [])
        ]);

        // Failed Checks = Safety Failures + Missing Compliance (Completed WO with NO logs)
        const safetyFailures = safetyLogs.filter(l => !l.passed).length || 0;
        const missingComplianceWOs = (completedWOs || []).filter(wo => !woIdsWithLogs.has(wo.id));
        const totalFailed = safetyFailures + missingComplianceWOs.length;

        const complianceRate = totalCompleted > 0
            ? Math.round((woIdsWithLogs.size / totalCompleted) * 100)
            : 100;

        // Map to recent events
        const events: ComplianceLog[] = [
            ...safetyLogs.map(l => ({
                id: l.id,
                type: 'safety' as const,
                title: 'Safety Sign-off',
                description: l.passed ? 'Site safety standards verified.' : 'Safety inspection failed.',
                submitted_at: l.created_at,
                userName: (l.maintain_visit_reports as any)?.maintain_work_orders?.users?.full_name || 'System',
                siteName: (l.maintain_visit_reports as any)?.maintain_work_orders?.sites?.name || 'Unknown Site',
                status: l.passed ? 'pass' as const : 'fail' as const
            })),
            ...(sopLogs?.map(l => ({
                id: l.id,
                type: 'sop' as const,
                title: (l as any).maintain_asset_sops?.title || 'SOP Execution',
                description: `SOP for ${(l as any).maintain_work_orders?.sites?.name || 'asset'} completed.`,
                submitted_at: l.submitted_at,
                userName: (l as any).users?.full_name || 'System',
                siteName: (l as any).maintain_work_orders?.sites?.name || 'Unknown Site',
                status: 'pass' as const
            })) || []),
            // Missing Compliance Events
            ...missingComplianceWOs.map(wo => ({
                id: wo.id,
                type: 'safety' as const, // Categorize as safety/compliance breach
                title: 'Compliance Breach',
                description: `Work order "${wo.title}" completed without mandatory checklists.`,
                submitted_at: wo.completed_at || new Date().toISOString(),
                userName: (wo as any).users?.full_name || 'System',
                siteName: (wo as any).sites?.name || 'N/A',
                status: 'fail' as const
            }))
        ].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

        return {
            totalWorkOrders: totalCompleted,
            checklistsPassed: passedSafety + (sopLogs?.length || 0),
            failedChecks: totalFailed,
            complianceRate,
            recentEvents: events.slice(0, 15)
        };
    }
};
