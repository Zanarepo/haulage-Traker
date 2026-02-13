import React, { useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { Loader2 } from 'lucide-react';

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    editingSupply: any;
    clients: any[];
    submitting: boolean;
}

export default function SupplyModal({ isOpen, onClose, onSave, editingSupply, clients, submitting }: SupplyModalProps) {
    const [clientId, setClientId] = useState('');
    const [qty, setQty] = useState('');
    const [remQty, setRemQty] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Update form when editingSupply changes
    React.useEffect(() => {
        if (isOpen) {
            setClientId(editingSupply?.client_id || '');
            setQty(editingSupply?.total_quantity || '');
            setRemQty(editingSupply?.remaining_quantity || '');
            setDate(editingSupply?.purchase_date ? new Date(editingSupply.purchase_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, editingSupply]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            client_id: clientId,
            total_quantity: Number(qty),
            remaining_quantity: editingSupply ? Number(remQty) : Number(qty),
            purchase_date: new Date(date).toISOString()
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingSupply ? 'Edit Supply Record' : 'New Supply Record'}
            maxWidth="500px"
            footer={
                <>
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-submit" disabled={submitting || !clientId || !qty} onClick={handleSubmit}>
                        {submitting ? <Loader2 size={16} className="spinning" /> : 'Save Record'}
                    </button>
                </>
            }
        >
            <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
                <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        Source Client (Provider)
                    </label>
                    <select
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        required
                        disabled={!!editingSupply?.client_id}
                        style={{ width: '100%', height: '48px', borderRadius: '0.75rem', padding: '0 1rem', background: !!editingSupply?.client_id ? 'var(--bg-main)' : 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem', opacity: !!editingSupply?.client_id ? 0.7 : 1, cursor: !!editingSupply?.client_id ? 'not-allowed' : 'pointer' }}
                    >
                        <option value="">Select a client (MTN, Glo, etc.)</option>
                        {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {clients.length === 0 && (
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', fontWeight: 600 }}>
                            ⚠️ No clients found. Please add clients in the "Clients & Sites" section first.
                        </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Select the client that supplied the diesel to the depot.
                    </p>
                </div>

                <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        {editingSupply?.id ? 'Total Volume (Liters)' : 'Add to Stock (Liters)'}
                    </label>
                    <input
                        type="number"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        required
                        placeholder="e.g. 45000"
                        style={{ width: '100%', height: '48px', borderRadius: '0.75rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                    />
                </div>

                {editingSupply?.id && (
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                            Remaining Stock (Liters)
                        </label>
                        <input
                            type="number"
                            value={remQty}
                            readOnly
                            style={{ width: '100%', height: '48px', borderRadius: '0.75rem', padding: '0 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'not-allowed' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Remaining quantity is tracked automatically based on allocations.
                        </p>
                    </div>
                )}

                <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                        Date of Supply
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                        style={{ width: '100%', height: '48px', borderRadius: '0.75rem', padding: '0 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                    />
                </div>
            </form>
        </Modal>
    );
}
