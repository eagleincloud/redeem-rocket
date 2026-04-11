import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { SubscriptionPlan } from '@/app/types';
import { supabase } from '@/app/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BizUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId: string | null;
  businessName: string | null;
  businessLogo: string;
  businessCategory: string;
  role: 'business';
  plan: SubscriptionPlan;
  planExpiry: string | null; // ISO date string; null = free/lifetime
  onboarding_done: boolean;

  // Owner Profile (new)
  ownerPhone?: string;
  ownerPhotoUrl?: string;
  ownerBio?: string;

  // Business Details (new)
  businessDescription?: string;
  businessWebsite?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessWhatsApp?: string;

  // Location Details (new)
  serviceRadius?: number; // km radius
  serviceAreas?: string[]; // array of area names
  mapLat?: number;
  mapLng?: number;

  // Documents (new)
  documents?: Record<string, string>; // {businessLicense: url, taxId: url, ...}

  // Payment Methods (new)
  acceptedPayments?: string[]; // ['upi', 'card', 'cash', etc.]

  // Product Selection
  product_selection?: string; // 'rr' | 'lms' | 'both'

  // Team member support
  isTeamMember?: boolean;
  teamMemberData?: {
    id: string;
    name: string;
    email: string;
    role_id?: string;
    permissions?: Record<string, string>;
  };
}

