"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { useSites } from '@/hooks/useSites';
import { useUsers } from '@/hooks/useUsers';
import { useAssets } from '@/hooks/useAssets';
import {
    Loader2,
    ClipboardList,
    MapPin,
    User,
    Wrench,
    AlertTriangle,
    Calendar,
} from 'lucide-react';

interface NewWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    submitting: boolean;
}

const WO_TYPES = [
    { value: 'reactive', label: 'Reactive (Breakdown)' },
    { value: 'preventive', label: 'Preventive (Scheduled)' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'inspection', label: 'Inspection' },
];

const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

export default function NewWorkOrderModal({
    isOpen,
    onClose,
    onSubmit,
    submitting
}: NewWorkOrderModalProps) {
    const { sites } = useSites();
    const { users } = useUsers();
    const { assets } = useAssets();

    const [title, setTitle] = useState('');
    const [type, setType] = useState('reactive');
    const [priority, setPriority] = useState('medium');
    const [siteId, setSiteId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [engineerId, setEngineerId] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    const engineers = (users || []).filter((u: any) =>
        u.role === 'site_engineer' && (u.is_active !== false)
    );

    // Smart Filtering: Engineer -> Clusters -> Sites -> Assets
    const filteredSites = engineerId
        ? (sites || []).filter((s: any) => {
            const engineer = users.find((u: any) => u.id === engineerId);
            return engineer?.cluster_ids?.includes(s.cluster_id);
        })
        : (sites || []);

    const filteredAssets = siteId
        ? (assets || []).filter((a: any) => a.site_id === siteId)
        : (assets || []);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setType('reactive');
            setPriority('medium');
            setSiteId('');
            setAssetId('');
            setEngineerId('');
            setDescription('');
            setScheduledDate('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            type,
            priority,
            site_id: siteId || null,
            asset_id: assetId || null,
            engineer_id: engineerId || null,
            description: description.trim() || null,
            scheduled_date: scheduledDate || null,
            status: engineerId ? 'assigned' : 'open',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Work Order"
            maxWidth="650px"
            footer={
                <>
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="btn-submit"
                        disabled={submitting || !title.trim()}
                        onClick={handleSubmit}
                    >
                        {submitting ? <Loader2 size={16} className="spinning" /> : 'Create Work Order'}
                    </button>
                </>
            }
        >
            <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Title */}
                <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                        Work Order Title
                    </label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <ClipboardList size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Generator not starting at site XYZ"
                            style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            required
                        />
                    </div>
                </div>

                {/* Type + Priority */}
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Type
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Wrench size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            >
                                {WO_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Priority
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <AlertTriangle size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Site + Asset */}
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Site
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={siteId}
                                onChange={e => { setSiteId(e.target.value); setAssetId(''); }}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            >
                                <option value="">Select Site</option>
                                {filteredSites.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.site_id_code}) {s.clusters?.name ? `— ${s.clusters.name} Cluster` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Asset {siteId ? `(${filteredAssets.length} at site)` : ''}
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Wrench size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={assetId}
                                onChange={e => setAssetId(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            >
                                <option value="">Select Asset (optional)</option>
                                {filteredAssets.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                        {a.type?.replace('_', ' ')} — {a.make_model || a.serial_number || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Assign Engineer + Scheduled Date */}
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Assign Engineer
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                value={engineerId}
                                onChange={e => setEngineerId(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', appearance: 'none' }}
                            >
                                <option value="">Unassigned</option>
                                {engineers.map((eng: any) => (
                                    <option key={eng.id} value={eng.id}>
                                        {eng.full_name} {eng.cluster_ids && eng.cluster_ids.length > 0 ? `(${eng.cluster_ids.length} Clusters)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                            Scheduled Date
                        </label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={e => setScheduledDate(e.target.value)}
                                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe the issue or maintenance task…"
                        rows={3}
                        style={{ width: '100%', borderRadius: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
                    />
                </div>
            </form>
        </Modal>
    );
}
