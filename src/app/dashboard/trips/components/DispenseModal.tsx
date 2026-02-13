"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Droplet,
    MapPin,
    Calculator,
    AlertCircle,
    Loader2,
    Map as MapIcon,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { History, X, Camera, PenTool, ShieldCheck, UserCheck } from 'lucide-react';
import { tripService } from '@/services/tripService';
import { documentService } from '@/services/documentService';
import SignaturePad from '@/components/SignaturePad/SignaturePad';

interface DispenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDispense: (logData: any) => Promise<void>;
    submitting: boolean;
    trip: any;
}

export default function DispenseModal({
    isOpen,
    onClose,
    onDispense,
    submitting,
    trip
}: DispenseModalProps) {
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [communityQuantity, setCommunityQuantity] = useState('');
    const [previousDrops, setPreviousDrops] = useState<any[]>([]);
    const [itinerary, setItinerary] = useState<any[]>([]);

    // Document state
    const [waybillFile, setWaybillFile] = useState<File | null>(null);
    const [driverSig, setDriverSig] = useState<string | null>(null);
    const [engineerSig, setEngineerSig] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const loadData = useCallback(async () => {
        if (!trip) return;
        try {
            setItinerary(trip.itineraries || []);
            const firstPending = trip.itineraries?.find((it: any) => it.status === 'pending');
            if (firstPending) {
                setSelectedSiteId(firstPending.site_id);
            }
            const logs = await tripService.getDispensingLogs(trip.id);
            setPreviousDrops(logs || []);
        } catch (error) {
            console.error('Failed to load dispensing data:', error);
        }
    }, [trip]);

    useEffect(() => {
        if (isOpen && trip) {
            loadData();
            setQuantity('');
            setCommunityQuantity('');
            setWaybillFile(null);
            setDriverSig(null);
            setEngineerSig(null);
        }
    }, [isOpen, trip, loadData]);

    const handleUploadAndDispense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSiteId || !quantity) return;

        setIsUploading(true);
        try {
            let waybillUrl = '';
            let dSigUrl = '';
            let eSigUrl = '';

            // 1. Upload waybill if exists
            if (waybillFile) {
                const path = `waybills/WB_${Date.now()}_${waybillFile.name}`;
                waybillUrl = await documentService.uploadDocument(waybillFile, path);
            }

            // 2. Upload signatures if exists
            if (driverSig) {
                dSigUrl = await documentService.uploadSignature(driverSig, 'driver');
            }
            if (engineerSig) {
                eSigUrl = await documentService.uploadSignature(engineerSig, 'engineer');
            }

            // 3. Dispatch original dispense action with URLs
            await onDispense({
                trip_id: trip.id,
                site_id: selectedSiteId,
                quantity_dispensed: Number(quantity),
                community_provision_qty: Number(communityQuantity) || 0,
                waybill_photo_url: waybillUrl,
                driver_signature_url: dSigUrl,
                engineer_signature_url: eSigUrl,
                engineer_name: 'Site Engineer' // Default for now
            });

            const updatedItinerary = itinerary.map(it =>
                it.site_id === selectedSiteId ? { ...it, status: 'dispensed' } : it
            );
            setItinerary(updatedItinerary);
            setQuantity('');
            setCommunityQuantity('');
            setWaybillFile(null);
            setDriverSig(null);
            setEngineerSig(null);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload verification documents. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const totalLoaded = trip?.loaded_quantity || 0;
    const totalDispensedSoFar = previousDrops.reduce((sum, log) => sum + (log.quantity_dispensed || 0) + (log.community_provision_qty || 0), 0);
    const remainingVolume = totalLoaded - totalDispensedSoFar;

    const currentTotalAttempted = Number(quantity) + (Number(communityQuantity) || 0);
    const isFullyDispensed = remainingVolume <= 0 && totalLoaded > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Record Delivery Activity"
            maxWidth="550px"
            footer={
                <>
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Close</button>
                    {!isFullyDispensed && (
                        <button
                            className="btn-submit"
                            disabled={submitting || isUploading || !selectedSiteId || !quantity || currentTotalAttempted > remainingVolume}
                            onClick={handleUploadAndDispense}
                        >
                            {submitting || isUploading ? <Loader2 size={16} className="spinning" /> : 'Confirm Delivery'}
                        </button>
                    )}
                </>
            }
        >
            <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Truck Volume Status */}
                <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Truck: {trip?.truck_plate_number}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: remainingVolume <= 0 ? '#10b981' : 'var(--text-main)' }}>
                            {remainingVolume.toLocaleString()} L Left
                        </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, (totalDispensedSoFar / totalLoaded) * 100)}%`,
                            height: '100%',
                            background: '#3b82f6',
                            transition: 'width 0.4s ease'
                        }}></div>
                    </div>
                </div>

                {/* Itinerary Progress */}
                <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <MapIcon size={16} className="text-primary" />
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Planned Itinerary Sites</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {itinerary.map((it: any) => (
                            <div key={it.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                background: selectedSiteId === it.site_id ? 'var(--bg-main)' : 'transparent',
                                borderRadius: '0.75rem',
                                border: selectedSiteId === it.site_id ? '1px solid #3b82f6' : '1px solid transparent',
                                cursor: it.status === 'pending' ? 'pointer' : 'default',
                                opacity: it.status === 'dispensed' ? 0.6 : 1
                            }}
                                onClick={() => it.status === 'pending' && setSelectedSiteId(it.site_id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {it.status === 'dispensed' ? (
                                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                                    ) : (
                                        <Clock size={16} style={{ color: selectedSiteId === it.site_id ? '#3b82f6' : 'var(--text-muted)' }} />
                                    )}
                                    <span style={{ fontSize: '0.9rem', fontWeight: selectedSiteId === it.site_id ? 700 : 500 }}>
                                        {it.sites?.name}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: it.status === 'dispensed' ? '#10b981' : '#f59e0b' }}>
                                    {it.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {!isFullyDispensed ? (
                    <>
                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label>Delivery Quantity for {itinerary.find(it => it.site_id === selectedSiteId)?.sites?.name || 'Selected Site'}</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <Calculator size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter volume delivered..."
                                    style={{ width: '100%', height: '44px', paddingLeft: '2.5rem', borderRadius: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                    max={remainingVolume}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '0.25rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Community Provision (Optional)</span>
                                {remainingVolume < currentTotalAttempted && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Exceeds capacity</span>}
                            </label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <Droplet size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                                <input
                                    type="number"
                                    value={communityQuantity}
                                    onChange={(e) => setCommunityQuantity(e.target.value)}
                                    placeholder="Enter community volume..."
                                    style={{ width: '100%', height: '44px', paddingLeft: '2.5rem', borderRadius: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        {/* Verification Documents */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={16} className="text-primary" />
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Verification Documents</h4>
                            </div>

                            {/* Waybill Upload */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Camera size={14} /> Waybill Photo (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setWaybillFile(e.target.files?.[0] || null)}
                                    className="file-input-compact"
                                />
                            </div>

                            {/* Signatures */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserCheck size={14} /> Driver Sig.
                                    </label>
                                    <SignaturePad
                                        onSave={setDriverSig}
                                        placeholder="Driver sign..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <PenTool size={14} /> Engineer Sig.
                                    </label>
                                    <SignaturePad
                                        onSave={setEngineerSig}
                                        placeholder="Engineer sign..."
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#10b981', fontWeight: 600 }}>
                        All planned deliveries completed! 🚛💨
                    </div>
                )}
            </div>

            <style jsx>{`
                .file-input-compact {
                    width: 100%;
                    font-size: 0.75rem;
                    padding: 8px;
                    background: var(--bg-hover);
                    border: 1px dashed var(--border-color);
                    border-radius: 0.5rem;
                    color: var(--text-muted);
                }
            `}</style>
        </Modal>
    );
}
