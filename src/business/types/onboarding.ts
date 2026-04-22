/**
 * Smart Onboarding Types
 * Complete type definitions for the business onboarding system
 */

// ── Feature Preferences ─────────────────────────────────────────────────────

export type FeaturePreference =
  | 'product_catalog'
  | 'lead_management'
  | 'email_campaigns'
  | 'automation'
  | 'social_media';

export interface FeaturePreferences {
  product_catalog: boolean;
  lead_management: boolean;
  email_campaigns: boolean;
  automation: boolean;
  social_media: boolean;
}

// ── Theme Preferences ────────────────────────────────────────────────────────

export interface ThemeColor {
  hex: string;
  rgb?: string;
  name?: string;
}

export interface ThemePreference {
  primary: ThemeColor;
  secondary: ThemeColor;
  accent: ThemeColor;
  background: ThemeColor;
  text: ThemeColor;
  textMuted: ThemeColor;
  border?: ThemeColor;
  success?: ThemeColor;
  error?: ThemeColor;
  warning?: ThemeColor;
}

// ── Placeholder for remaining types (see verification document for full list)
export interface OnboardingState {}
export interface OnboardingResult {}
export interface Pipeline {}
export interface AutomationRule {}
