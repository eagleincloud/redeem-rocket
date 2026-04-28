/**
 * Advanced 9-Screen Onboarding Flow Types
 * Complete type system for the activation funnel
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

// ── Business Types ──────────────────────────────────────────────────────────

export type BusinessType =
  | 'restaurant'
  | 'b2b_services'
  | 'ecommerce'
  | 'freelancer'
  | 'other';

export interface BusinessTypeConfig {
  type: BusinessType;
  label: string;
  icon: string;
  description: string;
  keyFeatures: string[];
  setupQuestions: DynamicQuestion[];
  pipelineTemplate: string;
  suggestedFeatures: FeaturePreference[];
}

// ── Dynamic Questions ──────────────────────────────────────────────────────

export interface DynamicQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'toggle' | 'number' | 'textarea';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  helpText?: string;
}

export interface DynamicSetupAnswers {
  [questionId: string]: string | string[] | boolean | number;
}

// ── Theme Preferences ──────────────────────────────────────────────────────

export interface ThemeColor {
  hex: string;
  rgb?: string;
  name?: string;
}

export interface ThemePreference {
  dashboardStyle: 'minimal' | 'data_heavy' | 'visual_focused';
  pipelineTemplate: 'sales' | 'order' | 'support' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
}

// ── Onboarding Steps ───────────────────────────────────────────────────────

export type OnboardingStep =
  | 'landing'
  | 'signup'
  | 'welcome'
  | 'features'
  | 'business_type'
  | 'feature_showcase'
  | 'theme_selection'
  | 'dynamic_setup'
  | 'ai_setup'
  | 'dashboard_preview'
  | 'complete';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  progress: number; // 0-100
}

// ── Use Case Selection ────────────────────────────────────────────────────

export type UseCase =
  | 'restaurant'
  | 'services'
  | 'online_store'
  | 'none';

// ── Complete Onboarding State ──────────────────────────────────────────────

export interface OnboardingState {
  // Entry phase
  selectedUseCase?: UseCase;

  // User data
  email?: string;
  name?: string;
  businessName?: string;

  // Feature phase
  featurePreferences: FeaturePreferences;

  // Business type
  businessType: BusinessType;

  // Theme & setup
  themePreference: ThemePreference;
  dynamicSetupAnswers: DynamicSetupAnswers;

  // AI setup result
  websiteUrl?: string;
  aiExtractedData?: Record<string, any>;

  // Generated resources
  pipelines?: Array<{ name: string; stages: Array<{ name: string; order: number }> }>;
  sampleLeads?: Array<{ name: string; company: string; value: number; status: string }>;

  // Tracking
  progress: OnboardingProgress;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// ── Pipeline Definition ───────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface Pipeline {
  id?: string;
  businessId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  template?: string;
  createdFromAI?: boolean;
  createdAt?: string;
}

// ── Sample Lead for Preview ────────────────────────────────────────────────

export interface SampleLead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  value?: number;
  stage: string;
  status: 'new' | 'active' | 'converted' | 'lost';
  lastActivityAt: string;
}

// ── AI Setup Data ───────────────────────────────────────────────────────────

export interface AISetupResult {
  businessName: string;
  industry: string;
  description: string;
  keywords: string[];
  suggestedFeatures: FeaturePreference[];
  samplePipelines: Pipeline[];
  sampleLeads: SampleLead[];
  automationSuggestions: Array<{ name: string; description: string }>;
}

// ── Dashboard Preview ──────────────────────────────────────────────────────

export interface DashboardSnapshot {
  pipelines: Pipeline[];
  leads: SampleLead[];
  tasksCount: number;
  suggestedActions: Array<{ title: string; description: string; action: string }>;
}

// ── Onboarding Event Tracking ──────────────────────────────────────────────

export interface OnboardingEvent {
  timestamp: string;
  eventType: 'step_completed' | 'feature_selected' | 'setup_answer' | 'error' | 'abandoned';
  step: OnboardingStep;
  data?: Record<string, any>;
}

// ── Success Metrics ───────────────────────────────────────────────────────

export interface OnboardingMetrics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  averageTimeToCompletion: number; // in seconds
  dropoffByStep: Record<OnboardingStep, number>;
  mostSelectedFeatures: FeaturePreference[];
  mostSelectedBusinessTypes: BusinessType[];
}
