import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { SubscriptionPlan } from '@/app/types';
import { supabase } from '@/app/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Theme preference configuration for business branding
 */
export interface ThemePreference {
  layout?: string; // e.g., 'grid', 'list', 'compact'
  primaryColor?: string; // hex color
  secondaryColor?: string; // hex color
  logoUrl?: string; // custom logo URL
  fontStyle?: string; // e.g., 'sans', 'serif', 'modern'
}

/**
 * Onboarding status enumeration
 */
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Feature preferences: track which features are enabled for the business
 */
export type FeaturePreferences = Record<string, boolean>;

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

  // Smart Onboarding: Feature & Theme Management
  featurePreferences?: FeaturePreferences; // which features are enabled
  themePreference?: ThemePreference; // business theme/branding settings
  onboardingStatus?: OnboardingStatus; // current onboarding status
  onboardingPhase?: number; // 0-6 phase indicator

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
  isLoading: boolean;
  logout: () => void;
  updatePlan: (plan: SubscriptionPlan, expiry?: string | null) => void;
  productSelection: 'rr' | 'lms' | 'both';

  // Smart Onboarding: Feature & Theme Management
  /**
   * Check if a specific feature is enabled for this business
   */
  canAccessFeature: (featureName: string) => boolean;
  /**
   * Get list of all enabled features
   */
  getEnabledFeatures: () => string[];
  /**
   * Update feature preferences in context and persist to database
   */
  updateFeaturePreferences: (prefs: FeaturePreferences) => Promise<void>;
  /**
   * Update theme preference in context and persist to database
   */
  updateThemePreference: (theme: ThemePreference) => Promise<void>;
  /**
   * Update onboarding status and persist to database
   */
  updateOnboardingStatus: (status: OnboardingStatus, phase?: number) => Promise<void>;
  /**
   * Apply theme colors to DOM via CSS custom properties
   */
  applyThemeToDOM: (theme?: ThemePreference) => void;
  /**
   * Get total count of enabled features
   */
  getEnabledFeatureCount: () => number;
  /**
   * Check if onboarding is required (status !== 'completed')
   */
  isOnboardingRequired: () => boolean;
  /**
   * Get current onboarding phase (0-6)
   */
  getCurrentOnboardingPhase: () => number;
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
const THEME_CSS_PREFIX = '--biz-theme';

/**
 * Default feature preferences based on subscription plan
 */
function getDefaultFeaturePreferences(plan: SubscriptionPlan): FeaturePreferences {
  const baseFeatures = {
    basicAnalytics: plan !== 'free',
    advancedAnalytics: plan === 'pro' || plan === 'enterprise',
    auctionAccess: plan === 'pro' || plan === 'enterprise',
    customIntegrations: plan === 'enterprise',
    dedicatedManager: plan === 'enterprise',
    apiAccess: plan === 'enterprise',
    bulkOperations: plan === 'pro' || plan === 'enterprise',
    teamManagement: plan !== 'free',
  };
  return baseFeatures;
}

/**
 * Default theme preference
 */
function getDefaultThemePreference(): ThemePreference {
  return {
    layout: 'grid',
    primaryColor: '#f97316', // orange
    secondaryColor: '#6366f1', // indigo
    fontStyle: 'sans',
  };
}

