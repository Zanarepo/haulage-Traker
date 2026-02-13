"use client";

import React, { useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Loader2,
    History,
    Trash2,
    Calendar,
    Truck,
    User,
    MapPin,
    Fuel,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Clock,
    Droplet
} from 'lucide-react';
import { format } from 'date-fns';
import { tripService } from '@/services/tripService';

interface TripHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    trips: any[];
    onClearAll: () => Promise<void>;
    submitting: boolean;
    isManager: boolean;
}

export default function TripHistoryModal({
    isOpen,
    onClose,
    trips,
    onClearAll,
    submitting,
    isManager
}: TripHistoryModalProps) {
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
    const [tripLogs, setTripLogs] = useState<Record<string, any[]>>({});
    const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});

    const toggleTrip = async (tripId: string) => {
        if (expandedTripId === tripId) {
            setExpandedTripId(null);
            return;
        }

        setExpandedTripId(tripId);

        // Load logs if not already loaded
        if (!tripLogs[tripId]) {
            try {
                setLoadingLogs(prev => ({ ...prev, [tripId]: true }));
                const logs = await tripService.getDispensingLogs(tripId);
                setTripLogs(prev => ({ ...prev, [tripId]: logs }));
            } catch (error) {
                console.error('Failed to load logs for trip:', tripId, error);
            } finally {
                setLoadingLogs(prev => ({ ...prev, [tripId]: false }));
            }
        }
    };

    const handleClearClick = async () => {
        if (showConfirmClear) {
            await onClearAll();
            setShowConfirmClear(false);
        } else {
            setShowConfirmClear(true);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Comprehensive Trip Archive"
            maxWidth="900px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    {isManager && (
                        <button
                            className={`btn-${showConfirmClear ? 'danger' : 'outline-danger'}`}
                            onClick={handleClearClick}
                            disabled={submitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                border: '1px solid #ef4444',
                                background: showConfirmClear ? '#ef4444' : 'transparent',
                                color: showConfirmClear ? 'white' : '#ef4444',
                                cursor: 'pointer'
                            }}
                        >
                            {submitting ? <Loader2 size={16} className="spinning" /> : <Trash2 size={16} />}
                            {showConfirmClear ? 'Confirm Clear All?' : 'Clear All History'}
                        </button>
                    )}
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Close Archive</button>
                </div>
            }
        >
            <div className="history-container" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {trips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                        <History size={64} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Archive Data</h3>
                        <p style={{ fontSize: '0.9rem' }}>Completed trips and itineraries will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {trips.map((trip) => (
                            <div
                                key={trip.id}
                                style={{
                                    borderRadius: '1rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div
                                    style={{
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                                        gap: '1.5rem',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => toggleTrip(trip.id)}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Dispatch Date</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500 }}>
                                            <Calendar size={14} style={{ color: '#3b82f6' }} />
                                            {format(new Date(trip.created_at), 'MMM d, HH:mm')}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Logistics Asset</span>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{trip.truck_plate_number}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.driver?.full_name}</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Volume</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 800 }}>
                                            <Fuel size={14} style={{ color: '#10b981' }} />
                                            {trip.loaded_quantity?.toLocaleString()} L
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trip.clients?.name}</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '2rem',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            background: trip.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: trip.status === 'completed' ? '#10b981' : '#3b82f6',
                                            border: `1px solid ${trip.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                        }}>
                                            {trip.status}
                                        </span>
                                    </div>

                                    <div style={{ color: 'var(--text-muted)' }}>
                                        {expandedTripId === trip.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {expandedTripId === trip.id && (
                                    <div style={{
                                        padding: '0 1.25rem 1.25rem 1.25rem',
                                        borderTop: '1px solid var(--border-color)',
                                        background: 'var(--bg-main)'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.25rem' }}>
                                            {/* Column 1: Planned Itinerary */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                                    <Clock size={16} className="text-primary" />
                                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Planned Itinerary</h4>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {trip.itineraries?.map((it: any, idx: number) => (
                                                        <div key={it.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.6rem 0.75rem',
                                                            background: 'var(--bg-card)',
                                                            borderRadius: '0.5rem',
                                                            border: '1px solid var(--border-color)'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}.</span>
                                                                <span>{it.sites?.name}</span>
                                                            </div>
                                                            {it.status === 'dispensed' ? (
                                                                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                                                            ) : (
                                                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>PENDING</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 2: Actual Dispensing Logs */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                                    <Droplet size={16} style={{ color: '#10b981' }} />
                                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Actual Deliveries</h4>
                                                </div>
                                                {loadingLogs[trip.id] ? (
                                                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                                                        <Loader2 size={24} className="spinning" style={{ opacity: 0.3 }} />
                                                    </div>
                                                ) : tripLogs[trip.id]?.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        No dispensing logs recorded.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {tripLogs[trip.id]?.map((log: any) => (
                                                            <div key={log.id} style={{
                                                                padding: '0.6rem 0.75rem',
                                                                background: 'rgba(16, 185, 129, 0.03)',
                                                                borderRadius: '0.5rem',
                                                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.sites?.name}</span>
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                        {format(new Date(log.created_at), 'HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981' }}>
                                                                        {log.quantity_dispensed?.toLocaleString()} L
                                                                    </span>
                                                                    {log.community_provision_qty > 0 && (
                                                                        <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>
                                                                            + {log.community_provision_qty} L Community
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div style={{
                                                            marginTop: '0.5rem',
                                                            paddingTop: '0.5rem',
                                                            borderTop: '1px dashed var(--border-color)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Tailgate</span>
                                                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                                                                {tripLogs[trip.id]?.reduce((sum, l) => sum + (l.quantity_dispensed || 0) + (l.community_provision_qty || 0), 0).toLocaleString()} L
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showConfirmClear && (
                <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong>Permanent Deletion:</strong> This will erase all trips, itineraries, and dispensing history. This cannot be undone.
                    </div>
                </div>
            )}
        </Modal>
    );
}

// Support component if missing
function AlertCircle({ size }: { size: number }) {
    return <Trash2 size={size} />; // Fallback if AlertCircle not imported correctly
}
