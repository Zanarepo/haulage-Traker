'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { getItem, setItem, deleteItem, STORES } from '@/lib/indexedDB';

const AUTH_CACHE_KEY = 'currentSession';

interface CachedAuth {
    user: User;
    profile: UserProfile;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);

            // Cache to IndexedDB for offline use
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && data) {
                await setItem<CachedAuth>(STORES.AUTH, AUTH_CACHE_KEY, {
                    user: session.user,
                    profile: data,
                });
            }
        } catch (error) {
            console.error('[Auth] Profile fetch failed:', error);
            // Try IndexedDB fallback if profile fetch fails (offline)
            try {
                const cached = await getItem<CachedAuth>(STORES.AUTH, AUTH_CACHE_KEY);
                if (cached?.profile) {
                    setProfile(cached.profile);
                }
            } catch {
                // Silently fail — no cached data available
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await deleteItem(STORES.AUTH, AUTH_CACHE_KEY);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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
