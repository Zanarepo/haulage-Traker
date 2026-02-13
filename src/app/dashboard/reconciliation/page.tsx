"use client";

import React, { useState, useEffect } from 'react';
import './reconciliation.css';
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Clock,
    User,
    ArrowRight,
    Search,
    RefreshCcw,
    AlertCircle,
    Info,
    ChevronLeft,
    Trash2,
    X,
    ExternalLink
} from 'lucide-react';
import { reconciliationService, ReconciliationSummary } from '@/services/reconciliationService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatNumber, formatDate } from '@/lib/utils'; // Assuming this helper exists or we use toLocaleString

import { useReconciliation } from '@/hooks/useReconciliation';
import Modal from '@/components/Modal/Modal';

export default function ReconciliationPage() {
    const {
        profile,
        loading,
        searchTerm,
        setSearchTerm,
        selectedDriver,
        setSelectedDriver,
        currentPage,
        setCurrentPage,
        pageSize,
        dateMode,
        setDateMode,
        selectedMonth,
        setSelectedMonth,
        selectedQuarter,
        setSelectedQuarter,
        selectedYear,
        setSelectedYear,
        customRange,
        setCustomRange,
        showHistoryModal,
        setShowHistoryModal,
        selectedDetailedRecon,
        supplyHistory,
        loadingHistory,
        hasAccess,
        isSuperAdmin,
        isDriver,
        stats,
        uniqueDrivers,
        filteredData,
        totalPages,
        paginatedData,
        handleViewDetails,
        handleCloseCycle,
        handleDeleteRow,
        handleFilterChange,
        getPeriodDates,
        loadData
    } = useReconciliation();

    const [activeTab, setActiveTab] = useState<'fleet' | 'community'>('fleet');

    if (!loading && !hasAccess) {
        return (
            <div className="reconciliation-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <h2>Access Denied</h2>
                    <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view this dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reconciliation-container">
            <header className="reconciliation-header">
                <div className="header-meta">
                    <h1>Supplies Reconciliation</h1>
                    <p>{isDriver ? 'View your supply activity and period balance' : 'Track supply activity across flexible periods'}</p>
                </div>

                <div className="header-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div className="date-mode-toggle">
                        <button className={`mode-btn ${dateMode === 'monthly' ? 'active' : ''}`} onClick={() => setDateMode('monthly')}>Monthly</button>
                        <button className={`mode-btn ${dateMode === 'quarterly' ? 'active' : ''}`} onClick={() => setDateMode('quarterly')}>Quarterly</button>
                        <button className={`mode-btn ${dateMode === 'custom' ? 'active' : ''}`} onClick={() => setDateMode('custom')}>Custom</button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="period-selector" style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                            {dateMode === 'monthly' && (
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <option key={m} value={i}>{m}</option>
                                    ))}
                                </select>
                            )}

                            {dateMode === 'quarterly' && (
                                <select
                                    value={selectedQuarter}
                                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                                >
                                    <option value={0}>Q1 (Jan-Mar)</option>
                                    <option value={1}>Q2 (Apr-Jun)</option>
                                    <option value={2}>Q3 (Jul-Sep)</option>
                                    <option value={3}>Q4 (Oct-Dec)</option>
                                </select>
                            )}

                            {dateMode === 'custom' && (
                                <div className="custom-date-inputs">
                                    <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} />
                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                    <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} />
                                </div>
                            )}

                            {(dateMode === 'monthly' || dateMode === 'quarterly') && (
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {[2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button className="btn-reconcile" onClick={loadData} disabled={loading}>
                            <RefreshCcw size={16} className={loading ? 'spinning' : ''} />
                            Sync Data
                        </button>
                    </div>
                </div>
            </header>

            <div className="recon-stats">
                <div className="stat-card">
                    <div className="card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Calculator size={20} />
                    </div>
                    <div className="card-info">
                        <h3>Total Allocated (Depot)</h3>
                        <p className="value">{formatNumber(stats.totalAllocated)} <span>L</span></p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="card-info">
                        <h3>Total Supplied (Sites)</h3>
                        <p className="value">{formatNumber(stats.totalSupplied)} <span>L</span></p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <ArrowRight size={20} />
                    </div>
                    <div className="card-info">
                        <h3>Total Community Supply</h3>
                        <p className="value">{formatNumber(stats.totalCommunity)} <span>L</span></p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="card-icon" style={{
                        background: stats.netBalance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: stats.netBalance >= 0 ? '#10b981' : '#ef4444'
                    }}>
                        {stats.netBalance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div className="card-info">
                        <h3>Net Period Balance</h3>
                        <p className="value" style={{ color: stats.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                            {stats.netBalance > 0 ? '+' : ''}{formatNumber(stats.netBalance)} <span>L</span>
                        </p>
                    </div>
                </div>
            </div>

            <main className="recon-main">
                <div className="section-title" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <button
                                onClick={() => setActiveTab('fleet')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0 0 8px 0',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: activeTab === 'fleet' ? 'var(--text-main)' : 'var(--text-muted)',
                                    borderBottom: activeTab === 'fleet' ? '2px solid #3b82f6' : '2px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                {isDriver ? 'My Reconciliation' : 'Fleet Summary'}
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0 0 8px 0',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: activeTab === 'community' ? 'var(--text-main)' : 'var(--text-muted)',
                                    borderBottom: activeTab === 'community' ? '2px solid #3b82f6' : '2px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                Community Summary
                            </button>
                        </div>

                        {!isDriver && (
                            <div className="filter-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div className="search-wrap" style={{ position: 'relative', width: '250px' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search driver..."
                                        value={searchTerm}
                                        onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                                        className="filter-input"
                                    />
                                </div>

                                <div className="driver-filter">
                                    <select
                                        value={selectedDriver}
                                        onChange={(e) => handleFilterChange(setSelectedDriver, e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Drivers</option>
                                        {uniqueDrivers.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="recon-table-wrapper">
                    <table className="recon-table">
                        <thead>
                            {activeTab === 'fleet' ? (
                                <tr>
                                    <th>Driver</th>
                                    <th>Allocated</th>
                                    <th>Site Deliveries</th>
                                    <th>Community</th>
                                    <th>Actual Balance</th>
                                    <th>Action</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Driver</th>
                                    <th>Trip Count</th>
                                    <th>Total Provisioned to Community</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'fleet' ? 6 : 5} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <RefreshCcw className="spinning" style={{ margin: '0 auto 1rem' }} />
                                        <p>Calculating period balances...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((recon) => (
                                    <tr
                                        key={recon.driver_id}
                                        onClick={() => handleViewDetails(recon)}
                                        style={{ cursor: 'pointer' }}
                                        className="recon-row"
                                    >
                                        <td>
                                            <div className="driver-info">
                                                <div className="driver-avatar">{recon.full_name[0]}</div>
                                                <div className="driver-details">
                                                    <span className="name">{recon.full_name}</span>
                                                    <span className="trips">{recon.trip_count} trip entries in period</span>
                                                </div>
                                            </div>
                                        </td>

                                        {activeTab === 'fleet' ? (
                                            <>
                                                <td><strong>{formatNumber(recon.total_allocated)} L</strong></td>
                                                <td><strong>{formatNumber(recon.total_supplied)} L</strong></td>
                                                <td style={{ color: recon.total_community > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                                                    {recon.total_community > 0 ? `${formatNumber(recon.total_community)} L` : '-'}
                                                </td>
                                                <td>
                                                    <span className={`balance-tag ${recon.balance > 0 ? 'overage' : recon.balance < 0 ? 'shortage' : 'balanced'
                                                        }`}>
                                                        {recon.balance > 0 ? <TrendingUp size={14} /> : recon.balance < 0 ? <TrendingDown size={14} /> : <CheckCircle2 size={14} />}
                                                        {recon.balance > 0 ? '+' : ''}{formatNumber(recon.balance)} L
                                                    </span>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{recon.trip_count} Trips</td>
                                                <td style={{ color: '#f59e0b' }}>
                                                    <strong>{formatNumber(recon.total_community)} L</strong>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                                                        Logged
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        <td>
                                            <div
                                                style={{ display: 'flex', gap: '8px' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {!isDriver && (
                                                    <button
                                                        className="btn-reconcile"
                                                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCloseCycle(recon);
                                                        }}
                                                    >
                                                        Close Cycle
                                                        <ArrowRight size={14} />
                                                    </button>
                                                )}
                                                {isSuperAdmin && (
                                                    <button
                                                        className="btn-delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRow(recon);
                                                        }}
                                                        title="Delete (Superadmin)"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <AlertCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        No activity found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-footer">
                        <div className="pagination-info">
                            Showing <span>{(currentPage - 1) * pageSize + 1}</span> to <span>{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span>{filteredData.length}</span> drivers
                        </div>
                        <div className="pagination-btns">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="page-btn"
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                            <div className="page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`num-btn ${currentPage === num ? 'active' : ''}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="page-btn"
                            >
                                Next
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {showHistoryModal && selectedDetailedRecon && (
                <Modal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                    title={`Supply History for ${selectedDetailedRecon.full_name}`}
                    maxWidth="950px"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                            <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>Close</button>
                            {!isDriver && (
                                <button className="btn-submit" onClick={() => handleCloseCycle(selectedDetailedRecon)}>
                                    <CheckCircle2 size={16} />
                                    Close Reconciliation Cycle
                                </button>
                            )}
                        </div>
                    }
                >
                    <div className="modal-period-info" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <span>Reconciliation Period: <strong>{getPeriodDates().start.split('T')[0]}</strong> to <strong>{getPeriodDates().end.split('T')[0]}</strong></span>
                    </div>

                    <div className="modal-body-content">
                        {loadingHistory ? (
                            <div className="loading-state">
                                <RefreshCcw className="spinning" />
                                <p>Fetching supply logs...</p>
                            </div>
                        ) : supplyHistory.length > 0 ? (
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Trip ID</th>
                                        <th>Site Qty</th>
                                        <th>Community</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplyHistory.map((log) => (
                                        <tr key={log.id}>
                                            <td>{formatDate(log.created_at)}</td>
                                            <td><code style={{ fontSize: '0.75rem' }}>{log.trip?.id?.substring(0, 8)}...</code></td>
                                            <td><strong>{formatNumber(log.quantity_dispensed)} L</strong></td>
                                            <td style={{ color: log.community_provision_qty > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                                                {log.community_provision_qty > 0 ? `${formatNumber(log.community_provision_qty)} L` : '-'}
                                            </td>
                                            <td>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2}><strong>Total Logged</strong></td>
                                        <td><strong>{formatNumber(supplyHistory.reduce((s, l) => s + (l.quantity_dispensed || 0), 0))} L</strong></td>
                                        <td style={{ color: '#f59e0b' }}>
                                            <strong>{formatNumber(supplyHistory.reduce((s, l) => s + (l.community_provision_qty || 0), 0))} L</strong>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <AlertCircle size={32} />
                                <p>No individual dispensing logs found for this period.</p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
