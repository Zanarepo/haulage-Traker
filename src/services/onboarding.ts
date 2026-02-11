import { supabase } from '@/lib/supabase';
import { UserRole, DriverType } from '@/types/database';

export const onboardingService = {
    /**
     * Creates a new user in the system (Admin only)
     * This involves:
     * 1. Creating the auth user (Supabase Auth)
     * 2. Creating the profile (users table)
     */
    async createUser({
        email,
        phone,
        fullName,
        role,
        companyId,
        driverType,
        tempPassword
    }: {
        email?: string;
        phone?: string;
        fullName: string;
        role: UserRole;
        companyId: string;
        driverType?: DriverType;
        tempPassword: string;
    }) {
        try {
            // 1. Create Auth User
            // Note: By default, Supabase createUser requires service_role key to bypass email confirmation 
            // or we use signUp and then update the profile.
            // For a "Admin creates user" flow, we typically use a Supabase Edge Function with service_role 
            // OR allow signUp and handle profile creation in a trigger.

            const signUpOptions = {
                password: tempPassword,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            };

            const { data: authData, error: authError } = email
                ? await supabase.auth.signUp({ email, ...signUpOptions })
                : await supabase.auth.signUp({ phone: phone as string, ...signUpOptions });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create auth user');

            // 2. Create Profile in 'users' table
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    company_id: companyId,
                    full_name: fullName,
                    email: email,
                    phone_number: phone,
                    role: role,
                    driver_type: driverType,
                    needs_password_reset: true, // Force reset on first login
                });

            if (profileError) throw profileError;

            return { user: authData.user, success: true };
        } catch (error) {
            console.error('Error in direct onboarding:', error);
            throw error;
        }
    }
};
