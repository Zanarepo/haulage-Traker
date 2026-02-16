"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Fuel,
    Cpu,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Info
} from 'lucide-react';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

interface ConfirmSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: any; // The dispensing log being confirmed
    onConfirmed: () => void;
}

export default function ConfirmSupplyModal({
    isOpen,
    onClose,
    log,
    onConfirmed
}: ConfirmSupplyModalProps) {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && log?.site_id) {
            loadSiteAssets();
        }
    }, [isOpen, log]);

    const loadSiteAssets = async () => {
        try {
            setLoading(true);
            // We fetch assets for the specific site
            const data = await maintainService.getAssets(profile?.company_id || '', log.site_id);
            setAssets(data || []);
            if (data && data.length > 0) {
                setSelectedAssetId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load assets:', error);
            showToast('Failed to load site assets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedAssetId || !log || !profile) return;

        try {
            setSubmitting(true);
            await maintainService.confirmRefuel(
                log.id,
                selectedAssetId,
                profile.id,
                profile.company_id,
                log.site_id,
                log.quantity_dispensed
            );
            showToast('Supply confirmed and attributed to asset', 'success');
            onConfirmed();
            onClose();
        } catch (error: any) {
            console.error('Confirmation failed:', error);
            showToast('Failed to confirm supply: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!log) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Fuel Supply"
            maxWidth="500px"
            footer={
                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={submitting || !selectedAssetId || loading}
                        style={{ background: '#10b981', borderColor: '#10b981' }}
                    >
                        {submitting ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                        Confirm & Allocate
                    </button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.25rem' }}>
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ padding: '10px', borderRadius: '50%', background: 'white', color: '#10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Fuel size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity to Confirm</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{log.quantity_dispensed?.toLocaleString()} Liters</div>
                    </div>
                </div>

                <div className="info-box" style={{
                    display: 'flex', gap: '10px', padding: '0.85rem', background: 'var(--bg-hover)', borderRadius: '0.5rem', fontSize: '0.85rem'
                }}>
                    <Info size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        Supply recorded at <strong>{log.sites?.clusters?.name} • {log.sites?.name}</strong>. Please select the specific asset that was refuelled to update its operational history.
                    </p>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>Select Receiving Asset</label>
                    {loading ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                            <Loader2 size={24} className="spinning" style={{ opacity: 0.3 }} />
                        </div>
                    ) : assets.length === 0 ? (
                        <div style={{
                            padding: '1.5rem', textAlign: 'center', borderRadius: '0.5rem',
                            border: '1px dashed #ef4444', color: '#ef4444', fontSize: '0.85rem',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <AlertTriangle size={24} style={{ margin: '0 auto' }} />
                            <p style={{ margin: 0 }}>No assets found registered for this site.</p>
                            <a href="/dashboard/maintain/assets" style={{ color: '#ef4444', fontWeight: 700 }}>Register an asset first</a>
                        </div>
                    ) : (
                        <select
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                color: 'var(--text-main)', fontSize: '0.9rem'
                            }}
                        >
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.type.toUpperCase()} - {asset.make_model || 'Unknown Model'} ({asset.serial_number || 'No S/N'})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </Modal>
    );
}
