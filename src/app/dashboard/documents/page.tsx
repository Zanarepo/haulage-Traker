"use client";

import React, { useState, useEffect } from 'react';
import {
    Search,
    Download,
    Eye,
    Truck,
    MapPin,
    Calendar,
    Image as ImageIcon,
    PenTool,
    User
} from 'lucide-react';
import DataTable, { DataTableColumn } from '@/components/DataTable/DataTable';
import Modal from '@/components/Modal/Modal';
import { documentService } from '@/services/documentService';
import { useAuth } from '@/hooks/useAuth';
import './documents.css';

export default function DocumentCentre() {
    const { profile } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<any>(null);

    const isDriver = profile?.role === 'driver';

    useEffect(() => {
        if (profile?.id) {
            loadDocuments();
        }
    }, [profile?.id]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentService.getDeliveryDocuments(
                isDriver ? profile?.id : undefined
            );
            setDocuments(data || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: DataTableColumn<any>[] = [
        {
            label: 'Date',
            key: 'created_at',
            render: (it: any) => (
                <div className="date-group">
                    <span className="main-text">{new Date(it.created_at).toLocaleDateString()}</span>
                    <span className="sub-text">{new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            label: 'Trip & Asset',
            key: 'truck_plate_number',
            render: (it: any) => (
                <div className="asset-group">
                    <div className="asset-pill">
                        <Truck size={12} />
                        <span>{it.trips?.truck_plate_number}</span>
                    </div>
                    <span className="sub-text truncate">{it.trips?.clients?.name}</span>
                </div>
            )
        },
        {
            label: 'Delivery Site',
            key: 'site_name',
            render: (it: any) => (
                <div className="site-group">
                    <span className="main-text">{it.sites?.name}</span>
                    <span className="sub-text">{it.quantity_dispensed?.toLocaleString()} L delivered</span>
                </div>
            )
        },
        {
            label: 'Verification Docs',
            key: 'docs',
            render: (it: any) => (
                <div className="docs-badge-group">
                    {it.waybill_photo_url && <div className="doc-badge" title="Waybill Uploaded"><ImageIcon size={12} /></div>}
                    {it.driver_signature_url && <div className="doc-badge" title="Driver Signed"><User size={12} /></div>}
                    {it.engineer_signature_url && <div className="doc-badge" title="Engineer Signed"><PenTool size={12} /></div>}
                </div>
            )
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (it: any) => (
                <button
                    className="btn-view-doc"
                    onClick={() => setSelectedDoc(it)}
                >
                    <Eye size={14} /> Review
                </button>
            )
        }
    ];

    const filteredDocs = documents.filter(doc =>
        doc.trips?.truck_plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.sites?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.trips?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="document-centre-container">
            <div className="dashboard-header">
                <div className="header-titles">
                    <h1>Document Centre</h1>
                    <p>Centralized delivery verification and audit signatures</p>
                </div>

                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by truck, site, or client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="documents-content">
                <DataTable
                    columns={columns}
                    data={filteredDocs}
                    loading={loading}
                    keyExtractor={(it: any) => it.id}
                    emptyMessage="No delivery documents found."
                />
            </div>

            {/* Document Review Modal */}
            <Modal
                isOpen={!!selectedDoc}
                onClose={() => setSelectedDoc(null)}
                title="Delivery Verification Audit"
                maxWidth="650px"
                footer={
                    <button className="btn-close-modal" onClick={() => setSelectedDoc(null)}>Close Audit</button>
                }
            >
                {selectedDoc && (
                    <div className="doc-review-content">
                        <div className="review-meta-grid">
                            <div className="meta-card">
                                <label><Truck size={12} /> Asset</label>
                                <span>{selectedDoc.trips?.truck_plate_number}</span>
                            </div>
                            <div className="meta-card">
                                <label><MapPin size={12} /> Location</label>
                                <span>{selectedDoc.sites?.name}</span>
                            </div>
                            <div className="meta-card">
                                <label><Calendar size={12} /> Volume</label>
                                <span>{selectedDoc.quantity_dispensed?.toLocaleString()} L</span>
                            </div>
                        </div>

                        <div className="verification-details">
                            {selectedDoc.waybill_photo_url && (
                                <div className="detail-block">
                                    <div className="block-label">
                                        <ImageIcon size={14} /> Waybill Proof
                                    </div>
                                    <div className="proof-image-wrapper">
                                        <img src={selectedDoc.waybill_photo_url} alt="Waybill" />
                                        <a href={selectedDoc.waybill_photo_url} target="_blank" rel="noreferrer" className="img-download-link">
                                            <Download size={14} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="sig-details-grid">
                                {selectedDoc.driver_signature_url && (
                                    <div className="detail-block">
                                        <div className="block-label">
                                            <User size={14} /> Driver Sign-off
                                        </div>
                                        <div className="sig-display-box">
                                            <img src={selectedDoc.driver_signature_url} alt="Driver Sign" />
                                        </div>
                                        <p className="sig-author">{selectedDoc.trips?.driver?.full_name}</p>
                                    </div>
                                )}

                                {selectedDoc.engineer_signature_url && (
                                    <div className="detail-block">
                                        <div className="block-label">
                                            <PenTool size={14} /> Engineer Sign-off
                                        </div>
                                        <div className="sig-display-box">
                                            <img src={selectedDoc.engineer_signature_url} alt="Engineer Sign" />
                                        </div>
                                        <p className="sig-author">{selectedDoc.engineer_name || 'Site Engineer'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
