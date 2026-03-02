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
    const watchId = useRef<number | null>(null);

    // Load initial tracking state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ht-location-tracking');
        if (saved === 'enabled' && profile?.role === 'driver') {
            setIsTracking(true);
        }
    }, [profile?.role]);

    // Handle tracking persistence and status cleanup
    useEffect(() => {
        if (profile?.role !== 'driver') return;

        localStorage.setItem('ht-location-tracking', isTracking ? 'enabled' : 'disabled');

        if (!isTracking && user?.id) {
            trackingService.setInactive(user.id).catch(() => { });
        }
    }, [isTracking, profile?.role, user?.id]);

    useEffect(() => {
        if (!user || profile?.role !== 'driver' || !isTracking) {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            // Reset states when not tracking
            setIsPermissionDenied(false);
            setNoActiveTrip(false);
            return;
        }

        let lastUpdate = 0;
        const UPDATE_INTERVAL = 30000; // 30 seconds

        const startTracking = async () => {
            // Find the most recent trip that is NOT completed
            const { data: activeTrips } = await supabase
                .from('trips')
                .select('id')
                .eq('driver_id', user.id)
                .neq('status', 'completed') // Requirement: "else always active"
                .order('created_at', { ascending: false })
                .limit(1);

            if (!activeTrips || activeTrips.length === 0) {
                setNoActiveTrip(true);
                setIsTracking(false);
                trackingService.setInactive(user.id).catch(() => { });
                return;
            }

            const tripId = activeTrips[0].id;

            if ("geolocation" in navigator) {
                watchId.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const now = Date.now();
                        setIsPermissionDenied(false); // Clear error if we get coordinates
                        if (now - lastUpdate > UPDATE_INTERVAL) {
                            trackingService.updateLocation(
                                user.id,
                                position.coords.latitude,
                                position.coords.longitude,
                                tripId
                            ).catch(err => console.error('[Tracking] Failed to update:', err));
                            lastUpdate = now;
                        }
                    },
                    (error) => {
                        console.error('[Tracking] Position error:', error);
                        if (error.code === error.PERMISSION_DENIED) {
                            setIsPermissionDenied(true);
                            setIsTracking(false);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 10000,
                        timeout: 5000
                    }
                );
            }
        };

        startTracking();

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
        };
    }, [user, profile, isTracking]);

    const toggleTracking = () => {
        setIsTracking(prev => !prev);
    };

    return {
        isTracking,
        toggleTracking,
        isPermissionDenied,
        noActiveTrip
    };
}
