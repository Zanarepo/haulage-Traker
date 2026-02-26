"use client";

import './DashboardLayout.css';
import { useState, useEffect } from 'react';
import { useLayout } from '@/hooks/useLayout';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { getItem, STORES } from '@/lib/indexedDB';
import NexHaulLogo from '@/components/NexHaulLogo';
import { useSubscription } from '@/hooks/useSubscription';
import PlanBadge from '@/components/subscription/PlanBadge';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { PRODUCTS, isSharedItem, ProductId } from '@/config/productConfig';
import DashboardHeader from './DashboardHeader';
import { notificationService } from '@/services/notificationService';
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
  Lock,
  // Maintain icons
  Wrench,
  ClipboardList,
  Cpu,
  Camera,
  PackageCheck,
  CalendarClock,
  ShieldAlert,
  FileBarChart,
  BookOpen,
  Barcode,
  LayoutGrid
} from 'lucide-react';

interface SidebarItem {
  key: string;           // Unique key for product filtering
  title: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
  premiumOnly?: boolean;
}

/**
 * All possible sidebar items across both products.
 * Each has a `key` used by productConfig to determine visibility.
 */
const allSidebarItems: SidebarItem[] = [
  // ── Shared Core ──
  { key: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['superadmin', 'md', 'accountant', 'auditor', 'admin', 'driver', 'site_engineer'] },
  { key: 'company', title: 'Company Management', icon: <ShieldCheck size={20} />, path: '/dashboard/company', roles: ['superadmin'] },
  { key: 'users', title: 'Teams & Users', icon: <UsersIcon size={20} />, path: '/dashboard/users', roles: ['superadmin', 'admin'] },
  { key: 'clusters', title: 'Clusters', icon: <MapPin size={20} />, path: '/dashboard/clusters', roles: ['superadmin', 'admin', 'md'] },
  { key: 'sites', title: 'Clients & Sites', icon: <MapPin size={20} />, path: '/dashboard/sites', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { key: 'app-center', title: 'App Center', icon: <LayoutGrid size={20} />, path: '/dashboard/app-center', roles: ['superadmin'] },

  // ── InfraSupply ──
  { key: 'inventory', title: 'Inventory', icon: <Package size={20} />, path: '/dashboard/inventory', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { key: 'trips', title: 'Trips & Logistics', icon: <Truck size={20} />, path: '/dashboard/trips', roles: ['superadmin', 'admin', 'md', 'auditor', 'driver', 'site_engineer'] },
  { key: 'financials', title: 'Financials', icon: <BarChart3 size={20} />, path: '/dashboard/financials', roles: ['superadmin', 'md', 'accountant', 'auditor'], premiumOnly: true },
  { key: 'reconciliation', title: 'Supplies Reconciliation', icon: <Calculator size={20} />, path: '/dashboard/reconciliation', roles: ['superadmin', 'admin', 'md', 'accountant', 'driver', 'site_engineer'], premiumOnly: true },
  { key: 'tracking', title: 'Live Tracking', icon: <Navigation size={20} />, path: '/dashboard/tracking', roles: ['superadmin', 'admin', 'md'], premiumOnly: true },
  { key: 'documents', title: 'Documents', icon: <FileText size={20} />, path: '/dashboard/documents', roles: ['superadmin', 'admin', 'md', 'accountant', 'auditor', 'driver', 'site_engineer'], premiumOnly: true },

  // ── Maintain ──
  { key: 'work-orders', title: 'Work Orders', icon: <ClipboardList size={20} />, path: '/dashboard/maintain/work-orders', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },
  { key: 'assets', title: 'Asset Registry', icon: <Cpu size={20} />, path: '/dashboard/maintain/assets', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },
  { key: 'visit-reports', title: 'Visit Reports', icon: <Camera size={20} />, path: '/dashboard/maintain/visit-reports', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },
  { key: 'supplies', title: 'Supply Tracking', icon: <PackageCheck size={20} />, path: '/dashboard/maintain/supplies', roles: ['superadmin', 'admin', 'md', 'accountant', 'site_engineer'] },
  { key: 'receiving', title: 'Stock Receiving', icon: <Barcode size={20} />, path: '/dashboard/maintain/receiving', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { key: 'schedule', title: 'PM Schedule', icon: <CalendarClock size={20} />, path: '/dashboard/maintain/schedule', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },
  { key: 'safety', title: 'Safety Compliance', icon: <ShieldAlert size={20} />, path: '/dashboard/maintain/safety', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },
  { key: 'reports', title: 'Reports Centre', icon: <FileBarChart size={20} />, path: '/dashboard/maintain/reports', roles: ['superadmin', 'admin', 'md', 'accountant'] },
  { key: 'knowledge-base', title: 'Knowledge Base', icon: <BookOpen size={20} />, path: '/dashboard/maintain/knowledge-base', roles: ['superadmin', 'admin', 'md', 'site_engineer'] },

  // ── Shared (bottom) ──
  { key: 'settings', title: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings', roles: ['superadmin', 'admin', 'md', 'accountant', 'auditor', 'driver', 'site_engineer'] },
];

import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    handleLogout,
    availableProfiles,
    switchProfile
  } = useLayout();

  const hasNexHaulAccess = availableProfiles?.some(p => p.type === 'platform') ?? false;

  // Product modules
  const { activeModules, activeProduct, setActiveProduct: setActiveProductHook, isMultiProduct } = useCompanyModules(profile?.company_id || null);

  const setActiveProduct = (modId: ProductId) => {
    setActiveProductHook(modId);
    router.push(PRODUCTS[modId].dashboardPath);
  };

  // Subscription state for feature gates
  const { effectivePlanId, isFreePlan } = useSubscription(profile?.company_id || null);
  const [showSidebarUpgrade, setShowSidebarUpgrade] = useState(false);

  // Activate background location tracking
  useLocationTracking();

  // Guard: Ensure tenant profile is active in Fleet Dashboard
  useEffect(() => {
    if (profile && profile.type !== 'tenant') {
      const tenant = availableProfiles?.find(p => p.type === 'tenant');
      if (tenant) {
        switchProfile(tenant.id, 'tenant');
      }
    }
  }, [profile, availableProfiles, switchProfile]);

  // Read lastUpdated directly from IndexedDB after mount (avoids hydration mismatch)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    getItem<string>(STORES.DASHBOARD, 'lastUpdated').then((val) => {
      if (val) setLastUpdated(val);
    });
  }, []);

  // Filter sidebar items: role + product module visibility
  const filteredItems = allSidebarItems.filter(item => {
    // Must have the right role
    if (!profile?.role || !item.roles.includes(profile.role)) return false;

    // Shared items always visible
    if (isSharedItem(item.key)) return true;

    // Product-specific: check if the current active product includes this key
    const product = PRODUCTS[activeProduct];
    return product?.sidebarKeys.includes(item.key) || false;
  }).map(item => {
    // Dynamically set dashboard path to match active product
    if (item.key === 'dashboard') {
      return { ...item, path: PRODUCTS[activeProduct].dashboardPath };
    }
    return item;
  });

  // Split items: shared top, product-specific, shared bottom (settings)
  const topSharedItems = filteredItems.filter(i => isSharedItem(i.key) && i.key !== 'settings');
  const productItems = filteredItems.filter(i => !isSharedItem(i.key));
  const bottomItems = filteredItems.filter(i => i.key === 'settings');

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile?.id) {
      loadUnreadCounts();
      // Polling or subscription could be here
      const interval = setInterval(loadUnreadCounts, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  const loadUnreadCounts = async () => {
    if (!profile?.id) return;
    try {
      const counts = await notificationService.getUnreadCounts(profile.id);
      setUnreadCounts(counts);
    } catch (err) {
      console.warn('[loadUnreadCounts]', err);
    }
  };

  return (
    <div className="layout-root">
      {/* Mobile Header */}
      <header className="mobile-header">
        <NexHaulLogo size={32} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => toggleMobileOpen(true)} className="menu-trigger">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileOpen && <div className="backdrop" onClick={closeMobile} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          {/* Logo Section */}
          <div className="logo-section">
            <NexHaulLogo size={40} showText={!isCollapsed || isMobileOpen} className="brand-link" />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={toggleSidebar} className="toggle-btn desktop-only">
                {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
          </div>



          {/* Navigation */}
          <nav className="nav-list">
            {/* Shared top items */}
            {topSharedItems.map((item) => renderNavItem(item, isCollapsed && !isMobileOpen, isFreePlan, effectivePlanId, closeMobile, setShowSidebarUpgrade, unreadCounts))}

            {/* Product section separator */}
            {productItems.length > 0 && (!isCollapsed || isMobileOpen) && (
              <div className="nav-section-label">
                <span>{PRODUCTS[activeProduct]?.icon} {PRODUCTS[activeProduct]?.name}</span>
              </div>
            )}
            {productItems.length > 0 && isCollapsed && !isMobileOpen && (
              <div className="nav-section-divider" />
            )}

            {/* Product-specific items */}
            {productItems.map((item) => renderNavItem(item, isCollapsed && !isMobileOpen, isFreePlan, effectivePlanId, closeMobile, setShowSidebarUpgrade, unreadCounts))}

            {/* Settings at bottom */}
            {bottomItems.length > 0 && <div className="nav-section-divider" />}
            {bottomItems.map((item) => renderNavItem(item, isCollapsed && !isMobileOpen, isFreePlan, effectivePlanId, closeMobile, setShowSidebarUpgrade, unreadCounts))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {(!isCollapsed || isMobileOpen) && (isOnline ? 'System Online' : 'Offline Mode')}
            </div>

            {mounted && (!isCollapsed || isMobileOpen) && lastUpdated && (
              <div className="last-sync">
                Last cached: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}

            <button onClick={toggleDarkMode} className="footer-btn">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {(!isCollapsed || isMobileOpen) && <span>Appearance</span>}
            </button>

            {hasNexHaulAccess && (
              <button
                onClick={() => {
                  const platform = availableProfiles?.find(p => p.type === 'platform');
                  if (platform) {
                    switchProfile(platform.id, 'platform');
                    router.push('/nexhaul');
                  }
                }}
                className="footer-btn switch-btn"
              >
                <ShieldCheck size={18} className="text-purple-400" />
                {(!isCollapsed || isMobileOpen) && <span>Switch to NexHaul</span>}
              </button>
            )}

            <button onClick={handleLogout} className="footer-btn logout">
              <LogOut size={18} />
              {(!isCollapsed || isMobileOpen) && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`main-container ${isCollapsed ? 'expanded' : ''}`}>
        <DashboardHeader onNotificationUpdate={loadUnreadCounts} />
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

/** Render a single nav item (handles locked state) */
function renderNavItem(
  item: SidebarItem,
  isCollapsed: boolean,
  isFreePlan: boolean,
  effectivePlanId: string,
  closeMobile: () => void,
  setShowSidebarUpgrade: (v: boolean) => void,
  unreadCounts: Record<string, number> = {}
) {
  const isLocked = (() => {
    if (isFreePlan && item.premiumOnly) return true;
    if (effectivePlanId === 'small_business') {
      if (item.title === 'Financials' || item.title === 'Supplies Reconciliation') return true;
    }
    return false;
  })();

  // Determine module key for notifications
  const moduleKey = item.key === 'supplies' ? 'maintain' : item.key; // Example mapping
  const count = unreadCounts[moduleKey] || 0;

  return isLocked ? (
    <button
      key={item.key}
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
      key={item.key}
      href={item.path}
      className="nav-item"
      onClick={closeMobile}
      style={{ position: 'relative' }}
    >
      <span className="nav-icon">
        {item.icon}
        {isCollapsed && count > 0 && (
          <span className="count-badge-collapsed">{count}</span>
        )}
      </span>
      {!isCollapsed && (
        <>
          <span className="nav-title">{item.title}</span>
          {count > 0 && (
            <span className="count-badge-sidebar">{count}</span>
          )}
        </>
      )}
    </a>
  );
}
