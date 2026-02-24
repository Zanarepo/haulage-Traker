"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { useSites } from '@/hooks/useSites';
import { useClusters, NIGERIAN_STATES } from '@/hooks/useClusters';
import { Cpu, Calendar, Hash, MapPin, Gauge, Loader2, Globe, Map } from 'lucide-react';

interface NewAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
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

export default function NewAssetModal({
    isOpen,
    onClose,
    onSubmit,
    submitting
}: NewAssetModalProps) {
    const { sites } = useSites();
    const { clusters } = useClusters();
    const [selectedState, setSelectedState] = useState('');
    const [selectedClusterId, setSelectedClusterId] = useState('');
    const [filteredClusters, setFilteredClusters] = useState<any[]>([]);
    const [filteredSites, setFilteredSites] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        type: 'generator',
        make_model: '',
        serial_number: '',
        cluster_id: '',
        site_id: '',
        hour_meter: 0,
        fuel_tank_capacity: 0,
        manufacturing_date: '',
        installation_date: '',
        purchase_date: '',
        warranty_expiry_date: '',
        pm_interval_hours: 250,
        last_pm_hours: 0,
        last_pm_date: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'generator',
                make_model: '',
                serial_number: '',
                cluster_id: '',
                site_id: '',
                hour_meter: 0,
                fuel_tank_capacity: 0,
                manufacturing_date: '',
                installation_date: '',
                purchase_date: '',
                warranty_expiry_date: '',
                pm_interval_hours: 250,
                last_pm_hours: 0,
                last_pm_date: '',
                notes: ''
            });

            setSelectedState('');
            setSelectedClusterId('');
            setFilteredClusters([]);
            setFilteredSites([]);
        }
    }, [isOpen]);

    // Filter Clusters by State
    useEffect(() => {
        if (selectedState) {
            const filtered = clusters.filter(c => c.state === selectedState);
            setFilteredClusters(filtered);
            // Auto-select if only one cluster in state
            if (filtered.length === 1) {
                setSelectedClusterId(filtered[0].id);
            } else if (!filtered.some(c => c.id === selectedClusterId)) {
                setSelectedClusterId('');
            }
        } else {
            setFilteredClusters(clusters);
        }
    }, [selectedState, clusters]);

    // Handle Cluster Selection & Site Filtering
    useEffect(() => {
        if (selectedClusterId) {
            const result = sites.filter(s => s.cluster_id === selectedClusterId);
            setFilteredSites(result);
            // Reset site if not in new cluster
            setFormData(prev => ({
                ...prev,
                cluster_id: selectedClusterId,
                site_id: result.some(s => s.id === prev.site_id) ? prev.site_id : ''
            }));
        } else {
            setFilteredSites([]);
            setFormData(prev => ({ ...prev, cluster_id: '', site_id: '' }));
        }
    }, [selectedClusterId, sites]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

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
            title="Register New Asset"
            maxWidth="580px"
            footer={
                <>
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="btn-submit"
                        disabled={submitting || !formData.make_model || !formData.site_id}
                        onClick={handleSubmit}
                        style={{ height: '38px', padding: '0 1.25rem' }}
                    >
                        {submitting ? <Loader2 size={16} className="spinning" /> : 'Register Asset'}
                    </button>
                </>
            }
        >
            <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onSubmit={handleSubmit}>

                {/* Equipment Identity */}
                <span style={sectionLabelStyle}>Equipment Identity</span>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Machine Type</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, fontSize: '0.9rem' }}>
                                {ASSET_TYPES.find(t => t.value === formData.type)?.icon}
                            </span>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                style={{ ...inputStyle, appearance: 'none' }}
                                required
                            >
                                {ASSET_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Make & Model</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Cpu size={14} style={iconStyle} />
                            <input
                                name="make_model"
                                type="text"
                                placeholder="Model ID"
                                value={formData.make_model}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label style={labelStyle}>Serial Number</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <Hash size={14} style={iconStyle} />
                        <input
                            name="serial_number"
                            type="text"
                            placeholder="Unique ID"
                            value={formData.serial_number}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Deployment & Metrics */}
                <span style={sectionLabelStyle}>Deployment & Metrics</span>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>State/Region</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Map size={14} style={iconStyle} />
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                style={{ ...inputStyle, appearance: 'none' }}
                                required
                            >
                                <option value="">State...</option>
                                {NIGERIAN_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Cluster</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Globe size={14} style={iconStyle} />
                            <select
                                name="cluster_id"
                                value={selectedClusterId}
                                onChange={(e) => setSelectedClusterId(e.target.value)}
                                style={{ ...inputStyle, appearance: 'none' }}
                                disabled={!selectedState}
                                required
                            >
                                <option value="">{selectedState ? 'Cluster...' : 'Select State'}</option>
                                {filteredClusters.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Assign to Site</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <MapPin size={14} style={iconStyle} />
                            <select
                                name="site_id"
                                value={formData.site_id}
                                onChange={handleChange}
                                style={{ ...inputStyle, appearance: 'none' }}
                                disabled={!selectedClusterId}
                                required
                            >
                                <option value="">{selectedClusterId ? 'Select Site' : 'Select Cluster'}</option>
                                {filteredSites.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.site_id_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Hour Meter</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Gauge size={14} style={iconStyle} />
                            <input
                                name="hour_meter"
                                type="number"
                                placeholder="0"
                                value={formData.hour_meter}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Fuel Capacity (L)</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Gauge size={14} style={iconStyle} />
                            <input
                                name="fuel_tank_capacity"
                                type="number"
                                placeholder="0"
                                value={formData.fuel_tank_capacity}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Lifecycle & Warranty */}
                <span style={sectionLabelStyle}>Lifecycle & Warranty (Optional)</span>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Mfg Date</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Calendar size={14} style={iconStyle} />
                            <input
                                name="manufacturing_date"
                                type="date"
                                value={formData.manufacturing_date}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Install Date</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Calendar size={14} style={iconStyle} />
                            <input
                                name="installation_date"
                                type="date"
                                value={formData.installation_date}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Purchase</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Calendar size={14} style={iconStyle} />
                            <input
                                name="purchase_date"
                                type="date"
                                value={formData.purchase_date}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Exp Date</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Calendar size={14} style={iconStyle} />
                            <input
                                name="warranty_expiry_date"
                                type="date"
                                value={formData.warranty_expiry_date}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Maintenance Tracking */}
                <span style={sectionLabelStyle}>Maintenance Schedule</span>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Svc Interval (hrs)</label>
                        <input
                            name="pm_interval_hours"
                            type="number"
                            value={formData.pm_interval_hours}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Last Svc (hrs)</label>
                        <input
                            name="last_pm_hours"
                            type="number"
                            value={formData.last_pm_hours}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Last Svc Date</label>
                        <input
                            name="last_pm_date"
                            type="date"
                            value={formData.last_pm_date}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        name="notes"
                        rows={2}
                        placeholder="Remarks..."
                        value={formData.notes}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            borderRadius: '0.4rem',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>
            </form>
        </Modal>
    );
}
