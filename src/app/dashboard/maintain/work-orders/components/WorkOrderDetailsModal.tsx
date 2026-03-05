"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    ClipboardCheck,
    Info,
    Navigation
} from 'lucide-react';
import { useKnowledgeBase, SOP } from '../../knowledge-base/hooks/useKnowledgeBase';
import SOPModal from '../../knowledge-base/components/SOPModal';
import VisitWizardModal from '../../components/VisitWizardModal';

interface WorkOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: any;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: string, extra?: any) => void;
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
    const [newItem, setNewItem] = useState({ item_name: '', quantity: '1', notes: '', master_id: '' as string | null });
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // SOP Integration State
    const { sops, categories, submitExecution } = useKnowledgeBase();
    const [showSOPChecklist, setShowSOPChecklist] = useState(false);
    const [relevantSOPs, setRelevantSOPs] = useState<SOP[]>([]); // Multiple matching SOPs
    const [activeSOP, setActiveSOP] = useState<SOP | null>(null); // Current SOP being executed
    const [executionHistory, setExecutionHistory] = useState<{ sopLogs: any[], safetyLogs: any[] }>({ sopLogs: [], safetyLogs: [] });
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Engineer Stock State
    const [engineerStock, setEngineerStock] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [type, setType] = useState('reactive');
    const [priority, setPriority] = useState('medium');
    const [siteId, setSiteId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [engineerId, setEngineerId] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [showVisitWizard, setShowVisitWizard] = useState(false);

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
            loadExecutionHistory();
            if (workOrder.engineer_id) {
                loadEngineerStock(workOrder.engineer_id);
            }
        }
    }, [workOrder, isOpen]);

    useEffect(() => {
        if (isOpen && engineerId) {
            loadEngineerStock(engineerId);
        }
    }, [engineerId, isOpen]);

    const loadEngineerStock = async (engId: string) => {
        if (!engId) {
            setEngineerStock([]);
            return;
        }
        try {
            const data = await maintainService.getEngineerStock(engId);
            setEngineerStock(data || []);
        } catch (err) {
            console.error('[loadEngineerStock]', err);
            setEngineerStock([]);
        }
    };

    // Handle Click Outside for Dropdown
    useEffect(() => {
        if (!showOptions) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showOptions]);

    const loadInventory = async () => {
        if (!workOrder?.id) return;
        try {
            const data = await maintainService.getInventoryLogs(workOrder.id);
            setInventoryItems(data || []);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    };

    const loadExecutionHistory = async () => {
        if (!workOrder?.id) return;
        try {
            setLoadingHistory(true);
            const data = await maintainService.getWorkOrderExecutionHistory(workOrder.id);
            setExecutionHistory(data);
        } catch (error) {
            console.error('Failed to load execution history:', error);
        } finally {
            setLoadingHistory(false);
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

    // Filtered Items for dropdown (only with balance > 0)
    const filteredStockItems = engineerStock.filter(item =>
        item.balance > 0 && (
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).slice(0, 10);

    const exactMatch = engineerStock.find(i => i.item_name.toLowerCase() === searchTerm.toLowerCase());

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

    const linkedAsset = workOrder?.asset_id ? assets.find((a: any) => a.id === workOrder.asset_id) : null;

    // Auto-fetch matching SOPs whenever asset selection changes
    useEffect(() => {
        const currentAssetId = isEditing ? assetId : workOrder?.asset_id;
        const asset = assets.find((a: any) => a.id === currentAssetId);

        if (asset && sops.length > 0) {
            const matches = sops.filter(s =>
                s.asset_type?.toLowerCase() === asset.type?.toLowerCase() ||
                s.category?.toLowerCase() === asset.type?.toLowerCase()
            );
            setRelevantSOPs(matches);
        } else {
            setRelevantSOPs([]);
        }
    }, [assetId, workOrder?.asset_id, sops, assets, isEditing]);

    const handleSave = () => {
        if (!title.trim() || !workOrder) return;
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
                            workOrder.status !== 'completed' && profile?.role !== 'site_engineer' && (
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

                        <div className="form-row detail-grid" style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
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
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                        {linkedAsset
                                            ? `${linkedAsset.type?.replace('_', ' ').charAt(0).toUpperCase() + linkedAsset.type?.replace('_', ' ').slice(1)} — ${linkedAsset.make_model || linkedAsset.serial_number || 'Unknown'}`
                                            : `Linked Asset #${workOrder.asset_id.slice(0, 8)}`
                                        }
                                    </p>
                                    {workOrder?.status === 'in_progress' && relevantSOPs.length > 0 && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Procedural Checklists</label>
                                            {relevantSOPs.map(sop => (
                                                <button
                                                    key={sop.id}
                                                    className="btn-maintain-action"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        color: '#10b981',
                                                        justifyContent: 'center',
                                                        padding: '8px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                    onClick={() => {
                                                        setActiveSOP(sop);
                                                        setShowSOPChecklist(true);
                                                    }}
                                                >
                                                    <ClipboardCheck size={16} />
                                                    {sop.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="detail-section">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>DESCRIPTION</label>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-main)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                                {workOrder?.description || "No description provided."}
                            </div>
                        </div>

                        {/* Visit Flow Actions for Engineers & Admins */}
                        {(profile?.role === 'site_engineer' || isAdmin) && workOrder?.status !== 'completed' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button
                                    className="btn-maintain-action"
                                    style={{
                                        width: '100%',
                                        background: workOrder?.status === 'assigned' ? '#3b82f6' : '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onClick={() => setShowVisitWizard(true)}
                                >
                                    {workOrder?.status === 'assigned' ? (
                                        <>
                                            <Navigation size={18} />
                                            START SITE VISIT
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardCheck size={18} />
                                            CONTINUE / COMPLETE VISIT
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />



                        {/* Inventory Log Section */}
                        <div className="detail-section" style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <ClipboardList size={14} /> INVENTORY USED
                                <span style={{ fontSize: '0.65rem', fontWeight: 400, marginLeft: 'auto', opacity: 0.7 }}>
                                    (Deducted from your Stock Wallet)
                                </span>
                            </label>

                            {/* Inventory List */}
                            {inventoryItems.length > 0 ? (
                                <div style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden', background: 'var(--bg-hover)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 12px' }}>Item</th>
                                                <th style={{ padding: '10px 12px', width: '60px' }}>Qty</th>
                                                <th style={{ padding: '10px 12px' }}>Notes</th>
                                                {workOrder.status !== 'completed' && <th style={{ padding: '10px 12px', width: '40px' }}></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryItems.map(item => (
                                                <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.item_name}</td>
                                                    <td style={{ padding: '10px 12px' }}>{item.quantity}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.notes}</td>
                                                    {workOrder.status !== 'completed' && (
                                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                            <button onClick={async () => {
                                                                if (window.confirm('Remove this log?')) {
                                                                    await maintainService.deleteInventoryLog(item.id);
                                                                    loadInventory();
                                                                }
                                                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: '0.75rem', border: '1px dashed var(--border-color)', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    No hardware or supplies recorded for this work order.
                                </div>
                            )}

                            {workOrder.status !== 'completed' && (
                                <div className="form-row inventory-log-row" style={{ alignItems: 'end', position: 'relative' }}>
                                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block', color: 'var(--text-muted)' }}>Search My Stock</label>
                                        <input
                                            type="text"
                                            placeholder="Find part..."
                                            value={searchTerm}
                                            onChange={e => {
                                                setSearchTerm(e.target.value);
                                                setShowOptions(true);
                                                setNewItem(prev => ({ ...prev, item_name: e.target.value }));
                                            }}
                                            onFocus={() => setShowOptions(true)}
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                        />
                                        {showOptions && (searchTerm || filteredStockItems.length > 0) && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                left: 0,
                                                right: 0,
                                                zIndex: 100,
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                marginBottom: '4px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                boxShadow: '0 -4px 15px -3px rgba(0, 0, 0, 0.3)'
                                            }}>
                                                {filteredStockItems.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => {
                                                            setSearchTerm(item.item_name);
                                                            setNewItem({
                                                                ...newItem,
                                                                item_name: item.item_name,
                                                                master_id: item.master_id || item.master?.id || null
                                                            });
                                                            setShowOptions(false);
                                                        }}
                                                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.item_category}</span>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>{item.balance} {item.unit}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {searchTerm && filteredStockItems.length === 0 && (
                                                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        No stock matching "{searchTerm}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block', color: 'var(--text-muted)' }}>Qty</label>
                                        <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'block', color: 'var(--text-muted)' }}>Notes</label>
                                        <input type="text" placeholder="Serial/Notes..." value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                                    </div>
                                    <button
                                        className="btn-maintain-action"
                                        style={{ padding: '8px 16px' }}
                                        disabled={!newItem.item_name}
                                        onClick={async () => {
                                            if (!profile || !newItem.item_name) return;
                                            try {
                                                await maintainService.saveInventoryLog(profile.company_id!, workOrder.id, profile.id, [{
                                                    item_name: newItem.item_name,
                                                    quantity: parseFloat(newItem.quantity),
                                                    notes: newItem.notes,
                                                    master_id: newItem.master_id
                                                }]);
                                                setNewItem({ item_name: '', quantity: '1', notes: '', master_id: null });
                                                setSearchTerm('');
                                                loadInventory();
                                            } catch (e: any) {
                                                alert('Failed to log item: ' + e.message);
                                            }
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Compliance Audit Trail Section */}
                        <div className="detail-section" style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <ClipboardCheck size={14} /> COMPLIANCE AUDIT TRAIL
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Safety Logs */}
                                {executionHistory.safetyLogs.map(log => (
                                    <div key={log.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        background: 'var(--bg-hover)',
                                        borderRadius: '8px',
                                        border: `1px solid ${log.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: log.passed ? '#10b98120' : '#ef444420',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: log.passed ? '#10b981' : '#ef4444'
                                            }}>
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Safety Sign-off</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {log.userName} • {new Date(log.created_at).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: log.passed ? '#10b981' : '#ef4444',
                                            textTransform: 'uppercase'
                                        }}>
                                            {log.passed ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>
                                ))}

                                {/* SOP Logs */}
                                {executionHistory.sopLogs.map(log => (
                                    <div key={log.id}
                                        onClick={() => {
                                            const sop = sops.find(s => s.id === log.sop_id);
                                            if (sop) {
                                                setActiveSOP(sop);
                                                setShowSOPChecklist(true);
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'var(--bg-hover)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#3b82f6'
                                            }}>
                                                <ClipboardCheck size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{log.maintain_asset_sops?.title || 'SOP Check'}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {log.users?.full_name} • {new Date(log.submitted_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>COMPLETED</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Click to View</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pending / Unmet SOPs */}
                                {relevantSOPs.filter(sop => !executionHistory.sopLogs.some(log => log.sop_id === sop.id)).map(sop => (
                                    <div key={`pending-${sop.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'rgba(245, 158, 11, 0.03)',
                                            borderRadius: '8px',
                                            border: '1px dashed rgba(245, 158, 11, 0.3)',
                                            opacity: 0.8
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#f59e0b'
                                            }}>
                                                <ClipboardList size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{sop.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requirement not yet fulfilled</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>PENDING</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Checklist Missing</div>
                                        </div>
                                    </div>
                                ))}

                                {executionHistory.safetyLogs.length === 0 && executionHistory.sopLogs.length === 0 && relevantSOPs.length === 0 && !loadingHistory && (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: '0.75rem', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        No compliance logs found for this work order.
                                    </div>
                                )}
                                {loadingHistory && <div style={{ textAlign: 'center', padding: '1rem' }}><Loader2 size={20} className="spinning" /></div>}
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="detail-section">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <Camera size={14} /> MAINTENANCE PHOTOS (BEFORE/AFTER)
                            </label>

                            <div className="media-grid" style={{ gap: '1rem', marginTop: '0.5rem' }}>
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

                        {/* Diesel & Hour Meter Reading Section - Moved to Base with Premium Styling */}
                        {workOrder.status !== 'completed' && (
                            <div className="detail-section" style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                    <Fuel size={16} style={{ color: '#3b82f6' }} /> FINAL LOG ENTRY & SUBMISSION
                                </label>
                                <div className="form-row three-col" style={{ marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Diesel Level (L)</label>
                                        <input
                                            type="number"
                                            className="maintenance-input"
                                            placeholder="Liters..."
                                            value={workOrder.status === 'in_progress' ? dieselAfter : dieselBefore}
                                            onChange={(e) => workOrder.status === 'in_progress' ? setDieselAfter(e.target.value) : setDieselBefore(e.target.value)}
                                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Hour Meter (h)</label>
                                        <input
                                            type="number"
                                            className="maintenance-input"
                                            placeholder="Hours..."
                                            value={hourMeter}
                                            onChange={(e) => setHourMeter(e.target.value)}
                                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Confirm Asset</label>
                                        <select
                                            className="maintenance-input"
                                            value={assetId}
                                            onChange={(e) => setAssetId(e.target.value)}
                                            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        >
                                            <option value="">Select Asset</option>
                                            {filteredAssets.map((a: any) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.type?.replace('_', ' ').charAt(0).toUpperCase() + a.type?.replace('_', ' ').slice(1)} — {a.make_model || a.serial_number || 'Unknown'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    className="btn-submit"
                                    style={{ width: '100%', height: '44px', fontSize: '0.9rem', fontWeight: 700, gap: '8px' }}
                                    onClick={async () => {
                                        if (!profile) return;

                                        const dieselLevel = workOrder.status === 'in_progress' ? dieselAfter : dieselBefore;
                                        if (!dieselLevel || isNaN(parseFloat(dieselLevel))) {
                                            alert('Please enter a valid Diesel Level reading.');
                                            return;
                                        }

                                        try {
                                            await maintainService.saveDieselReading({
                                                site_id: siteId,
                                                work_order_id: workOrder.id,
                                                asset_id: assetId || undefined,
                                                company_id: profile.company_id!,
                                                level: parseFloat(dieselLevel),
                                                hour_meter: hourMeter ? parseFloat(hourMeter) : undefined,
                                                reading_type: workOrder.status === 'in_progress' ? 'after' : 'before',
                                                recorded_by: profile.id
                                            });
                                            alert('Visit log entry saved successfully.');
                                            setHourMeter('');
                                            onClose(); // Auto-close on successful log
                                        } catch (e: any) {
                                            alert('Failed to save log: ' + e.message);
                                        }
                                    }}
                                >
                                    <CheckCircle size={18} /> Submit Visit Log & Close
                                </button>
                            </div>
                        )}
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
                        <div className="form-row">
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
                        <div className="form-row">
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
                        <div className="form-row">
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
                                            {a.type?.replace('_', ' ').charAt(0).toUpperCase() + a.type?.replace('_', ' ').slice(1)} — {a.make_model || a.serial_number || 'Unknown'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Relevant SOPs Info (Edit Mode) */}
                        {relevantSOPs.length > 0 && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Info size={16} style={{ color: '#3b82f6' }} />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
                                    <strong>{relevantSOPs.length} SOP(s) matched</strong> for this asset type ({relevantSOPs.map(s => s.title).join(', ')}). These will be available for the engineer to follow.
                                </div>
                            </div>
                        )}

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
                )
                }
            </div >

            {/* SOP Checklist Interaction */}
            {activeSOP && (
                <SOPModal
                    isOpen={showSOPChecklist}
                    onClose={() => {
                        setShowSOPChecklist(false);
                        setActiveSOP(null);
                    }}
                    sop={activeSOP}
                    categories={categories}
                    userRole={profile?.role}
                    workOrderId={workOrder.id}
                    onSave={async (data) => {
                        try {
                            await submitExecution(activeSOP.id, data.steps_json, workOrder.id);
                            setShowSOPChecklist(false);
                            setActiveSOP(null);
                            loadExecutionHistory(); // Refresh history
                        } catch (err) {
                            console.error('Failed to submit SOP execution:', err);
                        }
                    }}
                />
            )}

            {showVisitWizard && (
                <VisitWizardModal
                    isOpen={showVisitWizard}
                    onClose={() => setShowVisitWizard(false)}
                    workOrder={workOrder}
                    engineerId={profile?.id || ''}
                    onComplete={() => {
                        // If it's the first time starting, move to in_progress
                        if (workOrder?.status === 'assigned') {
                            onUpdateStatus(workOrder.id, 'in_progress');
                        }
                        // If it's finishing, it should realistically mark WO as completed
                        // but we leave that to the service or user choice?
                        // Actually, the user said "engineer can just proceed with the work order and thedeailswouldbe captured in the site visit reports"
                        // I'll mark as completed if they finished step 3
                        if (workOrder?.status === 'in_progress') {
                            onUpdateStatus(workOrder.id, 'completed');
                        }
                        setShowVisitWizard(false);
                        onUpdate(workOrder.id, {}); // Trigger refresh
                    }}
                />
            )}
        </Modal >
    );
}
