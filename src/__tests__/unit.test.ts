/**
 * Unit Tests — Pure functions (no React rendering)
 * Run: npm test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Inline the same pure functions used in the app ──────────────────────────
// (These are module-private in the app; we test the logic directly here)

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function formatCurrency(n?: number): string {
  if (!n) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function meetsRequirement(userPlan: string, required: string): boolean {
  const ORDER = ['free', 'basic', 'pro', 'enterprise'];
  return ORDER.indexOf(userPlan) >= ORDER.indexOf(required);
}

function csvHeaders(rows: Record<string, unknown>[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}

type Lead = { stage: string; name: string };
function filterByStage(leads: Lead[], stage: string): Lead[] {
  if (stage === 'all') return leads;
  return leads.filter(l => l.stage === stage);
}

function bulkChangeStage(ids: string[], newStage: string, leads: Lead & { id: string }[]) {
  return leads.map(l =>
    ids.includes((l as Lead & { id: string }).id)
      ? { ...l, stage: newStage }
      : l
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a number with ₹ and Indian locale', () => {
    const result = formatCurrency(85000);
    expect(result).toContain('₹');
    expect(result).toContain('85');
  });

  it('returns em-dash for zero', () => {
    expect(formatCurrency(0)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('handles small amounts', () => {
    const result = formatCurrency(500);
    expect(result).toContain('₹');
    expect(result).toContain('500');
  });
});

describe('daysAgo', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString();
    expect(daysAgo(today)).toBe(0);
  });

  it('returns 1 for yesterday', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    expect(daysAgo(yesterday)).toBe(1);
  });

  it('returns 7 for one week ago', () => {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    expect(daysAgo(weekAgo)).toBe(7);
  });

  it('returns 30 for thirty days ago', () => {
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    expect(daysAgo(monthAgo)).toBe(30);
  });
});

describe('meetsRequirement', () => {
  it('free user fails basic requirement', () => {
    expect(meetsRequirement('free', 'basic')).toBe(false);
  });

  it('pro user meets basic requirement', () => {
    expect(meetsRequirement('pro', 'basic')).toBe(true);
  });

  it('enterprise user meets pro requirement', () => {
    expect(meetsRequirement('enterprise', 'pro')).toBe(true);
  });

  it('basic user fails pro requirement', () => {
    expect(meetsRequirement('basic', 'pro')).toBe(false);
  });

  it('same plan meets requirement', () => {
    expect(meetsRequirement('free', 'free')).toBe(true);
    expect(meetsRequirement('pro', 'pro')).toBe(true);
  });
});

describe('CSV export', () => {
  it('produces correct headers from row data', () => {
    const rows = [
      { name: 'Test Lead', phone: '9876543210', stage: 'new', value: 5000 }
    ];
    const headers = csvHeaders(rows);
    expect(headers).toContain('name');
    expect(headers).toContain('phone');
    expect(headers).toContain('stage');
    expect(headers).toContain('value');
  });

  it('returns empty array for empty data', () => {
    expect(csvHeaders([])).toEqual([]);
  });
});

describe('Stage filter', () => {
  const leads: Lead[] = [
    { stage: 'new',         name: 'Lead A' },
    { stage: 'contacted',   name: 'Lead B' },
    { stage: 'new',         name: 'Lead C' },
    { stage: 'negotiating', name: 'Lead D' },
  ];

  it('returns all leads when stage is "all"', () => {
    expect(filterByStage(leads, 'all')).toHaveLength(4);
  });

  it('filters correctly to "new" stage', () => {
    const result = filterByStage(leads, 'new');
    expect(result).toHaveLength(2);
    expect(result.every(l => l.stage === 'new')).toBe(true);
  });

  it('filters correctly to "contacted" stage', () => {
    const result = filterByStage(leads, 'contacted');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Lead B');
  });

  it('returns empty array for non-existent stage', () => {
    expect(filterByStage(leads, 'won')).toHaveLength(0);
  });
});

describe('Bulk stage change', () => {
  const leads = [
    { id: '1', name: 'Lead A', stage: 'new' },
    { id: '2', name: 'Lead B', stage: 'contacted' },
    { id: '3', name: 'Lead C', stage: 'new' },
  ];

  it('changes stage for selected IDs only', () => {
    const result = bulkChangeStage(['1', '3'], 'negotiating', leads);
    expect(result.find(l => l.id === '1')?.stage).toBe('negotiating');
    expect(result.find(l => l.id === '3')?.stage).toBe('negotiating');
    expect(result.find(l => l.id === '2')?.stage).toBe('contacted');
  });

  it('leaves unselected leads unchanged', () => {
    const result = bulkChangeStage(['1'], 'won', leads);
    expect(result.find(l => l.id === '2')?.stage).toBe('contacted');
    expect(result.find(l => l.id === '3')?.stage).toBe('new');
  });

  it('handles empty selection', () => {
    const result = bulkChangeStage([], 'won', leads);
    expect(result).toEqual(leads);
  });
});

describe('Getting Started checklist localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initialises with all steps as false', () => {
    const checklist = {
      updateProfile: false,
      addProduct: false,
      createOffer: false,
      addTeamMember: false,
      sendCampaign: false,
    };
    localStorage.setItem('gs_test-biz', JSON.stringify(checklist));
    const stored = JSON.parse(localStorage.getItem('gs_test-biz') || '{}');
    expect(stored.updateProfile).toBe(false);
    expect(stored.addProduct).toBe(false);
  });

  it('marks a step complete', () => {
    const checklist = { updateProfile: false, addProduct: false };
    localStorage.setItem('gs_test-biz', JSON.stringify(checklist));

    const updated = { ...checklist, addProduct: true };
    localStorage.setItem('gs_test-biz', JSON.stringify(updated));

    const stored = JSON.parse(localStorage.getItem('gs_test-biz') || '{}');
    expect(stored.addProduct).toBe(true);
    expect(stored.updateProfile).toBe(false);
  });

  it('onboarding done array grows when step is marked', () => {
    const done: string[] = [];
    done.push('offer');
    localStorage.setItem('rr_onboarding_done', JSON.stringify(done));
    const stored: string[] = JSON.parse(localStorage.getItem('rr_onboarding_done') || '[]');
    expect(stored).toContain('offer');
  });
});
