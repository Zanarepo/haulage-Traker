"use client";

import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
    onNotificationUpdate?: () => void;
}

export default function DashboardHeader({ onNotificationUpdate }: DashboardHeaderProps) {
    const { profile } = useAuth();

    return (
        <header className="dashboard-top-header">
            <div className="header-left">
                {/* Could add breadcrumbs or page title here later */}
            </div>

            <div className="header-right">
                <NotificationCenter userId={profile?.id || ''} onUpdate={onNotificationUpdate} />
            </div>
        </header>
    );
}