function loadBizUser(): BizUser | null {
  if (DEV_BYPASS) return DEV_USER;      // always logged in during dev
  try {
    // Check for team member session first
    const teamRaw = localStorage.getItem(TEAM_SESSION_KEY);
    if (teamRaw) {
      // Return a placeholder — the provider will load owner data asynchronously
      // We return null here and let the effect handle it
      console.log('[BusinessContext] Team member session detected, will load async');
      return null;
    }
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const user = JSON.parse(s);
      console.log('[BusinessContext] Owner loaded from localStorage:', { id: user.id, email: user.email, role: user.role });
      return user;
    }
    return null;
  } catch {
    console.error('[BusinessContext] Error loading biz user from localStorage');
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
  // isLoading = true while we're async-loading a team member session so
  // BusinessLayout doesn't immediately redirect to /login before data arrives.
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (DEV_BYPASS) return false;
    try { return Boolean(localStorage.getItem(TEAM_SESSION_KEY)); } catch { return false; }
  });

  // Load owner data for team member sessions
  // Also subscribe to storage changes so we reload when team member logs in
  useEffect(() => {
    if (DEV_BYPASS) return;
    const teamRaw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!teamRaw || !supabase) {
      setIsLoading(false);
      return;
    }

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

      console.log('[BusinessContext] Loading team member session:', { teamId: teamSession.id, businessId: teamSession.business_id });

      // Load the owner's biz_users record via business_id
      supabase
        .from('biz_users')
        .select('*, businesses(*)')
        .eq('business_id', teamSession.business_id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.log('[BusinessContext] biz_users query failed/empty, trying businesses table fallback:', { error: error?.message });
            // Fallback: load businesses table directly
            supabase!
              .from('businesses')
              .select('*')
              .eq('id', teamSession.business_id)
              .single()
              .then(({ data: biz, error: bizError }) => {
                if (bizError) {
                  console.error('[BusinessContext] Fallback businesses query failed:', bizError.message);
                  setIsLoading(false);
                  return;
                }
                if (!biz) {
                  console.error('[BusinessContext] Business record not found for ID:', teamSession.business_id);
                  setIsLoading(false);
                  return;
                }
                console.log('[BusinessContext] Loaded business from fallback:', { businessId: biz.id, businessName: biz.name });
                const plan = (biz.plan as SubscriptionPlan) ?? 'free';
                const user: BizUser = {
                  id: biz.id,
                  name: teamSession.name,
                  email: teamSession.email,
                  businessId: biz.id,
                  businessName: biz.name ?? null,
                  businessLogo: biz.logo ?? '🏪',
                  businessCategory: biz.category ?? '',
                  role: 'business',
                  plan,
                  planExpiry: null,
                  onboarding_done: true,
                  product_selection: biz.product_selection ?? 'both',
                  featurePreferences: getDefaultFeaturePreferences(plan),
                  themePreference: getDefaultThemePreference(),
                  onboardingStatus: 'completed',
                  onboardingPhase: 6,
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
                setIsLoading(false);
              })
              .catch(err => {
                console.error('[BusinessContext] Fallback businesses query threw error:', err);
                setIsLoading(false);
              });
            return;
          }

          console.log('[BusinessContext] Loaded biz_users record successfully:', { bizUserId: data.id, businessId: teamSession.business_id });
          const biz = data.businesses as Record<string, unknown> | null;
          const plan = ((data.plan ?? 'free') as SubscriptionPlan);

          // Parse JSONB columns from database
          let featurePreferences: FeaturePreferences = getDefaultFeaturePreferences(plan);
          if (data.feature_preferences) {
            try {
              featurePreferences = typeof data.feature_preferences === 'string'
                ? JSON.parse(data.feature_preferences)
                : data.feature_preferences;
            } catch (e) {
              console.warn('[BusinessContext] Failed to parse feature_preferences:', e);
            }
          }

          let themePreference: ThemePreference = getDefaultThemePreference();
          if (data.theme_preference) {
            try {
              themePreference = typeof data.theme_preference === 'string'
                ? JSON.parse(data.theme_preference)
                : data.theme_preference;
            } catch (e) {
              console.warn('[BusinessContext] Failed to parse theme_preference:', e);
            }
          }

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
            plan,
            planExpiry: (data.plan_expiry as string) ?? null,
            onboarding_done: true,
            product_selection: (biz?.product_selection as string) ?? (data.product_selection as string) ?? 'both',
            featurePreferences,
            themePreference,
            onboardingStatus: (data.onboarding_status as OnboardingStatus) ?? 'completed',
            onboardingPhase: (data.onboarding_phase as number) ?? 6,
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
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[BusinessContext] biz_users query threw error:', err);
          setIsLoading(false);
        });
    } catch (e) {
      console.error('[BusinessContext] Failed to load team member session:', e);
      setIsLoading(false);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Smart Onboarding: Feature & Theme Management ──────────────────────────────────

  /**
   * Apply theme colors to DOM via CSS custom properties
   * MUST be defined before setBizUser to avoid temporal dead zone
   */
  /**
   * Apply theme colors to DOM via CSS custom properties
   */
  const applyThemeToDOM = useCallback((theme?: ThemePreference) => {
    const themeToApply = theme || bizUser?.themePreference || getDefaultThemePreference();
    if (!themeToApply) return;

    const root = document.documentElement;

    // Set CSS custom properties for theme colors
    if (themeToApply.primaryColor) {
      root.style.setProperty(`${THEME_CSS_PREFIX}-primary`, themeToApply.primaryColor);
    }
    if (themeToApply.secondaryColor) {
      root.style.setProperty(`${THEME_CSS_PREFIX}-secondary`, themeToApply.secondaryColor);
    }
    if (themeToApply.layout) {
      root.style.setProperty(`${THEME_CSS_PREFIX}-layout`, themeToApply.layout);
    }
    if (themeToApply.fontStyle) {
      root.style.setProperty(`${THEME_CSS_PREFIX}-font`, themeToApply.fontStyle);
    }

    console.log('[BusinessContext] Theme applied to DOM:', { primary: themeToApply.primaryColor, secondary: themeToApply.secondaryColor });
  }, [bizUser?.themePreference]);

  const setBizUser = useCallback((user: BizUser | null) => {
    if (user) {
      // Parse JSONB columns from Supabase if they come as strings
      const parsed: BizUser = {
        ...user,
        featurePreferences: typeof user.featurePreferences === 'string'
          ? JSON.parse(user.featurePreferences as unknown as string)
          : (user.featurePreferences || getDefaultFeaturePreferences(user.plan)),
        themePreference: typeof user.themePreference === 'string'
          ? JSON.parse(user.themePreference as unknown as string)
          : (user.themePreference || getDefaultThemePreference()),
        onboardingStatus: (user.onboardingStatus || 'pending') as OnboardingStatus,
        onboardingPhase: user.onboardingPhase ?? 0,
      };
      saveBizUser(parsed);
      setBizUserState(parsed);
      // Apply theme to DOM when user is set
      applyThemeToDOM(parsed.themePreference);
    } else {
      saveBizUser(null);
      setBizUserState(null);
    }
  }, [applyThemeToDOM]);

  
  // ── Smart Onboarding: Feature & Theme Management ──────────────────────────────────



  /**
   * Check if a specific feature is enabled
   */
  const canAccessFeature = useCallback((featureName: string): boolean => {
    if (!bizUser?.featurePreferences) {
      return getDefaultFeaturePreferences(bizUser?.plan || 'free')[featureName as keyof typeof getDefaultFeaturePreferences] || false;
    }
    return bizUser.featurePreferences[featureName] ?? false;
  }, [bizUser?.featurePreferences, bizUser?.plan]);

  /**
   * Get list of all enabled features
   */
  const getEnabledFeatures = useCallback((): string[] => {
    const prefs = bizUser?.featurePreferences || getDefaultFeaturePreferences(bizUser?.plan || 'free');
    return Object.entries(prefs)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
  }, [bizUser?.featurePreferences, bizUser?.plan]);

  /**
   * Get count of enabled features
   */
  const getEnabledFeatureCount = useCallback((): number => {
    return getEnabledFeatures().length;
  }, [getEnabledFeatures]);

  /**
   * Update feature preferences in context and persist to database
   */
  const updateFeaturePreferences = useCallback(async (prefs: FeaturePreferences): Promise<void> => {
    if (!bizUser?.businessId || !supabase) {
      console.error('[BusinessContext] Cannot update feature preferences: no business ID or supabase');
      throw new Error('No business ID found');
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('biz_users')
        .update({ feature_preferences: prefs })
        .eq('id', bizUser.id);

      if (error) throw error;

      // Update in context
      setBizUserState(prev => {
        if (!prev) return prev;
        const updated = { ...prev, featurePreferences: prefs };
        saveBizUser(updated);
        return updated;
      });

      console.log('[BusinessContext] Feature preferences updated:', prefs);
    } catch (err) {
      console.error('[BusinessContext] Failed to update feature preferences:', err);
      throw err;
    }
  }, [bizUser?.id, bizUser?.businessId]);

  /**
   * Update theme preference in context and persist to database
   */
  const updateThemePreference = useCallback(async (theme: ThemePreference): Promise<void> => {
    if (!bizUser?.businessId || !supabase) {
      console.error('[BusinessContext] Cannot update theme preference: no business ID or supabase');
      throw new Error('No business ID found');
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('biz_users')
        .update({ theme_preference: theme })
        .eq('id', bizUser.id);

      if (error) throw error;

      // Update in context and apply to DOM
      setBizUserState(prev => {
        if (!prev) return prev;
        const updated = { ...prev, themePreference: theme };
        saveBizUser(updated);
        return updated;
      });

      // Apply theme to DOM immediately
      applyThemeToDOM(theme);

      console.log('[BusinessContext] Theme preference updated:', theme);
    } catch (err) {
      console.error('[BusinessContext] Failed to update theme preference:', err);
      throw err;
    }
  }, [bizUser?.id, bizUser?.businessId, applyThemeToDOM]);

  /**
   * Update onboarding status and persist to database
   */
  const updateOnboardingStatus = useCallback(async (status: OnboardingStatus, phase?: number): Promise<void> => {
    if (!bizUser?.businessId || !supabase) {
      console.error('[BusinessContext] Cannot update onboarding status: no business ID or supabase');
      throw new Error('No business ID found');
    }

    try {
      const phaseValue = phase !== undefined ? phase : (bizUser.onboardingPhase || 0);

      // Update in database
      const { error } = await supabase
        .from('biz_users')
        .update({
          onboarding_status: status,
          onboarding_phase: phaseValue
        })
        .eq('id', bizUser.id);

      if (error) throw error;

      // Update in context
      setBizUserState(prev => {
        if (!prev) return prev;
        const updated = { ...prev, onboardingStatus: status, onboardingPhase: phaseValue };
        saveBizUser(updated);
        return updated;
      });

      console.log('[BusinessContext] Onboarding status updated:', { status, phase: phaseValue });
    } catch (err) {
      console.error('[BusinessContext] Failed to update onboarding status:', err);
      throw err;
    }
  }, [bizUser?.id, bizUser?.businessId, bizUser?.onboardingPhase]);

  /**
   * Check if onboarding is required (status !== 'completed')
   */
  const isOnboardingRequired = useCallback((): boolean => {
    return bizUser?.onboardingStatus !== 'completed';
  }, [bizUser?.onboardingStatus]);

  /**
   * Get current onboarding phase (0-6)
   */
  const getCurrentOnboardingPhase = useCallback((): number => {
    return bizUser?.onboardingPhase ?? 0;
  }, [bizUser?.onboardingPhase]);

  // Apply theme on mount or when theme preference changes
  useEffect(() => {
    if (bizUser?.themePreference) {
      applyThemeToDOM(bizUser.themePreference);
    }
  }, [bizUser?.themePreference, applyThemeToDOM]);

  const value = useMemo<BusinessContextValue>(() => ({
    bizUser,
    setBizUser,
    isAuthenticated: Boolean(bizUser),
    isLoading,
    logout,
    updatePlan,
    productSelection: (bizUser?.product_selection as 'rr' | 'lms' | 'both') || 'both',
    // Smart Onboarding methods
    canAccessFeature,
    getEnabledFeatures,
    updateFeaturePreferences,
    updateThemePreference,
    updateOnboardingStatus,
    applyThemeToDOM,
    getEnabledFeatureCount,
    isOnboardingRequired,
    getCurrentOnboardingPhase,
  }), [
    bizUser,
    setBizUser,
    isLoading,
    logout,
    updatePlan,
    canAccessFeature,
    getEnabledFeatures,
    updateFeaturePreferences,
    updateThemePreference,
    updateOnboardingStatus,
    applyThemeToDOM,
    getEnabledFeatureCount,
    isOnboardingRequired,
    getCurrentOnboardingPhase,
  ]);

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
    isLoading: ctx.isLoading,
    logout: ctx.logout,
    updatePlan: ctx.updatePlan,
  };
}
