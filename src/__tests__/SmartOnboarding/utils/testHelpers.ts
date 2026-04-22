/**
 * Test utilities for SmartOnboarding tests
 * Provides mocks, fixtures, and helper functions for consistent test setup
 */

import { vi } from 'vitest';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { BizUser } from '@/business/context/BusinessContext';
import { FeaturePreferences } from '@/business/components/SmartOnboarding';

/**
 * Mock BusinessContext provider for testing
 * Wraps component with necessary context and router
 */
export function createMockBusinessProvider(
  mockContextValue: {
    bizUser: BizUser | null;
    setBizUser: (user: BizUser | null) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    updatePlan: (plan: any, expiry?: string | null) => void;
    productSelection: 'rr' | 'lms' | 'both';
    canAccessFeature: (feature: string) => boolean;
  }
) {
  return ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

/**
 * Create a mock BizUser for testing
 */
export function createMockBizUser(overrides?: Partial<BizUser>): BizUser {
  return {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    businessId: 'biz-1',
    businessName: 'Test Business',
    businessLogo: '🚀',
    businessCategory: 'Technology',
    role: 'business',
    plan: 'free',
    planExpiry: null,
    onboarding_done: false,
    feature_preferences: {
      product_catalog: false,
      lead_management: false,
      email_campaigns: false,
      automation: false,
      social_media: false,
    },
    ...overrides,
  };
}

/**
 * Create default feature preferences for testing
 */
export function createDefaultFeaturePreferences(
  overrides?: Partial<FeaturePreferences>
): FeaturePreferences {
  return {
    product_catalog: true,
    lead_management: false,
    email_campaigns: false,
    automation: false,
    social_media: false,
    ...overrides,
  };
}

/**
 * Mock completeOnboarding function
 */
export const mockCompleteOnboarding = vi.fn(
  async (userId: string, preferences: FeaturePreferences): Promise<boolean> => {
    return true;
  }
);

/**
 * Setup localStorage for tests
 */
export function setupLocalStorage() {
  localStorage.clear();
  return {
    clear: () => localStorage.clear(),
    setBizUser: (user: BizUser) => {
      localStorage.setItem('biz_user', JSON.stringify(user));
    },
    getBizUser: () => {
      const item = localStorage.getItem('biz_user');
      return item ? JSON.parse(item) : null;
    },
  };
}

/**
 * Wait for animations to complete (300ms default for SmartOnboarding)
 */
export async function waitForAnimation(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test data constants
 */
export const FEATURE_QUESTIONS_DATA = [
  {
    id: 'product_catalog',
    icon: '📦',
    title: 'Do you want to showcase your products or services?',
    yesLabel: 'Yes, showcase products',
    noLabel: 'No, not needed',
  },
  {
    id: 'lead_management',
    icon: '👥',
    title: 'Do you want to capture and manage sales leads?',
    yesLabel: 'Yes, manage leads',
    noLabel: 'No, not needed',
  },
  {
    id: 'email_campaigns',
    icon: '📧',
    title: 'Do you want to send automated email campaigns?',
    yesLabel: 'Yes, use email campaigns',
    noLabel: 'No, handle manually',
  },
  {
    id: 'automation',
    icon: '🤖',
    title: 'Do you want to automate your business workflows?',
    yesLabel: 'Yes, automate workflows',
    noLabel: 'No, prefer manual',
  },
  {
    id: 'social_media',
    icon: '📱',
    title: 'Do you want to manage your social media?',
    yesLabel: 'Yes, integrate social',
    noLabel: 'No, not right now',
  },
];
