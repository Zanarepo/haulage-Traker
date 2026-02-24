"use client";

import React, { useState } from 'react';
import {
    Barcode,
    Trash2,
    ArrowRightLeft,
    Plus,
    Package,
    Layers,
    DollarSign,
    Info,
    CheckCircle2,
    Edit2,
    X,
    RefreshCcw,
    Hash,
    ChevronDown
} from 'lucide-react';
import { useReceiving, StagedItem } from '../hooks/useReceiving';

export default function ReceivingDashboard({ companyId, userId, onSuccess, prefillProduct }: { companyId: string, userId: string, onSuccess?: () => void, prefillProduct?: any }) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const {
        stagedItems,
        scanBuffer,
        setScanBuffer,
        supplierName,
        setSupplierName,
        referenceNo,
        setReferenceNo,
        loading,
        duplicateAlert,
        lastAddedBarcode,
        inclusionMode,
        setInclusionMode,
        bulkQuantity,
        setBulkQuantity,
        currentProduct,
        setCurrentProduct,
        scannerRef,
        handleBarcodeScan,
        addBulkItem,
        startEditing,
        updateStagedItem,
        updateBarcodeSku,
        cancelEditing,
        editingItemId,
        deleteStagedItem,
        deleteBarcode,
        handleCommit
    } = useReceiving({
        companyId,
        userId,
        prefillProduct,
        onSuccess: () => {
            if (onSuccess) onSuccess();
        }
    });

    const totalStagedUnits = stagedItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalStagedValue = stagedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="receiving-modern-container">
            {/* Header: Batch Identity */}
            <div className="receiving-batch-header">
                <div className="header-field">
                    <label>SUPPLIER NAME</label>
                    <input
                        type="text"
                        placeholder="e.g. TotalEnergies, Bosch..."
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                    />
                </div>
                <div className="header-field">
                    <label>REF / INVOICE #</label>
                    <input
                        type="text"
                        placeholder="Batch Reference"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                    />
                </div>
                <div className="header-stats">
                    <div className="mini-stat">
                        <span className="label">Lines</span>
                        <span className="value">{stagedItems.length}</span>
                    </div>
                    <div className="mini-stat">
                        <span className="label">Total Units</span>
                        <span className="value">{totalStagedUnits}</span>
                    </div>
                </div>
            </div>

            <div className="receiving-main-grid">
                {/* Product Template & Entry */}
                <div className="product-template-card">
                    <div className="template-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={18} color="var(--primary-color)" />
                            <h3>Active Product Template</h3>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                className="btn-new-product"
                                onClick={cancelEditing}
                                title="Clear form for new product"
                            >
                                <RefreshCcw size={14} /> New Product
                            </button>
                            <div className="mode-toggle-pill">
                                <button
                                    className={`mode-toggle-btn ${inclusionMode === 'unique' ? 'active' : ''}`}
                                    onClick={() => setInclusionMode('unique')}
                                >
                                    <Barcode size={14} /> Unique
                                </button>
                                <button
                                    className={`mode-toggle-btn ${inclusionMode === 'bulk' ? 'active' : ''}`}
                                    onClick={() => setInclusionMode('bulk')}
                                >
                                    <Package size={14} /> Bulk
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="template-form-grid">
                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                type="text"
                                placeholder="Main ID"
                                value={currentProduct.productName}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Part Number</label>
                            <input
                                type="text"
                                placeholder="Model #"
                                value={currentProduct.partNo}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, partNo: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Unit Price</label>
                            <div className="input-with-icon">
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>₦</span>
                                <input
                                    type="number"
                                    value={currentProduct.price}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        {inclusionMode === 'bulk' && (
                            <div className="form-group">
                                <label>SKU / Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Size XL, Red"
                                    value={currentProduct.sku}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {inclusionMode === 'unique' ? (
                        <div className="scanner-console-hologram">
                            <div className="hologram-glow" />
                            <div className="scanner-ui">
                                <div className="status-indicator">
                                    <div className="pulse-dot" />
                                    <span>READY TO SCAN...</span>
                                </div>
                                <div className="scan-input-wrapper">
                                    <input
                                        ref={scannerRef}
                                        type="text"
                                        placeholder="Awaiting Barcode..."
                                        value={scanBuffer}
                                        onChange={(e) => setScanBuffer(e.target.value)}
                                        onKeyDown={handleBarcodeScan}
                                    />
                                    <button
                                        className="btn-manual-scan"
                                        onClick={() => handleBarcodeScan(scanBuffer)}
                                        disabled={!scanBuffer.trim()}
                                    >
                                        <Plus size={16} /> Add to List
                                    </button>

                                    {lastAddedBarcode && (
                                        <div className="scanner-success-feedback">
                                            <CheckCircle2 size={16} /> Added: {lastAddedBarcode}
                                        </div>
                                    )}

                                    {duplicateAlert && (
                                        <div className={`scanner-alert ${duplicateAlert.type}`}>
                                            <Info size={14} /> {duplicateAlert.msg}
                                        </div>
                                    )}
                                </div>
                                <div className="scan-metrics">
                                    <span>{stagedItems.filter(i => i.mode === 'unique').length} lines staged</span>
                                    <span className="divider">|</span>
                                    <span>{stagedItems.filter(i => i.mode === 'unique').reduce((a, b) => a + b.quantity, 0)} total units</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bulk-entry-area">
                            <div className="bulk-form">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Quantity to Receive</label>
                                    <input
                                        type="number"
                                        value={bulkQuantity}
                                        onChange={(e) => setBulkQuantity(Number(e.target.value))}
                                        min="1"
                                    />
                                </div>
                                <button className="btn-add-bulk" onClick={editingItemId ? updateStagedItem : addBulkItem}>
                                    <Plus size={18} /> {editingItemId ? 'Update Entry' : 'Add to List'}
                                </button>
                            </div>
                            <p className="bulk-hint">
                                <Info size={14} /> Use this for generic items without serial numbers.
                            </p>
                        </div>
                    )}

                    {editingItemId && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                            <button className="btn-add-bulk" style={{ flex: 1 }} onClick={updateStagedItem}>
                                <CheckCircle2 size={16} /> Save Product Updates
                            </button>
                            <button className="btn-add-bulk" style={{ flex: 1, background: 'var(--border-color)', color: 'var(--text-main)' }} onClick={cancelEditing}>
                                Cancel Edit
                            </button>
                        </div>
                    )}
                </div>

                {/* Staging List */}
                <div className="staging-list-card">
                    <div className="list-header">
                        <h3>Staged Items List</h3>
                        {stagedItems.length > 0 && totalStagedValue > 0 && (
                            <div className="running-total">
                                Total Value: <strong>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalStagedValue)}</strong>
                            </div>
                        )}
                    </div>

                    <div className="staging-table-wrapper">
                        {stagedItems.length === 0 ? (
                            <div className="empty-staging">
                                <Package size={48} opacity={0.2} />
                                <p>No items added yet. Start scanning or enter bulk quantity.</p>
                            </div>
                        ) : (
                            <table className="staging-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Type</th>
                                        <th>Qty</th>
                                        <th>Value</th>
                                        <th style={{ width: '80px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stagedItems.map(item => (
                                        <React.Fragment key={item.id}>
                                            <tr
                                                className={`staged-row ${expandedRow === item.id ? 'expanded' : ''} ${editingItemId === item.id ? 'is-editing' : ''}`}
                                                onClick={() => item.mode === 'unique' && setExpandedRow(expandedRow === item.id ? null : item.id)}
                                                style={{ cursor: item.mode === 'unique' ? 'pointer' : 'default' }}
                                            >
                                                <td data-label="Product">
                                                    <div className="staged-product-cell">
                                                        <span className="p-name">{item.productName}</span>
                                                        <span className="p-meta">
                                                            {item.partNo || 'No Part #'}
                                                            {item.sku && <span className="sku-tag"> • {item.sku}</span>}
                                                            {item.mode === 'unique' && <span className="view-codes-hint"> • View {item.barcodes.length} serials</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Type">
                                                    <span className={`mode-pill ${item.mode}`}>
                                                        {item.mode === 'unique' ? <Barcode size={10} /> : <Package size={10} />}
                                                        {item.mode}
                                                    </span>
                                                </td>
                                                <td data-label="Qty">
                                                    <div className="qty-tag">
                                                        <strong>{item.quantity}</strong> {item.unit}
                                                    </div>
                                                </td>
                                                <td data-label="Value"> {new Intl.NumberFormat('en-NG').format(item.price * item.quantity)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="row-action-btn edit"
                                                            onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                                            title="Edit parameters"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            className="row-action-btn delete"
                                                            onClick={(e) => { e.stopPropagation(); deleteStagedItem(item.id); }}
                                                            title="Delete line item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === item.id && item.mode === 'unique' && (
                                                <tr className="expanded-barcode-row">
                                                    <td colSpan={5}>
                                                        <div className="barcode-detailed-display">
                                                            <div className="detail-header">
                                                                <div className="header-title">
                                                                    <Hash size={16} />
                                                                    <h5>Individual Unit Metadata</h5>
                                                                </div>
                                                                <span className="hint">Assign attributes like Size, Color, or Grade to each specific serial number</span>
                                                            </div>
                                                            <div className="id-metadata-grid">
                                                                {item.barcodes.map((bc, idx) => (
                                                                    <div key={idx} className="id-metadata-row">
                                                                        <div className="id-code">
                                                                            <Barcode size={12} />
                                                                            <span>{bc.barcode}</span>
                                                                        </div>
                                                                        <div className="sku-input-wrapper">
                                                                            <input
                                                                                type="text"
                                                                                className="id-sku-inline"
                                                                                placeholder="Metadata (e.g. Red, XL)"
                                                                                value={bc.sku || ''}
                                                                                onChange={(e) => updateBarcodeSku(item.id, bc.barcode, e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            className="id-remove-btn"
                                                                            onClick={(e) => { e.stopPropagation(); deleteBarcode(item.id, bc.barcode); }}
                                                                            title="Remove this ID"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="staging-footer">
                        <button
                            className="btn-commit-batch"
                            disabled={stagedItems.length === 0 || loading}
                            onClick={handleCommit}
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Commit {totalStagedUnits} Units to Inventory
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
