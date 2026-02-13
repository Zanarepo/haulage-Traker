"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DriverLocation } from '@/services/trackingService';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Trucks
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2554/2554978.png', // Replace with a local SVG if possible
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

interface TrackingMapProps {
    locations: DriverLocation[];
    selectedDriverId?: string | null;
}

// Component to focus map on selected driver
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ locations, selectedDriverId }) => {
    const selectedLocation = locations.find(loc => loc.driver_id === selectedDriverId);
    const defaultCenter: [number, number] = [9.0820, 8.6753]; // Nigeria Center

    return (
        <MapContainer
            center={defaultCenter}
            zoom={6}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {locations.map((loc) => (
                <Marker
                    key={loc.driver_id}
                    position={[Number(loc.latitude), Number(loc.longitude)]}
                    icon={truckIcon}
                >
                    <Popup>
                        <div className="map-popup-content">
                            <strong>{loc.user?.full_name || 'Unknown Driver'}</strong>
                            <p>Asset: {loc.trips?.truck_plate_number || 'N/A'}</p>
                            <p>Status: <span className="status-badge">{loc.trips?.status || 'Active'}</span></p>
                            <small>Updated: {new Date(loc.updated_at).toLocaleTimeString()}</small>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {selectedLocation && (
                <ChangeView center={[Number(selectedLocation.latitude), Number(selectedLocation.longitude)]} />
            )}
        </MapContainer>
    );
};

export default TrackingMap;
