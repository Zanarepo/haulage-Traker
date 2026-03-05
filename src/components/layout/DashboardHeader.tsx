"use client";

import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import AppLauncher from './AppLauncher';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
    onNotificationUpdate?: () => void;
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export default function DashboardHeader({
    onNotificationUpdate,
    isSidebarCollapsed,
    onToggleSidebar
}: DashboardHeaderProps) {
    const { profile } = useAuth();

    return (
        <header className="dashboard-top-header">
            <div className="header-left">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="sidebar-toggle-btn desktop-only"
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                )}
            </div>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AppLauncher companyId={profile?.company_id || null} />
                <NotificationCenter userId={profile?.id || ''} onUpdate={onNotificationUpdate} />
            </div>
        </header>
    );
}
