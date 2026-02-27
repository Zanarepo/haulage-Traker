"use client";

import './sites.css';
import { useState, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useSites } from '@/hooks/useSites';
import { useClusters, NIGERIAN_STATES } from '@/hooks/useClusters';
import { Client } from '@/services/clientService';
import { Site } from '@/services/siteService';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import {

    Plus,
    Building2,
    Globe,
    Trash2,

    Edit3,
    Loader2,

} from 'lucide-react';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';

export default function SitesManagementPage() {
    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'superadmin';

    const {
        clients,
        loading: loadingClients,
        submitting: submittingClient,
        handleCreateClient,
        handleUpdateClient,
        handleDeleteClient
    } = useClients();
    const {
        sites,
        loading: loadingSites,
        submitting: submittingSite,
        handleCreateSite,
        handleUpdateSite,
        handleDeleteSite
    } = useSites();
    const { clusters } = useClusters();

    const [activeTab, setActiveTab] = useState<'clients' | 'sites'>('clients');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<any>(null);
    const [deletingEntity, setDeletingEntity] = useState<any>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const { plan, effectivePlanId, infraPlanId, maintainPlanId, canAddClient, canAddSite } = useSubscription(profile?.company_id || null);

    const handleAddEntity = async () => {
        try {
            if (activeTab === 'clients') {
                // Check local state first for immediate response
                if (clients.length >= plan.limits.maxClients) {
                    setShowUpgradeModal(true);
                    return;
                }

                const check = await canAddClient();
                if (!check.allowed) {
                    setShowUpgradeModal(true);
                    return;
                }
                openClientModal();
            } else {
                // Check local state first for immediate response
                if (sites.length >= plan.limits.maxSites) {
                    setShowUpgradeModal(true);
                    return;
                }

                const check = await canAddSite();
                if (!check.allowed) {
                    setShowUpgradeModal(true);
                    return;
                }
                openSiteModal();
            }
        } catch {
            // Fallback: allow if check fails
            activeTab === 'clients' ? openClientModal() : openSiteModal();
        }
    };

    const openClientModal = (client: any = null) => {
        setEditingEntity(client);
        setIsClientModalOpen(true);
    };

    const openSiteModal = (site: any = null) => {
        setEditingEntity(site);
        setIsSiteModalOpen(true);
    };

    const clientColumns: DataTableColumn<Client>[] = [
        {
            label: 'Client Name',
            key: 'name',
            render: (item: Client) => (
                <div className="item-info">
                    <div className="item-icon"><Building2 size={18} /></div>
                    <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-sub">Registered Client</span>
                    </div>
                </div>
            )
        },
        {
            label: 'Haulage Rate',
            key: 'haulage_rate_per_liter',
            render: (item: Client) => <span className="rate-badge">₦{item.haulage_rate_per_liter} / L</span>
        },
        {
            label: 'Actions',
            key: 'id',
            render: (item: Client) => {
                const actions: RowActionItem[] = [
                    {
                        label: 'Edit',
                        icon: <Edit3 size={14} />,
                        onClick: () => openClientModal(item),
                        tooltip: 'Edit Client'
                    }
                ];

                if (isSuperAdmin) {
                    actions.push({
                        label: 'Delete',
                        icon: <Trash2 size={14} />,
                        onClick: () => setDeletingEntity({ type: 'client', ...item }),
                        variant: 'danger',
                        tooltip: 'Delete Client'
                    });
                }

                return <RowActions actions={actions} />;
            }
        }
    ];

    const siteColumns: DataTableColumn<any>[] = [
        {
            label: 'Site Name',
            key: 'name',
            render: (item: any) => (
                <div className="item-info">
                    <div className="item-icon site"><Globe size={18} /></div>
                    <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-sub">{item.site_id_code || 'No Code'}</span>
                    </div>
                </div>
            )
        },
        {
            label: 'Client',
            key: 'clients',
            render: (item: any) => item.clients?.name || 'Unknown'
        },
        {
            label: 'Cluster',
            key: 'clusters',
            render: (item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.clusters?.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.clusters?.state}</span>
                </div>
            )
        },
        {
            label: 'Capacity',
            key: 'tank_capacity',
            render: (item: any) => <span className="capacity-badge">{item.tank_capacity ? `${item.tank_capacity} L` : 'N/A'}</span>
        },
        {
            label: 'Actions',
            key: 'id',
            render: (item: any) => {
                const actions: RowActionItem[] = [
                    {
                        label: 'Edit',
                        icon: <Edit3 size={14} />,
                        onClick: () => openSiteModal(item),
                        tooltip: 'Edit Site'
                    }
                ];

                if (isSuperAdmin) {
                    actions.push({
                        label: 'Delete',
                        icon: <Trash2 size={14} />,
                        onClick: () => setDeletingEntity({ type: 'site', ...item }),
                        variant: 'danger',
                        tooltip: 'Delete Site'
                    });
                }

                return <RowActions actions={actions} />;
            }
        }
    ];

    return (
        <div className="sites-page">
            <header className="page-header">
                <div>
                    <h1>Clients & Sites</h1>
                    <p>Manage operational locations and client relationships</p>
                </div>
                <button
                    className="btn-add-entity"
                    onClick={handleAddEntity}
                >
                    <Plus size={18} />
                    <span>{activeTab === 'clients' ? 'Add Client' : 'Add Site'}</span>
                </button>
            </header>

            <div className="tab-switcher">
                <button
                    className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clients')}
                >
                    Clients ({clients.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sites')}
                >
                    Sites ({sites.length})
                </button>
            </div>

            <div className="entity-stats">
                <div className="stat-chip">
                    <Building2 size={20} color="#3b82f6" />
                    <div>
                        <div className="stat-value">{clients.length} / {plan.limits.maxClients}</div>
                        <div className="stat-label">Clients</div>
                    </div>
                </div>
                <div className="stat-chip">
                    <Globe size={20} color="#10b981" />
                    <div>
                        <div className="stat-value">{sites.length} / {plan.limits.maxSites}</div>
                        <div className="stat-label">Active Sites</div>
                    </div>
                </div>
            </div>

            {activeTab === 'clients' ? (
                <DataTable
                    columns={clientColumns}
                    data={clients}
                    loading={loadingClients}
                    keyExtractor={(item: Client) => item.id}
                    emptyMessage="No clients found. Add your first client to get started."
                />
            ) : (
                <DataTable
                    columns={siteColumns}
                    data={sites}
                    loading={loadingSites}
                    keyExtractor={(item: any) => item.id}
                    emptyMessage="No sites found. Create a site to start dispatching."
                />
            )}

            {isClientModalOpen && (
                <ClientModal
                    isOpen={isClientModalOpen}
                    onClose={() => setIsClientModalOpen(false)}
                    onSave={async (name, rate) => {
                        const success = editingEntity
                            ? await handleUpdateClient(editingEntity.id, name, rate)
                            : await handleCreateClient(name, rate);
                        if (success) setIsClientModalOpen(false);
                    }}
                    editingClient={editingEntity}
                    submitting={submittingClient}
                />
            )}

            {isSiteModalOpen && (
                <SiteModal
                    isOpen={isSiteModalOpen}
                    onClose={() => setIsSiteModalOpen(false)}
                    onSave={async (siteData, clientName) => {
                        const success = editingEntity
                            ? await handleUpdateSite(editingEntity.id, siteData)
                            : await handleCreateSite(siteData, clientName);
                        if (success) setIsSiteModalOpen(false);
                    }}
                    editingSite={editingEntity}
                    clusters={clusters}
                    clients={clients}
                    submitting={submittingSite}
                />
            )}

            {deletingEntity && (
                <ConfirmationModal
                    isOpen={!!deletingEntity}
                    onClose={() => setDeletingEntity(null)}
                    onConfirm={async () => {
                        if (deletingEntity.type === 'client') {
                            await handleDeleteClient(deletingEntity.id);
                        } else {
                            await handleDeleteSite(deletingEntity.id);
                        }
                        setDeletingEntity(null);
                    }}
                    title={`Delete ${deletingEntity.type === 'client' ? 'Client' : 'Site'}`}
                    message={`Are you sure you want to delete ${deletingEntity.name}?`}
                    loading={submittingClient || submittingSite}
                />
            )}

            {showUpgradeModal && profile?.company_id && (
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentPlan={effectivePlanId}
                    companyId={profile.company_id}
                    userEmail={profile.email || ''}
                    infraPlanId={infraPlanId}
                    maintainPlanId={maintainPlanId}
                />
            )}
        </div>
    );
}

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, rate: number) => void;
    editingClient?: Client;
    submitting: boolean;
}

