"use client";

import './company.css';
import { useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/common/LoadingScreen';
import Modal from '@/components/Modal/Modal';
import {
    ShieldCheck,
    Edit3,
    Check,
    X,
    Calendar,
    Globe,
    MapPin,
    Package,
    Users as UsersIcon,
    Truck,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function CompanyManagementPage() {
    const { profile } = useAuth();
    const {
        company,
        stats,
        loading,
        submitting,
        isEditing,
        setIsEditing,
        handleUpdateCompany
    } = useCompany();

    const [editName, setEditName] = useState('');

    // Access Denied State
    if (profile && profile.role !== 'superadmin') {
        return (
            <div className="access-denied">
                <div className="denied-box">
                    <AlertCircle size={48} color="#ef4444" />
                    <h1>Access Denied</h1>
                    <p>Only Superadmins can manage company-wide settings.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingScreen message="Loading company profile..." />;
    }

    const startEditing = () => {
        setEditName(company?.name || '');
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
    };

    const saveName = () => {
        if (editName.trim() && editName !== company?.name) {
            handleUpdateCompany(editName.trim());
        } else {
            setIsEditing(false);
        }
    };

    return (
        <>
            <div className="company-page">
                <header className="page-header">
                    <div>
                        <h1>Company Management</h1>
                        <p>Control center for organization-wide settings and overview</p>
                    </div>
                </header>

                {/* Company Profile Header */}
                <section className="company-profile">
                    <div className="company-logo-box">
                        <ShieldCheck size={40} />
                    </div>

                    <div className="company-info-main">
                        <div className="company-name-edit">
                            <h1>{company?.name}</h1>
                            <button className="btn-edit-inline" onClick={startEditing}>
                                <Edit3 size={16} />
                            </button>
                        </div>

                        {/* Meta info removed per user request */}
                    </div>
                </section>

                {/* Organizational Stats Grid */}
                <div className="org-stats-grid">
                    <OrgStatCard
                        title="Clusters"
                        value={stats.clustersCount}
                        icon={<MapPin size={22} />}
                        color="#3b82f6"
                    />
                    <OrgStatCard
                        title="Total Sites"
                        value={stats.sitesCount}
                        icon={<Globe size={22} />}
                        color="#8b5cf6"
                    />
                    <OrgStatCard
                        title="Active Users"
                        value={stats.activeUsersCount}
                        icon={<UsersIcon size={22} />}
                        color="#10b981"
                    />
                    <OrgStatCard
                        title="Clients"
                        value={stats.clientsCount}
                        icon={<Package size={22} />}
                        color="#f59e0b"
                    />
                </div>

                {/* Settings Sections */}
                <div className="mgmt-sections">
                    <div className="settings-group">
                        <div className="group-header">
                            <h2>General Information</h2>
                            <p>Basic organization details visible across the system</p>
                        </div>

                        <div className="settings-content-placeholder">
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                More company settings (Logo upload, default haulage rates, etc.) are currently being integrated.
                                The current version allows managing the company name and organizational structure overview.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Company Modal */}
            {isEditing && (
                <Modal
                    isOpen={true}
                    onClose={cancelEditing}
                    title="Edit Organization Name"
                    footer={
                        <>
                            <button className="btn-cancel" onClick={cancelEditing} disabled={submitting}>
                                Cancel
                            </button>
                            <button className="btn-submit" onClick={saveName} disabled={submitting || !editName.trim()}>
                                {submitting ? <Loader2 size={16} className="spinning" /> : <Check size={16} />}
                                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter organization name"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                        />
                    </div>
                </Modal>
            )}
        </>
    );
}

function OrgStatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="org-stat-card">
            <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
                {icon}
            </div>
            <div className="stat-content">
                <h3>{title}</h3>
                <div className="value">{value}</div>
            </div>
        </div>
    );
}
