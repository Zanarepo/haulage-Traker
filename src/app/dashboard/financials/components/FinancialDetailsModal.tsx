"use client";

import React from 'react';
import Modal from '@/components/Modal/Modal';
import {
    Truck,
    MapPin,
    User,
    Calendar,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Droplet,
    Wallet,
    TrendingDown,
    Map,
    Clock
} from 'lucide-react';

interface FinancialDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
    onApprove: (id: string, type: 'accountant' | 'auditor') => Promise<void>;
    onFlag: (id: string) => Promise<void>;
    isAccountant: boolean;
    isAuditor: boolean;
    submitting: boolean;
}

export default function FinancialDetailsModal({
    isOpen,
    onClose,
    record,
    onApprove,
    onFlag,
    isAccountant,
    isAuditor,
    submitting
}: FinancialDetailsModalProps) {
    if (!record) return null;

    const trip = record.dispensing_logs?.trips;
    const site = record.dispensing_logs?.sites;
    const client = trip?.clients;
    const driver = trip?.driver;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Financial Transaction Details"
            maxWidth="600px"
            footer={
                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="btn-cancel" onClick={onClose}>Close</button>
                    {!record.is_audit_flagged && (isAccountant || isAuditor) && (
                        <button
                            className="btn-flag"
                            onClick={() => onFlag(record.id)}
                            disabled={submitting}
                        >
                            Flag for Review
                        </button>
                    )}
                    {isAccountant && !record.accountant_approval && (
                        <button
                            className="btn-approve"
                            onClick={() => onApprove(record.id, 'accountant')}
                            disabled={submitting}
                        >
                            <ShieldCheck size={16} /> Accountant Approve
                        </button>
                    )}
                    {isAuditor && !record.auditor_approval && (
                        <button
                            className="btn-approve"
                            style={{ background: '#a855f7' }}
                            onClick={() => onApprove(record.id, 'auditor')}
                            disabled={submitting}
                        >
                            <CheckCircle2 size={16} /> Auditor Audit
                        </button>
                    )}
                </div>
            }
        >
            <div className="financial-details-modal">
                <div className="details-grid">
                    {/* Header Info - More compact */}
                    <div className="detail-section highlight">
                        <div className="haulage-main-stats">
                            <div className="stat-item">
                                <span className="label">Haulage Fee</span>
                                <span className="value primary">₦ {record.calculated_haulage_fee?.toLocaleString()}</span>
                            </div>
                            {record.loss_amount > 0 && (
                                <div className="stat-item">
                                    <span className="label">Est. Loss</span>
                                    <span className="value danger">₦ {record.loss_amount?.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logistics & Site - Combined or side-by-side */}
                    <div className="detail-section">
                        <div className="compact-data-grid">
                            <div className="data-group">
                                <h6>LOGISTICS</h6>
                                <div className="data-row">
                                    <span className="label"><Truck size={12} /> Asset</span>
                                    <span className="value">{trip?.truck_plate_number}</span>
                                </div>
                                <div className="data-row">
                                    <span className="label"><User size={12} /> Driver</span>
                                    <span className="value truncate">{driver?.full_name}</span>
                                </div>
                            </div>

                            <div className="data-group">
                                <h6>DELIVERY</h6>
                                <div className="data-row">
                                    <span className="label"><Map size={12} /> Client</span>
                                    <span className="value">{client?.name}</span>
                                </div>
                                <div className="data-row">
                                    <span className="label"><MapPin size={12} /> Site</span>
                                    <span className="value truncate">{site?.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="divider" />

                        <div className="data-row-inline">
                            <div className="item">
                                <span className="label">Volume:</span>
                                <span className="value"><Droplet size={12} /> {record.dispensing_logs?.quantity_dispensed?.toLocaleString()} L</span>
                            </div>
                            <div className="item">
                                <span className="label">Date:</span>
                                <span className="value"><Calendar size={12} /> {new Date(record.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compact Approval Summary */}
                    <div className="detail-section">
                        <div className="approval-row">
                            <div className={`mini-card ${record.accountant_approval ? 'approved' : 'pending'}`}>
                                <ShieldCheck size={14} />
                                <span>Accountant: {record.accountant_approval ? 'Approved' : 'Pending'}</span>
                            </div>
                            <div className={`mini-card ${record.auditor_approval ? 'approved' : 'pending'}`}>
                                <CheckCircle2 size={14} />
                                <span>Auditor: {record.auditor_approval ? 'Audited' : 'Pending'}</span>
                            </div>
                            {record.is_audit_flagged && (
                                <div className="mini-card flagged">
                                    <AlertCircle size={14} />
                                    <span>FLAGGED</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .financial-details-modal {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .details-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .detail-section {
                    background: var(--bg-hover);
                    padding: 0.85rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                }

                .detail-section.highlight {
                    background: var(--bg-card);
                    border-color: #3b82f630;
                }

                .detail-section h6 {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    margin: 0 0 0.5rem 0;
                    letter-spacing: 0.05em;
                }

                .haulage-main-stats {
                    display: flex;
                    gap: 1.5rem;
                    justify-content: space-around;
                    align-items: center;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stat-item .label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .stat-item .value {
                    font-size: 1.25rem;
                    font-weight: 900;
                }

                .stat-item .value.primary { color: #10b981; }
                .stat-item .value.danger { color: #ef4444; }

                .compact-data-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .data-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .data-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                }

                .data-row .label {
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .data-row .value {
                    font-weight: 700;
                    color: var(--text-main);
                }

                .truncate {
                    max-width: 100px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 0.75rem 0;
                    opacity: 0.5;
                }

                .data-row-inline {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                }

                .data-row-inline .item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .data-row-inline .label {
                    color: var(--text-muted);
                    font-weight: 500;
                }

                .data-row-inline .value {
                    color: var(--text-main);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .approval-row {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .mini-card {
                    flex: 1;
                    min-width: 120px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0.6rem 0.85rem;
                    border-radius: 0.5rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    border: 1px solid transparent;
                }

                .mini-card.approved {
                    background: rgba(16, 185, 129, 0.08);
                    color: #10b981;
                    border-color: rgba(16, 185, 129, 0.2);
                }

                .mini-card.pending {
                    background: rgba(245, 158, 11, 0.08);
                    color: #f59e0b;
                    border-color: rgba(245, 158, 11, 0.2);
                }

                .mini-card.flagged {
                    background: rgba(239, 68, 68, 0.08);
                    color: #ef4444;
                    border-color: rgba(239, 68, 68, 0.2);
                }

                @media (max-width: 480px) {
                    .compact-data-grid {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                    }
                }
            `}</style>
        </Modal>
    );
}
