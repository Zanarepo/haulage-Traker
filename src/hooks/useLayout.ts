"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useLayout() {
    const { user, profile, availableProfiles, loading, signOut, switchProfile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const isOnline = useOnlineStatus();
    const router = useRouter();

    // Read saved theme from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ht-theme');
        if (saved === 'light') {
            setIsDarkMode(false);
        } else if (saved === 'dark') {
            setIsDarkMode(true);
        }
    }, []);

    useEffect(() => {
        // Only redirect to login if user is genuinely logged out AND online
        // When offline, cached auth keeps the user on the dashboard
        if (!loading && !user && navigator.onLine) {
            router.push('/');
        }
    }, [user, loading, router]);

    // Apply theme to DOM and persist to localStorage
    useEffect(() => {
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ht-theme', theme);
    }, [isDarkMode]);

    const toggleSidebar = useCallback(() => setIsCollapsed(prev => !prev), []);
    const toggleMobileOpen = useCallback((val: boolean) => setIsMobileOpen(val), []);
    const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);
    const closeMobile = useCallback(() => setIsMobileOpen(false), []);

    const handleLogout = useCallback(async () => {
        await signOut();
        router.push('/');
    }, [signOut, router]);

    return {
        user,
        profile,
        availableProfiles,
        loading,
        isCollapsed,
        isMobileOpen,
        isDarkMode,
        isOnline,
        toggleSidebar,
        toggleMobileOpen,
        toggleDarkMode,
        closeMobile,
        handleLogout,
        switchProfile
    };
}
