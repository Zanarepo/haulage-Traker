"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import { useSites } from '@/hooks/useSites';
import { useUsers } from '@/hooks/useUsers';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/hooks/useAuth';
import {
    Loader2,
    ClipboardList,
    MapPin,
    User,
    Wrench,
    AlertTriangle,
    Calendar,
    Edit3,
    Trash2,
    CheckCircle,
    Camera,
    Fuel,
    Plus,
} from 'lucide-react';

interface WorkOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: any;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: string) => void;
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

const STATUS_COLORS: Record<string, string> = {
    open: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#f59e0b',
    completed: '#10b981',
    cancelled: '#6b7280',
    on_hold: '#ef4444',
};

export default function WorkOrderDetailsModal({
    isOpen,
    onClose,
    workOrder,
    onUpdate,
    onDelete,
    onUpdateStatus,
    submitting
}: WorkOrderDetailsModalProps) {
    const { profile } = useAuth();
    const { sites } = useSites();
    const { users } = useUsers();
    const { assets } = useAssets();

    const [isEditing, setIsEditing] = useState(false);

    // Media & Readings State
    const [media, setMedia] = useState<any[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [dieselBefore, setDieselBefore] = useState('');
    const [dieselAfter, setDieselAfter] = useState('');
    const [hourMeter, setHourMeter] = useState(''); // New Hour Meter state
    const [inventoryItems, setInventoryItems] = useState<any[]>([]); // To display logs
    const [newItem, setNewItem] = useState({ item_name: '', quantity: '1', notes: '' });
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [type, setType] = useState('reactive');
    const [priority, setPriority] = useState('medium');
    const [siteId, setSiteId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [engineerId, setEngineerId] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    const isAdmin = ['superadmin', 'admin', 'md'].includes(profile?.role || '');

    const loadMedia = async () => {
        if (!workOrder?.id) return;
        try {
            setLoadingMedia(true);
            const data = await maintainService.getWorkOrderMedia(workOrder.id);
            setMedia(data || []);
        } catch (error) {
            console.error('Failed to load media:', error);
        } finally {
            setLoadingMedia(false);
        }
    };

    useEffect(() => {
        if (workOrder && isOpen) {
            setTitle(workOrder.title || '');
            setType(workOrder.type || 'reactive');
            setPriority(workOrder.priority || 'medium');
            setSiteId(workOrder.site_id || '');
            setAssetId(workOrder.asset_id || '');
            setEngineerId(workOrder.engineer_id || '');
            setDescription(workOrder.description || '');
            setScheduledDate(workOrder.scheduled_date ? workOrder.scheduled_date.split('T')[0] : '');
            setIsEditing(false);
            loadMedia();
            loadInventory();
        }
    }, [workOrder, isOpen]);

    const loadInventory = async () => {
        if (!workOrder?.id) return;
        try {
            const data = await maintainService.getInventoryLogs(workOrder.id);
            setInventoryItems(data || []);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    };

    const handleUploadMedia = async (file: File, type: 'before' | 'after', header: string) => {
        if (!profile || !workOrder) return;
        try {
            setUploadingMedia(true);
            await maintainService.uploadWorkOrderMedia(
                file,
                workOrder.id,
                profile.company_id!,
                profile.id,
                type,
                header
            );
            await loadMedia();
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert('Failed to upload image: ' + error.message);
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleDeleteMedia = async (mediaId: string, url: string) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await maintainService.deleteWorkOrderMedia(mediaId, url);
            await loadMedia();
        } catch (error: any) {
            alert('Delete failed: ' + error.message);
        }
    };

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

    const handleSave = () => {
        if (!title.trim()) return;
        onUpdate(workOrder.id, {
            title: title.trim(),
            type,
            priority,
            site_id: siteId || null,
            asset_id: assetId || null,
            engineer_id: engineerId || null,
            description: description.trim() || null,
            scheduled_date: scheduledDate || null,
            status: engineerId && workOrder.status === 'open' ? 'assigned' : workOrder.status,
        });
    };

    if (!workOrder) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Work Order" : "Work Order Details"}
            maxWidth="650px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        {isAdmin && !isEditing && (
                            <button className="btn-maintain-action" style={{ background: '#ef444420', color: '#ef4444', border: 'none' }} onClick={() => onDelete(workOrder.id)}>
                                <Trash2 size={16} /> Delete
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-cancel" onClick={isEditing ? () => setIsEditing(false) : onClose}>
                            {isEditing ? 'Cancel' : 'Close'}
                        </button>
                        {!isEditing ? (
                            workOrder.status !== 'completed' && (
                                <button className="btn-submit" onClick={() => setIsEditing(true)}>
                                    <Edit3 size={16} /> Edit Work Order
                                </button>
                            )
                        ) : (
                            <button className="btn-submit" onClick={handleSave} disabled={submitting || !title.trim()}>
                                {submitting ? <Loader2 size={16} className="spinning" /> : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="modal-content-inner" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {!isEditing ? (
                    // VIEW MODE
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{workOrder.title}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ticket ID: #{workOrder.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <span
                                className="status-tag"
                                style={{ background: `${STATUS_COLORS[workOrder.status]}20`, color: STATUS_COLORS[workOrder.status], padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                {workOrder.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                            <div className="detail-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                    <Wrench size={14} /> TYPE
                                </label>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{workOrder.type.charAt(0).toUpperCase() + workOrder.type.slice(1)}</p>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                    <AlertTriangle size={14} /> PRIORITY
                                </label>
                                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: workOrder.priority === 'critical' ? '#ef4444' : workOrder.priority === 'high' ? '#f59e0b' : 'var(--text-main)' }}>
                                    {workOrder.priority.toUpperCase()}
                                </p>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                    <MapPin size={14} /> SITE
                                </label>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                    {workOrder.site?.name || '—'} {workOrder.site?.site_id_code ? `(${workOrder.site.site_id_code})` : ''}
                                    {workOrder.site?.clusters?.name && (
                                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {workOrder.site.clusters.name} Cluster
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                    <User size={14} /> ASSIGNED TO
                                </label>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                    {workOrder.engineer?.full_name || 'Unassigned'}
                                    {workOrder.engineer?.cluster_names && workOrder.engineer.cluster_names.length > 0 && (
                                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Managing: {workOrder.engineer.cluster_names.join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                    <Calendar size={14} /> SCHEDULED DATE
                                </label>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{workOrder.scheduled_date ? new Date(workOrder.scheduled_date).toLocaleDateString() : 'Not scheduled'}</p>
                            </div>
                            {workOrder.asset_id && (
                                <div className="detail-item">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                        <Wrench size={14} /> ASSET
                                    </label>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Linked Asset #{workOrder.asset_id.slice(0, 8)}</p>
                                </div>
                            )}
                        </div>

                        <div className="detail-section">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>DESCRIPTION</label>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-main)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                                {workOrder.description || "No description provided."}
                            </div>
                        </div>

                        {/* Quick Status Actions for Engineers */}
                        {profile?.role === 'site_engineer' && workOrder.status !== 'completed' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                                {workOrder.status === 'assigned' && (
                                    <button
                                        className="btn-submit"
                                        style={{ background: '#f59e0b', width: '100%' }}
                                        onClick={() => onUpdateStatus(workOrder.id, 'in_progress')}
                                    >
                                        Start Work
                                    </button>
                                )}
                                {workOrder.status === 'in_progress' && (
                                    <button
                                        className="btn-submit"
                                        style={{ background: '#10b981', width: '100%' }}
                                        onClick={() => onUpdateStatus(workOrder.id, 'completed')}
                                    >
                                        <CheckCircle size={18} /> Mark as Completed
                                    </button>
                                )}
                            </div>
                        )}

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

                        {/* Diesel & Hour Meter Reading Section */}
                        {workOrder.status !== 'completed' && (
                            <div className="detail-section">
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                    <Fuel size={14} /> DIESEL LEVEL & HOUR METER (LOG ENTRY)
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'var(--bg-hover)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Diesel Level (Liters)</label>
                                        <input
                                            type="number"
                                            className="maintenance-input"
                                            placeholder="Liters..."
                                            value={workOrder.status === 'in_progress' ? dieselAfter : dieselBefore}
                                            onChange={(e) => workOrder.status === 'in_progress' ? setDieselAfter(e.target.value) : setDieselBefore(e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hour Meter</label>
                                        <input
                                            type="number"
                                            className="maintenance-input"
                                            placeholder="Generator hours..."
                                            value={hourMeter}
                                            onChange={(e) => setHourMeter(e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Asset ID (Optional)</label>
                                        <select
                                            className="maintenance-input"
                                            value={assetId}
                                            onChange={(e) => setAssetId(e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                        >
                                            <option value="">Select Asset</option>
                                            {filteredAssets.map((a: any) => (
                                                <option key={a.id} value={a.id}>{a.site_id_code || a.id.slice(0, 8)} ({a.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    className="btn-maintain-action"
                                    style={{ marginTop: '10px', width: '100%', fontSize: '0.85rem' }}
                                    onClick={async () => {
                                        if (!profile) return;
                                        try {
                                            await maintainService.saveDieselReading({
                                                site_id: siteId,
                                                work_order_id: workOrder.id,
                                                asset_id: assetId || undefined,
                                                company_id: profile.company_id!,
                                                level: parseFloat(workOrder.status === 'in_progress' ? dieselAfter : dieselBefore),
                                                hour_meter: hourMeter ? parseFloat(hourMeter) : undefined,
                                                reading_type: workOrder.status === 'in_progress' ? 'after' : 'before',
                                                recorded_by: profile.id
                                            });
                                            alert('Log entry saved to historical record.');
                                            setHourMeter('');
                                        } catch (e: any) {
                                            alert('Failed to save log: ' + e.message);
                                        }
                                    }}
                                >
                                    <CheckCircle size={14} /> Save Log Entry
                                </button>
                            </div>
                        )}

                        {/* Inventory Log Section */}
                        <div className="detail-section" style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <ClipboardList size={14} /> INVENTORY USED
                            </label>

                            {/* Inventory List */}
                            {inventoryItems.length > 0 && (
                                <div style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                                <th style={{ padding: '8px' }}>Item</th>
                                                <th style={{ padding: '8px' }}>Qty</th>
                                                <th style={{ padding: '8px' }}>Notes</th>
                                                {workOrder.status !== 'completed' && <th style={{ padding: '8px' }}></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryItems.map(item => (
                                                <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                                                    <td style={{ padding: '8px' }}>{item.item_name}</td>
                                                    <td style={{ padding: '8px' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{item.notes}</td>
                                                    {workOrder.status !== 'completed' && (
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                                            <button onClick={async () => {
                                                                if (window.confirm('Remove this log?')) {
                                                                    await maintainService.deleteInventoryLog(item.id);
                                                                    loadInventory();
                                                                }
                                                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {workOrder.status !== 'completed' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '8px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block' }}>Item Name</label>
                                        <input type="text" placeholder="Filter, Oil..." value={newItem.item_name} onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block' }}>Qty</label>
                                        <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block' }}>Notes</label>
                                        <input type="text" placeholder="Serial num..." value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                                    </div>
                                    <button
                                        className="btn-maintain-action"
                                        style={{ padding: '6px 12px' }}
                                        disabled={!newItem.item_name}
                                        onClick={async () => {
                                            if (!profile || !newItem.item_name) return;
                                            try {
                                                await maintainService.saveInventoryLog(profile.company_id!, workOrder.id, profile.id, [{
                                                    item_name: newItem.item_name,
                                                    quantity: parseFloat(newItem.quantity),
                                                    notes: newItem.notes
                                                }]);
                                                setNewItem({ item_name: '', quantity: '1', notes: '' });
                                                loadInventory();
                                            } catch (e: any) {
                                                alert('Failed to log item: ' + e.message);
                                            }
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Media Section */}
                        <div className="detail-section">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <Camera size={14} /> MAINTENANCE PHOTOS (BEFORE/AFTER)
                            </label>

                            <div className="media-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                {/* Before Photos */}
                                <div className="media-group">
                                    <h4 style={{ fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-main)' }}>Before Photos</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {media.filter(m => m.type === 'before').map(m => (
                                            <div key={m.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={m.file_url} alt={m.header} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', color: 'white' }}>{m.header}</div>
                                                {((profile?.role === 'superadmin') || (profile?.role === 'site_engineer' && workOrder.status !== 'completed')) && (
                                                    <button
                                                        onClick={() => handleDeleteMedia(m.id, m.file_url)}
                                                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'red', border: 'none', borderRadius: '4px', color: 'white', padding: '2px 4px', fontSize: '0.6rem' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {workOrder.status !== 'completed' && (
                                            <label className="upload-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', height: '60px', cursor: 'pointer' }}>
                                                <Plus size={20} />
                                                <input
                                                    type="file"
                                                    hidden
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const header = prompt('Enter a caption for this BEFORE photo:');
                                                            if (header !== null) await handleUploadMedia(file, 'before', header);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* After Photos */}
                                <div className="media-group">
                                    <h4 style={{ fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-main)' }}>After Photos</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {media.filter(m => m.type === 'after').map(m => (
                                            <div key={m.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={m.file_url} alt={m.header} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', color: 'white' }}>{m.header}</div>
                                                {((profile?.role === 'superadmin') || (profile?.role === 'site_engineer' && workOrder.status !== 'completed')) && (
                                                    <button
                                                        onClick={() => handleDeleteMedia(m.id, m.file_url)}
                                                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'red', border: 'none', borderRadius: '4px', color: 'white', padding: '2px 4px', fontSize: '0.6rem' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {workOrder.status !== 'completed' && (
                                            <label className="upload-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', height: '60px', cursor: 'pointer' }}>
                                                <Plus size={20} />
                                                <input
                                                    type="file"
                                                    hidden
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const header = prompt('Enter a caption for this AFTER photo:');
                                                            if (header !== null) await handleUploadMedia(file, 'after', header);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // EDIT MODE
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
                                    placeholder="e.g. Generator not starting"
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem 0 2.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Type + Priority */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                >
                                    {WO_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Priority
                                </label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                >
                                    {PRIORITIES.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assign Engineer + Scheduled Date */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Assign Engineer
                                </label>
                                <select
                                    value={engineerId}
                                    onChange={e => { setEngineerId(e.target.value); setSiteId(''); setAssetId(''); }}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', pointerEvents: isAdmin ? 'auto' : 'none', opacity: isAdmin ? 1 : 0.7 }}
                                >
                                    <option value="">Unassigned</option>
                                    {engineers.map((eng: any) => (
                                        <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Scheduled Date
                                </label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        {/* Site + Asset */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Site
                                </label>
                                <select
                                    value={siteId}
                                    onChange={e => { setSiteId(e.target.value); setAssetId(''); }}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Select Site</option>
                                    {filteredSites.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.site_id_code}) {s.clusters?.name ? `— ${s.clusters.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                    Asset
                                </label>
                                <select
                                    value={assetId}
                                    onChange={e => setAssetId(e.target.value)}
                                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
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

                        {/* Description */}
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the issue…"
                                rows={3}
                                style={{ width: '100%', borderRadius: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', resize: 'vertical' }}
                            />
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
