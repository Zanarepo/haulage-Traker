"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, X, Clock, CheckCircle, Package, Trash2 } from 'lucide-react';
import { notificationService, Notification } from '@/services/notificationService';
import { useToast } from '@/hooks/useToast';

interface NotificationCenterProps {
    userId: string;
    onUpdate?: () => void;
}

export default function NotificationCenter({ userId, onUpdate }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (userId) {
            loadNotifications();
            // Optional: Real-time subscription could be added here
        }
    }, [userId]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications(userId);
            setNotifications(data);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('[NotificationCenter]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            showToast('Failed to mark as read', 'error');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead(userId);
            setNotifications([]);
            setIsOpen(false);
            if (onUpdate) onUpdate();
            showToast('All notifications cleared', 'success');
        } catch (err) {
            showToast('Failed to clear notifications', 'error');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'request': return <Clock size={16} color="#f59e0b" />;
            case 'approved': return <CheckCircle size={16} color="#3b82f6" />;
            case 'fulfilled': return <Package size={16} color="#10b981" />;
            case 'rejected': return <X size={16} color="#ef4444" />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <div className="notification-center-global" style={{ position: 'relative' }}>
            <button
                className="notification-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        boxShadow: '0 0 0 2px var(--bg-card)'
                    }}>
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 2000,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOTIFICATIONS</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {notifications.length > 0 && (
                                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Clear All
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                                <Bell size={32} color="var(--border-color)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All caught up!</div>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }} onClick={() => notif.link && (window.location.href = notif.link)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ marginTop: '2px' }}>{getIcon(notif.type)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px', color: 'var(--text-main)' }}>{notif.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.message}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{notif.module}</span>
                                            {notif.link && <span style={{ color: 'var(--brand-main)', fontSize: '0.7rem', fontWeight: 700 }}>View →</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleMarkRead(notif.id, e)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'flex-start', padding: '4px' }}
                                        title="Mark as read"
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
