import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/business/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/business/leads', label: 'Leads', icon: '👥' },
  { path: '/business/campaigns', label: 'Campaigns', icon: '📧' },
  { path: '/business/automation', label: 'Automation', icon: '🤖' },
  { path: '/business/settings', label: 'Settings', icon: '⚙️' },
];

export const Navigation: React.FC<NavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            display: 'none',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        style={{
          width: '16rem',
          background: 'var(--color-dark-bg-secondary)',
          borderRight: '1px solid var(--color-dark-border)',
          padding: 'var(--space-16) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          zIndex: 40,
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo / Brand */}
        <div style={{ padding: '0 var(--space-16)', marginBottom: 'var(--space-20)' }}>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
            🚀 Redeem
          </h1>
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: 'var(--space-10) var(--space-16)',
                textDecoration: 'none',
                color: isActive(item.path) ? 'var(--color-primary-400)' : 'var(--color-text-secondary)',
                background: isActive(item.path) ? 'var(--color-dark-surface)' : 'transparent',
                borderLeft: isActive(item.path) ? '4px solid var(--color-primary-500)' : '4px solid transparent',
                transition: 'all var(--transition-base)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isActive(item.path) ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                display: 'flex',
                gap: 'var(--space-8)',
                alignItems: 'center',
              }}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom section (logout, etc.) */}
        <div style={{ padding: '0 var(--space-16)', borderTop: '1px solid var(--color-dark-border)', paddingTop: 'var(--space-12)' }}>
          <Link
            to="/logout"
            style={{
              padding: 'var(--space-10) var(--space-16)',
              textDecoration: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              gap: 'var(--space-8)',
              alignItems: 'center',
              transition: 'all var(--transition-base)',
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </Link>
        </div>
      </nav>

      {/* Main content offset for desktop */}
      <style>{`
        @media (max-width: 768px) {
          nav {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            padding: var(--space-12) !important;
            border-right: none !important;
            border-bottom: 1px solid var(--color-dark-border) !important;
          }
        }
      `}</style>

      {/* Spacer for desktop layout */}
      <div style={{ width: '16rem', display: 'block' }} />
    </>
  );
};
