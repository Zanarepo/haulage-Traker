"use client";

import './sites.css';
import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { useSites } from '@/hooks/useSites';
import { useClusters } from '@/hooks/useClusters';
import { Client } from '@/services/clientService';
import { Site } from '@/services/siteService';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import {
    Briefcase,
    MapPin,
    Plus,
    Building2,
    Globe,
    Trash2,

    Edit3,
    Loader2,
    X,
    MoreVertical
} from 'lucide-react';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';

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
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Clients & Sites</h1>
                    <p>Manage operational locations and client relationships</p>
                </div>
                <button
                    className="btn-add-entity"
                    onClick={() => activeTab === 'clients' ? openClientModal() : openSiteModal()}
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
                        <div className="stat-value">{clients.length}</div>
                        <div className="stat-label">Clients</div>
                    </div>
                </div>
                <div className="stat-chip">
                    <Globe size={20} color="#10b981" />
                    <div>
                        <div className="stat-value">{sites.length}</div>
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
    const [clusterId, setClusterId] = useState(editingSite?.cluster_id || '');
    const [clientId, setClientId] = useState(editingSite?.client_id || '');
    const [clientName, setClientName] = useState(''); // Text input for client name
    const [community, setCommunity] = useState(editingSite?.host_community || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            site_id_code: siteCode,
            tank_capacity: capacity ? parseFloat(capacity) : undefined,
            cluster_id: clusterId,
            client_id: clientId,
            host_community: community
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

                <div className="form-group">
                    <label>Operational Cluster</label>
                    <select value={clusterId} onChange={e => setClusterId(e.target.value)} required>
                        <option value="">Select Cluster...</option>
                        {clusters.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name} ({c.state})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Host Community</label>
                    <input
                        type="text"
                        value={community}
                        onChange={e => setCommunity(e.target.value)}
                        placeholder="e.g. Victoria Island"
                    />
                </div>
            </form>
        </Modal>
    );
}
