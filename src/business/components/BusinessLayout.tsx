import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Navigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { usePersistedState } from '../hooks/usePersistedState';
import { useThemeLoader } from '../hooks/useThemeLoader';
import { supabase } from '@/app/lib/supabase';
import {
  LayoutDashboard, Package, Tag, Gavel, ShoppingBag, ClipboardList,
  Wallet, BarChart3, Image, User, Bell, CreditCard, Menu, X, Sun, Moon,
  LogOut, ChevronRight, TrendingUp, AlertCircle, Lock, Zap,
  Megaphone, Users, Receipt, UserCheck, RadioTower, Search,
  Mail, Link2, Workflow, Share2, Boxes, Truck, FileText, DollarSign,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  planRequired?: 'basic' | 'pro' | 'enterprise';
};

type NavGroup = {
  label: string;
  isPremium?: boolean;
  items: NavItem[];
};

// ── Nav Groups ─────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  // ── 1. Home ──────────────────────────────────────────────────────────────────
  {
    label: 'HOME',
    items: [
      { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
    ],
  },

  // ── 2. Redeem Rocket — core platform features ─────────────────────────────────
  {
    label: 'REDEEM ROCKET',
    items: [
      { label: 'Orders',   path: '/app/orders',   icon: ShoppingBag },
      { label: 'Products', path: '/app/products', icon: Package },
      { label: 'Offers',   path: '/app/offers',   icon: Tag },
      { label: 'Auctions', path: '/app/auctions', icon: Gavel, planRequired: 'pro' },
    ],
  },

  // ── 2A. Inventory — stock management (Phase 2) ───────────────────────────────
  {
    label: 'INVENTORY',
    items: [
      { label: 'Dashboard',        path: '/app/inventory',             icon: Boxes },
      { label: 'Products Stock',   path: '/app/inventory/products',    icon: Package },
      { label: 'Stock Movements',  path: '/app/inventory/movements',   icon: Truck },
      { label: 'Purchase Orders',  path: '/app/inventory/orders',      icon: Receipt },
      { label: 'Reports',          path: '/app/inventory/reports',     icon: FileText },
    ],
  },


  // ── 2B. Finance & Accounting (Phase 2) ───────────────────────────────────────
  {
    label: 'FINANCE',
    items: [
      { label: 'Dashboard',     path: '/app/finance',       icon: DollarSign },
      { label: 'Expenses',      path: '/app/expenses',      icon: CreditCard },
      { label: 'Reports',       path: '/app/financial-reports', icon: FileText },
    ],
  },

  // ── 2C. Payments & Invoicing (Phase 2) ─────────────────────────────────────────
  {
    label: 'PAYMENTS',
    items: [
      { label: 'Payment Links', path: '/app/payment-links', icon: Wallet },
      { label: 'Dashboard',     path: '/app/payments',      icon: DollarSign },
    ],
  },

  // ── 3. Leads & CRM — sales pipeline ──────────────────────────────────────────
  {
    label: 'LEADS & CRM',
    items: [
      { label: 'Leads',        path: '/app/leads',        icon: UserCheck,    planRequired: 'basic' },
      { label: 'Requirements', path: '/app/requirements', icon: ClipboardList },
    ],
  },

  // ── 4. Marketing — campaigns, outreach, growth ───────────────────────────────
  {
    label: 'MARKETING',
    isPremium: true,
    items: [
      { label: 'Campaigns',     path: '/app/campaigns',     icon: Users },
      { label: 'Email Setup',   path: '/app/email-setup',   icon: Mail,       planRequired: 'basic' },
      { label: 'Connectors',    path: '/app/connectors',    icon: Link2,      planRequired: 'basic' },
      { label: 'Automation',    path: '/app/automation',    icon: Workflow,   planRequired: 'basic' },
      { label: 'Social Media',  path: '/app/social',        icon: Share2,     planRequired: 'basic' },
      { label: 'Outreach',      path: '/app/outreach',      icon: RadioTower, planRequired: 'basic' },
      { label: 'Analytics',     path: '/app/analytics',     icon: BarChart3,  planRequired: 'basic' },
      { label: 'Grow & Ads',    path: '/app/grow',          icon: TrendingUp, planRequired: 'basic' },
    ],
  },

  // ── 5. Settings — business setup & configuration ─────────────────────────────
  {
    label: 'SETTINGS',
    items: [
      { label: 'Profile',       path: '/app/profile',       icon: User },
      { label: 'Photos',        path: '/app/photos',        icon: Image },
      { label: 'Team',          path: '/app/team',          icon: Users },
      { label: 'Subscription',  path: '/app/subscription',  icon: CreditCard },
      { label: 'Notifications', path: '/app/notifications', icon: Bell },
    ],
  },
];

