"use client";

import React from 'react';
import Modal from '@/components/Modal/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    variant?: 'danger' | 'warning';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    variant = 'danger'
}: ConfirmationModalProps) {
    const isDanger = variant === 'danger';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="450px"
            footer={
                <>
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn-submit ${isDanger ? 'btn-danger' : ''}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className="spinning" /> : confirmText}
                    </button>
                </>
            }
        >
            <div className="confirmation-content" style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <div className={`confirmation-icon ${variant}`} style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: isDanger ? '#ef4444' : '#f59e0b',
                    flexShrink: 0
                }}>
                    <AlertTriangle size={24} />
                </div>
                <div className="confirmation-body">
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {message}
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                        This action cannot be undone.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