interface BusinessContextValue {
  bizUser: BizUser | null;
  setBizUser: (user: BizUser | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
  updatePlan: (plan: SubscriptionPlan, expiry?: string | null) => void;
  productSelection: 'rr' | 'lms' | 'both';
}

// ── Dev bypass ───────────────────────────────────────────────────────────────
// Set DEV_BYPASS = true to skip login entirely while building features.
// Flip back to false when you're ready to enable real authentication.

const DEV_BYPASS = false;

const DEV_USER: BizUser = {
  id:               'dev-owner-1',
  name:             'Dev Owner',
  email:            'dev@redeemrocket.in',
  phone:            '9999999999',
  businessId:       'biz-dev-1',
  businessName:     'Redeem Rocket (Dev)',
  businessLogo:     '🚀',
  businessCategory: 'Technology',
  role:             'business',
  plan:             'enterprise',       // all features unlocked
  planExpiry:       null,               // no expiry
  onboarding_done:  true,               // skip onboarding
  ownerPhone:       '9999999999',
  businessDescription: 'Dev testing business',
  businessWebsite:  'https://redeemrocket.dev',
  businessEmail:    'business@redeemrocket.in',
  serviceRadius:    5,
  serviceAreas:     ['Indiranagar', 'Koramangala'],
  mapLat:           12.9716,
  mapLng:           77.5946,
  documents:        {},
  acceptedPayments: ['upi', 'card', 'cash'],
};

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'biz_user';
const TEAM_SESSION_KEY = 'team_member_session';

function loadBizUser(): BizUser | null {
  if (DEV_BYPASS) return DEV_USER;      // always logged in during dev
  try {
    // Check for team member session first
    const teamRaw = localStorage.getItem(TEAM_SESSION_KEY);
    if (teamRaw) {
      // Return a placeholder — the provider will load owner data asynchronously
      // We return null here and let the effect handle it
      return null;
    }
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function saveBizUser(user: BizUser | null) {
  if (DEV_BYPASS) return;              // skip localStorage in dev mode
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

// ── Context ───────────────────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [bizUser, setBizUserState] = useState<BizUser | null>(loadBizUser);

  // Load owner data for team member sessions
  useEffect(() => {
    if (DEV_BYPASS) return;
    const teamRaw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!teamRaw || !supabase) return;

    try {
      const teamSession = JSON.parse(teamRaw) as {
        id: string;
        business_id: string;
        name: string;
        email: string;
        role_id?: string;
        permissions?: Record<string, string>;
        status: string;
      };

      // Load the owner's biz_users record via business_id
      supabase
        .from('biz_users')
        .select('*, businesses(*)')
        .eq('business_id', teamSession.business_id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            // Fallback: load businesses table directly
            supabase!
              .from('businesses')
              .select('*')
              .eq('id', teamSession.business_id)
              .single()
              .then(({ data: biz }) => {
                if (!biz) return;
                const user: BizUser = {
                  id: biz.id,
                  name: teamSession.name,
                  email: teamSession.email,
                  businessId: biz.id,
                  businessName: biz.name ?? null,
                  businessLogo: biz.logo ?? '🏪',
                  businessCategory: biz.category ?? '',
                  role: 'business',
                  plan: (biz.plan as SubscriptionPlan) ?? 'free',
                  planExpiry: null,
                  onboarding_done: true,
                  product_selection: biz.product_selection ?? 'both',
                  isTeamMember: true,
                  teamMemberData: {
                    id: teamSession.id,
                    name: teamSession.name,
                    email: teamSession.email,
                    role_id: teamSession.role_id,
                    permissions: teamSession.permissions,
                  },
                };
                setBizUserState(user);
              });
            return;
          }

          const biz = data.businesses as Record<string, unknown> | null;
          const user: BizUser = {
            id: data.id,
            name: teamSession.name,
            email: teamSession.email,
            phone: (data.phone as string) ?? '',
            businessId: teamSession.business_id,
            businessName: (biz?.name as string) ?? (data.business_name as string) ?? null,
            businessLogo: (biz?.logo as string) ?? (data.business_logo as string) ?? '🏪',
            businessCategory: (biz?.category as string) ?? (data.business_category as string) ?? '',
            role: 'business',
            plan: ((data.plan ?? 'free') as SubscriptionPlan),
            planExpiry: (data.plan_expiry as string) ?? null,
            onboarding_done: true,
            product_selection: (biz?.product_selection as string) ?? (data.product_selection as string) ?? 'both',
            isTeamMember: true,
            teamMemberData: {
              id: teamSession.id,
              name: teamSession.name,
              email: teamSession.email,
              role_id: teamSession.role_id,
              permissions: teamSession.permissions,
            },
          };
          setBizUserState(user);
        });
    } catch (e) {
      console.warn('[BusinessContext] Failed to load team member session:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBizUser = useCallback((user: BizUser | null) => {
    saveBizUser(user);
    setBizUserState(user);
  }, []);

  const logout = useCallback(() => {
    if (DEV_BYPASS) return;             // no-op in dev mode
    localStorage.removeItem(TEAM_SESSION_KEY);
    localStorage.removeItem('team_member_first_login');
    localStorage.removeItem('team_member_first_login_id');
    saveBizUser(null);
    setBizUserState(null);
  }, []);

  const updatePlan = useCallback((plan: SubscriptionPlan, expiry?: string | null) => {
    setBizUserState(prev => {
      if (!prev) return prev;
      const planExpiry = expiry !== undefined
        ? expiry
        : plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const updated = { ...prev, plan, planExpiry };
      saveBizUser(updated);
      return updated;
    });
  }, []);

  const value = useMemo<BusinessContextValue>(() => ({
    bizUser,
    setBizUser,
    isAuthenticated: Boolean(bizUser),
    logout,
    updatePlan,
    productSelection: (bizUser?.product_selection as 'rr' | 'lms' | 'both') || 'both',
  }), [bizUser, setBizUser, logout, updatePlan]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusinessContext must be used within BusinessProvider');
  return ctx;
}

// Alias for convenience
export function useBusiness() {
  return useBusinessContext();
}

// Helper to use context with shorter property names
export function useAuthBusiness() {
  const ctx = useBusinessContext();
  return {
    user: ctx.bizUser,
    setUser: ctx.setBizUser,
    isAuthenticated: ctx.isAuthenticated,
    logout: ctx.logout,
    updatePlan: ctx.updatePlan,
  };
}
