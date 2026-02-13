"use client";

import './clusters.css';
import { useState } from 'react';
import { useClusters, NIGERIAN_STATES } from '@/hooks/useClusters';
import DataTable, { DataTableColumn, DataTableFilter } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import {
    MapPin,
    Plus,
    Edit3,
    Trash2,
    X,
    Loader2,
    Globe,
    MoreVertical
} from 'lucide-react';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';

export default function ClustersPage() {
    const {
        filteredClusters,
        loading,
        searchQuery,
        setSearchQuery,
        stateFilter,
        setStateFilter,
        isModalOpen,
        editingCluster,
        openAddModal,
        openEditModal,
        closeModal,
        handleCreateCluster,
        handleUpdateCluster,
        handleDeleteCluster,
        submitting,
        clusters,
    } = useClusters();

    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'superadmin';
    const [deletingCluster, setDeletingCluster] = useState<any | null>(null);

    // Derive unique states for the filter
    const uniqueStates = [...new Set(clusters.map(c => c.state).filter(Boolean))] as string[];

    // Column definitions for DataTable
    const columns: DataTableColumn<any>[] = [
        {
            key: 'name',
            label: 'Cluster',
            fullWidth: true,
            render: (cluster) => (
                <div className="cluster-info">
                    <div className="cluster-icon">
                        <MapPin size={16} />
                    </div>
                    <div>
                        <div className="cluster-name">{cluster.name}</div>
                        <div className="cluster-date">
                            Created {new Date(cluster.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'state',
            label: 'State',
            render: (cluster) => (
                <span className={`state-badge ${!cluster.state ? 'unassigned' : ''}`}>
                    {cluster.state || 'Not set'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (cluster) => {
                const actions: RowActionItem[] = [
                    {
                        label: 'Edit',
                        icon: <Edit3 size={14} />,
                        onClick: () => openEditModal(cluster),
                        tooltip: 'Edit Cluster'
                    }
                ];

                if (isSuperAdmin) {
                    actions.push({
                        label: 'Delete',
                        icon: <Trash2 size={14} />,
                        onClick: () => setDeletingCluster(cluster),
                        variant: 'danger',
                        tooltip: 'Delete Cluster'
                    });
                }

                return <RowActions actions={actions} />;
            },
        },
    ];

    // Filter definitions for DataTable
    const filters: DataTableFilter[] = [
        {
            label: 'State',
            value: stateFilter,
            onChange: setStateFilter,
            options: [
                { value: '', label: 'All States' },
                ...uniqueStates.map(s => ({ value: s, label: s })),
            ],
        },
    ];

    return (
        <div className="clusters-page">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1>Clusters</h1>
                    <p>Manage regional groups and operational areas</p>
                </div>
            </header>

            {/* Stats */}
            <div className="cluster-stats">
                <div className="stat-chip">
                    <MapPin size={16} style={{ color: '#3b82f6' }} />
                    <span className="stat-value">{clusters.length}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-chip">
                    <Globe size={16} style={{ color: '#8b5cf6' }} />
                    <span className="stat-value">{uniqueStates.length}</span>
                    <span className="stat-label">States</span>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={filteredClusters}
                keyExtractor={(cluster) => cluster.id}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search clusters..."
                filters={filters}
                loading={loading}
                pageSize={10}
                emptyIcon={<MapPin size={40} />}
                emptyMessage={
                    searchQuery || stateFilter
                        ? 'No clusters match your filters.'
                        : 'No clusters found. Create your first cluster!'
                }
                actions={
                    <button className="btn-add-cluster" onClick={openAddModal}>
                        <Plus size={15} />
                        Add Cluster
                    </button>
                }
            />

            {/* Modal */}
            {isModalOpen && (
                <ClusterModal
                    editingCluster={editingCluster}
                    onClose={closeModal}
                    onCreate={handleCreateCluster}
                    onUpdate={handleUpdateCluster}
                    submitting={submitting}
                />
            )}

            {deletingCluster && (
                <ConfirmationModal
                    isOpen={!!deletingCluster}
                    onClose={() => setDeletingCluster(null)}
                    onConfirm={async () => {
                        await handleDeleteCluster(deletingCluster.id);
                        setDeletingCluster(null);
                    }}
                    title="Delete Cluster"
                    message={`Are you sure you want to delete ${deletingCluster.name}?`}
                    loading={submitting}
                />
            )}
        </div>
    );
}

/* ─── Cluster Modal Component ──────────────────────────────── */
function ClusterModal({
    editingCluster,
    onClose,
    onCreate,
    onUpdate,
    submitting,
}: {
    editingCluster: any;
    onClose: () => void;
    onCreate: (input: { name: string; state?: string }) => Promise<void>;
    onUpdate: (id: string, fields: { name?: string; state?: string }) => Promise<void>;
    submitting: boolean;
}) {
    const isEdit = !!editingCluster;
    const [name, setName] = useState(editingCluster?.name || '');
    const [state, setState] = useState(editingCluster?.state || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            await onUpdate(editingCluster.id, { name, state: state || undefined });
        } else {
            await onCreate({ name, state: state || undefined });
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEdit ? 'Edit Cluster' : 'Add New Cluster'}
            footer={
                <>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" form="cluster-form" className="btn-submit" disabled={submitting || !name.trim()}>
                        {submitting ? (
                            <><Loader2 size={14} className="spinning" /> Saving...</>
                        ) : (
                            isEdit ? 'Save Changes' : 'Create Cluster'
                        )}
                    </button>
                </>
            }
        >
            <form id="cluster-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Cluster Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Lagos Hub"
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label>State</label>
                    <select value={state} onChange={(e) => setState(e.target.value)}>
                        <option value="">Select state...</option>
                        {NIGERIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </form>
        </Modal>
    );
}
