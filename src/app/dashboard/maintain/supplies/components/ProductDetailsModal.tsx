"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { maintainService } from '@/services/maintainService';
import {
    Package,
    Hash,

    Info,

    Loader2,
    Barcode,

    DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any | null;
}

export default function ProductDetailsModal({
    isOpen,
    onClose,
    product
}: ProductDetailsModalProps) {
    const { showToast } = useToast();
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'units'>('info');

    useEffect(() => {
        if (isOpen && product?.id) {
            loadProductUnits();
            setActiveTab('info');
        }
    }, [isOpen, product?.id]);

    const loadProductUnits = async () => {
        if (!product?.id) return;
        try {
            setLoading(true);
            const data = await maintainService.getMasterInventoryUnits(product.id);
            setUnits(data || []);
        } catch (error) {
            console.error('Failed to load product units:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'block'
    };

    const infoCardStyle: React.CSSProperties = {
        padding: '1rem',
        background: 'var(--bg-card)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    };

    const statBadgeStyle: React.CSSProperties = {
        padding: '0.4rem 0.75rem',
        borderRadius: '0.5rem',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85rem'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Product Specifications"
            maxWidth="600px"
        >
            <div className="product-details-content">
                {/* Header Profile */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}>
                        <Package size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{product.product_name}</h2>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <span className={`mode-pill ${product.is_unique ? 'unique' : 'bulk'}`} style={{ fontSize: '0.65rem' }}>
                                {product.is_unique ? 'SERIALIZED TRACKING' : 'BULK TRACKING'}
                            </span>
                            <span className="mode-pill bulk" style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                {product.item_category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                {product.is_unique && (
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '4px', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => setActiveTab('info')}
                            style={{
                                flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                                background: activeTab === 'info' ? 'var(--bg-card)' : 'transparent',
                                color: activeTab === 'info' ? 'var(--text-main)' : 'var(--text-muted)',
                                cursor: 'pointer', boxShadow: activeTab === 'info' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('units')}
                            style={{
                                flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                                background: activeTab === 'units' ? 'var(--bg-card)' : 'transparent',
                                color: activeTab === 'units' ? 'var(--text-main)' : 'var(--text-muted)',
                                cursor: 'pointer', boxShadow: activeTab === 'units' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <Barcode size={14} /> Serial Numbers ({units.length})
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={infoCardStyle}>
                                <span style={sectionLabelStyle}>Inventory Metadata</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Mfr / Supplier</span>
                                        <span style={{ fontWeight: 600 }}>{product.manufacturer || 'Generic'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Part Number</span>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{product.part_no || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>System ID</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{product.id.slice(0, 13)}...</span>
                                    </div>
                                </div>
                            </div>

                            <div style={infoCardStyle}>
                                <span style={sectionLabelStyle}>Current Stock Levels</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>{product.total_in_stock}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{product.unit} Available</span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: 'var(--border-color)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${Math.min((product.total_in_stock / (product.low_stock_threshold * 2 || 100)) * 100, 100)}%`,
                                            height: '100%',
                                            background: product.total_in_stock <= (product.low_stock_threshold || 5) ? '#ef4444' : '#10b981'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {product.total_in_stock <= (product.low_stock_threshold || 5) ? '⚠️ STOCKS RUNNING LOW' : '✅ HEALTHY STOCK LEVEL'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={infoCardStyle}>
                            <span style={sectionLabelStyle}>Commercial Info</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATEST PURCHASE PRICE</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(product.last_purchase_price || 0)}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>EST. INVENTORY VALUE</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)' }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format((product.last_purchase_price || 0) * product.total_in_stock)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered serial numbers currently in warehouse:</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{units.length} UNITS</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '0.75rem',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            padding: '4px'
                        }}>
                            {loading ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                                    <Loader2 size={24} className="spinning" style={{ opacity: 0.3, margin: '0 auto' }} />
                                </div>
                            ) : units.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'var(--bg-hover)', borderRadius: '0.75rem', border: '1px dashed var(--border-color)' }}>
                                    <Barcode size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No unique units found in stock.</p>
                                </div>
                            ) : (
                                units.map((u, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                            <Hash size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>{u.barcode}</div>
                                                {u.sku && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u.sku}</div>}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            background: u.status === 'in_stock' ? 'rgba(16, 185, 129, 0.1)' :
                                                u.status === 'fulfilled' ? 'rgba(59, 130, 246, 0.1)' :
                                                    'rgba(107, 114, 128, 0.1)',
                                            color: u.status === 'in_stock' ? '#10b981' :
                                                u.status === 'fulfilled' ? '#3b82f6' :
                                                    '#6b7280',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {u.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="info-box" style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Info size={16} color="#3b82f6" />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                Serial numbers are tracked individually for maximum accountability. When issuing stock, these exact IDs must be verified.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
