"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Users,
    Navigation,
    RefreshCcw,
    Truck,
    Search,
    MapPin,
    Map as MapIcon
} from 'lucide-react';
import { trackingService, DriverLocation } from '@/services/trackingService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/common/LoadingScreen';
import './tracking.css';

// Dynamically import map to avoid SSR issues
const TrackingMap = dynamic(
    () => import('@/components/TrackingMap/TrackingMap'),
    {
        ssr: false,
        loading: () => (
            <div className="map-placeholder">
                <RefreshCcw className="spinning" />
                <p>Initializing Real-time Map...</p>
            </div>
        )
    }
);

export default function TrackingDashboard() {
    const { profile } = useAuth();
    const [locations, setLocations] = useState<DriverLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.company_id) {
            loadInitialData();

            // Subscribe to real-time updates
            const subscription = trackingService.subscribeToAllLocations((payload) => {
                handleRealtimeUpdate(payload);
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [profile?.company_id]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const clusterIds = (profile?.role === 'admin' || profile?.role === 'site_engineer')
                ? profile?.cluster_ids
                : undefined;
            const data = await trackingService.getActiveLocations(clusterIds);
            setLocations(data);
        } catch (error) {
            console.error('Failed to load tracking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRealtimeUpdate = async (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (!newRecord.is_active) {
                // Driver stopped tracking
                setLocations(prev => prev.filter(l => l.driver_id !== newRecord.driver_id));
                if (selectedId === newRecord.driver_id) setSelectedId(null);
                return;
            }

            // Check if we already have this driver
            setLocations(prev => {
                const exists = prev.find(l => l.driver_id === newRecord.driver_id);
                if (exists) {
                    return prev.map(l => l.driver_id === newRecord.driver_id ? { ...l, ...newRecord } : l);
                }
                return prev;
            });

            // If new driver wasn't in our list, we need to fetch their basic info
            const alreadyShowing = locations.some(l => l.driver_id === newRecord.driver_id);
            if (!alreadyShowing) {
                try {
                    const clusterIds = (profile?.role === 'admin' || profile?.role === 'site_engineer')
                        ? profile?.cluster_ids
                        : undefined;

                    let selectStr = `
                        *,
                        user:users!driver_id (full_name, role),
                        trips:trips!trip_id (truck_plate_number, status, cluster_id)
                    `;

                    if (clusterIds && clusterIds.length > 0) {
                        selectStr = `
                            *,
                            user:users!driver_id (full_name, role),
                            trips:trips!trip_id!inner (truck_plate_number, status, cluster_id)
                        `;
                    }

                    let query = supabase
                        .from('driver_locations')
                        .select(selectStr)
                        .eq('driver_id', newRecord.driver_id)
                        .eq('is_active', true);

                    if (clusterIds && clusterIds.length > 0) {
                        query = query.in('trips.cluster_id', clusterIds);
                    }

                    const { data: details } = await query.single();
                    const validDetails = details as any as DriverLocation;

                    if (validDetails) {
                        setLocations(prev => {
                            if (prev.some(l => l.driver_id === validDetails.driver_id)) return prev;
                            return [...prev, validDetails];
                        });
                    }
                } catch (err) {
                    // This might error with 'JSON object requested, but no rows were returned' 
                    // if the driver doesn't match the cluster filter, which is fine.
                    console.debug('Driver skipped or fetch failed (likely cluster mismatch)');
                }
            }
        } else if (eventType === 'DELETE') {
            setLocations(prev => prev.filter(l => l.driver_id !== oldRecord.driver_id));
            if (selectedId === oldRecord.driver_id) setSelectedId(null);
        }
    };

    const filteredLocations = useMemo(() => {
        return locations.filter(loc =>
            loc.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loc.trips?.truck_plate_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [locations, searchTerm]);

    if (loading && locations.length === 0) {
        return <LoadingScreen message="Initializing fleet tracking..." />;
    }

    return (
        <div className="tracking-dashboard">
            <div className="tracking-header">
                <div className="titles">
                    <h1>Live Tracking</h1>
                    <p>Real-time fleet monitoring and driver locators</p>
                </div>

                <div className="header-actions">
                    <button className="btn-sync" onClick={loadInitialData} disabled={loading}>
                        <RefreshCcw size={16} className={loading ? 'spinning' : ''} />
                        Sync Now
                    </button>
                </div>
            </div>

            <div className="tracking-main-view">
                {/* Side Panel: Driver List */}
                <div className="driver-tracking-list">
                    <div className="list-header">
                        <h3>
                            <Navigation size={18} />
                            Active Fleet
                            <span className="active-count">{locations.length}</span>
                        </h3>
                        <div className="search-bar" style={{ marginTop: '1rem' }}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search fleet..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="driver-items-container">
                        {filteredLocations.length === 0 ? (
                            <div className="empty-state">No active drivers found.</div>
                        ) : (
                            filteredLocations.map(loc => (
                                <div
                                    key={loc.driver_id}
                                    className={`driver-tracking-item ${selectedId === loc.driver_id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(loc.driver_id)}
                                >
                                    <div className={`avatar-initials ${loc.user?.role === 'site_engineer' ? 'engineer' : ''}`}>
                                        {loc.user?.full_name?.split(' ').map(n => n[0]).join('') || 'DR'}
                                    </div>
                                    <div className="driver-info">
                                        <h4>{loc.user?.full_name}</h4>
                                        {loc.user?.role === 'site_engineer' ? (
                                            <p><MapPin size={10} /> Site Engineer</p>
                                        ) : (
                                            <p><Truck size={10} /> {loc.trips?.truck_plate_number || 'No active trip'}</p>
                                        )}
                                    </div>
                                    <div className={`status-indicator ${loc.user?.role === 'site_engineer' ? 'engineer' : ''}`} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main: Map View */}
                <div className="map-view-wrapper">
                    <TrackingMap
                        locations={locations}
                        selectedDriverId={selectedId}
                    />
                </div>
            </div>
        </div>
    );
}
