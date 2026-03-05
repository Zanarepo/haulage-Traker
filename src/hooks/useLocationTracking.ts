"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trackingService } from '@/services/trackingService';
import { supabase } from '@/lib/supabase';

/**
 * Driver Location Tracking Hook
 * 
 * Logic:
 * 1. Insertion: Data is inserted via Supabase UPSERT in trackingService.updateLocation.
 *    Since driver_id is the Primary Key, each driver has exactly ONE row in driver_locations.
 * 2. Active Trip: A trip is considered trackable if its status is NOT 'completed'. 
 *    This covers 'pending', 'active', 'dispensed', and 'reconciled' states.
 */
export function useLocationTracking() {
    const { user, profile } = useAuth();
    const [isTracking, setIsTracking] = useState(false);
    const [isPermissionDenied, setIsPermissionDenied] = useState(false);
    const [noActiveTrip, setNoActiveTrip] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const watchId = useRef<number | null>(null);

    // Initial mount check for persistence
    useEffect(() => {
        const saved = localStorage.getItem('ht-location-tracking');
        if (saved === 'enabled' && (profile?.role === 'driver' || profile?.role === 'site_engineer')) {
            setIsTracking(true);
        }
    }, [profile?.role]);

    const startTracking = async () => {
        if (!user || (profile?.role !== 'driver' && profile?.role !== 'site_engineer')) return;

        setIsLoading(true);
        setNoActiveTrip(false);

        // For drivers, we MUST have an active trip
        if (profile?.role === 'driver') {
            try {
                // Find the most recent trip that is NOT completed
                const { data: activeTrips, error } = await supabase
                    .from('trips')
                    .select('id')
                    .eq('driver_id', user.id)
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw error;

                if (!activeTrips || activeTrips.length === 0) {
                    setNoActiveTrip(true);
                    setIsTracking(false);
                    localStorage.setItem('ht-location-tracking', 'disabled');
                    alert("🚛 No Active Trip: You cannot turn on live tracking without an 'Active' trip assigned to you. Please set a trip to active first.");
                    setIsLoading(false);
                    return;
                }

                const tripId = activeTrips[0].id;

                // Set states BEFORE beginWatch for better UI responsiveness
                setIsTracking(true);
                localStorage.setItem('ht-location-tracking', 'enabled');

                await beginWatch(tripId);
            } catch (err) {
                console.error('[Tracking] Initialization failed:', err);
                setIsTracking(false);
                localStorage.setItem('ht-location-tracking', 'disabled');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Site engineers don't need a trip
            try {
                setIsTracking(true);
                localStorage.setItem('ht-location-tracking', 'enabled');
                await beginWatch();
            } catch (err) {
                console.error('[Tracking] Engineer watch failed:', err);
                setIsTracking(false);
                localStorage.setItem('ht-location-tracking', 'disabled');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const beginWatch = async (tripId?: string) => {
        if (!user || !("geolocation" in navigator)) return;

        // Clear any existing watch
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
        }

        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                setIsPermissionDenied(false);
                trackingService.updateLocation(
                    user.id,
                    position.coords.latitude,
                    position.coords.longitude,
                    tripId
                ).catch(err => console.error('[Tracking] Failed to update:', err));
            },
            (error) => {
                console.error('[Tracking] Position error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    setIsPermissionDenied(true);
                    setIsTracking(false);
                    localStorage.setItem('ht-location-tracking', 'disabled');
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 10000
            }
        );
    };

    const stopTracking = () => {
        setIsTracking(false);
        setIsLoading(false);
        localStorage.setItem('ht-location-tracking', 'disabled');
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (user?.id) {
            trackingService.setInactive(user.id).catch(() => { });
        }
    };

    // Driver/Engineer Effect: Sync state changes to actual tracking
    useEffect(() => {
        const isTrackable = profile?.role === 'driver' || profile?.role === 'site_engineer';
        if (!isTrackable || !user) return;

        if (isTracking && watchId.current === null) {
            startTracking();
        } else if (!isTracking && watchId.current !== null) {
            stopTracking();
        }

        return () => {
            // No automatic cleanup here to keep tracking running across page changes
            // unless the component is truly unmounted and we want to stop it.
            // But since this is used in DashboardLayout, it stays mounted.
        };
    }, [isTracking, profile?.role, user?.id]);

    const toggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    return {
        isTracking,
        isLoading,
        toggleTracking,
        isPermissionDenied,
        noActiveTrip
    };
}
