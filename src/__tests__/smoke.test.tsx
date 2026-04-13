/**
 * Smoke Tests — Every major page renders without crashing
 * Run: npm test
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Global mocks ─────────────────────────────────────────────────────────────

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate:     () => vi.fn(),
  useLocation:     () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams:       () => ({}),
  Link:            ({ children, ...p }: { children: React.ReactNode; to: string }) =>
                     React.createElement('a', p, children),
  NavLink:         ({ children, ...p }: { children: React.ReactNode; to: string }) =>
                     React.createElement('a', p, children),
}));

// Mock ThemeContext
vi.mock('@/app/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggle: vi.fn() }),
}));

// Mock BusinessContext
const mockBizUser = {
  id: 'test-id',
  name: 'Test Owner',
  email: 'test@biz.com',
  businessId: 'biz-test-1',
  businessName: 'Test Business',
  businessLogo: '🏪',
  businessCategory: 'Grocery',
  role: 'business' as const,
  plan: 'pro' as const,
  planExpiry: null,
  onboarding_done: true,
};

vi.mock('@/business/context/BusinessContext', () => ({
  useBusinessContext: () => ({
    bizUser:         mockBizUser,
    setBizUser:      vi.fn(),
    isAuthenticated: true,
    logout:          vi.fn(),
    updatePlan:      vi.fn(),
  }),
}));

// Match the actual import path used by business components
vi.mock('../business/context/BusinessContext', () => ({
  useBusinessContext: () => ({
    bizUser:         mockBizUser,
    setBizUser:      vi.fn(),
    isAuthenticated: true,
    logout:          vi.fn(),
    updatePlan:      vi.fn(),
  }),
}));

// Mock useViewport hook
vi.mock('../business/hooks/useViewport', () => ({
  useViewport: () => ({ isMobile: false, isTablet: false, width: 1280 }),
}));

// Mock supabase
vi.mock('@/app/lib/supabase', () => ({
  supabase:    null,
  hasSupabase: false,
}));

// Mock supabase-data
vi.mock('@/app/api/supabase-data', () => ({
  registerBusiness:   vi.fn().mockResolvedValue(null),
  upsertBusinessHours: vi.fn().mockResolvedValue(null),
  markScrapedBizClaimed: vi.fn().mockResolvedValue(null),
  createOffer:        vi.fn().mockResolvedValue(null),
  updateOffer:        vi.fn().mockResolvedValue(null),
}));

// Mock recharts so it doesn't error in jsdom
vi.mock('recharts', () => ({
  BarChart:          ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Bar:               () => null,
  XAxis:             () => null,
  YAxis:             () => null,
  Tooltip:           () => null,
  CartesianGrid:     () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  LineChart:         ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Line:              () => null,
  PieChart:          ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Pie:               () => null,
  Cell:              () => null,
  Legend:            () => null,
  AreaChart:         ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Area:              () => null,
}));

// Mock motion/react (framer-motion compatible)
vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag: string) => ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) =>
    React.createElement(tag as keyof JSX.IntrinsicElements || 'div', props as Record<string, unknown>, children)
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

// Mock useRBAC (used in OutreachPage)
vi.mock('../business/hooks/useRBAC', () => ({
  useRBAC: () => ({ canRead: true, canWrite: true, role: 'owner' }),
}));

// Stub window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  // Stub ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// ── Helper ────────────────────────────────────────────────────────────────────
function renderPage(Component: React.ComponentType) {
  return render(React.createElement(Component));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Smoke tests — pages render without crashing', () => {
  it('GettingStartedCard renders', async () => {
    const { GettingStartedCard } = await import('../business/components/GettingStartedCard');
    const { container } = render(React.createElement(GettingStartedCard));
    expect(container).toBeTruthy();
  });

  it('DashboardPage renders', async () => {
    const { DashboardPage } = await import('../business/components/DashboardPage');
    const { container } = renderPage(DashboardPage);
    expect(container).toBeTruthy();
  });

  it('OffersPage renders', async () => {
    const { OffersPage } = await import('../business/components/OffersPage');
    const { container } = renderPage(OffersPage);
    expect(container).toBeTruthy();
  });

  it('InvoicesPage renders', async () => {
    const { InvoicesPage } = await import('../business/components/InvoicesPage');
    const { container } = renderPage(InvoicesPage);
    expect(container).toBeTruthy();
  });

  it('AnalyticsPage renders', async () => {
    const { AnalyticsPage } = await import('../business/components/AnalyticsPage');
    const { container } = renderPage(AnalyticsPage);
    expect(container).toBeTruthy();
  });

  it('TeamPage renders', async () => {
    const { TeamPage } = await import('../business/components/TeamPage');
    const { container } = renderPage(TeamPage);
    expect(container).toBeTruthy();
  });

  it('AuctionsManagePage renders', async () => {
    const { AuctionsManagePage } = await import('../business/components/AuctionsManagePage');
    const { container } = renderPage(AuctionsManagePage);
    expect(container).toBeTruthy();
  });

  it('RequirementsManagePage renders', async () => {
    const { RequirementsManagePage } = await import('../business/components/RequirementsManagePage');
    const { container } = renderPage(RequirementsManagePage);
    expect(container).toBeTruthy();
  });
});
