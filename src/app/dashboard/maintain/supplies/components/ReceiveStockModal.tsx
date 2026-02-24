import { X } from 'lucide-react';
import ReceivingDashboard from './ReceivingDashboard';

interface ReceiveStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    userId: string;
    onSuccess?: () => void;
    prefillProduct?: any;
}

export default function ReceiveStockModal({ isOpen, onClose, companyId, userId, onSuccess, prefillProduct }: ReceiveStockModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content large" style={{
                maxWidth: '1200px',
                width: '95%',
                padding: 0,
                overflow: 'hidden',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div className="modal-header" style={{
                    padding: '1.25rem 2rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-card)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Inbound Delivery Check-in</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Register new stock, scan barcodes, or add bulk quantities to central inventory.</p>
                    </div>
                    <button className="btn-close-modal" onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                    <ReceivingDashboard
                        companyId={companyId}
                        userId={userId}
                        prefillProduct={prefillProduct}
                        onSuccess={() => {
                            if (onSuccess) onSuccess();
                            onClose(); // Automatically close on success as requested
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
