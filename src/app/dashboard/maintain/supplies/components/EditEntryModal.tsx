import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { Save } from 'lucide-react';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

interface EditEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any;
    onSuccess?: () => void;
}

export default function EditEntryModal({ isOpen, onClose, entry, onSuccess }: EditEntryModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({ quantity: 0, notes: '' });

    useEffect(() => {
        if (entry) {
            setValues({
                quantity: entry.quantity,
                notes: entry.notes || ''
            });
        }
    }, [entry, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await maintainService.updateLedgerEntry(entry.id, values);
            showToast('Entry updated successfully.', 'success');
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('Failed to update entry.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Entry"
            maxWidth="450px"
        >
            <form onSubmit={handleSave} style={{ padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                            Quantity ({entry?.unit || 'pcs'})
                        </label>
                        <input
                            type="number"
                            value={values.quantity}
                            onChange={(e) => setValues({ ...values, quantity: Number(e.target.value) })}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                            Notes
                        </label>
                        <textarea
                            value={values.notes}
                            onChange={(e) => setValues({ ...values, notes: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem',
                                resize: 'none'
                            }}
                            placeholder="Add any additional context..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            className="btn-pagination"
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.75rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                            style={{ flex: 2, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
