"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Users,
    Navigation,
    RefreshCcw,
    Truck,
    Search,
    Map as MapIcon
} from 'lucide-react';
import { trackingService, DriverLocation } from '@/services/trackingService';
import { useAuth } from '@/hooks/useAuth';
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

    const handleRealtimeUpdate = (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        setLocations(prev => {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                if (!newRecord.is_active) {
                    return prev.filter(l => l.driver_id !== newRecord.driver_id);
                }

                const exists = prev.find(l => l.driver_id === newRecord.driver_id);
                if (exists) {
                    return prev.map(l => l.driver_id === newRecord.driver_id ? { ...l, ...newRecord } : l);
                } else {
                    // If it's a new active driver, we might need to re-fetch to get joined user/trip data
                    // For simplicity in this demo, we'll just wait for the next full refresh or 
                    // implement a single fetch for the new driver.
                    loadInitialData();
                    return prev;
                }
            } else if (eventType === 'DELETE') {
                return prev.filter(l => l.driver_id !== oldRecord.driver_id);
            }
            return prev;
        });
    };

    const filteredLocations = useMemo(() => {
        return locations.filter(loc =>
            loc.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loc.trips?.truck_plate_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [locations, searchTerm]);

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
                            Active Drivers
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
                        {loading && locations.length === 0 ? (
                            <div className="empty-state">Loading fleet data...</div>
                        ) : filteredLocations.length === 0 ? (
                            <div className="empty-state">No active drivers found.</div>
                        ) : (
                            filteredLocations.map(loc => (
                                <div
                                    key={loc.driver_id}
                                    className={`driver-tracking-item ${selectedId === loc.driver_id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(loc.driver_id)}
                                >
                                    <div className="avatar-initials">
                                        {loc.user?.full_name?.split(' ').map(n => n[0]).join('') || 'DR'}
                                    </div>
                                    <div className="driver-info">
                                        <h4>{loc.user?.full_name}</h4>
                                        <p><Truck size={10} /> {loc.trips?.truck_plate_number || 'No active trip'}</p>
                                    </div>
                                    <div className="status-indicator" />
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
