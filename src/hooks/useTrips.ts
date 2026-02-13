"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tripService } from '@/services/tripService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Trip, TripStatus } from '@/types/database';

export function useTrips() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters and UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);

    const isManager = ['superadmin', 'admin', 'md', 'accountant', 'auditor'].includes(profile?.role || '');

    const loadTrips = useCallback(async () => {
        if (!profile?.company_id) return;

        try {
            setLoading(true);
            const data = await tripService.getTrips(profile.company_id);
            setTrips(data || []);
        } catch (error: any) {
            console.error('Failed to load trips:', error);
            showToast('Failed to load trips: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const handleDispatchTrip = async (tripData: any) => {
        try {
            setSubmitting(true);
            const { itinerary, ...rest } = tripData;

            const newTrip = await tripService.createTrip(rest);

            if (itinerary && itinerary.length > 0) {
                const itineraryRecords = itinerary.map((siteId: string) => ({
                    trip_id: newTrip.id,
                    site_id: siteId,
                    status: 'pending'
                }));
                await tripService.createItinerary(itineraryRecords);
            }

            showToast('Trip dispatched successfully', 'success');
            await loadTrips();
            setIsDispatchModalOpen(false);
        } catch (error: any) {
            console.error('Dispatch failed:', error);
            showToast('Failed to dispatch trip: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (tripId: string, status: TripStatus) => {
        try {
            setSubmitting(true);
            await tripService.updateTripStatus(tripId, status);
            showToast(`Trip status updated to ${status}`, 'success');
            await loadTrips();
        } catch (error: any) {
            console.error('Status update failed:', error);
            showToast('Failed to update status', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordDispense = async (logData: any) => {
        try {
            setSubmitting(true);
            await tripService.recordDispensingLog(logData);

            // Update itinerary status
            await tripService.updateItineraryStatus(logData.trip_id, logData.site_id, 'dispensed');

            showToast('Dispensing log recorded successfully', 'success');

            // Auto-update trip status to 'dispensed' for tracking
            await tripService.updateTripStatus(logData.trip_id, 'dispensed');

            await loadTrips();
            // Modal is handled by local state in components typically
        } catch (error: any) {
            console.error('Dispensing failed:', error);
            showToast('Failed to record dispensing', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearAllHistory = async () => {
        if (!profile?.company_id) return;
        try {
            setSubmitting(true);
            await tripService.deleteAllTrips(profile.company_id);
            showToast('All trip history cleared successfully', 'success');
            await loadTrips();
            setIsHistoryModalOpen(false);
        } catch (error: any) {
            console.error('Failed to clear history:', error);
            showToast('Failed to clear history: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTrips = useMemo(() => {
        return trips.filter(trip => {
            const matchesSearch =
                trip.truck_plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.clusters?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = !statusFilter || trip.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [trips, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: trips.length,
            active: trips.filter(t => t.status === 'active').length,
            pending: trips.filter(t => t.status === 'pending').length,
            completed: trips.filter(t => t.status === 'completed' || t.status === 'reconciled').length,
        };
    }, [trips]);

    return {
        trips,
        filteredTrips,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        isDispatchModalOpen,
        setIsDispatchModalOpen,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        isDispenseModalOpen,
        setIsDispenseModalOpen,
        selectedTrip,
        setSelectedTrip,
        handleDispatchTrip,
        handleUpdateStatus,
        handleRecordDispense,
        handleClearAllHistory,
        stats,
        isManager,
        loadTrips
    };
}
