"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { useSites } from '@/hooks/useSites';
import { maintainService } from '@/services/maintainService';
import {
    Cpu,
    Calendar,
    Hash,
    MapPin,
    Gauge,
    Info,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2,
    History,
    ArrowLeft,
    Wrench,
    Fuel,
    Clock,
    ChevronLeft,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface AssetDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: any | null;
    onUpdate: (id: string, updates: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    submitting: boolean;
}

const ASSET_TYPES = [
    { value: 'generator', label: 'Generator', icon: '⚡' },
    { value: 'inverter', label: 'Inverter', icon: '🔌' },
    { value: 'ac_unit', label: 'AC Unit', icon: '❄️' },
    { value: 'rectifier', label: 'Rectifier', icon: '🔋' },
    { value: 'battery_bank', label: 'Battery Bank', icon: '🪫' },
    { value: 'ups', label: 'UPS', icon: '🔄' },
    { value: 'solar_panel', label: 'Solar Panel', icon: '☀️' },
    { value: 'other', label: 'Other', icon: '🔧' },
];

export default function AssetDetailsModal({
    isOpen,
    onClose,
    asset,
    onUpdate,
    onDelete,
    submitting
}: AssetDetailsModalProps) {
    const { sites } = useSites();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [formData, setFormData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (asset) {
            setFormData({
                type: asset.type,
                make_model: asset.make_model || '',
                serial_number: asset.serial_number || '',
                site_id: asset.site_id || '',
                hour_meter: asset.hour_meter || 0,
                fuel_tank_capacity: asset.fuel_tank_capacity || 0,
                status: asset.status,
                manufacturing_date: asset.manufacturing_date || '',
                installation_date: asset.installation_date || '',
                purchase_date: asset.purchase_date || '',
                warranty_expiry_date: asset.warranty_expiry_date || '',
                notes: asset.notes || ''
            });
            setIsEditing(false);
            setActiveTab('details');
            setCurrentPage(1);
            if (isOpen) loadHistory(asset.id);
        }
    }, [asset, isOpen]);

    const loadHistory = async (id: string) => {
        try {
            setLoadingHistory(true);
            const data = await maintainService.getAssetHistory(id);
            setHistory(data);
        } catch (error) {
            console.error('History load failed:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteClick = async () => {
        if (!asset) return;
        if (onDelete) {
            await onDelete(asset.id);
            onClose();
        } else {
            if (!window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;
            try {
                setDeleting(true);
                await maintainService.deleteAsset(asset.id);
                showToast('Asset deleted successfully', 'success');
                onClose();
            } catch (error: any) {
                showToast('Delete failed: ' + error.message, 'error');
            } finally {
                setDeleting(false);
            }
        }
    };

    if (!asset || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        await onUpdate(asset.id, formData);
        setIsEditing(false);
    };

    const typeInfo = ASSET_TYPES.find(t => t.value === formData.type) || ASSET_TYPES[7];

    const labelStyle: React.CSSProperties = {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '0.25rem',
        display: 'block'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: '38px',
        borderRadius: '0.4rem',
        padding: '0 0.75rem 0 2.25rem',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)',
        fontSize: '0.85rem'
    };

    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)'
    };

    const detailValueStyle: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-hover)',
        borderRadius: '0.4rem',
        color: 'var(--text-main)',
        fontSize: '0.85rem',
        minHeight: '38px',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid transparent'
    };

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.02em'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Equipment" : activeTab === 'history' ? "Asset History" : "Equipment Information"}
            maxWidth="650px"
            footer={
                isEditing ? (
                    <>
                        <div style={{ marginRight: 'auto' }}>
                            <button className="btn-cancel" style={{ color: '#ef4444', border: '1px solid #ef444430' }} onClick={handleDeleteClick} disabled={deleting || submitting}>
                                {deleting ? <Loader2 size={16} className="spinning" /> : <Trash2 size={16} />}
                            </button>
                        </div>
                        <button className="btn-cancel" onClick={() => setIsEditing(false)} disabled={submitting}>Cancel</button>
                        <button className="btn-submit" onClick={handleSave} disabled={submitting} style={{ height: '38px' }}>
                            {submitting ? <Loader2 size={16} className="spinning" /> : 'Save Changes'}
                        </button>
                    </>
                ) : (
                    <>
                        {!isEditing && activeTab === 'details' && (
                            <div style={{ marginRight: 'auto' }}>
                                <button className="btn-cancel" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }} onClick={() => setIsEditing(true)}>
                                    <Edit2 size={14} /> Edit Asset
                                </button>
                            </div>
                        )}
                        <button className="btn-submit" onClick={onClose} style={{ height: '38px' }}>Close</button>
                    </>
                )
            }
        >
            {/* Tab Switcher */}
            {!isEditing && (
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '4px', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('details')}
                        style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                            background: activeTab === 'details' ? 'var(--bg-hover)' : 'transparent',
                            color: activeTab === 'details' ? 'var(--text-main)' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                            background: activeTab === 'history' ? 'var(--bg-hover)' : 'transparent',
                            color: activeTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <History size={14} /> History
                    </button>
                </div>
            )}

            {activeTab === 'details' || isEditing ? (
                <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                    {/* Identity & Location */}
                    <span style={sectionLabelStyle}>Identity & Site</span>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label style={labelStyle}>Machine Type</label>
                            {isEditing ? (
                                <div className="input-with-icon" style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>{typeInfo.icon}</span>
                                    <select name="type" value={formData.type} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' }}>
                                        {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div style={detailValueStyle}>{typeInfo.icon} {typeInfo.label}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Make & Model</label>
                            {isEditing ? (
                                <input name="make_model" value={formData.make_model} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '1rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.make_model || '—'}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label style={labelStyle}>Serial Number</label>
                            {isEditing ? (
                                <input name="serial_number" value={formData.serial_number} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '1rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.serial_number || '—'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Deployment Site</label>
                            {isEditing ? (
                                <select name="site_id" value={formData.site_id} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '1rem', appearance: 'none' }}>
                                    <option value="">Select Site</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            ) : (
                                <div style={detailValueStyle} title={asset.site?.clusters?.name}>
                                    {asset.site?.name || '—'}
                                    {asset.site?.clusters?.state && <span style={{ marginLeft: '6px', fontSize: '0.7rem', opacity: 0.6 }}>({asset.site.clusters.state})</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational */}
                    <span style={sectionLabelStyle}>Operational Stats</span>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label style={labelStyle}>Status</label>
                            {isEditing ? (
                                <select name="status" value={formData.status} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem', appearance: 'none' }}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="decommissioned">Out</option>
                                </select>
                            ) : (
                                <div style={detailValueStyle}>
                                    <span className={`status-tag ${asset.status}`} style={{ fontSize: '9px' }}>{asset.status}</span>
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Runtime</label>
                            {isEditing ? (
                                <input type="number" name="hour_meter" value={formData.hour_meter} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.hour_meter || 0}h</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Fuel Tank</label>
                            {isEditing ? (
                                <input type="number" name="fuel_tank_capacity" value={formData.fuel_tank_capacity} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.fuel_tank_capacity || 0}L</div>
                            )}
                        </div>
                    </div>

                    {/* Lifecycle */}
                    <span style={sectionLabelStyle}>Lifecycle (Optional)</span>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label style={labelStyle}>Manufacturing</label>
                            {isEditing ? (
                                <input type="date" name="manufacturing_date" value={formData.manufacturing_date} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.manufacturing_date || '—'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Installation</label>
                            {isEditing ? (
                                <input type="date" name="installation_date" value={formData.installation_date} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.installation_date || '—'}</div>
                            )}
                        </div>
                    </div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label style={labelStyle}>Purchase Date</label>
                            {isEditing ? (
                                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={detailValueStyle}>{asset.purchase_date || '—'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={labelStyle}>Warranty Exp</label>
                            {isEditing ? (
                                <input type="date" name="warranty_expiry_date" value={formData.warranty_expiry_date} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '0.75rem' }} />
                            ) : (
                                <div style={{ ...detailValueStyle, color: asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date() ? '#ef4444' : 'inherit' }}>
                                    {asset.warranty_expiry_date || '—'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Technical Notes</label>
                        {isEditing ? (
                            <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} style={{ width: '100%', borderRadius: '0.4rem', padding: '0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                        ) : (
                            <div style={{ ...detailValueStyle, minHeight: '60px', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {asset.notes || 'No specialized notes.'}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                        {loadingHistory && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading activity logs...</div>}
                        {!loadingHistory && history.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <Clock size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p>No logged activities found for this asset.</p>
                            </div>
                        )}
                        {history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((log, idx) => (
                            <div key={idx} style={{
                                padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{
                                    padding: '8px', borderRadius: '8px',
                                    background: log.type === 'maintenance' ? 'rgba(5b, 130, 246, 0.1)' :
                                        log.details.includes('REFILL') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: log.type === 'maintenance' ? '#3b82f6' :
                                        log.details.includes('REFILL') ? '#10b981' : '#10b981',
                                    flexShrink: 0
                                }}>
                                    {log.type === 'maintenance' ? <Wrench size={16} /> : <Fuel size={16} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {log.title || log.details}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {new Date(log.time).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Info size={12} style={{ opacity: 0.6 }} /> By {log.user}
                                        </span>

                                        {log.type === 'maintenance' && (
                                            <>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
                                                <span style={{
                                                    fontSize: '9px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px',
                                                    background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 800
                                                }}>{log.status}</span>
                                            </>
                                        )}

                                        {log.details.includes('run') && (
                                            <>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    color: '#10b981', fontWeight: 700, fontSize: '0.8rem'
                                                }}>
                                                    <TrendingUp size={12} />
                                                    {log.details.match(/\(\+(\d+)h run\)/)?.[0] || 'Run log'}
                                                </span>
                                            </>
                                        )}

                                        {log.details.includes('REFILL') && (
                                            <>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    color: '#10b981', fontWeight: 700, fontSize: '0.8rem'
                                                }}>
                                                    <Fuel size={12} />
                                                    Supply Confirmation
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {history.length > ITEMS_PER_PAGE && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                            marginTop: '0.5rem', padding: '0.75rem', borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                style={{
                                    padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center'
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Page {currentPage} of {Math.ceil(history.length / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                disabled={currentPage >= Math.ceil(history.length / ITEMS_PER_PAGE)}
                                onClick={() => setCurrentPage(p => p + 1)}
                                style={{
                                    padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage >= Math.ceil(history.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer',
                                    opacity: currentPage >= Math.ceil(history.length / ITEMS_PER_PAGE) ? 0.5 : 1, display: 'flex', alignItems: 'center'
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
