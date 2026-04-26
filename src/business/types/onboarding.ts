/**
 * Smart Onboarding Types
 * Complete type definitions for the business onboarding system
 */

// ── Business Categories ─────────────────────────────────────────────────────

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subtypes: BusinessType[];
  color: string;
  templates?: Template[];
}

// ── Business Types ──────────────────────────────────────────────────────────

export interface BusinessType {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  features: string[];
  setupTime: string; // e.g., "15 mins"
  popularTemplates?: string[];
}

// ── Templates ────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  description: string;
  features: string[];
  featureCount: number;
  setupTime: string;
  complexity: 'simple' | 'moderate' | 'complex';
  icon?: string;
  sampleData?: Record<string, unknown>;
  automations?: AutomationTemplate[];
  integrations?: string[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
}

// ── Onboarding Questions ────────────────────────────────────────────────────

export interface OnboardingQuestion {
  id: string;
  question: string;
  description?: string;
  type: 'yes_no' | 'multiple_choice' | 'text' | 'number' | 'dropdown';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  conditionalLogic?: {
    dependsOn: string; // question ID
    value: string | boolean;
    condition: 'equals' | 'contains' | 'greaterThan';
  };
}

// ── Behavior Recommendations ────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  type: 'feature' | 'automation' | 'integration' | 'training';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  expectedImpact: string;
  learnMoreUrl?: string;
}

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

// ── Onboarding Data ──────────────────────────────────────────────────────────

export interface OnboardingData {
  category?: BusinessCategory;
  type?: BusinessType;
  template?: Template;
  answers: Record<string, unknown>;
  featurePreferences?: FeaturePreferences;
  themePreference?: {
    primaryColor?: string;
    secondaryColor?: string;
    layout?: string;
    logoUrl?: string;
  };
  selectedPipelines?: string[];
  recommendations?: Recommendation[];
}

// ── Onboarding State ─────────────────────────────────────────────────────────

export type OnboardingPhase =
  | 'category_selection'
  | 'type_selection'
  | 'template_selection'
  | 'template_preview'
  | 'questions'
  | 'recommendations'
  | 'summary'
  | 'complete';

export interface OnboardingState {
  currentPhase: OnboardingPhase;
  phaseProgress: number; // 0-100
  data: OnboardingData;
  isLoading: boolean;
  error?: string;
}

// ── Placeholders for other types ────────────────────────────────────────────

export interface OnboardingResult {}
export interface Pipeline {}
export interface AutomationRule {}
