/**
 * Onboarding Utility Functions
 * Helper functions for Smart Onboarding system
 */

import type {
  FeaturePreferences,
  ThemePreference,
  ThemeColor,
  Pipeline,
  AutomationRule,
  BusinessType,
  FeaturePreference,
} from '../types/onboarding';

// Mock constants for demonstration
const DEFAULT_THEME_COLORS = {
  primary: { hex: '#ff4400' },
  secondary: { hex: '#0a0e27' },
  accent: { hex: '#ff4400' },
  background: { hex: '#0a0e27' },
  text: { hex: '#ffffff' },
  textMuted: { hex: '#9ca3af' },
};

/**
 * Get default feature preferences based on business type
 */
export function getDefaultFeaturePreferences(businessType?: BusinessType): FeaturePreferences {
  return {
    product_catalog: true,
    lead_management: false,
    email_campaigns: false,
    automation: false,
    social_media: false,
  };
}

/**
 * Get default theme preference
 */
export function getDefaultThemePreference(): ThemePreference {
  return { ...DEFAULT_THEME_COLORS } as ThemePreference;
}

/**
 * Apply theme colors to DOM via CSS variables
 */
export function applyThemeColors(theme: ThemePreference): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary.hex);
  root.style.setProperty('--color-secondary', theme.secondary.hex);
  root.style.setProperty('--color-accent', theme.accent.hex);
  root.style.setProperty('--color-background', theme.background.hex);
  root.style.setProperty('--color-text', theme.text.hex);
  root.style.setProperty('--color-text-muted', theme.textMuted.hex);
}

/**
 * Remove/revert theme colors
 */
export function removeThemeColors(): void {
  const root = document.documentElement;
  const themeVars = [
    '--color-primary',
    '--color-secondary',
    '--color-accent',
    '--color-background',
    '--color-text',
    '--color-text-muted',
    '--color-border',
    '--color-success',
    '--color-error',
    '--color-warning',
  ];

  for (const varName of themeVars) {
    root.style.removeProperty(varName);
  }
}

/**
 * Calculate onboarding progress as percentage
 */
export function calculateOnboardingProgress(currentPhase: number, totalPhases: number): number {
  if (totalPhases <= 0) return 0;
  const percentage = ((currentPhase + 1) / totalPhases) * 100;
  return Math.min(Math.round(percentage), 100);
}

/**
 * Get human-readable label for a feature
 */
export function getFeatureLabel(featureName: FeaturePreference): string {
  const labels: Record<FeaturePreference, string> = {
    product_catalog: 'Product Catalog',
    lead_management: 'Lead Management',
    email_campaigns: 'Email Campaigns',
    automation: 'Workflow Automation',
    social_media: 'Social Media',
  };
  return labels[featureName] || featureName;
}

/**
 * Get emoji icon for a feature
 */
export function getFeatureIcon(featureName: FeaturePreference): string {
  const icons: Record<FeaturePreference, string> = {
    product_catalog: '📦',
    lead_management: '👥',
    email_campaigns: '📧',
    automation: '🤖',
    social_media: '📱',
  };
  return icons[featureName] || '✨';
}

/**
 * Get description for a feature
 */
export function getFeatureDescription(featureName: FeaturePreference): string {
  const descriptions: Record<FeaturePreference, string> = {
    product_catalog: 'Showcase your products or services',
    lead_management: 'Track potential customers through their journey',
    email_campaigns: 'Send automated email campaigns to customers',
    automation: 'Automate repetitive business workflows',
    social_media: 'Manage all social media from one place',
  };
  return descriptions[featureName] || '';
}

/**
 * Safely merge theme preferences
 */
export function mergeThemePreferences(
  base: ThemePreference,
  updates: Partial<ThemePreference>
): ThemePreference {
  const merged: ThemePreference = { ...base };
  const colorKeys: Array<keyof ThemePreference> = [
    'primary',
    'secondary',
    'accent',
    'background',
    'text',
    'textMuted',
  ];

  for (const key of colorKeys) {
    if (key in updates && updates[key]) {
      merged[key] = updates[key] as ThemeColor;
    }
  }

  return merged;
}
