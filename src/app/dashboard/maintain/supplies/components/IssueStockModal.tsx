"use client";

import React from 'react';
import { MapPin, Layers, Users, Plus, Trash2, FileText, Save, Package } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { useIssueStock } from '../hooks/useIssueStock';

interface IssueStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    onSuccess: () => void;
}

export default function IssueStockModal({ isOpen, onClose, companyId, onSuccess }: IssueStockModalProps) {
    const {
        loading,
        batchName,
        setBatchName,
        selectedRegion,
        setSelectedRegion,
        selectedClusterId,
        setSelectedClusterId,
        selectedEngineerId,
        setSelectedEngineerId,
        stagedItems,
        setStagedItems,
        newItem,
        setNewItem,
        searchTerm,
        setSearchTerm,
        showOptions,
        setShowOptions,
        dropdownRef,
        filteredItems,
        exactMatch,
        regions,
        filteredClusters,
        filteredEngineers,
        handleAddItem,
        handleRemoveItem,
        selectOption,
        handleBlur,
        handleSubmit
    } = useIssueStock({ companyId, isOpen, onClose, onSuccess });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="1000px"
            title="Issue Cluster Stock"
            footer={
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', width: '100%' }}>
                    <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '0.6rem 1.25rem' }}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="issue-stock-form"
                        className="btn-submit"
                        disabled={loading || stagedItems.length === 0 || !selectedEngineerId}
                        style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Save size={18} /> {loading ? 'Processing...' : `Assign ${stagedItems.length} Item(s)`}
                    </button>
                </div>
            }
        >
            <form id="issue-stock-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* 1. Hierarchical Selection Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <FileText size={14} /> BATCH REFERENCE
                        </label>
                        <input
                            placeholder="e.g. Feb Supplies"
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <MapPin size={14} /> 1. SELECT REGION
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => {
                                setSelectedRegion(e.target.value);
                                setSelectedClusterId('');
                                setSelectedEngineerId('');
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        >
                            <option value="">Select Region...</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <Layers size={14} /> 2. SELECT CLUSTER
                        </label>
                        <select
                            disabled={!selectedRegion}
                            value={selectedClusterId}
                            onChange={(e) => {
                                setSelectedClusterId(e.target.value);
                                setSelectedEngineerId('');
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', opacity: !selectedRegion ? 0.6 : 1 }}
                        >
                            <option value="">Select Cluster...</option>
                            {filteredClusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <Users size={14} /> 3. ASSIGN TO CLUSTER
                        </label>
                        <select
                            disabled={!selectedClusterId}
                            required
                            value={selectedEngineerId}
                            onChange={(e) => setSelectedEngineerId(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', opacity: !selectedClusterId ? 0.6 : 1 }}
                        >
                            <option value="">Select Personnel...</option>
                            {filteredEngineers.map((eng: any) => (
                                <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Multi-Item Entry Section */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={18} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Staged Items</span>
                    </div>

                    {/* Entry Row: Searachable Input + Qty + Unit + Cat + Notes + Add */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 3fr 50px', gap: '12px', padding: '1rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                        <div ref={dropdownRef} className="form-group" style={{ position: 'relative' }}>
                            <input
                                placeholder="Search or type new item..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowOptions(true);
                                }}
                                onFocus={() => setShowOptions(true)}
                                onBlur={handleBlur}
                                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)' }}
                            />
                            {showOptions && (searchTerm || filteredItems.length > 0) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    marginTop: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => selectOption(item)}
                                            style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700 }}>{item.product_name}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.part_no || 'No Part #'}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, color: item.total_in_stock > 0 ? '#10b981' : '#ef4444' }}>
                                                    {item.total_in_stock} {item.unit}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Warehouse Balance</div>
                                            </div>
                                        </div>
                                    ))}
                                    {searchTerm && !exactMatch && (
                                        <div
                                            onClick={() => setShowOptions(false)}
                                            style={{ padding: '12px', cursor: 'pointer', fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700, background: 'rgba(59, 130, 246, 0.05)' }}
                                        >
                                            + Issue "{searchTerm}" as Ad-hoc Item
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <input
                                placeholder="Unit"
                                value={newItem.unit}
                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', background: exactMatch ? 'var(--bg-hover)' : 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <select
                                value={newItem.item_category}
                                onChange={(e) => setNewItem({ ...newItem, item_category: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', background: exactMatch ? 'var(--bg-hover)' : 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                                <option value="Parts">Parts</option>
                                <option value="Lubricants">Lubricants</option>
                                <option value="Fuel">Fuel</option>
                                <option value="Tools">Tools</option>
                                <option value="Filter">Filter</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <input
                                placeholder="Notes / Batch Info"
                                value={newItem.notes}
                                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                height: '36px'
                            }}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Staging List */}
                    <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--bg-main)' }}>
                        {stagedItems.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No items added yet. Use the fields above to stage inventory.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <tbody style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
                                    {stagedItems.map((item) => (
                                        <tr key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 3fr 50px', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                                            <td style={{ fontWeight: 600 }}>
                                                {item.item_name}
                                                {item.barcodes.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                        {item.barcodes.map(bc => (
                                                            <span key={bc} style={{ fontSize: '0.65rem', background: '#3b82f615', color: '#3b82f6', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>
                                                                {bc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td><span style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>{item.item_category}</span></td>
                                            <td style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <input
                                                    placeholder="Scan Barcode to Link..."
                                                    className="form-input"
                                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val && !item.barcodes.includes(val)) {
                                                                const updated = stagedItems.map(si => si.id === item.id ? { ...si, barcodes: [...si.barcodes, val], quantity: Math.max(si.quantity, si.barcodes.length + 1) } : si);
                                                                setStagedItems(updated);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.notes}</span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </form>

            <style jsx>{`
                .form-group input:focus {
                    outline: none;
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 2px var(--primary-faint);
                }
            `}</style>
        </Modal >
    );
}
