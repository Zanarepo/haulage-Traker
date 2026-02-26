"use client";

import React from 'react';
import NexHaulLogo from '@/components/NexHaulLogo';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    ShieldCheck,
    Users,
    Settings,
    LogOut,
    Menu,
    ChevronLeft,
    Building2,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './NexHaulLayout.css';

export default function NexHaulLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, availableProfiles, signOut, platformProfile, switchProfile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Guard: Ensure platform profile is active in NexHaul Mission Control
    useEffect(() => {
        if (profile && profile.type !== 'platform') {
            const platform = availableProfiles?.find(p => p.type === 'platform');
            if (platform) {
                switchProfile(platform.id, 'platform');
            }
        }
    }, [profile, availableProfiles, switchProfile]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const hasDashboardAccess = availableProfiles?.some(p => p.type === 'tenant') ?? false;

    const menuItems = [
        { title: 'Overview', icon: <LayoutDashboard size={20} />, path: '/nexhaul' },
        { title: 'Companies', icon: <Building2 size={20} />, path: '/nexhaul/companies', roles: ['nexsuper', 'nexadmin'] },
        { title: 'Platform Admins', icon: <ShieldCheck size={20} />, path: '/nexhaul/admins', roles: ['nexsuper'] },
        { title: 'System Settings', icon: <Settings size={20} />, path: '/nexhaul/settings' },
    ];


    const filteredMenu = menuItems.filter(item =>
        !item.roles || (platformProfile?.role && item.roles.includes(platformProfile.role))
    );

    const closeMobile = () => setIsMobileOpen(false);

    return (
        <div className="nexhaul-layout">
            {/* ── Mobile Header ── */}
            <header className="nh-mobile-header">
                <NexHaulLogo size={28} showText />
                <button onClick={() => setIsMobileOpen(true)} className="nh-menu-trigger" aria-label="Open menu">
                    <Menu size={22} />
                </button>
            </header>

            {/* ── Mobile Backdrop ── */}
            {isMobileOpen && <div className="nh-backdrop" onClick={closeMobile} />}

            {/* ── Sidebar ── */}
            <aside className={`nexhaul-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <NexHaulLogo size={32} showText={!isCollapsed || isMobileOpen} />
                    <button
                        onClick={() => {
                            if (isMobileOpen) {
                                closeMobile();
                            } else {
                                setIsCollapsed(!isCollapsed);
                            }
                        }}
                        className="toggle-btn"
                    >
                        {isMobileOpen ? <X size={20} /> : isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className={`admin-badge ${platformProfile?.role || 'platform'}`}>
                    <ShieldCheck size={14} />
                    {(!isCollapsed || isMobileOpen) && (
                        <span>{platformProfile?.role?.replace('nex', 'Nex') || 'PLATFORM ADMIN'}</span>
                    )}
                </div>

                <nav className="nav-list">
                    {filteredMenu.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.path}
                            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <span className="icon">{item.icon}</span>
                            {(!isCollapsed || isMobileOpen) && <span className="title">{item.title}</span>}
                        </a>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        {(!isCollapsed || isMobileOpen) && (
                            <div className="user-details">
                                <p className="name">{platformProfile?.full_name || profile?.full_name}</p>
                                <p className="role">{platformProfile?.role || 'Platform Admin'}</p>
                            </div>
                        )}
                    </div>
                    {hasDashboardAccess && (
                        <button
                            onClick={() => {
                                const tenant = availableProfiles?.find(p => p.type === 'tenant');
                                if (tenant) {
                                    switchProfile(tenant.id, 'tenant');
                                    router.push('/dashboard');
                                }
                            }}
                            className="switch-workspace-btn"
                            title="Back to Dashboard"
                        >
                            <LayoutDashboard size={20} className="text-blue-400" />
                            {(!isCollapsed || isMobileOpen) && <span>Switch to Dashboard</span>}
                        </button>
                    )}
                    <button onClick={signOut} className="logout-btn">
                        <LogOut size={20} />
                        {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <main className={`nexhaul-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
                <header className="nexhaul-header">
                    <h1>NexHaul Mission Control</h1>
                    <div className="header-actions">
                        {/* Global Search or Notifications could go here */}
                    </div>
                </header>
                <div className="nexhaul-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
