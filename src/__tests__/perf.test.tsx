/**
 * Performance Tests — Render timing assertions
 * Run: npm test
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams:   () => ({}),
  Link:        ({ children, to }: { children: React.ReactNode; to: string }) =>
                 React.createElement('a', { href: to }, children),
  NavLink:     ({ children, to }: { children: React.ReactNode; to: string }) =>
                 React.createElement('a', { href: to }, children),
}));

vi.mock('@/app/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggle: vi.fn() }),
}));

const mockBizUser = {
  id: 'perf-id',
  name: 'Perf Owner',
  email: 'perf@biz.com',
  businessId: 'biz-perf-1',
  businessName: 'Perf Business',
  businessLogo: '🏪',
  businessCategory: 'Grocery',
  role: 'business' as const,
  plan: 'enterprise' as const,
  planExpiry: null,
  onboarding_done: true,
};

vi.mock('../business/context/BusinessContext', () => ({
  useBusinessContext: () => ({
    bizUser:         mockBizUser,
    setBizUser:      vi.fn(),
    isAuthenticated: true,
    logout:          vi.fn(),
    updatePlan:      vi.fn(),
  }),
}));

vi.mock('../business/hooks/useViewport', () => ({
  useViewport: () => ({ isMobile: false, isTablet: false, width: 1280 }),
}));

vi.mock('@/app/lib/supabase', () => ({
  supabase:    null,
  hasSupabase: false,
}));

vi.mock('@/app/api/supabase-data', () => ({
  registerBusiness:      vi.fn().mockResolvedValue(null),
  upsertBusinessHours:   vi.fn().mockResolvedValue(null),
  markScrapedBizClaimed: vi.fn().mockResolvedValue(null),
  createOffer:           vi.fn().mockResolvedValue(null),
  updateOffer:           vi.fn().mockResolvedValue(null),
}));

vi.mock('recharts', () => ({
  BarChart:            ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Bar:                 () => null,
  XAxis:               () => null,
  YAxis:               () => null,
  Tooltip:             () => null,
  CartesianGrid:       () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  LineChart:           ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Line:                () => null,
  PieChart:            ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Pie:                 () => null,
  Cell:                () => null,
  Legend:              () => null,
  AreaChart:           ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Area:                () => null,
}));

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_t, tag: string) => ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) =>
      React.createElement(tag as keyof JSX.IntrinsicElements || 'div', props as Record<string, unknown>, children),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, {}, children),
}));

vi.mock('../business/hooks/useRBAC', () => ({
  useRBAC: () => ({ canRead: true, canWrite: true, role: 'owner' }),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// ── Performance helper ────────────────────────────────────────────────────────

async function measureRenderMs(Component: React.ComponentType): Promise<number> {
  const start = performance.now();
  render(React.createElement(Component));
  return performance.now() - start;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Render performance', () => {
  it('GettingStartedCard renders in < 50ms', async () => {
    const { GettingStartedCard } = await import('../business/components/GettingStartedCard');
    const ms = await measureRenderMs(GettingStartedCard);
    expect(ms).toBeLessThan(50);
  });

  it('DashboardPage renders in < 200ms', async () => {
    const { DashboardPage } = await import('../business/components/DashboardPage');
    const ms = await measureRenderMs(DashboardPage);
    expect(ms).toBeLessThan(200);
  });

  it('OffersPage renders in < 200ms', async () => {
    const { OffersPage } = await import('../business/components/OffersPage');
    const ms = await measureRenderMs(OffersPage);
    expect(ms).toBeLessThan(200);
  });

  it('TeamPage renders in < 200ms', async () => {
    const { TeamPage } = await import('../business/components/TeamPage');
    const ms = await measureRenderMs(TeamPage);
    expect(ms).toBeLessThan(200);
  });

  it('AnalyticsPage renders in < 200ms', async () => {
    const { AnalyticsPage } = await import('../business/components/AnalyticsPage');
    const ms = await measureRenderMs(AnalyticsPage);
    expect(ms).toBeLessThan(200);
  });
});

describe('Search filter performance', () => {
  it('filters 50 leads by stage in < 5ms', () => {
    // Inline performance test — no render needed
    const leads = Array.from({ length: 50 }, (_, i) => ({
      id: `lead-${i}`,
      name: `Lead ${i}`,
      stage: i % 3 === 0 ? 'new' : i % 3 === 1 ? 'contacted' : 'negotiating',
      value: (i + 1) * 1000,
    }));

    const start = performance.now();
    const filtered = leads.filter(l => l.stage === 'new');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('searches 50 leads by name in < 5ms', () => {
    const leads = Array.from({ length: 50 }, (_, i) => ({
      id: `lead-${i}`,
      name: i % 5 === 0 ? `Priya Shah ${i}` : `Rahul Kumar ${i}`,
      phone: `98765${String(i).padStart(5, '0')}`,
    }));

    const start = performance.now();
    const query = 'priya';
    const filtered = leads.filter(l =>
      l.name.toLowerCase().includes(query) || l.phone.includes(query)
    );
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    expect(filtered.length).toBe(10);
  });
});
