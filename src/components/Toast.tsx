"use client";

import { useToast } from '@/hooks/useToast';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: { bg: '#05261e', border: '#10b981', text: '#34d399', icon: '#10b981' },
    error: { bg: '#2a0a0a', border: '#ef4444', text: '#fca5a5', icon: '#ef4444' },
    info: { bg: '#0a1a2a', border: '#3b82f6', text: '#93c5fd', icon: '#3b82f6' },
    warning: { bg: '#2a1e05', border: '#f59e0b', text: '#fcd34d', icon: '#f59e0b' },
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 380,
            width: '100%',
            pointerEvents: 'none',
        }}>
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                const color = colors[toast.type];
                return (
                    <div
                        key={toast.id}
                        style={{
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: color.bg,
                            border: `1px solid ${color.border}30`,
                            boxShadow: `0 4px 24px ${color.border}20`,
                            color: color.text,
                            fontSize: 13,
                            fontWeight: 500,
                            animation: 'toast-slide-in 0.3s ease-out',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <Icon size={18} style={{ color: color.icon, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: color.text,
                                cursor: 'pointer',
                                padding: 2,
                                opacity: 0.6,
                                flexShrink: 0,
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
            <style>{`
                @keyframes toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
