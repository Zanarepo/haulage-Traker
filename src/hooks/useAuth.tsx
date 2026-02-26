'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { getItem, setItem, deleteItem, STORES } from '@/lib/indexedDB';

const AUTH_CACHE_KEY = 'currentSession';

interface CachedAuth {
    user: User;
    profile: UserProfile | any; // Support platform admin profile
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | any | null;
    availableProfiles: any[];
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    switchProfile: (profileId: string, profileType: 'platform' | 'tenant') => void;
    isPlatformAdmin: boolean;
    platformProfile: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | any | null>(null);
    const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initAuth();

        // Listen for auth changes (only fires when online)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                deleteItem(STORES.AUTH, AUTH_CACHE_KEY);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const initAuth = async () => {
        try {
            // Try Supabase first
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
                return;
            }
        } catch (error) {
            console.warn('[Auth] Supabase unreachable, trying IndexedDB cache:', error);
        }

        // Fallback: load from IndexedDB cache (offline support)
        try {
            const cached = await getItem<CachedAuth>(STORES.AUTH, AUTH_CACHE_KEY);
            if (cached?.user && cached?.profile) {
                setUser(cached.user);
                setProfile(cached.profile);
            }
        } catch (error) {
            console.warn('[Auth] IndexedDB cache read failed:', error);
        }

        setLoading(false);
    };

    const fetchProfile = async (userId: string) => {
        try {
            console.log('[Auth Debug] Fetching profiles for userId:', userId);
            setLoading(true);
            const profiles: any[] = [];

            // 1. Check regular users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*, user_cluster_assignments(cluster_id)')
                .eq('id', userId)
                .single();

            if (!userError && userData) {
                console.log('[Auth Debug] Found tenant profile in "users" table');
                const cluster_ids = (userData as any).user_cluster_assignments?.map((uca: any) => uca.cluster_id) || [];
                profiles.push({ ...userData, cluster_ids, type: 'tenant' });
            } else if (userError && userError.code !== 'PGRST116') {
                console.warn('[Auth Debug] Error fetching tenant profile:', userError.message);
            }

            // 2. Check nexhaul_admins table
            const { data: adminData, error: adminError } = await supabase
                .from('nexhaul_admins')
                .select('*')
                .eq('id', userId)
                .single();

            if (!adminError && adminData) {
                console.log('[Auth Debug] Found platform profile in "nexhaul_admins" table');
                profiles.push({ ...adminData, type: 'platform' });
            } else if (adminError && adminError.code !== 'PGRST116') {
                console.warn('[Auth Debug] Error fetching platform profile:', adminError.message);
            }

            setAvailableProfiles(profiles);

            // 3. Smart Profile Selection
            const cached = await getItem<CachedAuth>(STORES.AUTH, AUTH_CACHE_KEY);
            const currentProfileId = profile?.id || cached?.profile?.id;
            const currentProfileType = profile?.type || cached?.profile?.type;

            // Check if current profile is still valid (be lenient with legacy cache missing 'type')
            const stillValid = currentProfileId && profiles.find(p =>
                p.id === currentProfileId && (!currentProfileType || p.type === currentProfileType)
            );

            if (stillValid) {
                // Keep current profile but update it with the latest data from server
                const updatedProfile = profiles.find(p => p.id === currentProfileId && (!currentProfileType || p.type === currentProfileType));
                setProfile(updatedProfile);
                await cacheAuth(userId, updatedProfile);
            } else if (profiles.length === 1) {
                // Auto-select if only one exists
                const selected = profiles[0];
                setProfile(selected);
                await cacheAuth(userId, selected);
            } else if (profiles.length > 1) {
                // Favor tenant profile as default for dashboard users with multiple roles
                const tenantDefault = profiles.find(p => p.type === 'tenant');
                if (tenantDefault) {
                    setProfile(tenantDefault);
                    await cacheAuth(userId, tenantDefault);
                } else {
                    // Fallback to first available if no tenant profile
                    setProfile(profiles[0]);
                    await cacheAuth(userId, profiles[0]);
                }
            } else {
                setProfile(null);
                await deleteItem(STORES.AUTH, AUTH_CACHE_KEY);
            }

        } catch (error) {
            console.error('[Auth] Profile fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const switchProfile = (profileId: string, profileType: 'platform' | 'tenant') => {
        const selected = availableProfiles.find(p => p.id === profileId && p.type === profileType);
        if (selected) {
            setProfile(selected);
            if (user) cacheAuth(user.id, selected);
        }
    };

    const cacheAuth = async (userId: string, profileData: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && profileData) {
            await setItem<CachedAuth>(STORES.AUTH, AUTH_CACHE_KEY, {
                user: session.user,
                profile: profileData,
            });
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    const signOut = async () => {
        await deleteItem(STORES.AUTH, AUTH_CACHE_KEY);
        setProfile(null);
        setAvailableProfiles([]);
        await supabase.auth.signOut();
    };

    const isPlatformAdmin = !!profile?.role?.startsWith('nex');

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            availableProfiles: availableProfiles || [],
            loading,
            signOut,
            refreshProfile,
            switchProfile,
            isPlatformAdmin,
            platformProfile: availableProfiles?.find(p => p.type === 'platform') || null
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
