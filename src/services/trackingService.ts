import { supabase } from '@/lib/supabase';

export interface DriverLocation {
    driver_id: string;
    trip_id?: string;
    latitude: number;
    longitude: number;
    updated_at: string;
    is_active: boolean;
    user?: {
        full_name: string;
    };
    trips?: {
        truck_plate_number: string;
        status: string;
    };
}

export const trackingService = {
    /**
     * Updates the current driver's location.
     */
    async updateLocation(driverId: string, lat: number, lng: number, tripId?: string) {
        const { error } = await supabase
            .from('driver_locations')
            .upsert({
                driver_id: driverId,
                trip_id: tripId,
                latitude: lat,
                longitude: lng,
                updated_at: new Date().toISOString(),
                is_active: true
            });

        if (error) {
            console.error('Error updating driver location:', error);
            throw error;
        }
    },

    /**
     * Sets a driver as inactive (stopped tracking).
     */
    async setInactive(driverId: string) {
        const { error } = await supabase
            .from('driver_locations')
            .update({ is_active: false })
            .eq('driver_id', driverId);

        if (error) {
            console.error('Error setting driver inactive:', error);
            throw error;
        }
    },

    /**
     * Fetches all active driver locations with user and trip details.
     * Supports regional filtering via clusterIds.
     */
    async getActiveLocations(clusterIds?: string[]): Promise<DriverLocation[]> {
        let query = supabase
            .from('driver_locations')
            .select(`
                *,
                user:users!driver_id (full_name),
                trips!trip_id!inner (truck_plate_number, status, cluster_id)
            `)
            .eq('is_active', true);

        if (clusterIds && clusterIds.length > 0) {
            query = query.in('trips.cluster_id', clusterIds);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching active locations:', error);
            throw error;
        }

        return data as any as DriverLocation[];
    },

    /**
     * Subscribes to real-time updates for all driver locations.
     */
    subscribeToAllLocations(callback: (payload: any) => void) {
        return supabase
            .channel('public:driver_locations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'driver_locations' },
                callback
            )
            .subscribe();
    }
};
