import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SubscriptionPlan } from '@/app/types';

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
}

interface BusinessContextValue {
  bizUser: BizUser | null;
  setBizUser: (user: BizUser | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
  updatePlan: (plan: SubscriptionPlan, expiry?: string | null) => void;
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

function loadBizUser(): BizUser | null {
  if (DEV_BYPASS) return DEV_USER;      // always logged in during dev
  try {
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

  const setBizUser = useCallback((user: BizUser | null) => {
    saveBizUser(user);
    setBizUserState(user);
  }, []);

  const logout = useCallback(() => {
    if (DEV_BYPASS) return;             // no-op in dev mode
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
