"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import {
    Camera,
    MapPin,
    Navigation,
    Fuel,
    ClipboardCheck,
    ArrowRight,
    CheckCircle2,
    Loader2,
    X,
    Info,
    User,
    Image as ImageIcon,
    Trash2,
    Plus
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';

interface VisitWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder?: any; // Optional for ad-hoc
    engineerId: string;
    onComplete: () => void;
    targetEngineerId?: string; // Add this if it was intended
    editVisit?: any;
}

export default function VisitWizardModal({
    isOpen,
    onClose,
    workOrder,
    engineerId,
    onComplete,
    targetEngineerId: providedEngineerId,
    editVisit
}: VisitWizardModalProps & { targetEngineerId?: string }) {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const { users } = useUsers();
    const isAdmin = ['superadmin', 'admin', 'md'].includes(profile?.role || '');

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [siteId, setSiteId] = useState(workOrder?.site_id || '');
    const [targetEngineerId, setTargetEngineerId] = useState(workOrder?.engineer_id || engineerId || providedEngineerId || '');
    const [sites, setSites] = useState<any[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);

    // 1. Arrival & Location
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [locLoading, setLocLoading] = useState(false);

    // 2. Pre-Check documentation
    const [hourMeterBefore, setHourMeterBefore] = useState('');
    const [dieselBefore, setDieselBefore] = useState('');
    const [visitMedia, setVisitMedia] = useState<any[]>([]);
    const [siteNotes, setSiteNotes] = useState('');
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // 3. Safety Checklist
    const [safetyPassed, setSafetyPassed] = useState<boolean | null>(null);

    // 4. Departure documentation
    const [hourMeterAfter, setHourMeterAfter] = useState('');
    const [dieselAfter, setDieselAfter] = useState('');

    const [visitId, setVisitId] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [mediaType, setMediaType] = useState<'before' | 'after'>('before');

    useEffect(() => {
        if (isOpen && !workOrder) {
            loadSites();
        }
    }, [isOpen, workOrder]);

    useEffect(() => {
        if (isOpen && editVisit) {
            setVisitId(editVisit.id);
            setSiteId(editVisit.site_id || '');
            setTargetEngineerId(editVisit.engineer_id || '');
            setLat(editVisit.geo_lat || null);
            setLng(editVisit.geo_lng || null);
            setHourMeterBefore(editVisit.hour_meter_before?.toString() || '');
            setDieselBefore(editVisit.diesel_level_before?.toString() || '');
            setHourMeterAfter(editVisit.hour_meter_after?.toString() || '');
            setDieselAfter(editVisit.diesel_level_after?.toString() || '');
            setSiteNotes(editVisit.site_condition_notes || '');

            // Fetch media for editing
            const fetchMedia = async () => {
                const data = await maintainService.getVisitMedia(editVisit.id);
                setVisitMedia(data);
            };
            fetchMedia();

            // If it's a completed visit being edited, we might want to start further in the steps
            // but for simplicity, let's just let them wizard through or we can add a way to jump.
            // Let's set step to 1 but populate everything.
        } else if (isOpen && !editVisit) {
            // Reset state if not editing
            setVisitId(null);
            setStep(1);
            setSiteId(workOrder?.site_id || '');
            setHourMeterBefore('');
            setDieselBefore('');
            setHourMeterAfter('');
            setDieselAfter('');
            setVisitMedia([]);
            setLat(null);
            setLng(null);
        }
    }, [isOpen, editVisit, workOrder]);

    const loadSites = async () => {
        try {
            setLoadingSites(true);
            const data = await maintainService.getSites();
            let filtered = data || [];

            // Engineers only see sites in their assigned clusters
            if (profile?.role === 'site_engineer' && profile?.cluster_ids && profile.cluster_ids.length > 0) {
                filtered = filtered.filter(s => profile.cluster_ids?.includes(s.cluster_id));
            }

            setSites(filtered);
        } finally {
            setLoadingSites(false);
        }
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const handleIdentifyLocation = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser", "error");
            return;
        }

        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                setLocLoading(false);
                showToast("Location accurately captured", "success");
            },
            (err) => {
                console.error(err);
                showToast("Could not capture location. Please ensure location services are enabled.", "error");
                setLocLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleStartVisit = async () => {
        if (!siteId) {
            showToast("Please select a site first.", "warning");
            return;
        }
        if (lat === null || lng === null) {
            showToast("Please capture your location first.", "warning");
            return;
        }

        // Geofencing Check
        let geofenceValid = false;
        const selectedSite = workOrder?.site || sites.find(s => s.id === siteId);

        if (selectedSite?.latitude && selectedSite?.longitude) {
            const distance = getDistance(
                lat, lng,
                Number(selectedSite.latitude),
                Number(selectedSite.longitude)
            );
            // Valid if within 200 meters
            geofenceValid = distance <= 200;
            console.log(`[Geofence] Distance to site: ${distance.toFixed(2)}m. Valid: ${geofenceValid}`);
        }

        if (!profile?.company_id) return;
        setSubmitting(true);
        try {
            if (editVisit) {
                await maintainService.updateVisitReport(visitId!, {
                    site_id: siteId,
                    engineer_id: targetEngineerId,
                    hour_meter_before: hourMeterBefore ? Number(hourMeterBefore) : undefined,
                    diesel_level_before: dieselBefore ? Number(dieselBefore) : undefined,
                    site_condition_notes: siteNotes
                });
                showToast("Visit metadata updated", "success");
            } else {
                const v = await maintainService.startVisit({
                    companyId: profile.company_id,
                    siteId,
                    engineerId: targetEngineerId,
                    workOrderId: workOrder?.id,
                    lat,
                    lng,
                    geofenceValid,
                    hourMeterBefore: hourMeterBefore ? Number(hourMeterBefore) : undefined,
                    dieselLevelBefore: dieselBefore ? Number(dieselBefore) : undefined,
                    site_condition_notes: siteNotes
                } as any);
                setVisitId(v.id);
                showToast("Visit record started successfully", "success");
            }
            setStep(2); // Move to Arrival Documentation
        } catch (err) {
            console.error(err);
            showToast("Failed to process visit record", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        const header = window.prompt("Enter a caption for this photo (e.g., 'Meter Reading', 'Site Gate'):");
        if (header === null) return; // User cancelled

        try {
            setUploadingMedia(true);
            if (visitId) {
                const newMedia = await maintainService.uploadVisitMedia(
                    file,
                    visitId,
                    profile.company_id!,
                    profile.id,
                    mediaType,
                    header
                );
                setVisitMedia(prev => [...prev, newMedia]);
                showToast("Photo uploaded successfully", "success");
            } else {
                showToast("Please identify your location first", "warning");
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            showToast("Upload failed: " + error.message, "error");
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteMedia = async (media: any) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await maintainService.deleteVisitMedia(media.id, media.file_url);
            setVisitMedia(prev => prev.filter(m => m.id !== media.id));
            showToast("Photo removed", "info");
        } catch (error: any) {
            showToast("Delete failed", "error");
        }
    };

    const handleProceedToCompletion = async () => {
        if (!visitId || safetyPassed === null || !profile) return;
        setSubmitting(true);
        try {
            await maintainService.submitSafetyCheck({
                visitId,
                companyId: profile.company_id!,
                checklistJson: { initial_check: safetyPassed },
                passed: safetyPassed,
                signedBy: profile.id
            });
            showToast("Safety status logged", "success");
            setStep(4);
        } catch (err) {
            console.error(err);
            showToast("Failed to log safety status", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteVisit = async () => {
        if (!visitId) return;

        setSubmitting(true);
        try {
            const updatePayload = {
                before_photos: visitMedia.filter(m => m.type === 'before').map(m => m.file_url),
                after_photos: visitMedia.filter(m => m.type === 'after').map(m => m.file_url),
                hour_meter_after: hourMeterAfter ? Number(hourMeterAfter) : undefined,
                diesel_level_after: dieselAfter ? Number(dieselAfter) : undefined,
                site_condition_notes: siteNotes
            };

            if (editVisit) {
                await maintainService.updateVisitReport(visitId, updatePayload as any);
                showToast("Visit report updated", "success");
            } else {
                await maintainService.completeVisit(visitId, {
                    beforePhotos: updatePayload.before_photos,
                    afterPhotos: updatePayload.after_photos,
                    hourMeterAfter: updatePayload.hour_meter_after,
                    dieselLevelAfter: updatePayload.diesel_level_after
                });
                showToast("Visit report completed successfully", "success");
            }
            onComplete();
            onClose();
        } catch (err) {
            console.error(err);
            showToast("Failed to complete report", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={workOrder ? `Site Visit — ${workOrder.title}` : "New Site Visit"}
            maxWidth="600px"
        >
            <div className="visit-wizard" style={{ padding: '1rem' }}>
                {/* Progress Steps */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            flex: 1,
                            height: '4px',
                            background: step >= i ? 'var(--accent-color)' : 'var(--border-color)',
                            borderRadius: '2px',
                            transition: 'all 0.3s'
                        }} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="step-content">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={20} className="text-accent" />
                            Arrival & Identification
                        </h3>

                        {isAdmin && !workOrder && (
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                    Assign Visit To (Engineer)
                                </label>
                                <select
                                    value={targetEngineerId}
                                    onChange={e => setTargetEngineerId(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Select an engineer...</option>
                                    {users.filter(u => u.role === 'site_engineer').map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {!workOrder && (
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                    Select Site
                                </label>
                                <select
                                    value={siteId}
                                    onChange={e => setSiteId(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Choose a site...</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.site_id_code})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{
                            background: 'var(--bg-hover)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            textAlign: 'center',
                            border: '1px dashed var(--border-color)',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                To begin the visit, identify your current coordinates at the site as proof of presence.
                            </p>

                            {lat ? (
                                <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={18} />
                                    Location Identified: {lat.toFixed(4)}, {lng?.toFixed(4)}
                                    <button
                                        onClick={handleIdentifyLocation}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                        re-capture
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleIdentifyLocation}
                                    disabled={locLoading}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: '30px',
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {locLoading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                                    Identify My Location
                                </button>
                            )}
                        </div>

                        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Hour Meter (Arrival)
                                </label>
                                <input
                                    type="number"
                                    value={hourMeterBefore}
                                    onChange={e => setHourMeterBefore(e.target.value)}
                                    placeholder="00.0"
                                    style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Diesel Level (L/%)
                                </label>
                                <input
                                    type="number"
                                    value={dieselBefore}
                                    onChange={e => setDieselBefore(e.target.value)}
                                    placeholder="Liters"
                                    style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleStartVisit}
                            disabled={submitting || !siteId || !lat}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'black',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : "PROCEED TO ARRIVAL PHOTOS"}
                            {!submitting && <ArrowRight size={18} />}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => { setMediaType('before'); fileInputRef.current?.click(); }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <Camera size={20} className="text-accent" />
                            </button>
                            Arrival Documentation
                        </h3>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Provide "Before" photos of the site, asset meter, and any existing conditions.
                        </p>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                Site Condition & Observations
                            </label>
                            <textarea
                                value={siteNotes}
                                onChange={e => setSiteNotes(e.target.value)}
                                placeholder="Any visible issues, security concerns, or asset observations..."
                                style={{ width: '100%', minHeight: '80px', borderRadius: '0.5rem', padding: '0.8rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <div className="media-grid">
                                {visitMedia.filter(m => m.type === 'before').map((media) => (
                                    <div key={media.id} style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                        <img src={media.file_url} alt={media.header} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', fontSize: '0.65rem' }}>
                                            {media.header}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMedia(media)}
                                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        setMediaType('before');
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingMedia}
                                    style={{
                                        height: '120px',
                                        borderRadius: '8px',
                                        border: '2px dashed var(--border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: 'var(--bg-hover)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {uploadingMedia ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{uploadingMedia ? 'Uploading...' : 'Add Arrival Photo'}</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'black',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            PROCEED TO SAFETY CHECK <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <div style={{ padding: '10px', background: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
                                <ClipboardCheck size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>Safety & Compliance</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perform pre-work safety verification</p>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <Info size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                You must complete any required SOP checklists before finishing the visit.
                                {workOrder && " These can be found in the Work Order details."}
                            </p>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem' }}>Did the site pass initial safety checks?</p>
                            <div className="detail-grid">
                                <button
                                    onClick={() => setSafetyPassed(true)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid ${safetyPassed === true ? '#10b981' : 'var(--border-color)'}`,
                                        background: safetyPassed === true ? '#f0fdf4' : 'white',
                                        color: safetyPassed === true ? '#059669' : 'var(--text-main)',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    YES — SAFE
                                </button>
                                <button
                                    onClick={() => setSafetyPassed(false)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid ${safetyPassed === false ? '#ef4444' : 'var(--border-color)'}`,
                                        background: safetyPassed === false ? '#fef2f2' : 'white',
                                        color: safetyPassed === false ? '#991b1b' : 'var(--text-main)',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    NO — ISSUES
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleProceedToCompletion}
                            disabled={safetyPassed === null || submitting}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'black',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <>PROCEED TO DEPARTURE LOGS <ArrowRight size={18} /></>}
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-content">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => { setMediaType('after'); fileInputRef.current?.click(); }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <Camera size={20} className="text-accent" />
                            </button>
                            Final Documentation
                        </h3>

                        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Hour Meter (Departure)
                                </label>
                                <input
                                    type="number"
                                    value={hourMeterAfter}
                                    onChange={e => setHourMeterAfter(e.target.value)}
                                    placeholder="00.0"
                                    style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Diesel Level (L/%)
                                </label>
                                <input
                                    type="number"
                                    value={dieselAfter}
                                    onChange={e => setDieselAfter(e.target.value)}
                                    placeholder="Liters"
                                    style={{ width: '100%', height: '40px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                Departure Photos
                            </label>

                            <div className="media-grid" style={{ marginBottom: '15px' }}>
                                {visitMedia.filter(m => m.type === 'after').map((media) => (
                                    <div key={media.id} style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                        <img src={media.file_url} alt={media.header} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', fontSize: '0.65rem' }}>
                                            {media.header}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMedia(media)}
                                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        setMediaType('after');
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingMedia}
                                    style={{
                                        height: '120px',
                                        borderRadius: '8px',
                                        border: '2px dashed var(--border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: 'var(--bg-hover)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {uploadingMedia ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{uploadingMedia ? 'Uploading...' : 'Add Photo'}</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleCompleteVisit}
                            disabled={submitting}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '8px',
                                background: '#10b981',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                            COMPLETE & LOG VISIT
                        </button>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadMedia}
                style={{ display: 'none' }}
                accept="image/*"
            />

        </Modal>
    );
}