// Bottom nav items (mobile) — 5 most-used daily features
const BOTTOM_NAV: NavItem[] = [
  { label: 'Home',   path: '/app',          icon: LayoutDashboard },
  { label: 'Orders', path: '/app/orders',   icon: ShoppingBag },
  { label: 'Offers', path: '/app/offers',   icon: Tag },
  { label: 'Leads',  path: '/app/leads',    icon: UserCheck, planRequired: 'basic' },
  { label: 'More',   path: '/app/profile',  icon: User },
];

// Flat list for header title lookup
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

// ── Global Search Types ────────────────────────────────────────────────────────
type SearchResultType = 'lead' | 'invoice' | 'offer' | 'campaign';
interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  path: string;
  emoji: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLAN_RANK: Record<string, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };
function meetsRequirement(userPlan: string, required?: string): boolean {
  if (!required) return true;
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

function getDaysLeft(expiry: string | null): number | null {
  if (!expiry) return null;
  const ms = new Date(expiry).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', basic: '#3b82f6', pro: '#fb923c', enterprise: '#f59e0b',
};

const PLAN_BADGE_LABELS: Record<string, string> = {
  basic: 'PAID', pro: 'PRO', enterprise: 'ENT',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function BusinessLayout() {
  const { bizUser, isLoading, logout } = useBusinessContext();
  // Load and apply business theme from database
  const { theme, isLoading: themeLoading, error: themeError } = useThemeLoader(bizUser?.id);
  // Sidebar open/collapsed state persisted per user
  const [sidebarOpen, setSidebarOpen] = usePersistedState<boolean>('sidebar_open', true, bizUser?.id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark, toggleTheme } = useTheme();
  const { isMobile } = useViewport();
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer when resizing to desktop
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time unread notification count
  useEffect(() => {
    if (!supabase || !bizUser?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('in_app_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', bizUser.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    // Subscribe to new notifications
    const channel = supabase
      .channel(`notif-badge-${bizUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'in_app_notifications',
        filter: `user_id=eq.${bizUser.id}`,
      }, () => setUnreadCount(c => c + 1))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'in_app_notifications',
        filter: `user_id=eq.${bizUser.id}`,
      }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bizUser?.id]);

  // Cmd+K / Ctrl+K to open global search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search across leads, invoices, offers, campaigns
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || !bizUser?.businessId) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const bizId = bizUser.businessId;
    const results: SearchResult[] = [];
    try {
      // Leads
      if (supabase) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name, company, phone, stage')
          .eq('business_id', bizId)
          .or(`name.ilike.%${q}%,company.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(5);
        (leads ?? []).forEach((l: Record<string, string>) => results.push({
          id: l.id, type: 'lead',
          title: l.name,
          subtitle: l.company ? `${l.company} · ${l.stage}` : l.stage,
          path: `/app/leads?open=${l.id}`,
          emoji: '🎯',
        }));

        // Invoices / payment submissions
        const { data: invoices } = await supabase
          .from('payment_submissions')
          .select('id, customer_name, amount, status')
          .eq('business_id', bizId)
          .ilike('customer_name', `%${q}%`)
          .limit(5);
        (invoices ?? []).forEach((inv: Record<string, string | number>) => results.push({
          id: String(inv.id), type: 'invoice',
          title: String(inv.customer_name),
          subtitle: `₹${Number(inv.amount).toLocaleString('en-IN')} · ${inv.status}`,
          path: `/app/invoices`,
          emoji: '🧾',
        }));

        // Offers
        const { data: offers } = await supabase
          .from('offers')
          .select('id, title, discount_type, status')
          .eq('business_id', bizId)
          .ilike('title', `%${q}%`)
          .limit(5);
        (offers ?? []).forEach((o: Record<string, string>) => results.push({
          id: o.id, type: 'offer',
          title: o.title,
          subtitle: `${o.discount_type} · ${o.status}`,
          path: `/app/offers`,
          emoji: '🏷️',
        }));

        // Campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, name, status, channel')
          .eq('business_id', bizId)
          .or(`name.ilike.%${q}%`)
          .limit(5);
        (campaigns ?? []).forEach((c: Record<string, string>) => results.push({
          id: c.id, type: 'campaign',
          title: c.name,
          subtitle: `${c.channel} · ${c.status}`,
          path: `/app/campaigns`,
          emoji: '📣',
        }));
      }
    } catch { /* silent */ }
    setSearchResults(results);
    setSearchLoading(false);
  }, [bizUser?.businessId]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => runSearch(searchQuery), 320);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, runSearch]);

  // Wait for async team-member session to load before deciding auth state
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src="/logo.png" alt="Redeem Rocket" style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.8 }} />
        <div style={{ width: 36, height: 36, border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  if (!bizUser) return <Navigate to="/login" replace />;
  if (!bizUser.onboarding_done) return <Navigate to="/business/onboarding" replace />;

  const planColor = PLAN_COLORS[bizUser.plan] ?? '#6b7280';
  const planLabel = bizUser.plan.charAt(0).toUpperCase() + bizUser.plan.slice(1);

  function isActive(path: string) {
    if (path === '/app') return location.pathname === '/app' || location.pathname === '/app/';
    return location.pathname.startsWith(path);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleNavClick(item: NavItem, closeDrawer = false) {
    const locked = !meetsRequirement(bizUser.plan, item.planRequired);
    if (closeDrawer) setDrawerOpen(false);
    if (locked) {
      const badgeLabel = PLAN_BADGE_LABELS[item.planRequired ?? ''] ?? 'PAID';
      setLockedMsg(`${item.label} requires ${badgeLabel} plan — upgrade to unlock`);
      if (lockedMsg === null) {
        setTimeout(() => setLockedMsg(null), 3500);
      }
      navigate('/app/subscription');
    } else {
      navigate(item.path);
    }
  }

  const bg        = isDark ? '#0b1220' : '#faf7f3';
  const sidebar   = isDark ? '#0f172a' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : '#e8d8cc';
  const text      = isDark ? '#f1f5f9' : '#18100a';
  const textMuted = isDark ? '#6b7280' : '#9a7860';
  const accent    = '#f97316';

  // ── Dynamic nav groups based on product_selection ─────────────────────────
  const productSelection = (bizUser.product_selection as 'rr' | 'lms' | 'both') || 'both';
  const activeNavGroups: NavGroup[] = (() => {
    if (productSelection === 'rr') {
      return NAV_GROUPS.filter(g => ['HOME', 'REDEEM ROCKET', 'SETTINGS'].includes(g.label));
    }
    if (productSelection === 'lms') {
      return NAV_GROUPS.filter(g => ['HOME', 'LEADS & CRM', 'MARKETING', 'SETTINGS'].includes(g.label));
    }
    return NAV_GROUPS; // 'both' or unset — show everything
  })();

  // ── Shared: Nav group renderer (used in sidebar + drawer) ──────────────────
  function renderNavGroups(collapsed: boolean) {
    return activeNavGroups.map((group, gi) => {
      const isPremiumGroup = group.isPremium;
      return (
        <div key={group.label}>
          {isPremiumGroup && !collapsed && (
            <div style={{ margin: '10px 12px 0', height: 1, background: `linear-gradient(90deg, #f59e0b44, transparent)` }} />
          )}
          {gi > 0 && collapsed && (
            <div style={{ margin: '6px 12px', height: 1, background: border }} />
          )}
          {!collapsed && (
            <div style={{
              padding: '10px 16px 3px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: isPremiumGroup ? '#f59e0b' : textMuted,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {isPremiumGroup && <Zap size={10} color="#f59e0b" fill="#f59e0b" />}
              {group.label}
              {isPremiumGroup && <span style={{ marginLeft: 4, fontSize: 9, color: '#f59e0b88' }}>Premium</span>}
            </div>
          )}
          {group.items.map((item) => {
            const { label, path, icon: Icon, planRequired } = item;
            const active = isActive(path);
            const locked = !meetsRequirement(bizUser.plan, planRequired);
            return (
              <button
                key={path}
                onClick={() => handleNavClick(item, true)}
                title={collapsed ? (locked ? `${label} — requires ${planRequired} plan` : label) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: collapsed ? '9px' : '9px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? `${accent}22` : 'transparent',
                  border: 'none',
                  borderLeft: active ? `3px solid ${accent}` : '3px solid transparent',
                  cursor: 'pointer',
                  color: locked ? `${textMuted}99` : active ? accent : textMuted,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                  borderRadius: collapsed ? 4 : '0 8px 8px 0',
                  marginRight: collapsed ? 0 : 8,
                  opacity: locked ? 0.65 : 1,
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = isDark ? '#ffffff0d' : '#f3f4f6'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
                    {locked && planRequired && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                        background: planRequired === 'pro' ? '#fb923c22' : '#3b82f622',
                        color: planRequired === 'pro' ? '#fb923c' : '#3b82f6',
                        border: `1px solid ${planRequired === 'pro' ? '#fb923c44' : '#3b82f644'}`,
                        letterSpacing: '0.04em', flexShrink: 0,
                      }}>
                        {PLAN_BADGE_LABELS[planRequired] ?? 'PAID'}
                      </span>
                    )}
                    {locked && <Lock size={11} style={{ flexShrink: 0, opacity: 0.5 }} />}
                    {active && !locked && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }} />}
                  </>
                )}
                {collapsed && locked && (
                  <span style={{
                    position: 'absolute', bottom: 3, right: 3,
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#1c2a55',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={7} color="#ef4444" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    });
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: bg, color: text, fontFamily: 'system-ui, sans-serif' }}>

        {/* Mobile header */}
        <header style={{
          height: 56, background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Business name - left */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              🚀
            </div>
            <span style={{
              fontSize: 14, fontWeight: 700, color: '#f1f5f9',
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {bizUser?.businessName || bizUser?.name || 'My Business'}
            </span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Bell icon */}
          <button onClick={() => { navigate('/app/notifications'); setUnreadCount(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 6, display: 'flex', position: 'relative' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar circle */}
          <button
            onClick={() => navigate('/app/profile')}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: '2px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, padding: 0,
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}
          >
            {(bizUser?.name ?? bizUser?.businessName ?? 'B').charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto', padding: '16px 16px 80px',
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 30% 80%, rgba(124,58,237,0.06) 0%, transparent 60%), #0b1220'
            : bg,
        }}>
          <Outlet />
        </main>

        {/* Bottom nav */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
          background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'stretch', zIndex: 100,
        }}>
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.path);
            const locked = !meetsRequirement(bizUser.plan, item.planRequired);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: active ? '#f97316' : '#6b7280',
                  fontSize: 10, fontWeight: active ? 700 : 400,
                  position: 'relative', paddingTop: 8,
                }}
              >
                {/* Orange dot above active icon */}
                {active && (
                  <span style={{
                    position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#f97316',
                    boxShadow: '0 0 6px rgba(249,115,22,0.8)',
                  }} />
                )}
                <Icon size={20} />
                <span style={{ fontSize: 10 }}>{item.label}</span>
                {locked && (
                  <span style={{
                    position: 'absolute', top: 10, right: '25%',
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={6} color="#ef4444" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Hamburger Drawer Overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                  zIndex: 199, backdropFilter: 'blur(2px)',
                }}
              />
              {/* Drawer panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed', left: 0, top: 0, bottom: 0,
                  width: '82%', maxWidth: 320,
                  background: sidebar, zIndex: 200,
                  display: 'flex', flexDirection: 'column',
                  overflowY: 'auto',
                  boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
                }}
              >
                {/* Drawer header */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
                  <img src="/logo.png" alt="Redeem Rocket" style={{ height: 44, width: 'auto', objectFit: 'contain', flex: 1 }} />
                  <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4, flexShrink: 0 }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Business info */}
                {bizUser.businessName && (
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, background: isDark ? '#111827' : '#fdf6f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${accent}33, #fb923c33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${accent}44` }}>
                        {bizUser.businessLogo || '🏪'}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{bizUser.businessName}</div>
                        <div style={{ fontSize: 10, color: textMuted }}>{bizUser.businessCategory || 'Business'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nav groups */}
                <nav style={{ flex: 1, paddingBottom: 8 }}>
                  {renderNavGroups(false)}
                </nav>

                {/* Plan info + logout */}
                <div style={{ padding: '12px 0', borderTop: `1px solid ${border}` }}>
                  {(() => {
                    const daysLeft = getDaysLeft(bizUser.planExpiry ?? null);
                    const expiryColor = daysLeft === null ? planColor : daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : planColor;
                    return (
                      <div style={{ padding: '8px 16px', marginBottom: 4 }}>
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${expiryColor}22`, border: `1px solid ${expiryColor}44` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CreditCard size={14} color={expiryColor} />
                            <span style={{ fontSize: 12, color: expiryColor, fontWeight: 600 }}>{planLabel} Plan</span>
                            <button onClick={() => { setDrawerOpen(false); navigate('/app/subscription'); }} style={{ marginLeft: 'auto', fontSize: 10, color: expiryColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              {bizUser.plan === 'free' ? 'Upgrade' : 'Manage'}
                            </button>
                          </div>
                          {daysLeft !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                              {daysLeft <= 7 && <AlertCircle size={11} color={expiryColor} />}
                              <span style={{ fontSize: 10, color: expiryColor, fontWeight: daysLeft <= 7 ? 700 : 400 }}>
                                {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => { setDrawerOpen(false); handleLogout(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 16px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#ef4444', fontSize: 13, fontWeight: 500,
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Locked-feature toast (mobile: centered above bottom nav) */}
        {lockedMsg && (
          <div style={{
            position: 'fixed', bottom: 72,
            left: '50%', transform: 'translateX(-50%)',
            background: isDark ? '#1c2a55' : '#18100a',
            border: '1px solid #f9731633', borderRadius: 10,
            padding: '10px 16px', fontSize: 12, color: '#e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 300,
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap',
          }}>
            <Lock size={14} color="#f97316" />
            {lockedMsg}
          </div>
        )}
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: isDark ? '#0b1220' : bg, color: text, fontFamily: 'system-ui, sans-serif', position: 'relative' }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        minWidth: sidebarOpen ? 240 : 64,
        background: sidebar,
        borderRight: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Redeem Rocket"
            style={{ height: sidebarOpen ? 48 : 36, width: 'auto', objectFit: 'contain', transition: 'height 0.25s' }}
          />
        </div>

        {/* Business info */}
        {sidebarOpen && bizUser.businessName && (
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, background: isDark ? '#111827' : '#fdf6f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${accent}33, #fb923c33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: `1px solid ${accent}44`, flexShrink: 0 }}>
                {bizUser.businessLogo || '🏪'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{bizUser.businessName}</div>
                <div style={{ fontSize: 10, color: textMuted }}>{bizUser.businessCategory || 'Business'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
          {renderNavGroups(!sidebarOpen)}
        </nav>

        {/* Bottom: Plan badge + logout */}
        <div style={{ padding: '12px 0', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          {sidebarOpen && (() => {
            const daysLeft = getDaysLeft(bizUser.planExpiry ?? null);
            const expiryColor = daysLeft === null ? planColor : daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : planColor;
            return (
              <div style={{ padding: '8px 16px', marginBottom: 4 }}>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: `${expiryColor}22`, border: `1px solid ${expiryColor}44` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={14} color={expiryColor} />
                    <span style={{ fontSize: 12, color: expiryColor, fontWeight: 600 }}>{planLabel} Plan</span>
                    <button onClick={() => navigate('/app/subscription')} style={{ marginLeft: 'auto', fontSize: 10, color: expiryColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      {bizUser.plan === 'free' ? 'Upgrade' : 'Manage'}
                    </button>
                  </div>
                  {daysLeft !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      {daysLeft <= 7 && <AlertCircle size={11} color={expiryColor} />}
                      <span style={{ fontSize: 10, color: expiryColor, fontWeight: daysLeft <= 7 ? 700 : 400 }}>
                        {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: sidebarOpen ? '10px 16px' : '10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#ef4444', fontSize: 13, fontWeight: 500,
            }}
          >
            <LogOut size={16} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header */}
        <header style={{
          height: 56, background: sidebar, borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 6, borderRadius: 6, display: 'flex' }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Page title (hidden when search is open) */}
          {!searchOpen && (
            <span style={{ fontSize: 14, fontWeight: 600, color: text, whiteSpace: 'nowrap' }}>
              {ALL_NAV_ITEMS.find(n => isActive(n.path))?.label ?? 'Business Portal'}
            </span>
          )}

          {/* Global Search */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 420, position: 'relative', marginLeft: searchOpen ? 0 : 'auto', marginRight: 4 }}>
            <div
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: searchOpen ? (isDark ? '#0e1530' : '#fff') : (isDark ? '#ffffff0d' : '#f3f4f6'),
                border: `1px solid ${searchOpen ? accent : border}`,
                borderRadius: 8, padding: '6px 10px',
                cursor: 'text', transition: 'all 0.2s',
                boxShadow: searchOpen ? `0 0 0 2px ${accent}33` : 'none',
              }}
            >
              <Search size={14} color={searchOpen ? accent : textMuted} style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads, invoices, offers… (⌘K)"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 13, color: text, caretColor: accent,
                  minWidth: 0,
                }}
              />
              {searchQuery && (
                <button
                  onClick={e => { e.stopPropagation(); setSearchQuery(''); setSearchResults([]); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0, display: 'flex' }}
                >
                  <X size={13} />
                </button>
              )}
              {!searchQuery && !searchOpen && (
                <span style={{ fontSize: 10, color: textMuted, background: isDark ? '#1c2a55' : '#e5e7eb', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>⌘K</span>
              )}
            </div>

            {/* Results dropdown */}
            <AnimatePresence>
              {searchOpen && (searchQuery.trim().length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                    background: sidebar, border: `1px solid ${border}`,
                    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    zIndex: 200, overflow: 'hidden', maxHeight: 400, overflowY: 'auto',
                  }}
                >
                  {searchLoading && (
                    <div style={{ padding: '14px 16px', color: textMuted, fontSize: 13, textAlign: 'center' }}>
                      Searching…
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div style={{ padding: '14px 16px', color: textMuted, fontSize: 13, textAlign: 'center' }}>
                      No results for "{searchQuery}"
                    </div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (() => {
                    const groups: SearchResultType[] = ['lead', 'invoice', 'offer', 'campaign'];
                    const groupLabels: Record<SearchResultType, string> = { lead: 'Leads', invoice: 'Invoices', offer: 'Offers', campaign: 'Campaigns' };
                    return groups.map(type => {
                      const items = searchResults.filter(r => r.type === type);
                      if (!items.length) return null;
                      return (
                        <div key={type}>
                          <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: textMuted, textTransform: 'uppercase' }}>
                            {groupLabels[type]}
                          </div>
                          {items.map(result => (
                            <button
                              key={result.id}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                                setSearchResults([]);
                                navigate(result.path);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '8px 14px',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                textAlign: 'left', transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#ffffff0d' : '#f3f4f6')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{result.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.title}</div>
                                {result.subtitle && (
                                  <div style={{ fontSize: 11, color: textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.subtitle}</div>
                                )}
                              </div>
                              <ChevronRight size={13} color={textMuted} style={{ flexShrink: 0 }} />
                            </button>
                          ))}
                        </div>
                      );
                    });
                  })()}
                  <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}`, fontSize: 11, color: textMuted }}>
                    Press <kbd style={{ background: isDark ? '#1c2a55' : '#e5e7eb', borderRadius: 3, padding: '1px 4px', fontFamily: 'monospace' }}>↵</kbd> to navigate · <kbd style={{ background: isDark ? '#1c2a55' : '#e5e7eb', borderRadius: 3, padding: '1px 4px', fontFamily: 'monospace' }}>Esc</kbd> to close
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => { navigate('/app/notifications'); setUnreadCount(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 6, borderRadius: 6, display: 'flex', position: 'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 6, borderRadius: 6, display: 'flex' }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div
            style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #fb923c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            onClick={() => navigate('/app/profile')}
          >
            {bizUser.name?.charAt(0).toUpperCase() ?? 'B'}
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto', padding: 24,
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 30% 80%, rgba(124,58,237,0.06) 0%, transparent 60%), #0b1220'
            : bg,
          position: 'relative',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Locked-feature toast (desktop) */}
      {lockedMsg && (
        <div style={{
          position: 'fixed', bottom: 80,
          left: sidebarOpen ? 256 : 80,
          background: isDark ? '#1c2a55' : '#18100a',
          border: '1px solid #f9731633',
          borderRadius: 10, padding: '10px 16px',
          fontSize: 12, color: '#e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'left 0.25s',
          maxWidth: 360,
        }}>
          <Lock size={14} color="#f97316" />
          {lockedMsg}
        </div>
      )}
    </div>
  );
}
