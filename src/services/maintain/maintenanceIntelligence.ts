import { addDays, differenceInDays } from 'date-fns';

export interface AssetProjections {
    hoursSinceService: number;
    hoursRemaining: number;
    estimatedDueDate: Date | null;
    healthStatus: 'healthy' | 'due_soon' | 'overdue';
    avgDailyRuntime: number;
    sessionHours: number;
}

export const maintenanceIntelligence = {
    /**
     * Calculates maintenance projections for an asset, considering hybrid solar offsets.
     */
    calculateAssetProjections(asset: any, site: any): AssetProjections {
        const currentMeter = Number(asset.hour_meter || 0);
        const lastPmHours = Number(asset.last_pm_hours || 0);
        const intervalHrs = Number(asset.pm_interval_hours || 250);
        const intervalDays = Number(asset.service_interval_days || 10);
        const lastPmDate = asset.last_pm_date ? new Date(asset.last_pm_date) : (asset.created_at ? new Date(asset.created_at) : new Date());

        const hoursSinceService = currentMeter - lastPmHours;
        const meterRemaining = intervalHrs - hoursSinceService;

        const daysSinceService = Math.max(0, differenceInDays(new Date(), lastPmDate));
        const daysRemaining = intervalDays - daysSinceService;

        // 1. Calculate historical usage velocity (hours per day)
        const daysForVelocity = Math.max(1, daysSinceService);
        let rawAvgDailyRuntime = hoursSinceService / daysForVelocity;

        // 2. Adjust for Hybrid/Solar offsets
        // If it's a hybrid site, we expect the generator to run LESS than a standard set.
        const solarOffset = site?.is_hybrid ? Number(site.solar_offset_hours || 0) : 0;
        let predictedDailyRuntime = Math.max(0, rawAvgDailyRuntime);

        // If data is too thin, use a baseline
        if (hoursSinceService < 10) {
            const baseline = 12; // Standard gen-set baseline
            predictedDailyRuntime = Math.max(1, baseline - solarOffset);
        }

        // 3. Project Due Dates (Meter vs Calendar)
        let meterDueDate: Date | null = null;
        if (predictedDailyRuntime > 0) {
            const daysToMeterLimit = meterRemaining / predictedDailyRuntime;
            meterDueDate = addDays(new Date(), Math.round(daysToMeterLimit));
        }

        const calendarDueDate = addDays(lastPmDate, intervalDays);

        // The effective due date is the EARLIER of the two
        const estimatedDueDate = meterDueDate && meterDueDate < calendarDueDate ? meterDueDate : calendarDueDate;

        // 4. Determine health status (Dual Trigger)
        let healthStatus: 'healthy' | 'due_soon' | 'overdue' = 'healthy';

        const isMeterOverdue = meterRemaining <= 0;
        const isCalendarOverdue = daysRemaining <= 0;

        const isMeterDueSoon = meterRemaining <= (intervalHrs * 0.1); // 10% threshold
        const isCalendarDueSoon = daysRemaining <= 2;

        if (isMeterOverdue || isCalendarOverdue) {
            healthStatus = 'overdue';
        } else if (isMeterDueSoon || isCalendarDueSoon) {
            healthStatus = 'due_soon';
        }

        return {
            hoursSinceService,
            hoursRemaining: meterRemaining,
            estimatedDueDate,
            healthStatus,
            avgDailyRuntime: rawAvgDailyRuntime,
            sessionHours: hoursSinceService
        };
    },

    /**
     * Aggregates common fault categories for failure analysis.
     */
    analyzeFailurePatterns(workOrders: any[]) {
        const patterns: Record<string, number> = {};
        workOrders.forEach(wo => {
            if (wo.fault_category) {
                patterns[wo.fault_category] = (patterns[wo.fault_category] || 0) + 1;
            }
        });
        return patterns;
    }
};
