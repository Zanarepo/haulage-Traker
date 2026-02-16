"use client";

import React from 'react';
import './trips.css';
import {
    Truck,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowRightCircle,
    MapPin,
    User,
    History,
    Droplet
} from 'lucide-react';
import DispenseModal from './components/DispenseModal';

import { useTrips } from '@/hooks/useTrips';
import { useClusters } from '@/hooks/useClusters';
import { useUsers } from '@/hooks/useUsers';
import { useInventory } from '@/hooks/useInventory';
import { useSites } from '@/hooks/useSites';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import DispatchModal from './components/DispatchModal';
import TripHistoryModal from './components/TripHistoryModal';
import RowActions from '@/components/RowActions/RowActions';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export default function TripsDashboard() {
    const {
        filteredTrips,
        loading,
        submitting,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        isDispatchModalOpen,
        setIsDispatchModalOpen,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        isDispenseModalOpen,
        setIsDispenseModalOpen,
        selectedTrip,
        setSelectedTrip,
        handleDispatchTrip,
        handleUpdateStatus,
        handleRecordDispense,
        handleClearAllHistory,
        stats,
        isManager,
        trips,
        loadTrips
    } = useTrips();

    // Data needed for Dispatch Modal
    const { clusters } = useClusters();
    const { users } = useUsers();
    const { sites } = useSites();
    const { aggregatedData } = useInventory(); // Using aggregated data for pooled stock

    const { profile } = useAuth();
    const { isFreePlan } = useSubscription(profile?.company_id || null);

    const drivers = users.filter(u => u.role === 'driver');

    const columns: DataTableColumn<any>[] = [
        {
            label: 'Trip Info',
            key: 'truck_plate_number',
            render: (it) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="truck-pill">{it.truck_plate_number}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {new Date(it.created_at).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            label: 'Driver',
            key: 'driver',
            render: (it) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                        <User size={12} />
                    </div>
                    <span>{it.driver?.full_name || 'Unassigned'}</span>
                </div>
            )
        },
        {
            label: 'Region',
            key: 'cluster',
            render: (it) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <MapPin size={14} />
                    <span>{it.clusters?.name || 'Unknown'}</span>
                </div>
            )
        },
        {
            label: 'Volume',
            key: 'loaded_quantity',
            render: (it) => <span className="quantity-badge">{it.loaded_quantity.toLocaleString()} L</span>
        },
        {
            label: 'Status',
            key: 'status',
            render: (it) => (
                <span className={`status-pill ${it.status}`}>
                    {it.status}
                </span>
            )
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (it) => (
                <RowActions
                    actions={[
                        ...(it.status === 'pending' ? [{
                            label: 'Set Active',
                            icon: <ArrowRightCircle size={14} />,
                            onClick: () => handleUpdateStatus(it.id, 'active'),
                        }] : []),
                        ...((it.status === 'active' || it.status === 'dispensed') ? [{
                            label: 'Record Dispensing',
                            icon: <Droplet size={14} />,
                            onClick: () => {
                                setSelectedTrip(it);
                                setIsDispenseModalOpen(true);
                            },
                        }] : []),
                        {
                            label: 'View Logs',
                            icon: <Clock size={14} />,
                            onClick: () => setIsHistoryModalOpen(true),
                        },
                        ...((it.status === 'dispensed' && isManager) ? [{
                            label: 'Mark Reconciled',
                            icon: <CheckCircle2 size={14} />,
                            onClick: () => handleUpdateStatus(it.id, 'reconciled'),
                        }] : []),
                        ...((it.status === 'reconciled' && isManager) ? [{
                            label: 'Complete Trip',
                            icon: <CheckCircle2 size={14} />,
                            onClick: () => handleUpdateStatus(it.id, 'completed'),
                        }] : [])
                    ]}
                />
            )
        }
    ];

    return (
        <div className="trips-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>{isManager ? 'Trips & Logistics' : 'My Trips'}</h1>
                    <p>{isManager ? 'Dispatch trucks, track delivery status, and manage supply distribution' : 'Track your assigned trips and record deliveries'}</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    {isManager && (
                        <button className="btn-dispatch" onClick={() => setIsDispatchModalOpen(true)}>
                            <Plus size={18} />
                            Dispatch Trip
                        </button>
                    )}
                </div>
            </header>

            <div className="trips-stats">
                <StatCard
                    label={isManager ? "Total Trips" : "My Trips"}
                    value={stats.total}
                    icon={<Truck size={24} />}
                    color="rgba(59, 130, 246, 0.1)"
                    iconColor="#3b82f6"
                />
                <StatCard
                    label="Active Now"
                    value={stats.active}
                    icon={<ArrowRightCircle size={24} />}
                    color="rgba(16, 185, 129, 0.1)"
                    iconColor="#10b981"
                />
                <StatCard
                    label="Pending Dispatch"
                    value={stats.pending}
                    icon={<Clock size={24} />}
                    color="rgba(245, 158, 11, 0.1)"
                    iconColor="#f59e0b"
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon={<CheckCircle2 size={24} />}
                    color="rgba(168, 85, 247, 0.1)"
                    iconColor="#a855f7"
                />
            </div>

            <div className="controls-container">
                <div className="search-field">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by truck, driver, or region..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="status-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="dispensed">Dispensed</option>
                        <option value="reconciled">Reconciled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="trips-content">
                <DataTable
                    columns={columns}
                    data={filteredTrips}
                    loading={loading}
                    keyExtractor={(it) => it.id}
                    emptyMessage="No trips found. Start by dispatching a new truck."
                />
            </div>

            <DispenseModal
                isOpen={isDispenseModalOpen}
                onClose={() => setIsDispenseModalOpen(false)}
                onDispense={handleRecordDispense}
                submitting={submitting}
                trip={selectedTrip}
            />

            <DispatchModal
                isOpen={isDispatchModalOpen}
                onClose={() => setIsDispatchModalOpen(false)}
                onDispatch={handleDispatchTrip}
                submitting={submitting}
                drivers={drivers}
                clusters={clusters}
                sites={sites}
                allocations={aggregatedData}
                isFreePlan={isFreePlan}
            />

            <TripHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                trips={trips}
                onClearAll={handleClearAllHistory}
                submitting={submitting}
                isManager={isManager}
                onConfirmed={loadTrips}
            />
        </div>
    );
}

function StatCard({ label, value, icon, color, iconColor }: any) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color, color: iconColor }}>
                {icon}
            </div>
            <div className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
}
