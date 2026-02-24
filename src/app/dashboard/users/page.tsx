"use client";

import './users.css';
import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { UserRole } from '@/types/database';
import DataTable, { DataTableColumn, DataTableFilter } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import {
    UserPlus,
    Users,
    Shield,
    Edit3,
    Trash2,
    UserX,
    UserCheck,
    X,
    Loader2,
    UserCircle,
    Crown
} from 'lucide-react';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'md', label: 'Managing Director' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'driver', label: 'Driver' },
    { value: 'site_engineer', label: 'Site Engineer' },
];

const AVATAR_COLORS: Record<string, string> = {
    superadmin: '#7c3aed',
    admin: '#3b82f6',
    md: '#f59e0b',
    accountant: '#10b981',
    auditor: '#06b6d4',
    driver: '#ef4444',
    site_engineer: '#f97316',
};

import { useClusters, NIGERIAN_STATES } from '@/hooks/useClusters';

export default function UsersPage() {
    const {
        filteredUsers,
        loading,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        isModalOpen,
        editingUser,
        openAddModal,
        openEditModal,
        closeModal,
        handleCreateUser,
        handleUpdateUser,
        handleToggleActive,
        handleDeleteUser,
        submitting,
        users,
    } = useUsers();

    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'superadmin';
    const [deletingUser, setDeletingUser] = useState<any | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [userLimitInfo, setUserLimitInfo] = useState({ current: 0, max: 0 });

    const { clusters } = useClusters();
    const { effectivePlanId, plan, canAddUser } = useSubscription(profile?.company_id || null);

    const activeCount = users.filter(u => u.is_active).length;
    const inactiveCount = users.filter(u => !u.is_active).length;

    const handleAddUser = async () => {
        try {
            const check = await canAddUser();
            console.log('[Users] canAddUser result:', check);
            if (!check.allowed) {
                setUserLimitInfo({ current: check.current, max: check.max });
                setShowUpgradeModal(true);
                return;
            }
            openAddModal();
        } catch (err) {
            console.error('[Users] canAddUser failed:', err);
            // If subscription check fails, still open modal (graceful degradation)
            openAddModal();
        }
    };

    // Column definitions for DataTable
    const columns: DataTableColumn<any>[] = [
        {
            key: 'full_name',
            label: 'User',
            fullWidth: true,
            render: (user) => (
                <div className="user-info">
                    <div
                        className="user-avatar"
                        style={{ background: AVATAR_COLORS[user.role] || '#3b82f6' }}
                    >
                        {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="user-name">{user.full_name}</div>
                        <div className="user-contact">
                            {user.email || user.phone_number || '—'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (user) => (
                <span className={`role-badge ${user.role}`}>
                    {user.role.replace('_', ' ')}
                </span>
            ),
        },
        {
            key: 'branches',
            label: 'Operational Branches',
            render: (user) => {
                const assignedClusters = clusters.filter(c => user.cluster_ids?.includes(c.id));
                if (assignedClusters.length === 0) return <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>;
                return (
                    <div className="branch-pills">
                        {assignedClusters.map(c => (
                            <span key={c.id} className="branch-pill">{c.name}</span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (user) => (
                <span className={`status-pill ${user.is_active ? 'active' : 'inactive'}`}>
                    <span className="status-dot" />
                    {user.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user) => {
                const actions: RowActionItem[] = [
                    {
                        label: 'Edit',
                        icon: <Edit3 size={14} />,
                        onClick: () => openEditModal(user),
                        tooltip: 'Edit User'
                    },
                    {
                        label: user.is_active ? 'Deactivate' : 'Reactivate',
                        icon: user.is_active ? <UserX size={14} /> : <UserCheck size={14} />,
                        onClick: () => handleToggleActive(user.id, user.is_active),
                        variant: user.is_active ? 'danger' : 'success',
                        tooltip: user.is_active ? 'Deactivate User' : 'Reactivate User'
                    }
                ];

                if (isSuperAdmin) {
                    actions.push({
                        label: 'Delete',
                        icon: <Trash2 size={14} />,
                        onClick: () => setDeletingUser(user),
                        variant: 'danger',
                        tooltip: 'Delete User'
                    });
                }

                return <RowActions actions={actions} />;
            },
        },
    ];

    // Filter definitions for DataTable
    const filters: DataTableFilter[] = [
        {
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
                { value: '', label: 'All Roles' },
                ...ROLES.map(r => ({ value: r.value, label: r.label })),
            ],
        },
        {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
            ],
        },
    ];

    return (
        <div className="users-page">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1>Teams & Users</h1>
                    <p>Manage team members and their roles</p>
                </div>
            </header>

            {/* Stats */}
            <div className="user-stats">
                <div className="stat-chip">
                    <Users size={16} style={{ color: '#3b82f6' }} />
                    <span className="stat-value">{users.length}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-chip">
                    <UserCheck size={16} style={{ color: '#10b981' }} />
                    <span className="stat-value">{activeCount}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="stat-chip">
                    <UserX size={16} style={{ color: '#64748b' }} />
                    <span className="stat-value">{inactiveCount}</span>
                    <span className="stat-label">Inactive</span>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={filteredUsers}
                keyExtractor={(user) => user.id}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search users..."
                filters={filters}
                loading={loading}
                pageSize={10}
                emptyIcon={<UserCircle size={40} />}
                emptyMessage={
                    searchQuery || roleFilter || statusFilter
                        ? 'No users match your filters.'
                        : 'No users found. Add your first team member!'
                }
                actions={
                    <button className="btn-add-user" onClick={handleAddUser}>
                        <UserPlus size={15} />
                        Add User
                    </button>
                }
            />

            {isModalOpen && (
                <UserModal
                    editingUser={editingUser}
                    clusters={clusters}
                    onClose={closeModal}
                    onCreate={handleCreateUser}
                    onUpdate={handleUpdateUser}
                    submitting={submitting}
                />
            )}

            {deletingUser && (
                <ConfirmationModal
                    isOpen={!!deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={async () => {
                        await handleDeleteUser(deletingUser.id);
                        setDeletingUser(null);
                    }}
                    title="Delete User"
                    message={`Are you sure you want to delete ${deletingUser.full_name}?`}
                    loading={submitting}
                />
            )}

            {showUpgradeModal && profile?.company_id && (
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentPlan={effectivePlanId}
                    companyId={profile.company_id}
                    userEmail={profile.email || ''}
                    limitType="users"
                    currentUsage={userLimitInfo.current}
                    maxAllowed={userLimitInfo.max}
                />
            )}
        </div>
    );
}

/* ─── User Modal Component ──────────────────────────────── */

function UserModal({
    editingUser,
    clusters,
    onClose,
    onCreate,
    onUpdate,
    submitting,
}: {
    editingUser: any;
    clusters: any[];
    onClose: () => void;
    onCreate: (input: any) => Promise<void>;
    onUpdate: (id: string, fields: any) => Promise<void>;
    submitting: boolean;
}) {
    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'superadmin';
    const isEdit = !!editingUser;
    const [fullName, setFullName] = useState(editingUser?.full_name || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [phone, setPhone] = useState(editingUser?.phone_number || '');
    const [role, setRole] = useState<UserRole>(editingUser?.role || 'driver');
    const [driverType, setDriverType] = useState(editingUser?.driver_type || '');
    const [tempPassword, setTempPassword] = useState('');
    const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>(editingUser?.cluster_ids || []);
    const [selectedState, setSelectedState] = useState('');

    const toggleCluster = (id: string) => {
        setSelectedClusterIds(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            await onUpdate(editingUser.id, {
                full_name: fullName,
                role,
                driver_type: role === 'driver' ? (driverType || null) : null,
                cluster_ids: selectedClusterIds,
            });
        } else {
            await onCreate({
                fullName,
                email: email || undefined,
                phone: phone || undefined,
                role,
                driverType: role === 'driver' ? (driverType || undefined) : undefined,
                tempPassword,
                clusterIds: selectedClusterIds,
            });
        }
    };

    const filteredAvailableClusters = clusters.filter(c =>
        !selectedClusterIds.includes(c.id) &&
        (!selectedState || c.state === selectedState)
    );

    return (
        <Modal
            isOpen={true} // Controlled by parent
            onClose={onClose}
            title={isEdit ? 'Edit User' : 'Add New User'}
            maxWidth="550px"
            footer={
                <>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" form="user-form" className="btn-submit" disabled={submitting || !fullName}>
                        {submitting ? (
                            <><Loader2 size={14} className="spinning" /> Saving...</>
                        ) : (
                            isEdit ? 'Save Changes' : 'Create User'
                        )}
                    </button>
                </>
            }
        >
            <form id="user-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                    />
                </div>

                {!isEdit && (
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@company.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+234..."
                            />
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label>Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                            {ROLES.filter(r => {
                                if (r.value === 'superadmin') return isSuperAdmin;
                                return true;
                            }).map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                    {role === 'driver' && (
                        <div className="form-group">
                            <label>Driver Type</label>
                            <select value={driverType} onChange={(e) => setDriverType(e.target.value)}>
                                <option value="">Select...</option>
                                <option value="internal">Internal</option>
                                <option value="external">External</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Operational Branches (Clusters)</label>
                    <div className="form-row" style={{ gap: '8px', marginBottom: '8px' }}>
                        <select
                            className="cluster-select"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            <option value="">Filter by State...</option>
                            {NIGERIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>

                        <select
                            className="cluster-select"
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    toggleCluster(e.target.value);
                                    e.target.value = ""; // Reset dropdown
                                }
                            }}
                            disabled={!selectedState && clusters.length > 10}
                        >
                            <option value="">{selectedState ? `Select Cluster in ${selectedState}...` : 'Select Cluster...'}</option>
                            {filteredAvailableClusters.map(cluster => (
                                <option key={cluster.id} value={cluster.id}>
                                    {cluster.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="selected-clusters-list">
                        {selectedClusterIds.map(id => {
                            const cluster = clusters.find(c => c.id === id);
                            if (!cluster) return null;
                            return (
                                <div key={id} className="selected-cluster-item">
                                    <div className="cluster-item-header">
                                        <span className="cluster-item-name">{cluster.name}</span>
                                        <span className="cluster-item-state">{cluster.state}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-remove-cluster"
                                        onClick={() => toggleCluster(id)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            );
                        })}
                        {selectedClusterIds.length === 0 && (
                            <p className="no-data-text">No branches selected.</p>
                        )}
                    </div>
                </div>

                {!isEdit && (
                    <div className="form-group">
                        <label>Temporary Password</label>
                        <input
                            type="password"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                            minLength={6}
                        />
                    </div>
                )}
            </form>
        </Modal>
    );
}
