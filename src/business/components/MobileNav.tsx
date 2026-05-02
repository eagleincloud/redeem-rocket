/**
 * MobileNav Component
 * Bottom navigation tab bar for mobile devices (< 768px)
 * Shows 4 main tabs + "More" menu with drawer
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useViewport } from '../hooks/useViewport';
import {
  LayoutDashboard, ShoppingBag, Tag, UserCheck, Menu, X,
  Workflow, Share2, BarChart3, TrendingUp, Settings, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './MobileNav.css';

interface NavTabItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface DrawerItem {
  label: string;
  path: string;
  icon: LucideIcon;
  isPremium?: boolean;
}

const MAIN_TABS: NavTabItem[] = [
  { label: 'Home', path: '/app', icon: LayoutDashboard },
  { label: 'Orders', path: '/app/orders', icon: ShoppingBag },
  { label: 'Offers', path: '/app/offers', icon: Tag },
  { label: 'Leads', path: '/app/leads', icon: UserCheck },
];

const DRAWER_ITEMS: DrawerItem[] = [
  { label: 'Campaigns', path: '/app/campaigns', icon: Menu },
  { label: 'Automation', path: '/app/automation', icon: Workflow },
  { label: 'Social', path: '/app/social', icon: Share2 },
  { label: 'Analytics', path: '/app/analytics', icon: BarChart3 },
  { label: 'Grow & Ads', path: '/app/grow', icon: TrendingUp },
  { label: 'Settings', path: '/app/profile', icon: Settings },
];

interface MobileNavProps {
  onLogout?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onLogout }) => {
  const { isMobile } = useViewport();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isMobile) return null;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.path}
            className={`tab-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            title={tab.label}
          >
            <tab.icon size={24} />
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}

        {/* More Menu */}
        <button
          className={`tab-item ${drawerOpen ? 'active' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
          title="More options"
        >
          <Menu size={24} />
          <span className="tab-label">More</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="drawer-overlay"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="mobile-drawer">
            {/* Drawer Header */}
            <div className="drawer-header">
              <h3>Menu</h3>
              <button
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                title="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body">
              {DRAWER_ITEMS.map((item) => (
                <button
                  key={item.path}
                  className={`drawer-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.isPremium && <span className="premium-badge">PRO</span>}
                </button>
              ))}

              <div className="drawer-divider" />

              {/* Drawer Footer - Logout */}
              {onLogout && (
                <button
                  className="drawer-item logout-btn"
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNav;
