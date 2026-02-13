import { supabase } from '@/lib/supabase';

export interface ReconciliationSummary {
    driver_id: string;
    full_name: string;
    total_allocated: number;
    total_supplied: number;
    total_community: number;
    balance: number;
    trip_count: number;
}

export const reconciliationService = {
    /**
     * Get pending reconciliation data for all drivers within a company for a specific period
     */
    async getPendingReconciliations(companyId: string, startDate: string, endDate: string) {
        // 1. Fetch all trips started within the period (Allocated)
        const { data: trips, error: tripsError } = await supabase
            .from('trips')
            .select(`
                id,
                driver_id,
                loaded_quantity,
                driver:users!driver_id (full_name)
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (tripsError) throw tripsError;

        // 2. Fetch all dispensing logs within the period (Supplied)
        const { data: logs, error: logsError } = await supabase
            .from('dispensing_logs')
            .select(`
                quantity_dispensed,
                community_provision_qty,
                trip:trips!trip_id (driver_id)
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (logsError) throw logsError;

        // Aggregate by driver
        const driverMap: Record<string, ReconciliationSummary> = {};

        // Helper to get or init driver
        const getDriver = (id: string, name: string) => {
            if (!driverMap[id]) {
                driverMap[id] = {
                    driver_id: id,
                    full_name: name,
                    total_allocated: 0,
                    total_supplied: 0,
                    total_community: 0,
                    balance: 0,
                    trip_count: 0
                };
            }
            return driverMap[id];
        };

        // Process Allocated (Trips)
        trips.forEach(trip => {
            if (!trip.driver_id) return;
            const d = getDriver(trip.driver_id, (trip.driver as any)?.full_name || 'Unknown Driver');
            d.total_allocated += Number(trip.loaded_quantity) || 0;
            d.trip_count += 1;
        });

        // Process Supplied (Logs)
        logs.forEach(log => {
            const driverId = (log.trip as any)?.driver_id;
            if (!driverId) return;
            const d = getDriver(driverId, 'Active Driver');
            d.total_supplied += Number(log.quantity_dispensed) || 0;
            d.total_community += Number((log as any).community_provision_qty) || 0;
        });

        // Calculate balances (Shortage/Overage = (Site Supplied + Community) - Total Allocated)
        // This ensures the balance reflects actual missing/unaccounted fuel.
        return Object.values(driverMap).map(d => ({
            ...d,
            balance: (d.total_supplied + d.total_community) - d.total_allocated
        }));
    },

    /**
     * Get detailed supply history (dispensing logs) for a specific driver and period
     */
    async getSupplyHistory(companyId: string, driverId: string, startDate: string, endDate: string) {
        // Fetch all dispensing logs for this driver in the period
        const { data: logs, error: logsError } = await supabase
            .from('dispensing_logs')
            .select(`
                id,
                created_at,
                quantity_dispensed,
                community_provision_qty,
                trip:trips!trip_id (
                    id,
                    loaded_quantity,
                    created_at
                )
            `)
            .eq('trip.driver_id', driverId)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (logsError) throw logsError;

        // Note: Filter items where trip belongs to this driver (Supabase might return null trip if restricted)
        return logs.filter(log => log.trip !== null);
    },

    /**
     * Close a reconciliation cycle for a driver
     */
    async closeCycle(data: {
        company_id: string;
        driver_id: string;
        period_start: string;
        period_end: string;
        total_allocated: number;
        total_supplied: number;
        reconciled_by: string;
    }) {
        const { error: insertError } = await supabase
            .from('fuel_reconciliations')
            .insert({
                ...data,
                status: 'completed'
            });

        if (insertError) throw insertError;

        // Update trip status to 'completed' or 'reconciled' so they don't show up in pending anymore
        const { error: updateError } = await supabase
            .from('trips')
            .update({ status: 'completed' })
            .eq('driver_id', data.driver_id)
            .eq('status', 'dispensed');

        if (updateError) throw updateError;
    },

    /**
     * Delete a recorded reconciliation (Superadmin only)
     */
    async deleteReconciliation(id: string) {
        const { error } = await supabase
            .from('fuel_reconciliations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
