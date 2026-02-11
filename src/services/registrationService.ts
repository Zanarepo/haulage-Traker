import { supabase } from '@/lib/supabase';

export const registrationService = {
    /**
     * Registers a new haulage company and its first Superadmin.
     * 
     * HOW IT WORKS:
     * We pass company_name, full_name, and phone in the signUp metadata.
     * A PostgreSQL trigger (handle_new_user) on auth.users fires AFTER INSERT
     * and automatically creates:
     *   1. A new row in public.companies
     *   2. A new row in public.users with role='superadmin'
     * 
     * This means the client ONLY needs to call signUp(). No separate 
     * table inserts are needed, so there are ZERO RLS/permission issues.
     */
    async registerCompany({
        email,
        password,
        fullName,
        companyName,
        phone
    }: {
        email: string;
        password: string;
        fullName: string;
        companyName: string;
        phone?: string;
    }) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        company_name: companyName,
                        phone: phone || null,
                    }
                }
            });

            if (error) throw error;
            if (!data.user) throw new Error('Signup failed - no user returned');

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration Error:', error);
            throw error;
        }
    }
};
