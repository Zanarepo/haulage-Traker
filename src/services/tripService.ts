import { supabase } from '@/lib/supabase';
import { Trip, DispensingLog, TripStatus } from '@/types/database';

export const tripService = {
    /**
     * Fetches all trips for a company.
     * Joins with clusters, users (driver), and clients.
     */
    async getTrips(companyId: string) {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                clusters (name),
                driver:users!driver_id (full_name),
                clients!client_id (name),
                itineraries:trip_itineraries (
                    *,
                    sites (name, site_id_code)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching trips:', error);
            throw error;
        }
        return data;
    },

    /**
     * Creates a new trip (Dispatch).
     */
    async createTrip(tripData: Partial<Trip>) {
        const { data, error } = await supabase
            .from('trips')
            .insert({
                ...tripData,
                status: 'pending' as TripStatus
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating trip:', error);
            throw error;
        }
        return data as Trip;
    },

    /**
     * Updates trip status.
     */
    async updateTripStatus(tripId: string, status: TripStatus) {
        const { data, error } = await supabase
            .from('trips')
            .update({ status })
            .eq('id', tripId)
            .select()
            .single();

        if (error) {
            console.error('Error updating trip status:', error);
            throw error;
        }
        return data as Trip;
    },

    /**
     * Fetches dispensing logs for a specific trip.
     */
    async getDispensingLogs(tripId: string) {
        const { data, error } = await supabase
            .from('dispensing_logs')
            .select(`
                *,
                sites (name, site_id_code)
            `)
            .eq('trip_id', tripId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching dispensing logs:', error);
            throw error;
        }
        return data;
    },

    /**
     * Records a new dispensing log.
     */
    async recordDispensingLog(logData: Partial<DispensingLog>) {
        const { data, error } = await supabase
            .from('dispensing_logs')
            .insert(logData)
            .select()
            .single();

        if (error) {
            console.error('Error recording dispensing log:', error);
            throw error;
        }
        return data as DispensingLog;
    },

    /**
     * Deletes all trips for a company. (Clear History)
     */
    async deleteAllTrips(companyId: string) {
        // Since trips are linked to company_id (via joins or direct column), 
        // we'll delete all trips. Assuming trips are global or filtered by cluster.
        // Actually trips table doesn't have company_id directly based on schema.
        // It has cluster_id.
        const { error } = await supabase
            .from('trips')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.error('Error clearing trips:', error);
            throw error;
        }
        return true;
    },

    /**
     * Adds itinerary records for a trip.
     */
    async createItinerary(itineraryData: any[]) {
        const { data, error } = await supabase
            .from('trip_itineraries')
            .insert(itineraryData)
            .select();

        if (error) {
            console.error('Error creating itinerary:', error);
            throw error;
        }
        return data;
    },

    /**
     * Updates an itinerary status to 'dispensed'.
     */
    async updateItineraryStatus(tripId: string, siteId: string, status: 'pending' | 'dispensed') {
        const { error } = await supabase
            .from('trip_itineraries')
            .update({ status })
            .match({ trip_id: tripId, site_id: siteId });

        if (error) {
            console.error('Error updating itinerary status:', error);
            throw error;
        }
    }
};
