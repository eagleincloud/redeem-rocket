/**
 * Feature Flag System Types
 */

export type FeatureCategory =
  | 'messaging'
  | 'document'
  | 'analytics'
  | 'automation'
  | 'integration'
  | 'mobile'
  | 'enterprise'
  | 'other';

export type PlanTier = 'starter' | 'professional' | 'enterprise';

export type FeatureStatus = 'beta' | 'active' | 'deprecated' | 'archived';

export type DependencyType = 'required' | 'optional' | 'conflicts';

export type FeatureAction =
  | 'enabled'
  | 'disabled'
  | 'updated'
  | 'rollout_started'
  | 'rollout_completed'
  | 'rollback'
  | 'config_changed';

export type RolloutStatus = 'pending' | 'in_progress' | 'completed' | 'rolled_back' | 'paused';

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature Definition - Master list of all features
 */
export interface Feature {
  id: string;
  feature_name: string;
  description: string;
  category: FeatureCategory;
  is_public: boolean;
  min_plan_tier: PlanTier;
  dependencies: string[]; // array of feature names
  conflicts: string[]; // array of feature names
  documentation_url?: string;
  icon_url?: string;
  launch_date?: string;
  deprecation_date?: string;
  status: FeatureStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Business Feature - Per-business feature enablement
 */
export interface BusinessFeature {
  id: string;
  business_id: string;
  feature_name: string;
  is_enabled: boolean;
  plan_tier?: PlanTier;
  rollout_percentage: number;
  segment_ids: string[]; // JSON array
  config_overrides: Record<string, any>;
  enabled_by?: string;
  enabled_at?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Feature Rollout - Gradual rollout tracking
 */
export interface FeatureRollout {
  id: string;
  business_id: string;
  feature_name: string;
  target_percentage: number;
  current_percentage: number;
  scheduled_for?: string;
  rolled_out_at?: string;
  status: RolloutStatus;
  auto_rollback_on_error: boolean;
  error_threshold: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Feature Dependency - Explicit dependency mapping
 */
export interface FeatureDependency {
  id: string;
  feature_name: string;
  depends_on: string;
  dependency_type: DependencyType;
  reason?: string;
  created_at: string;
}

/**
 * Feature Audit Log - Audit trail of changes
 */
export interface FeatureAuditLog {
  id: string;
  business_id: string;
  feature_name: string;
  action: FeatureAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by?: string;
  performed_by_email?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

/**
 * Feature Analytics - Usage and adoption metrics
 */
export interface FeatureAnalytics {
  id: string;
  business_id: string;
  feature_name: string;
  usage_count: number;
  unique_users: number;
  activation_rate: number; // percentage
  messaging_volume?: number;
  documents_signed?: number;
  queries_executed?: number;
  daily_active_users?: number;
  avg_session_duration_seconds?: number;
  feature_retention_rate?: number;
  associated_revenue?: number;
  customer_satisfaction_score?: number;
  churn_impact_percentage?: number;
  error_count?: number;
  error_rate?: number;
  period_date: string;
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

/**
 * Feature Usage Event - Raw event stream
 */
export interface FeatureUsageEvent {
  id: string;
  business_id: string;
  user_id?: string;
  feature_name: string;
  event_type: 'accessed' | 'used' | 'completed' | 'error';
  event_data: Record<string, any>;
  error_message?: string;
  error_stack?: string;
  duration_ms?: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature Flag Response - What the API returns
 */
export interface FeatureFlagResponse {
  feature_name: string;
  description?: string;
  category?: FeatureCategory;
  is_enabled: boolean;
  rollout_percentage: number;
  plan_tier?: PlanTier;
  dependencies?: string[];
  min_plan_tier?: PlanTier;
}

/**
 * Features List Response
 */
export interface FeaturesListResponse {
  features: Record<string, FeatureFlagResponse>;
}

/**
 * Feature Check Response (single feature)
 */
export interface FeatureCheckResponse extends FeatureFlagResponse {}

/**
 * Feature Analytics Response
 */
export interface FeatureAnalyticsResponse {
  period: string;
  analytics: FeatureAnalytics[];
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enable Feature Request
 */
export interface EnableFeatureRequest {
  businessId: string;
  userId?: string;
  reason?: string;
}

/**
 * Disable Feature Request
 */
export interface DisableFeatureRequest {
  businessId: string;
  userId?: string;
  reason?: string;
}

/**
 * Update Rollout Request
 */
export interface UpdateRolloutRequest {
  businessId: string;
  userId?: string;
  rolloutPercentage: number;
  scheduledFor?: string;
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature Flag Context - For React Context
 */
export interface FeatureFlagContextType {
  features: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  checkFeature: (featureName: string) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Feature Flag Props - For conditional rendering
 */
export interface FeatureFlagProps {
  name: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Upgrade Prompt Props
 */
export interface UpgradePromptProps {
  feature: string;
  currentPlan: PlanTier;
  requiredPlan: PlanTier;
  onUpgrade?: () => void;
}

/**
 * Rollout Stats
 */
export interface RolloutStats {
  feature_name: string;
  enabled_count: number;
  total_count: number;
  rollout_percentage: number;
  target_percentage: number;
  scheduled_for?: string;
  status: RolloutStatus;
}
