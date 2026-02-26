import { supabase } from '@/lib/supabase';
import { NexHaulAdmin, Company } from '@/types/database';

export const platformService = {
    /**
     * Get all platform admins (nexsuper only)
     */
    async getAdmins(): Promise<NexHaulAdmin[]> {
        const { data, error } = await supabase
            .from('nexhaul_admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new platform admin with temp password (nexsuper only)
     */
    async createAdmin(adminData: any): Promise<any> {
        const { email, password, full_name, role, phone_number } = adminData;

        // 1. Create the Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    role,
                    is_platform_admin: true
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Auth registration failed');

        const userId = authData.user.id;

        // 2. Insert into nexhaul_admins table only
        const { data, error: adminError } = await supabase
            .from('nexhaul_admins')
            .insert([{
                id: userId,
                full_name,
                email,
                role,
                phone_number
            }])
            .select()
            .single();

        if (adminError) throw adminError;
        return data;
    },

    /**
     * Update an admin (e.g., role or status)
     */
    async updateAdmin(id: string, updates: Partial<NexHaulAdmin>): Promise<NexHaulAdmin> {
        const { data, error } = await supabase
            .from('nexhaul_admins')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete an admin
     */
    async deleteAdmin(id: string): Promise<void> {
        const { error } = await supabase
            .from('nexhaul_admins')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get all companies on the platform
     */
    async getCompanies(): Promise<Company[]> {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all companies with detailed metrics (Plan, Staff Count, etc.)
     */
    async getDetailedCompanies(): Promise<any[]> {
        // 1. Fetch companies with full subscription data
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select(`
                *,
                subscriptions(id, plan, status, trial_start, trial_end, current_period_start, current_period_end, created_at, updated_at)
            `)
            .order('created_at', { ascending: false });

        if (companiesError) throw companiesError;

        // 2. Fetch aggregate metrics in parallel
        const [
            { data: userCounts },
            { data: tripCounts },
            { data: woCounts }
        ] = await Promise.all([
            supabase.from('users').select('company_id'),
            supabase.from('trips').select('client_id, company_id'),
            supabase.from('work_orders').select('company_id')
        ]);

        // Aggregate counts by company_id
        const staffMap: Record<string, number> = {};
        userCounts?.forEach(u => staffMap[u.company_id] = (staffMap[u.company_id] || 0) + 1);

        const tripMap: Record<string, number> = {};
        tripCounts?.forEach(t => tripMap[t.company_id] = (tripMap[t.company_id] || 0) + 1);

        const woMap: Record<string, number> = {};
        woCounts?.forEach(w => woMap[w.company_id] = (woMap[w.company_id] || 0) + 1);

        // 3. Merge data — subscription details from the subscriptions table
        return (companies || []).map(company => {
            const subs = (company as any).subscriptions;
            const sub = Array.isArray(subs) ? subs[0] : subs;
            return {
                ...company,
                plan: sub?.plan,
                subscriptionStatus: sub?.status || 'none',
                subscriptionData: sub || null,
                staffCount: staffMap[company.id] || 0,
                tripCount: tripMap[company.id] || 0,
                workOrderCount: woMap[company.id] || 0,
                location: company.metadata?.location || 'Not Specified',
                status: company.metadata?.status || 'active'
            };
        });
    },

    /**
     * Get full subscription history for a specific company
     */
    async getCompanySubscriptionHistory(companyId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Manually upgrade a company's subscription plan.
     * Used by platform admins when auto-upgrade via webhook fails.
     */
    async upgradeCompanyPlan(
        companyId: string,
        newPlan: 'trial' | 'free' | 'small_business' | 'enterprise',
        newStatus: 'active' | 'expired' | 'cancelled' = 'active'
    ): Promise<void> {
        const now = new Date().toISOString();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Upsert — update if exists, insert if not
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                company_id: companyId,
                plan: newPlan,
                status: newStatus,
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now,
            }, {
                onConflict: 'company_id'
            });

        if (error) throw error;
    },

    /**
     * Update company status (active/suspended)
     */
    async updateCompanyStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
        const { data: company } = await supabase
            .from('companies')
            .select('metadata')
            .eq('id', id)
            .single();

        const newMetadata = {
            ...(company?.metadata || {}),
            status
        };

        const { error } = await supabase
            .from('companies')
            .update({ metadata: newMetadata })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Permanently delete a company
     */
    async deleteCompany(id: string): Promise<void> {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Update an admin (e.g., role or status)
     */
    async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    /**
     * Aggregates key metrics across all companies for global dashboards
     */
    async getGlobalMetrics() {
        // 1. Get company stats
        const { data: companies, count: totalCompanies } = await supabase
            .from('companies')
            .select('*', { count: 'exact' });

        // 2. Get total logistics trips
        const { count: totalTrips } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true });

        // 3. Get total work orders (Maintenance)
        const { count: totalWorkOrders } = await supabase
            .from('work_orders')
            .select('*', { count: 'exact', head: true });

        // 4. Calculate module distribution
        const logisticsCount = companies?.filter(c => c.active_modules?.includes('infra_supply')).length || 0;
        const maintenanceCount = companies?.filter(c => c.active_modules?.includes('maintain')).length || 0;

        return {
            totalCompanies: totalCompanies || 0,
            totalTrips: totalTrips || 0,
            totalWorkOrders: totalWorkOrders || 0,
            moduleDistribution: {
                logistics: logisticsCount,
                maintenance: maintenanceCount,
                both: companies?.filter(c =>
                    c.active_modules?.includes('infra_supply') &&
                    c.active_modules?.includes('maintain')
                ).length || 0
            }
        };
    },

    /**
     * Get time-series activity data for the platform
     */
    async getPlatformGrowth() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch recent trips as a proxy for platform activity
        const { data: recentTrips } = await supabase
            .from('trips')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        // Fetch recent companies
        const { data: recentCompanies } = await supabase
            .from('companies')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo.toISOString());

        return {
            trips: recentTrips || [],
            newCompanies: recentCompanies || []
        };
    },

    /**
     * Get revenue and subscription metrics
     */
    async getRevenueStats() {
        const { data: companies } = await supabase
            .from('companies')
            .select('active_modules, created_at');

        // Mocking pricing for now: Logistics $299, Maintain $199
        let mrr = 0;
        const tiers = {
            basic: 0,
            professional: 0,
            enterprise: 0
        };

        companies?.forEach(c => {
            const hasLogistics = c.active_modules?.includes('infra_supply');
            const hasMaintain = c.active_modules?.includes('maintain');

            if (hasLogistics && hasMaintain) {
                mrr += 450; // Discounted bundle
                tiers.enterprise++;
            } else if (hasLogistics) {
                mrr += 299;
                tiers.professional++;
            } else if (hasMaintain) {
                mrr += 199;
                tiers.basic++;
            }
        });

        return {
            mrr,
            totalRevenue: mrr * 12, // Annual projection
            activeSubscriptions: companies?.length || 0,
            tierDistribution: [
                { label: 'Basic (Maintain)', value: tiers.basic, color: '#a855f7' },
                { label: 'Professional (Logistics)', value: tiers.professional, color: '#3b82f6' },
                { label: 'Enterprise (Full Suite)', value: tiers.enterprise, color: '#22c55e' }
            ]
        };
    }
};
