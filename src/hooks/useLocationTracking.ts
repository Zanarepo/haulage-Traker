"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trackingService } from '@/services/trackingService';
import { supabase } from '@/lib/supabase';

export function useLocationTracking() {
    const { user, profile } = useAuth();
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        if (!user || profile?.role !== 'driver') return;

        let lastUpdate = 0;
        const UPDATE_INTERVAL = 30000; // 30 seconds

        const startTracking = async () => {
            // Check if driver has an active trip
            const { data: activeTrips } = await supabase
                .from('trips')
                .select('id')
                .eq('driver_id', user.id)
                .eq('status', 'active')
                .limit(1);

            if (!activeTrips || activeTrips.length === 0) {
                trackingService.setInactive(user.id).catch(() => { });
                return;
            }

            const tripId = activeTrips[0].id;

            if ("geolocation" in navigator) {
                watchId.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const now = Date.now();
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
            }
            if (user) {
                trackingService.setInactive(user.id).catch(() => { });
            }
        };
    }, [user, profile]);
}
