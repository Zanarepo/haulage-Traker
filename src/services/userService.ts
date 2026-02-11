import { supabase } from '@/lib/supabase';
import { UserRole, DriverType } from '@/types/database';

export interface CreateUserInput {
    email?: string;
    phone?: string;
    fullName: string;
    role: UserRole;
    companyId: string;
    driverType?: DriverType;
    tempPassword: string;
    clusterIds?: string[]; // Added for initial assignment
}

export interface UpdateUserInput {
    full_name?: string;
    role?: UserRole;
    driver_type?: DriverType | null;
    is_active?: boolean;
    cluster_ids?: string[]; // Added for mass assignment
}

export const userService = {
    /**
     * Fetch all users in the same company.
     */
    async fetchUsers(companyId: string) {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                user_cluster_assignments(cluster_id)
            `)
            .eq('company_id', companyId)
            .order('role', { ascending: true })
            .order('full_name', { ascending: true });

        if (error) throw error;

        // Flatten the cluster assignments
        return data.map(user => ({
            ...user,
            cluster_ids: user.user_cluster_assignments?.map((a: any) => a.cluster_id) || []
        }));
    },

    /**
     * Create a new user: auth signup + profile row.
     * NOTE: This uses supabase.auth.signUp() which briefly signs in as the new user.
     * For production, use a Supabase Edge Function with service_role key.
     * Here we use admin.createUser via the REST API if available,
     * otherwise fall back to signUp + manual profile insert.
     */
    async createUser(input: CreateUserInput) {
        const { email, phone, fullName, role, companyId, driverType, tempPassword } = input;

        // Sign up via Supabase Auth
        const signUpOptions = {
            password: tempPassword,
            options: {
                data: { full_name: fullName },
            },
        };

        const { data: authData, error: authError } = email
            ? await supabase.auth.signUp({ email, ...signUpOptions })
            : await supabase.auth.signUp({ phone: phone as string, ...signUpOptions });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Auth user creation failed');

        // Create profile in users table
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                company_id: companyId,
                full_name: fullName,
                email: email || null,
                phone_number: phone || null,
                role,
                driver_type: driverType || null,
                needs_password_reset: true,
                is_active: true,
            });

        if (profileError) throw profileError;

        // Assign clusters if provided
        if (input.clusterIds && input.clusterIds.length > 0) {
            await this.setUserClusters(authData.user.id, input.clusterIds);
        }

        return authData.user;
    },

    /**
     * Update a user's profile fields.
     */
    async updateUser(userId: string, fields: UpdateUserInput) {
        const { cluster_ids, ...profileFields } = fields;

        // Update profile
        if (Object.keys(profileFields).length > 0) {
            const { error: profileError } = await supabase
                .from('users')
                .update(profileFields)
                .eq('id', userId);
            if (profileError) throw profileError;
        }

        // Update cluster assignments if provided
        if (cluster_ids) {
            await this.setUserClusters(userId, cluster_ids);
        }

        return true;
    },

    /**
     * Get clusters assigned to a user.
     */
    async getUserClusters(userId: string) {
        const { data, error } = await supabase
            .from('user_cluster_assignments')
            .select('cluster_id')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => d.cluster_id);
    },

    /**
     * Set clusters for a user (replaces existing).
     */
    async setUserClusters(userId: string, clusterIds: string[]) {
        // First, delete existing assignments
        const { error: deleteError } = await supabase
            .from('user_cluster_assignments')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Then, insert new ones
        if (clusterIds.length > 0) {
            const assignments = clusterIds.map(clusterId => ({
                user_id: userId,
                cluster_id: clusterId,
            }));

            const { error: insertError } = await supabase
                .from('user_cluster_assignments')
                .insert(assignments);

            if (insertError) throw insertError;
        }
    },

    /**
     * Toggle a user's active status.
     */
    async toggleUserActive(userId: string, isActive: boolean) {
        const { error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId);

        if (error) throw error;
    },
};