function ClientModal({ isOpen, onClose, onSave, editingClient, submitting }: ClientModalProps) {
    const [name, setName] = useState(editingClient?.name || '');
    const [rate, setRate] = useState(editingClient?.haulage_rate_per_liter || 45);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name, rate);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingClient ? 'Edit Client' : 'Add New Client'}
            footer={
                <>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" form="client-form" className="btn-submit" disabled={submitting}>
                        {submitting ? <Loader2 size={14} className="spinning" /> : (editingClient ? 'Save Changes' : 'Create Client')}
                    </button>
                </>
            }
        >
            <form id="client-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Client Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="e.g. MTN Nigeria"
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>Base Haulage Rate (₦/L)</label>
                    <input
                        type="number"
                        value={rate}
                        onChange={e => setRate(parseFloat(e.target.value))}
                        required
                        step="0.01"
                    />
                </div>
            </form>
        </Modal>
    );
}

interface SiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (siteData: Partial<Site>, clientName: string) => void;
    editingSite?: any;
    clusters: any[];
    clients: Client[];
    submitting: boolean;
}

function SiteModal({ isOpen, onClose, onSave, editingSite, clusters, clients, submitting }: SiteModalProps) {
    const [name, setName] = useState(editingSite?.name || '');
    const [siteCode, setSiteCode] = useState(editingSite?.site_id_code || '');
    const [capacity, setCapacity] = useState(editingSite?.tank_capacity || '');
    const [selectedState, setSelectedState] = useState(editingSite?.clusters?.state || '');
    const [clusterId, setClusterId] = useState(editingSite?.cluster_id || '');
    const [clientId, setClientId] = useState(editingSite?.client_id || '');
    const [clientName, setClientName] = useState(''); // Text input for client name
    const [community, setCommunity] = useState(editingSite?.host_community || '');
    const [isHybrid, setIsHybrid] = useState(editingSite?.is_hybrid || false);
    const [solarHours, setSolarHours] = useState(editingSite?.solar_offset_hours || 0);

    const filteredClusters = selectedState
        ? clusters.filter(c => c.state === selectedState)
        : clusters;

    useEffect(() => {
        if (!editingSite && selectedState && !filteredClusters.some(c => c.id === clusterId)) {
            if (filteredClusters.length === 1) {
                setClusterId(filteredClusters[0].id);
            } else {
                setClusterId('');
            }
        }
    }, [selectedState, filteredClusters, clusterId, editingSite]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            site_id_code: siteCode,
            tank_capacity: capacity ? parseFloat(capacity) : undefined,
            cluster_id: clusterId,
            client_id: clientId,
            host_community: community,
            is_hybrid: isHybrid,
            solar_offset_hours: Number(solarHours)
        }, clientName);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingSite ? 'Edit Site' : 'Add New Site'}
            maxWidth="550px"
            footer={
                <>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" form="site-form" className="btn-submit" disabled={submitting}>
                        {submitting ? <Loader2 size={14} className="spinning" /> : (editingSite ? 'Save Changes' : 'Create Site')}
                    </button>
                </>
            }
        >
            <form id="site-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Site Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="e.g. Lagos VI Base Station"
                        autoFocus
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Site ID Code</label>
                        <input
                            type="text"
                            value={siteCode}
                            onChange={e => setSiteCode(e.target.value)}
                            placeholder="e.g. LOS-001"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tank Capacity (L)</label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                            placeholder="e.g. 10000"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Assigned Client</label>
                    <select
                        value={clientId}
                        onChange={e => {
                            setClientId(e.target.value);
                            setClientName(''); // Clear manual name if selecting from list
                        }}
                        required={!clientName}
                    >
                        <option value="">Select or create client...</option>
                        {clients.map((c: Client) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>New Client Name (Optional)</label>
                    <input
                        type="text"
                        value={clientName}
                        onChange={e => {
                            setClientName(e.target.value);
                            if (e.target.value) setClientId(''); // Clear selection if typing a new name
                        }}
                        placeholder="Or type to create new client..."
                    />
                    {editingSite && !clientName && !clientId && (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Current: {editingSite.clients?.name}
                        </p>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Operational Region (State)</label>
                        <select value={selectedState} onChange={e => setSelectedState(e.target.value)} required>
                            <option value="">Select State...</option>
                            {NIGERIAN_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Operational Cluster</label>
                        <select value={clusterId} onChange={e => setClusterId(e.target.value)} disabled={!selectedState} required>
                            <option value="">{selectedState ? 'Select Cluster...' : 'Select State First'}</option>
                            {filteredClusters.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Host Community</label>
                    <input
                    />
                </div>

                <div className="form-group hybrid-section" style={{
                    background: 'var(--bg-main)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    marginTop: '0.5rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isHybrid ? '1rem' : '0' }}>
                        <div>
                            <label style={{ margin: 0, fontWeight: 600 }}>Hybrid Power System</label>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Uses Solar/Inverters to cushion usage</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isHybrid}
                                onChange={e => setIsHybrid(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {isHybrid && (
                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label>Solar energy contribution (hrs per day)</label>
                            <input
                                type="number"
                                value={solarHours}
                                onChange={e => setSolarHours(parseFloat(e.target.value))}
                                placeholder="e.g. 10.5"
                                min="0"
                                max="24"
                                step="0.5"
                            />
                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                This will offset the calculated maintenance schedule for all generators at this site.
                            </p>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}
