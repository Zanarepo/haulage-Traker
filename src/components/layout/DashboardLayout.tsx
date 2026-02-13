"use client";

import './DashboardLayout.css';
import { useState, useEffect } from 'react';
import { useLayout } from '@/hooks/useLayout';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { getItem, STORES } from '@/lib/indexedDB';
import {
  BarChart3,
  Users as UsersIcon,
  Truck,
  MapPin,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Moon,
  Sun,
  LayoutDashboard,
  ShieldCheck,
  Package,
  Wifi,
  WifiOff,
  Navigation,
  Calculator
} from 'lucide-react';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'md', 'accountant', 'auditor', 'admin', 'driver', 'site_engineer'] },
  { title: 'Company Management', icon: <ShieldCheck size={20} />, path: '/dashboard/company', roles: ['superadmin'] },
  { title: 'Teams & Users', icon: <UsersIcon size={20} />, path: '/dashboard/users', roles: ['superadmin', 'admin'] },
  { title: 'Clusters', icon: <MapPin size={20} />, path: '/dashboard/clusters', roles: ['superadmin', 'admin', 'md'] },
  { title: 'Clients & Sites', icon: <MapPin size={20} />, path: '/dashboard/sites', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { title: 'Inventory', icon: <Package size={20} />, path: '/dashboard/inventory', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { title: 'Trips & Logistics', icon: <Truck size={20} />, path: '/dashboard/trips', roles: ['superadmin', 'admin', 'md', 'auditor', 'driver'] },
  { title: 'Financials', icon: <BarChart3 size={20} />, path: '/dashboard/financials', roles: ['superadmin', 'md', 'accountant', 'auditor'] },
  { title: 'Supplies Reconciliation', icon: <Calculator size={20} />, path: '/dashboard/reconciliation', roles: ['superadmin', 'admin', 'md', 'accountant', 'driver'] },
  { title: 'Live Tracking', icon: <Navigation size={20} />, path: '/dashboard/tracking', roles: ['superadmin', 'admin', 'md'] },
  { title: 'Documents', icon: <FileText size={20} />, path: '/dashboard/documents', roles: ['superadmin', 'admin', 'md', 'accountant', 'auditor', 'driver', 'site_engineer'] },
  { title: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings', roles: ['superadmin', 'admin', 'md', 'accountant', 'auditor', 'driver', 'site_engineer'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    profile,
    isCollapsed,
    isMobileOpen,
    isDarkMode,
    isOnline,
    toggleSidebar,
    toggleMobileOpen,
    toggleDarkMode,
    closeMobile,
    handleLogout
  } = useLayout();

  // Activate background location tracking
  useLocationTracking();

  // Read lastUpdated directly from IndexedDB after mount (avoids hydration mismatch)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    getItem<string>(STORES.DASHBOARD, 'lastUpdated').then((val) => {
      if (val) setLastUpdated(val);
    });
  }, []);

  const filteredItems = sidebarItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <div className="layout-root">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="brand">
          <div className="logo-icon"><Truck size={18} /></div>
          <span className="brand-name">HT</span>
        </div>
        <button onClick={() => toggleMobileOpen(true)} className="menu-trigger">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileOpen && <div className="backdrop" onClick={closeMobile} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="brand">
              <div className="logo-icon"><Truck size={20} /></div>
              {!isCollapsed && <span className="brand-name">HaulageTracker</span>}
            </div>
            <button onClick={toggleSidebar} className="toggle-btn desktop-only">
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* User Profile Info */}
          {!isCollapsed && (
            <div className="user-capsule">
              <div className="profile-info">
                <p className="user-name">{profile?.full_name || 'User'}</p>
                <div className={`role-tag ${profile?.role}`}>{profile?.role}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="nav-list">
            {filteredItems.map((item) => (
              <a
                key={item.title}
                href={item.path}
                className="nav-item"
                onClick={closeMobile}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-title">{item.title}</span>}
              </a>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {!isCollapsed && (isOnline ? 'System Online' : 'Offline Mode')}
            </div>

            {mounted && !isCollapsed && lastUpdated && (
              <div className="last-sync">
                Last cached: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}

            <button onClick={toggleDarkMode} className="footer-btn">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {!isCollapsed && <span>Appearance</span>}
            </button>

            <button onClick={handleLogout} className="footer-btn logout">
              <LogOut size={18} />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`main-container ${isCollapsed ? 'expanded' : ''}`}>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
