"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import {
    Package,
    Hash,
    Tag,
    Layers,
    DollarSign,
    Save,
    Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any | null;
    onSuccess: () => void;
}

export default function EditProductModal({
    isOpen,
    onClose,
    product,
    onSuccess
}: EditProductModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        part_no: '',
        item_category: 'Parts',
        unit: 'pcs',
        last_purchase_price: 0,
        manufacturer: ''
    });

    useEffect(() => {
        if (isOpen && product) {
            setFormData({
                product_name: product.product_name || '',
                part_no: product.part_no || '',
                item_category: product.item_category || 'Parts',
                unit: product.unit || 'pcs',
                last_purchase_price: product.last_purchase_price || 0,
                manufacturer: product.manufacturer || ''
            });
        }
    }, [isOpen, product]);

    const handleSave = async () => {
        if (!product?.id) return;
        if (!formData.product_name.trim()) {
            showToast('Product name is required.', 'warning');
            return;
        }

        try {
            setLoading(true);
            await maintainService.updateMasterProduct(product.id, formData);
            showToast('Product updated successfully.', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('[EditProductModal] Update failed:', error);
            showToast(error.message || 'Failed to update product.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    const inputGroupStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '1rem'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    const inputStyle: React.CSSProperties = {
        padding: '0.75rem 1rem',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: 'var(--text-main)',
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Product Metadata"
            maxWidth="550px"
        >
            <div className="edit-product-content" style={{ padding: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ ...inputGroupStyle, gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Product Name</label>
                        <div style={{ position: 'relative' }}>
                            <Package size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                                value={formData.product_name}
                                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                placeholder="Enter product name"
                            />
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Part Number</label>
                        <div style={{ position: 'relative' }}>
                            <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                                value={formData.part_no}
                                onChange={(e) => setFormData({ ...formData, part_no: e.target.value })}
                                placeholder="e.g. PN-12345"
                            />
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Category</label>
                        <div style={{ position: 'relative' }}>
                            <Layers size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                style={{ ...inputStyle, paddingLeft: '2.75rem', appearance: 'none' }}
                                value={formData.item_category}
                                onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                            >
                                <option value="Parts">Parts</option>
                                <option value="Consumables">Consumables</option>
                                <option value="Tools">Tools</option>
                                <option value="Safety">Safety</option>
                                <option value="Lubricants">Lubricants</option>
                                <option value="Tires">Tires</option>
                                <option value="Batteries">Batteries</option>
                            </select>
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Unit of Measure</label>
                        <div style={{ position: 'relative' }}>
                            <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="e.g. pcs, Liters"
                            />
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Last Purchase Price (₦)</label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                                value={formData.last_purchase_price}
                                onChange={(e) => setFormData({ ...formData, last_purchase_price: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div style={{ ...inputGroupStyle, gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Manufacturer</label>
                        <input
                            type="text"
                            style={inputStyle}
                            value={formData.manufacturer}
                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                            placeholder="e.g. Bosch, Michelin"
                        />
                    </div>
                </div>

                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'var(--primary-color)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Update Product</>}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
