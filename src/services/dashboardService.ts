import { supabase } from '@/lib/supabase';

/**
 * Get admin/manager level stats
 */
async function getAdminStats(companyId: string) {
    // 1. Active Trips
    const { count: activeTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    // 2. Fuel Dispensed (Current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: dispensingData } = await supabase
        .from('dispensing_logs')
        .select('quantity_dispensed, community_provision_qty')
        .gte('created_at', startOfMonth.toISOString());

    const totalFuel = (dispensingData || []).reduce(
        (sum, log) => sum + (Number(log.quantity_dispensed) || 0) + (Number(log.community_provision_qty) || 0),
        0
    );

    // 3. Audit Alerts (Flagged financials)
    const { count: auditAlerts } = await supabase
        .from('financials')
        .select('*', { count: 'exact', head: true })
        .eq('is_audit_flagged', true);

    // 4. Clusters
    const { count: clusterCount } = await supabase
        .from('clusters')
        .select('*', { count: 'exact', head: true });

    return [
        {
            title: "Active Trips",
            value: activeTrips?.toString() || "0",
            sub: "In progress nationwide",
            color: "blue"
        },
        {
            title: "Product Dispensed",
            value: `${totalFuel.toLocaleString()} L`,
            sub: "This month total",
            color: "emerald"
        },
        {
            title: "Audit Alerts",
            value: auditAlerts?.toString() || "0",
            sub: "Requires attention",
            color: "rose"
        },
        {
            title: "Active Clusters",
            value: clusterCount?.toString() || "0",
            sub: "Strategic regions",
            color: "purple"
        }
    ];
}

/**
 * Get driver specific stats
 */
async function getDriverStats(userId: string) {
    // 1. Active Trip
    const { data: activeTrip } = await supabase
        .from('trips')
        .select('truck_plate_number, status')
        .eq('driver_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    // 2. Fuel Balance (Recent reconciliation)
    const { data: lastRecon } = await supabase
        .from('fuel_reconciliations')
        .select('balance')
        .eq('driver_id', userId)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

    // 3. Completed Trips
    const { count: completedCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', userId)
        .in('status', ['completed', 'reconciled']);

    // 4. Next Delivery (From active trip itinerary)
    let nextSite = "None";
    if (activeTrip) {
        const { data: itinerary } = await supabase
            .from('trip_itineraries')
            .select('sites(name)')
            .eq('trip_id', (activeTrip as any).id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (itinerary) {
            nextSite = (itinerary.sites as any)?.name || "Pending";
        }
    }

    return [
        {
            title: "Active Trip",
            value: activeTrip?.truck_plate_number || "None",
            sub: activeTrip ? "Currently on transit" : "Awaiting dispatch",
            color: "blue"
        },
        {
            title: "Product Balance",
            value: `${(lastRecon?.balance || 0).toLocaleString()} L`,
            sub: "Last reconciliation",
            color: (lastRecon?.balance || 0) < 0 ? "rose" : "emerald"
        },
        {
            title: "Completed",
            value: completedCount?.toString() || "0",
            sub: "Trips this year",
            color: "emerald"
        },
        {
            title: "Next Delivery",
            value: nextSite,
            sub: "Scheduled site",
            color: "blue"
        }
    ];
}

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
}

export const dashboardService = {
    /**
     * Get high-level stats based on user role
     */
    getStats: async (companyId: string, role: string, userId: string) => {
        if (role === 'driver') {
            return getDriverStats(userId);
        }
        return getAdminStats(companyId);
    },

    /**
     * Get recent activities
     */
    getActivities: async (companyId: string, role: string, userId: string) => {
        // Fetch dispensing logs joined with trips and users
        let query = supabase
            .from('dispensing_logs')
            .select(`
                *,
                sites (name),
                trip:trips!inner (
                    driver_id,
                    truck_plate_number,
                    driver:users!driver_id (full_name)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (role === 'driver') {
            query = query.eq('trip.driver_id', userId);
        }

        const { data: logs, error } = await query;

        if (error) return [];

        return (logs || []).map(log => ({
            user: (log.trip as any)?.driver?.full_name || "Unknown",
            action: `Dispensed ${log.quantity_dispensed}L`,
            target: (log.sites as any)?.name || "Unknown Site",
            time: formatTimeAgo(new Date(log.created_at)),
            status: "reconciled" // Visual placeholder
        }));
    }
};
