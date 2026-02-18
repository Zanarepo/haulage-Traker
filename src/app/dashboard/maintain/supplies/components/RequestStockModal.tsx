"use client";

import React from 'react';
import { Plus, Trash2, FileText, Send, Package } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { useStockRequest } from '../hooks/useStockRequest';

interface RequestStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    engineerId: string;
    onSuccess: () => void;
}

export default function RequestStockModal({ isOpen, onClose, companyId, engineerId, onSuccess }: RequestStockModalProps) {
    const {
        loading,
        notes,
        setNotes,
        stagedItems,
        newItem,
        setNewItem,
        searchTerm,
        setSearchTerm,
        showOptions,
        setShowOptions,
        dropdownRef,
        filteredItems,
        exactMatch,
        handleAddItem,
        handleRemoveItem,
        selectOption,
        handleSubmit
    } = useStockRequest({ companyId, engineerId, isOpen, onClose, onSuccess });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="800px"
            title="Request New Stock"
            footer={
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', width: '100%' }}>
                    <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '0.6rem 1.25rem' }}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="request-stock-form"
                        className="btn-submit"
                        disabled={loading || stagedItems.length === 0}
                        style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand-main)' }}
                    >
                        <Send size={18} /> {loading ? 'Sending...' : `Send Request (${stagedItems.length} Items)`}
                    </button>
                </div>
            }
        >
            <form id="request-stock-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* 1. Notes / Context */}
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <FileText size={14} /> PURPOSE / NOTES
                    </label>
                    <textarea
                        placeholder="Why do you need these items? (e.g. Weekly maintenance, specific breakdown...)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical' }}
                    />
                </div>

                {/* 2. Multi-Item Entry Section */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={18} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Items Requested</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 50px', gap: '12px', padding: '1rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                        <div ref={dropdownRef} className="form-group" style={{ position: 'relative' }}>
                            <input
                                placeholder="Search organization stock..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowOptions(true);
                                }}
                                onFocus={() => setShowOptions(true)}
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
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In Stock: {item.total_in_stock} {item.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {searchTerm && !exactMatch && (
                                        <div
                                            onClick={() => setShowOptions(false)}
                                            style={{ padding: '12px', cursor: 'pointer', fontSize: '0.85rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.05)' }}
                                        >
                                            + Request "{searchTerm}" (Ad-hoc)
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
                        <button
                            type="button"
                            onClick={handleAddItem}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'var(--brand-main)',
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
                                No items added. Select from the stock list above.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <tbody>
                                    {stagedItems.map((item) => (
                                        <tr key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 50px', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                                            <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
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
        </Modal>
    );
}
