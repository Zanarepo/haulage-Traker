"use client";

import '../maintain.css';
import '../../dashboard.css';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import NewWorkOrderModal from './components/NewWorkOrderModal';
import WorkOrderDetailsModal from './components/WorkOrderDetailsModal';
import {
    ClipboardList, Plus, Search,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    open: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#f59e0b',
    completed: '#10b981',
    cancelled: '#6b7280',
    on_hold: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444',
};

export default function WorkOrdersPage() {
    const {
        filteredWorkOrders,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        isCreateModalOpen,
        setIsCreateModalOpen,
        selectedWorkOrder,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        openDetails,
        handleCreate,
        handleUpdate,
        handleUpdateStatus,
        handleDelete,
        stats,
        isManager,
        isEngineer,
    } = useWorkOrders();

    return (
        <div className="maintain-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>{isEngineer ? 'My Work Orders' : 'Work Orders'}</h1>
                    <p>{isEngineer
                        ? 'Your assigned maintenance tasks and site visits.'
                        : 'Create, assign, and track maintenance tickets.'
                    }</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    {isManager && (
                        <button
                            className="btn-maintain-action"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus size={18} />
                            New Work Order
                        </button>
                    )}
                </div>
            </header>

            {/* Stats (engineers see their own; managers see all) */}
            <div className="maintain-stats">
                <div className="stat-card">
                    <h3>{isEngineer ? 'Assigned' : 'Total'}</h3>
                    <p className="value">{stats.total}</p>
                </div>
                <div className="stat-card">
                    <h3>Open</h3>
                    <p className="value">{stats.open}</p>
                </div>
                <div className="stat-card">
                    <h3>In Progress</h3>
                    <p className="value">{stats.inProgress}</p>
                </div>
                <div className="stat-card">
                    <h3>Overdue</h3>
                    <p className="value" style={{ color: stats.overdue > 0 ? '#ef4444' : undefined }}>
                        {stats.overdue}
                    </p>
                </div>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-field" style={{
                    flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center',
                    gap: '0.5rem', background: 'var(--bg-hover)', padding: '0 0.75rem',
                    height: '40px', borderRadius: '0.6rem', border: '1px solid var(--border-color)'
                }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search work orders…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.85rem' }}
                    />
                </div>
                <div className="maintain-filters">
                    {['all', 'open', 'assigned', 'in_progress', 'completed'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`filter-pill ${statusFilter === s ? `active active-${s}` : ''}`}
                        >
                            {s === 'all' ? 'All' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Work Orders List */}
            <div className="activity-list">
                {loading && <div className="maintain-empty">Loading work orders…</div>}
                {!loading && filteredWorkOrders.length === 0 && (
                    <div className="maintain-empty">
                        <ClipboardList size={32} />
                        <p>{isEngineer ? 'No work orders assigned to you.' : 'No work orders found. Create your first one!'}</p>
                    </div>
                )}
                {filteredWorkOrders.map((wo) => (
                    <div key={wo.id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetails(wo)}>
                        <div className="item-left">
                            <div className="avatar" style={{ background: PRIORITY_COLORS[wo.priority] || '#334155' }}>
                                {wo.type === 'preventive' ? 'PM' : wo.type === 'reactive' ? 'RX' : wo.type === 'emergency' ? '🚨' : 'IN'}
                            </div>
                            <div className="item-info">
                                <p><span>{wo.title}</span></p>
                                <div className="time">
                                    {wo.site?.name || '—'} · {wo.type} · {wo.engineer?.full_name || 'Unassigned'}
                                    {wo.scheduled_date && ` · Due: ${new Date(wo.scheduled_date).toLocaleDateString()}`}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* Engineer: quick status update */}
                            {isEngineer && wo.status === 'assigned' && (
                                <button
                                    className="filter-pill active active-in_progress"
                                    style={{ fontSize: '0.7rem' }}
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(wo.id, 'in_progress'); }}
                                >
                                    Start
                                </button>
                            )}
                            {isEngineer && wo.status === 'in_progress' && (
                                <button
                                    className="filter-pill active active-completed"
                                    style={{ fontSize: '0.7rem' }}
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(wo.id, 'completed'); }}
                                >
                                    Complete
                                </button>
                            )}
                            <span
                                className="status-tag"
                                style={{ background: `${STATUS_COLORS[wo.status]}20`, color: STATUS_COLORS[wo.status] }}
                            >
                                {wo.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Work Order Modal */}
            <NewWorkOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                submitting={submitting}
            />

            {/* Work Order Details Modal */}
            <WorkOrderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                workOrder={selectedWorkOrder}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
                submitting={submitting}
            />
        </div>
    );
}
