"use client";

import React, { useEffect, useState } from 'react';
import { platformService } from '@/services/platformService';
import { NexHaulAdmin } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import {
    Plus,
    Shield,
    Trash2,
    MoreVertical,
    Mail,
    Phone,
    UserPlus,
    Edit
} from 'lucide-react';
import DataTable from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import RowActions from '@/components/RowActions/RowActions';
import './Admins.css';

export default function AdminsPage() {
    const { profile, platformProfile } = useAuth();
    const [admins, setAdmins] = useState<NexHaulAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<NexHaulAdmin & { password?: string }>>({
        role: 'nexadmin'
    });
    const [isEditing, setIsEditing] = useState(false);

    const isSuper = platformProfile?.role === 'nexsuper';

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const data = await platformService.getAdmins();
            setAdmins(data);
        } catch (err) {
            console.error('Failed to load admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && formData.id) {
                await platformService.updateAdmin(formData.id, formData);
            } else {
                await platformService.createAdmin(formData);
            }
            setIsModalOpen(false);
            loadAdmins();
        } catch (err) {
            console.error('Failed to save admin:', err);
        }
    };

    const handleEdit = (admin: NexHaulAdmin) => {
        setFormData(admin);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this admin?')) return;
        try {
            await platformService.deleteAdmin(id);
            loadAdmins();
        } catch (err) {
            console.error('Failed to delete admin:', err);
        }
    };

    const columns = [
        {
            key: 'full_name',
            label: 'Administrator',
            render: (admin: NexHaulAdmin) => (
                <div className="admin-cell">
                    <div className="admin-avatar">
                        {admin.full_name.charAt(0)}
                    </div>
                    <div className="admin-info">
                        <h4>{admin.full_name}</h4>
                        <div className="admin-email">{admin.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Access Level',
            render: (admin: NexHaulAdmin) => {
                const isSuper = admin.role === 'nexsuper';
                const isAdmin = admin.role === 'nexadmin';
                return (
                    <div className={`role-badge ${isSuper ? 'role-super' : isAdmin ? 'role-admin' : 'role-support'}`}>
                        {admin.role.replace('nex', '')}
                    </div>
                );
            }
        },
        {
            key: 'phone_number',
            label: 'Contact Context',
            render: (admin: NexHaulAdmin) => (
                <div className="contact-info">
                    {admin.phone_number ? (
                        <span className="contact-phone">{admin.phone_number}</span>
                    ) : (
                        <span className="contact-none">No phone linked</span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (admin: NexHaulAdmin) => (
                <RowActions
                    actions={[
                        {
                            label: 'Edit Details',
                            icon: <Edit size={16} />,
                            onClick: () => handleEdit(admin),
                        },
                        {
                            label: 'Remove Admin',
                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                            variant: 'danger' as const,
                            onClick: () => handleDelete(admin.id),
                        }
                    ].filter(() => isSuper && admin.id !== profile?.id)}
                />
            )
        }
    ];

    if (!isSuper) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Shield size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold">Access Restricted</h2>
                <p className="text-gray-400 max-w-md mt-2">
                    Only NexSuper administrators can manage platform access levels.
                </p>
            </div>
        );
    }

    return (
        <div className="admins-page">
            <header className="admins-header">
                <div>
                    <h2>Platform Administrators</h2>
                    <p>Manage mission control access and security levels.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ role: 'nexadmin' });
                        setIsEditing(false);
                        setIsModalOpen(true);
                    }}
                    className="add-admin-btn"
                >
                    <UserPlus size={18} />
                    <span>Onboard New Admin</span>
                </button>
            </header>

            <div className="table-container">
                <DataTable
                    columns={columns}
                    data={admins}
                    loading={loading}
                    keyExtractor={(admin) => admin.id}
                    emptyMessage="No platform administrators found."
                    pageSize={10}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? "Edit Platform Admin" : "Onboard Platform Admin"}
                maxWidth="550px"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="onboard-admin-form"
                            className="btn-submit"
                        >
                            <Shield size={18} />
                            {isEditing ? 'Save Changes' : 'Register & Invite'}
                        </button>
                    </>
                }
            >
                <form id="onboard-admin-form" onSubmit={handleSave} className="standard-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Legal Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                value={formData.full_name || ''}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="john@nexhaul.com"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone Number (Optional)</label>
                        <input
                            type="tel"
                            placeholder="+234..."
                            value={formData.phone_number || ''}
                            onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>

                    <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '1.25rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        marginTop: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
                            <Shield size={16} />
                            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                Privileges & Security
                            </h3>
                        </div>

                        <div className="form-row" style={{ gap: '1rem' }}>
                            <div className="form-group">
                                <label>{isEditing ? 'Access Level' : 'Administrative Level'}</label>
                                <select
                                    className="premium-select"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <option value="nexadmin">NexAdmin (Operations)</option>
                                    <option value="nexsupport">NexSupport (Audit Only)</option>
                                    <option value="nexsuper">NexSuper (Platform Owner)</option>
                                </select>
                            </div>

                            {!isEditing && (
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter temp password"
                                        onChange={e => setFormData({ ...formData, password: e.target.value } as any)}
                                    />
                                </div>
                            )}
                        </div>

                        <p style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.8)', margin: 0, lineHeight: 1.4 }}>
                            {isEditing
                                ? 'Changes will take effect immediately across all Mission Control modules.'
                                : 'User will be required to change their credentials upon first Mission Control login. An invitation email will be sent automatically.'}
                        </p>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
