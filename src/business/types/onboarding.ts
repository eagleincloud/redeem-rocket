/**
 * Onboarding Types
 * Defines TypeScript interfaces for the Smart Onboarding flow
 */

export interface FeaturePreferences {
  products: boolean;
  leads: boolean;
  email: boolean;
  automation: boolean;
  social: boolean;
}

export interface ThemePreference {
  layout: 'visual' | 'minimalist' | 'data-heavy';
  primary: string;
  font: 'modern' | 'traditional' | 'playful';
  brandName: string;
}

export interface OnboardingResult {
  preferences: FeaturePreferences;
  theme: ThemePreference;
  completedAt: string;
}

export interface OnboardingPhase {
  id: 'discovery' | 'showcase' | 'theme' | 'setup' | 'preview';
  label: string;
  index: number;
}

export interface Feature {
  id: keyof FeaturePreferences;
  name: string;
  icon: any;
  color: string;
  description: string;
  examples: string;
}
