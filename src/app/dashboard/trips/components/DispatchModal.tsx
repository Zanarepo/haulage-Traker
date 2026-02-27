"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Loader2,
    Truck,
    Users,
    MapPin,
    Plus,
    X,
    Map as MapIcon,
    Fuel
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface DispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDispatch: (data: any) => void;
    submitting: boolean;
    drivers: any[];
    clusters: any[];
    sites: any[];
    allocations: any[];
}

export default function DispatchModal({
    isOpen,
    onClose,
    onDispatch,
    submitting,
    drivers,
    clusters,
    sites,
    allocations,
}: DispatchModalProps) {
    const { profile } = useAuth();
    const { plan } = useSubscription(profile?.company_id || null);

    const [plateNumber, setPlateNumber] = useState('');
    const [driverId, setDriverId] = useState('');
    const [clusterId, setClusterId] = useState('');
    const [clientId, setClientId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [itinerary, setItinerary] = useState<string[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [isMultipleClusters, setIsMultipleClusters] = useState(false);
    const [tempClusterId, setTempClusterId] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setPlateNumber('');
            setDriverId('');
            setClusterId('');
            setClientId('');
            setQuantity('');
            setItinerary([]);
            setSelectedSiteId('');
            setIsMultipleClusters(false);
            setTempClusterId('');
        }
    }, [isOpen]);

    const addToItinerary = () => {
        if (!selectedSiteId || itinerary.includes(selectedSiteId)) return;

        // Dynamic plan-based limit
        if (itinerary.length >= plan.features.infra_supply.maxItineraryStops) return;

        const site = sites.find(s => s.id === selectedSiteId);
        if (site) {
            setItinerary([...itinerary, selectedSiteId]);
            setSelectedSiteId('');
            setTempClusterId(''); // Clear temp cluster for next add

            // Auto-fill cluster and client from first site if not set
            if (!clusterId) setClusterId(site.cluster_id);
            if (!clientId) setClientId(site.client_id);
        }
    };

    const removeFromItinerary = (id: string) => {
        setItinerary(itinerary.filter(siteId => siteId !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onDispatch({
            truck_plate_number: plateNumber,
            driver_id: driverId,
            cluster_id: clusterId,
            client_id: clientId,
            loaded_quantity: Number(quantity),
            itinerary: itinerary
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dispatch New Trip (Planned Route)"
            maxWidth="650px"
            footer={
                <>
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="btn-submit"
                        disabled={submitting || !plateNumber || !driverId || !clusterId || !clientId || !quantity || itinerary.length === 0}
                        onClick={handleSubmit}
                    >
                        {submitting ? <Loader2 size={16} className="spinning" /> : 'Dispatch Truck'}
                    </button>
                </>
            }
        >
            <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Truck Plate Number
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Truck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={plateNumber}
                                onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. LAG-123-XY"
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Assigned Driver
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={driverId}
                                onChange={e => setDriverId(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                                required
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Primary Operation Cluster
                        </label>
                        <select
                            value={clusterId}
                            onChange={e => setClusterId(e.target.value)}
                            style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            required
                        >
                            <option value="">Select Primary Cluster</option>
                            {clusters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Delivery Flexibility
                        </label>
                        <div style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 1rem', background: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                            <input
                                type="checkbox"
                                id="multiClusters"
                                checked={isMultipleClusters}
                                onChange={e => setIsMultipleClusters(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="multiClusters" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                Multiple Clusters Involved
                            </label>
                        </div>
                    </div>
                </div>

                {/* Itinerary Planning Section */}
                <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                        <MapIcon size={16} className="text-primary" />
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Step 1: Build Planned Itinerary</h3>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 1.5fr) auto', gap: '0.75rem', marginBottom: '1rem' }}>
                        <select
                            value={tempClusterId}
                            onChange={e => {
                                setTempClusterId(e.target.value);
                                setSelectedSiteId(''); // Reset site when cluster changes
                            }}
                            style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                        >
                            <option value="">Select Cluster...</option>
                            {clusters
                                .filter(c => {
                                    if (isMultipleClusters) return true;
                                    return !clusterId || c.id === clusterId;
                                })
                                .map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                        </select>

                        <select
                            value={selectedSiteId}
                            onChange={e => setSelectedSiteId(e.target.value)}
                            disabled={!tempClusterId}
                            style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem', opacity: !tempClusterId ? 0.5 : 1 }}
                        >
                            <option value="">{tempClusterId ? 'Choose Site...' : 'Select Cluster First'}</option>
                            {sites
                                .filter(s => s.cluster_id === tempClusterId)
                                .filter(s => !itinerary.includes(s.id))
                                .map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                        </select>

                        <button
                            type="button"
                            onClick={addToItinerary}
                            disabled={!selectedSiteId || itinerary.length >= plan.features.infra_supply.maxItineraryStops}
                            style={{
                                height: '40px',
                                padding: '0 1rem',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                opacity: (!selectedSiteId || itinerary.length >= plan.features.infra_supply.maxItineraryStops) ? 0.5 : 1
                            }}
                        >
                            <Plus size={16} />
                            {itinerary.length >= plan.features.infra_supply.maxItineraryStops ? 'Limit Hit' : 'Add'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {itinerary.length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>⚠️ No stops added to itinerary yet.</p>
                        ) : (
                            itinerary.map((siteId, index) => {
                                const site = sites.find(s => s.id === siteId);
                                return (
                                    <div key={siteId} style={{
                                        display: 'flex',
                                        alignItems: 'center', gap: '8px',
                                        padding: '4px 8px 4px 12px',
                                        background: 'var(--bg-main)',
                                        borderRadius: '2rem',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.8rem'
                                    }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span>
                                        <span>{site?.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFromItinerary(siteId)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Client Stock Account
                        </label>
                        <select
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                            style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            required
                        >
                            <option value="">Select Client</option>
                            {allocations.map(a => (
                                <option key={a.client_id} value={a.client_id}>
                                    {a.client_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Loaded Quantity (Liters)
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Fuel size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="e.g. 10000"
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                required
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
