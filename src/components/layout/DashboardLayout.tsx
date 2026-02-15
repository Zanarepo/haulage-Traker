"use client";

import './DashboardLayout.css';
import { useState, useEffect } from 'react';
import { useLayout } from '@/hooks/useLayout';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { getItem, STORES } from '@/lib/indexedDB';
import NexHaulLogo from '@/components/NexHaulLogo';
import { useSubscription } from '@/hooks/useSubscription';
import PlanBadge from '@/components/subscription/PlanBadge';
import UpgradeModal from '@/components/subscription/UpgradeModal';
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
  Calculator,
  Crown,
  Lock
} from 'lucide-react';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
  premiumOnly?: boolean; // If true, locked on free plan
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'md', 'accountant', 'auditor', 'admin', 'driver', 'site_engineer'] },
  { title: 'Company Management', icon: <ShieldCheck size={20} />, path: '/dashboard/company', roles: ['superadmin'] },
  { title: 'Teams & Users', icon: <UsersIcon size={20} />, path: '/dashboard/users', roles: ['superadmin', 'admin'] },
  { title: 'Clusters', icon: <MapPin size={20} />, path: '/dashboard/clusters', roles: ['superadmin', 'admin', 'md'] },
  { title: 'Clients & Sites', icon: <MapPin size={20} />, path: '/dashboard/sites', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { title: 'Inventory', icon: <Package size={20} />, path: '/dashboard/inventory', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { title: 'Trips & Logistics', icon: <Truck size={20} />, path: '/dashboard/trips', roles: ['superadmin', 'admin', 'md', 'auditor', 'driver'] },
  { title: 'Financials', icon: <BarChart3 size={20} />, path: '/dashboard/financials', roles: ['superadmin', 'md', 'accountant', 'auditor'], premiumOnly: true },
  { title: 'Supplies Reconciliation', icon: <Calculator size={20} />, path: '/dashboard/reconciliation', roles: ['superadmin', 'admin', 'md', 'accountant', 'driver'], premiumOnly: true },
  { title: 'Live Tracking', icon: <Navigation size={20} />, path: '/dashboard/tracking', roles: ['superadmin', 'admin', 'md'], premiumOnly: true },
  { title: 'Documents', icon: <FileText size={20} />, path: '/dashboard/documents', roles: ['superadmin', 'admin', 'md', 'accountant', 'auditor', 'driver', 'site_engineer'], premiumOnly: true },
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

  // Subscription state for feature gates
  const { effectivePlanId, isFreePlan } = useSubscription(profile?.company_id || null);
  const [showSidebarUpgrade, setShowSidebarUpgrade] = useState(false);

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
        <NexHaulLogo size={32} />
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
            <NexHaulLogo size={40} showText={!isCollapsed} className="brand-link" />
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
              {profile?.company_id && (
                <PlanBadgeWrapper companyId={profile.company_id} email={profile.email || ''} />
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="nav-list">
            {filteredItems.map((item) => {
              const isLocked = (() => {
                if (isFreePlan && item.premiumOnly) return true;

                // Specific feature locks for Small Business (Keep Enterprise-only features locked)
                if (effectivePlanId === 'small_business') {
                  if (item.title === 'Financials' || item.title === 'Supplies Reconciliation') return true;
                }

                return false;
              })();

              return isLocked ? (
                <button
                  key={item.title}
                  className="nav-item locked"
                  onClick={() => setShowSidebarUpgrade(true)}
                  title="Upgrade to unlock"
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-title">{item.title}</span>
                      <Lock size={13} className="lock-icon" />
                    </>
                  )}
                </button>
              ) : (
                <a
                  key={item.title}
                  href={item.path}
                  className="nav-item"
                  onClick={closeMobile}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-title">{item.title}</span>}
                </a>
              );
            })}
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

      {/* Sidebar feature-gate Upgrade Modal */}
      {showSidebarUpgrade && profile?.company_id && (
        <UpgradeModal
          isOpen={showSidebarUpgrade}
          onClose={() => setShowSidebarUpgrade(false)}
          currentPlan={effectivePlanId}
          companyId={profile.company_id}
          userEmail={profile.email || ''}
        />
      )}
    </div>
  );
}

/** Small wrapper to isolate the useSubscription hook from the layout */
function PlanBadgeWrapper({ companyId, email }: { companyId: string; email: string }) {
  const { effectivePlanId, trialDaysRemaining, isTrialActive, isFreePlan } = useSubscription(companyId);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const showUpgradeButton = isTrialActive || isFreePlan;

  return (
    <>
      <PlanBadge
        plan={effectivePlanId}
        trialDaysRemaining={trialDaysRemaining}
        onClick={() => setShowUpgrade(true)}
      />
      {showUpgradeButton && (
        <button
          className="sidebar-upgrade-btn"
          onClick={() => setShowUpgrade(true)}
        >
          <Crown size={14} />
          Upgrade Plan
        </button>
      )}
      {showUpgrade && (
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          currentPlan={effectivePlanId}
          companyId={companyId}
          userEmail={email}
        />
      )}
    </>
  );
}
