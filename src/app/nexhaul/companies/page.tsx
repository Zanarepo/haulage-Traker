"use client";

import React, { useEffect, useState } from 'react';
import { platformService } from '@/services/platformService';
import {
    Plus,
    Search,
    Building2,
    Zap,
    Wrench,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ExternalLink,
    MapPin,
    Users,
    CreditCard,
    Trash2,
    ShieldAlert,
    Clock,
    Activity,
    ClipboardList,
    Crown,
    Loader2,
    ChevronDown
} from 'lucide-react';
import DataTable from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import RowActions from '@/components/RowActions/RowActions';
import { useAuth } from '@/hooks/useAuth';
import './Companies.css';

export default function CompaniesPage() {
    const { profile, platformProfile } = useAuth();
    const isSuper = platformProfile?.role === 'nexsuper';
    const [companies, setCompanies] = useState<any[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        const filtered = companies.filter(c =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCompanies(filtered);
    }, [searchQuery, companies]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const data = await platformService.getDetailedCompanies();
            setCompanies(data);
        } catch (err) {
            console.error('Failed to load companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleModule = async (company: any, module: string) => {
        const currentModules = company.active_modules || [];
        const newModules = currentModules.includes(module)
            ? currentModules.filter((m: string) => m !== module)
            : [...currentModules, module];

        try {
            await platformService.updateCompany(company.id, { active_modules: newModules });
            loadCompanies();
        } catch (err) {
            console.error('Failed to toggle module:', err);
        }
    };

    const handleStatusUpdate = async (companyId: string, status: 'active' | 'suspended') => {
        try {
            await platformService.updateCompanyStatus(companyId, status);
            loadCompanies();
            if (selectedCompany?.id === companyId) {
                setIsDetailModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDelete = async (companyId: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this company? All data associated with this tenant will be lost.')) return;

        try {
            await platformService.deleteCompany(companyId);
            loadCompanies();
            setIsDetailModalOpen(false);
        } catch (err) {
            console.error('Failed to delete company:', err);
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Company',
            render: (company: any) => (
                <div className="company-cell">
                    <div className="company-icon-wrapper">
                        <Building2 size={22} strokeWidth={2.5} />
                    </div>
                    <div className="company-info">
                        <h4>{company.name}</h4>
                        <div className="company-location">
                            <MapPin size={10} strokeWidth={3} />
                            {company.location || 'Not Specified'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'plan',
            label: 'Plan',
            render: (company: any) => (
                <span className={`plan-badge ${company.plan === 'enterprise' ? 'plan-enterprise' : company.plan === 'small_business' ? 'plan-pro' : company.plan === 'trial' ? 'plan-trial' : ''}`}>
                    {company.plan === 'small_business' ? 'Business' : company.plan || 'No Plan'}
                </span>
            )
        },
        {
            key: 'staff',
            label: 'Staff',
            render: (company: any) => (
                <div className="flex items-center gap-2 text-slate-400">
                    <Users size={16} strokeWidth={2.5} className="text-slate-600" />
                    <span className="font-bold text-sm text-slate-200">{company.staffCount || 0}</span>
                </div>
            )
        },
        {
            key: 'modules',
            label: 'Active Suite',
            hideOnMobile: true,
            render: (company: any) => {
                const isSupply = company.active_modules?.includes('infra_supply');
                const isMaintain = company.active_modules?.includes('maintain');
                return (
                    <div className="suite-badges">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleModule(company, 'infra_supply'); }}
                            className={`suite-btn ${isSupply ? 'active-blue' : ''}`}
                            title="Logistics Module"
                        >
                            <Zap size={15} fill={isSupply ? 'currentColor' : 'none'} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleModule(company, 'maintain'); }}
                            className={`suite-btn ${isMaintain ? 'active-purple' : ''}`}
                            title="Maintenance Module"
                        >
                            <Wrench size={15} fill={isMaintain ? 'currentColor' : 'none'} strokeWidth={2.5} />
                        </button>
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            hideOnMobile: true,
            render: (company: any) => (
                <div className={`badge-status ${company.status === 'active' ? 'badge-active' : 'badge-suspended'}`}>
                    <Activity size={12} strokeWidth={3} />
                    {company.status}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (company: any) => (
                <RowActions
                    actions={[
                        {
                            label: 'Suspend Tenant',
                            icon: <ShieldAlert size={16} strokeWidth={2.5} />,
                            variant: 'warning',
                            onClick: () => handleStatusUpdate(company.id, 'suspended'),
                        },
                        {
                            label: 'Delete Permanently',
                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                            variant: 'danger',
                            onClick: () => handleDelete(company.id),
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="companies-page">
            <header className="companies-header">
                <div>
                    <h2>Ecosystem Management</h2>
                    <p>Global view of active tenants, subscription health, and module entitlement.</p>
                </div>
                <div className="revenue-card">
                    <span className="revenue-label">Network Revenue</span>
                    <div className="revenue-value">
                        $14.2k
                        <span className="revenue-period">MRR</span>
                    </div>
                </div>
            </header>

            <div className="controls-container">
                <div className="search-field">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by company name, location or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <DataTable
                    columns={columns}
                    data={filteredCompanies}
                    loading={loading}
                    keyExtractor={(company) => company.id}
                    onRowClick={(c) => {
                        setSelectedCompany(c);
                        setIsDetailModalOpen(true);
                    }}
                    emptyMessage="No matching companies found in the NexHaul network."
                    pageSize={10}
                />
            </div>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl shadow-blue-500/5">
                            <Building2 size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white tracking-tight">{selectedCompany?.name}</div>
                        </div>
                    </div>
                }
                maxWidth="700px"
            >
                {selectedCompany && (
                    <CompanyDetailContent
                        company={selectedCompany}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDelete}
                        onPlanUpgraded={loadCompanies}
                    />
                )}
            </Modal>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════
   Company Detail Modal Content (with Subscription History)
   ═══════════════════════════════════════════════════════════ */

function CompanyDetailContent({
    company,
    onStatusUpdate,
    onDelete,
    onPlanUpgraded
}: {
    company: any;
    onStatusUpdate: (id: string, status: 'active' | 'suspended') => void;
    onDelete: (id: string) => void;
    onPlanUpgraded: () => void;
}) {
    const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string>(company.plan || 'free');
    const [upgrading, setUpgrading] = useState(false);
    const [upgradeSuccess, setUpgradeSuccess] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [company.id]);

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const history = await platformService.getCompanySubscriptionHistory(company.id);
            setSubscriptionHistory(history);
        } catch (err) {
            console.error('Failed to load subscription history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const sub = company.subscriptionData;

    const getPlanDisplayName = (plan: string) => {
        switch (plan) {
            case 'small_business': return 'Small Business';
            case 'enterprise': return 'Enterprise';
            case 'trial': return 'Enterprise Trial';
            case 'free': return 'Free';
            default: return plan;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#4ade80';
            case 'trialing': return '#60a5fa';
            case 'expired': return '#f87171';
            case 'cancelled': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'enterprise': return '#4ade80';
            case 'small_business': return '#3b82f6';
            case 'trial': return '#a855f7';
            case 'free': return '#94a3b8';
            default: return '#94a3b8';
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="py-4">
            {/* ── Overview Cards ── */}
            <div className="detail-grid">
                <div className="detail-card">
                    <div className="detail-label">
                        <CreditCard size={14} strokeWidth={2.5} />
                        Subscription Plan
                    </div>
                    <div className="detail-value" style={{ color: getPlanColor(company.plan) }}>
                        {getPlanDisplayName(company.plan)}
                    </div>
                    <div className="detail-subtext" style={{ color: getStatusColor(company.subscriptionStatus) }}>
                        <Activity size={12} strokeWidth={3} />
                        {company.subscriptionStatus === 'none' ? 'No subscription' : company.subscriptionStatus}
                    </div>
                </div>
                <div className="detail-card">
                    <div className="detail-label">
                        <Users size={14} strokeWidth={2.5} />
                        Total Users
                    </div>
                    <div className="detail-value">{company.staffCount || 0}</div>
                    <div className="detail-subtext text-slate-400">On-platform staff</div>
                </div>
            </div>

            {/* ── Subscription Details ── */}
            <h4 className="section-header-label">Subscription Details</h4>
            <div className="sub-detail-panel">
                <div className="sub-detail-row">
                    <span className="sub-detail-key">
                        <CreditCard size={14} strokeWidth={2.5} />
                        Current Plan
                    </span>
                    <span className={`sub-plan-tag plan-tag-${company.plan}`}>
                        {getPlanDisplayName(company.plan)}
                    </span>
                </div>
                <div className="sub-detail-row">
                    <span className="sub-detail-key">
                        <Activity size={14} strokeWidth={2.5} />
                        Status
                    </span>
                    <span className="sub-status-dot" style={{
                        color: getStatusColor(company.subscriptionStatus),
                        background: `${getStatusColor(company.subscriptionStatus)}12`
                    }}>
                        <span className="status-pulse" style={{ background: getStatusColor(company.subscriptionStatus) }}></span>
                        {company.subscriptionStatus === 'none' ? 'No Subscription' : company.subscriptionStatus}
                    </span>
                </div>
                {sub?.trial_start && (
                    <div className="sub-detail-row">
                        <span className="sub-detail-key">
                            <Clock size={14} strokeWidth={2.5} />
                            Trial Period
                        </span>
                        <span className="sub-detail-val">
                            {formatDate(sub.trial_start)} → {formatDate(sub.trial_end)}
                        </span>
                    </div>
                )}
                {sub?.current_period_start && (
                    <div className="sub-detail-row">
                        <span className="sub-detail-key">
                            <Clock size={14} strokeWidth={2.5} />
                            Billing Period
                        </span>
                        <span className="sub-detail-val">
                            {formatDate(sub.current_period_start)} → {formatDate(sub.current_period_end)}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Manual Plan Upgrade ── */}
            <h4 className="section-header-label">
                <Crown size={14} strokeWidth={2.5} />
                Manual Plan Override
            </h4>
            <div className="upgrade-panel">
                <p className="upgrade-description">
                    Manually update this tenant's subscription plan. Use this when a payment was received but the automatic upgrade failed.
                </p>
                <div className="upgrade-controls">
                    <div className="plan-select-wrapper">
                        <select
                            value={selectedPlan}
                            onChange={(e) => { setSelectedPlan(e.target.value); setUpgradeSuccess(false); }}
                            className="plan-select"
                        >
                            <option value="free">Free</option>
                            <option value="trial">Enterprise Trial</option>
                            <option value="small_business">Small Business</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                        <ChevronDown size={14} className="select-chevron" />
                    </div>
                    <button
                        className="btn-upgrade"
                        disabled={upgrading || selectedPlan === company.plan}
                        onClick={async () => {
                            try {
                                setUpgrading(true);
                                setUpgradeSuccess(false);
                                await platformService.upgradeCompanyPlan(
                                    company.id,
                                    selectedPlan as any,
                                    'active'
                                );
                                setUpgradeSuccess(true);
                                onPlanUpgraded();
                                loadHistory();
                            } catch (err) {
                                console.error('Upgrade failed:', err);
                                alert('Failed to update plan. Check console for details.');
                            } finally {
                                setUpgrading(false);
                            }
                        }}
                    >
                        {upgrading ? (
                            <><Loader2 size={14} className="spinning" /> Updating...</>
                        ) : (
                            <><Crown size={14} /> Apply Plan</>
                        )}
                    </button>
                </div>
                {upgradeSuccess && (
                    <div className="upgrade-success">
                        <CheckCircle2 size={14} strokeWidth={3} />
                        Plan updated successfully. Table will reflect changes.
                    </div>
                )}
            </div>

            {/* ── Active Entitlements ── */}
            <h4 className="section-header-label">Active Entitlements</h4>
            <div className="grid grid-cols-2 gap-4 mb-8 px-1">
                <div className={`entitlement-card ${company.active_modules?.includes('infra_supply') ? 'active' : ''}`}>
                    <div className="flex items-center gap-4">
                        <Zap size={20} strokeWidth={2.5} className={company.active_modules?.includes('infra_supply') ? 'text-blue-400' : 'text-slate-700'} fill={company.active_modules?.includes('infra_supply') ? 'currentColor' : 'none'} />
                        <span className="font-extrabold text-[15px] tracking-tight text-white/90">Logistics</span>
                    </div>
                    {company.active_modules?.includes('infra_supply') && <CheckCircle2 size={18} strokeWidth={3} className="text-blue-500" />}
                </div>
                <div className={`entitlement-card ${company.active_modules?.includes('maintain') ? 'active purple' : ''}`}>
                    <div className="flex items-center gap-4">
                        <Wrench size={20} strokeWidth={2.5} className={company.active_modules?.includes('maintain') ? 'text-purple-400' : 'text-slate-700'} fill={company.active_modules?.includes('maintain') ? 'currentColor' : 'none'} />
                        <span className="font-extrabold text-[15px] tracking-tight text-white/90">Maintenance</span>
                    </div>
                    {company.active_modules?.includes('maintain') && <CheckCircle2 size={18} strokeWidth={3} className="text-purple-500" />}
                </div>
            </div>

            {/* ── Subscription History Timeline ── */}
            <h4 className="section-header-label">
                <ClipboardList size={14} strokeWidth={2.5} />
                Subscription History
            </h4>
            <div className="sub-history-container">
                {loadingHistory ? (
                    <div className="sub-history-loading">
                        <div className="history-loader"></div>
                        <span>Loading subscription records...</span>
                    </div>
                ) : subscriptionHistory.length === 0 ? (
                    <div className="sub-history-empty">
                        <CreditCard size={28} strokeWidth={1.5} />
                        <span>No subscription records found</span>
                        <span className="sub-history-empty-sub">This company has not had any subscriptions yet.</span>
                    </div>
                ) : (
                    <div className="sub-history-timeline">
                        {subscriptionHistory.map((record, i) => (
                            <div key={record.id} className={`timeline-item ${i === 0 ? 'current' : ''}`}>
                                <div className="timeline-dot" style={{ borderColor: getPlanColor(record.plan) }}>
                                    <div className="timeline-dot-inner" style={{ background: getPlanColor(record.plan) }}></div>
                                </div>
                                {i < subscriptionHistory.length - 1 && <div className="timeline-line"></div>}
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className={`sub-plan-tag plan-tag-${record.plan}`}>
                                            {getPlanDisplayName(record.plan)}
                                        </span>
                                        <span className="timeline-status" style={{
                                            color: getStatusColor(record.status),
                                            background: `${getStatusColor(record.status)}12`,
                                            borderColor: `${getStatusColor(record.status)}30`
                                        }}>
                                            {record.status}
                                        </span>
                                    </div>
                                    <div className="timeline-meta">
                                        {record.trial_start && (
                                            <div className="timeline-meta-row">
                                                <span className="meta-label">Trial:</span>
                                                <span>{formatDate(record.trial_start)} → {formatDate(record.trial_end)}</span>
                                            </div>
                                        )}
                                        {record.current_period_start && (
                                            <div className="timeline-meta-row">
                                                <span className="meta-label">Period:</span>
                                                <span>{formatDate(record.current_period_start)} → {formatDate(record.current_period_end)}</span>
                                            </div>
                                        )}
                                        <div className="timeline-meta-row">
                                            <span className="meta-label">Created:</span>
                                            <span>{formatDateTime(record.created_at)}</span>
                                        </div>
                                        {record.updated_at !== record.created_at && (
                                            <div className="timeline-meta-row">
                                                <span className="meta-label">Updated:</span>
                                                <span>{formatDateTime(record.updated_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Lifecycle Metrics ── */}
            <h4 className="section-header-label">Lifecycle Metrics</h4>
            <div className="metrics-list">
                <div className="metric-item">
                    <span className="metric-info">
                        <Clock size={18} strokeWidth={2.5} className="text-slate-700" />
                        Onboarded Date
                    </span>
                    <span className="metric-value">
                        {new Date(company.created_at).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </span>
                </div>
                <div className="metric-item">
                    <span className="metric-info">
                        <MapPin size={18} strokeWidth={2.5} className="text-slate-700" />
                        Global Region
                    </span>
                    <span className="metric-value text-slate-400">
                        {company.location || 'Not Specified'}
                    </span>
                </div>
                <div className="metric-item">
                    <span className="metric-info">
                        <ShieldAlert size={18} strokeWidth={2.5} className="text-slate-700" />
                        System Integrity
                    </span>
                    <span className="text-emerald-500 font-black text-[11px] uppercase tracking-[0.1em] bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                        Optimal
                    </span>
                </div>
            </div>

            <div className="modal-actions">
                <button
                    onClick={() => onStatusUpdate(company.id, company.status === 'active' ? 'suspended' : 'active')}
                    className={`btn-action ${company.status === 'active' ? 'btn-suspend' : 'btn-restore'}`}
                >
                    <Activity size={16} strokeWidth={2.5} />
                    {company.status === 'active' ? 'Suspend Tenant' : 'Restore Tenant'}
                </button>
                <button
                    onClick={() => onDelete(company.id)}
                    className="btn-action btn-delete"
                >
                    <Trash2 size={16} strokeWidth={2.5} />
                    Delete Entity
                </button>
            </div>
        </div>
    );
}
