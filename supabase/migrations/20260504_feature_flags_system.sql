-- ═══════════════════════════════════════════════════════════════════════════
-- Feature Flag System - Complete Schema
-- Tables: feature_definitions, business_features, feature_rollout,
--         feature_dependencies, feature_audit_log, feature_analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- ── feature_definitions ────────────────────────────────────────────────────
-- Master list of all available features in the system
CREATE TABLE IF NOT EXISTS public.feature_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name    text NOT NULL UNIQUE,
  description     text NOT NULL,
  category        text NOT NULL CHECK (category IN (
                  'messaging','document','analytics','automation','integration','mobile','enterprise','other')),
  is_public       boolean NOT NULL DEFAULT true,
  min_plan_tier   text NOT NULL DEFAULT 'starter' CHECK (min_plan_tier IN ('starter','professional','enterprise')),

  -- Dependencies: JSON array of feature names this feature requires
  dependencies    jsonb NOT NULL DEFAULT '[]',

  -- Conflicts: JSON array of feature names this feature conflicts with
  conflicts       jsonb NOT NULL DEFAULT '[]',

  -- Documentation and metadata
  documentation_url text,
  icon_url        text,
  launch_date     date,
  deprecation_date date,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('beta','active','deprecated','archived')),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_dependency_plan CHECK (
    min_plan_tier IN ('starter', 'professional', 'enterprise')
  )
);

CREATE INDEX IF NOT EXISTS idx_feature_definitions_category ON public.feature_definitions (category);
CREATE INDEX IF NOT EXISTS idx_feature_definitions_status ON public.feature_definitions (status);
CREATE INDEX IF NOT EXISTS idx_feature_definitions_min_plan ON public.feature_definitions (min_plan_tier);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS feature_definitions_set_updated_at ON public.feature_definitions;
CREATE TRIGGER feature_definitions_set_updated_at BEFORE UPDATE ON public.feature_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_definitions_select" ON public.feature_definitions;
DROP POLICY IF EXISTS "feature_definitions_insert" ON public.feature_definitions;
DROP POLICY IF EXISTS "feature_definitions_update" ON public.feature_definitions;
CREATE POLICY "feature_definitions_select" ON public.feature_definitions FOR SELECT USING (true);
CREATE POLICY "feature_definitions_insert" ON public.feature_definitions FOR INSERT WITH CHECK (true);
CREATE POLICY "feature_definitions_update" ON public.feature_definitions FOR UPDATE USING (true) WITH CHECK (true);

-- ── business_features ──────────────────────────────────────────────────────
-- Per-business feature enablement status
CREATE TABLE IF NOT EXISTS public.business_features (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  feature_name    text NOT NULL REFERENCES public.feature_definitions(feature_name) ON DELETE RESTRICT,

  -- Enablement status
  is_enabled      boolean NOT NULL DEFAULT false,

  -- Plan tier for this business (overrides default if set)
  plan_tier       text CHECK (plan_tier IN ('starter','professional','enterprise')),

  -- Rollout percentage (0-100)
  rollout_percentage integer NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- User segment IDs for gradual rollout (JSON array of user/business segment IDs)
  segment_ids     jsonb NOT NULL DEFAULT '[]',

  -- Configuration overrides (JSON)
  config_overrides jsonb NOT NULL DEFAULT '{}',

  -- Metadata
  enabled_by      uuid,
  enabled_at      timestamptz,
  reason          text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, feature_name),
  CONSTRAINT valid_rollout CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_business_features_business ON public.business_features (business_id);
CREATE INDEX IF NOT EXISTS idx_business_features_enabled ON public.business_features (business_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_business_features_plan ON public.business_features (business_id, plan_tier);
CREATE INDEX IF NOT EXISTS idx_business_features_feature ON public.business_features (feature_name);
CREATE INDEX IF NOT EXISTS idx_business_features_rollout ON public.business_features (business_id, rollout_percentage);

DROP TRIGGER IF EXISTS business_features_set_updated_at ON public.business_features;
CREATE TRIGGER business_features_set_updated_at BEFORE UPDATE ON public.business_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_features_select" ON public.business_features;
DROP POLICY IF EXISTS "business_features_insert" ON public.business_features;
DROP POLICY IF EXISTS "business_features_update" ON public.business_features;
CREATE POLICY "business_features_select" ON public.business_features FOR SELECT USING (true);
CREATE POLICY "business_features_insert" ON public.business_features FOR INSERT WITH CHECK (true);
CREATE POLICY "business_features_update" ON public.business_features FOR UPDATE USING (true) WITH CHECK (true);

-- ── feature_rollout ────────────────────────────────────────────────────────
-- Gradual rollout tracking (10%, 25%, 50%, 100%)
CREATE TABLE IF NOT EXISTS public.feature_rollout (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  feature_name    text NOT NULL,

  -- Rollout stages
  target_percentage integer NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
  current_percentage integer NOT NULL DEFAULT 0 CHECK (current_percentage >= 0 AND current_percentage <= 100),

  -- Rollout schedule
  scheduled_for   timestamptz,
  rolled_out_at   timestamptz,

  -- Status: pending, in_progress, completed, rolled_back, paused
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rolled_back','paused')),

  -- Rollback configuration
  auto_rollback_on_error boolean DEFAULT false,
  error_threshold numeric(5,2) DEFAULT 5.0,  -- percentage of errors before rollback

  -- Metadata
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, feature_name, target_percentage),
  FOREIGN KEY (business_id, feature_name) REFERENCES public.business_features(business_id, feature_name) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feature_rollout_business ON public.feature_rollout (business_id);
CREATE INDEX IF NOT EXISTS idx_feature_rollout_status ON public.feature_rollout (status);
CREATE INDEX IF NOT EXISTS idx_feature_rollout_scheduled ON public.feature_rollout (scheduled_for) WHERE status = 'pending';

DROP TRIGGER IF EXISTS feature_rollout_set_updated_at ON public.feature_rollout;
CREATE TRIGGER feature_rollout_set_updated_at BEFORE UPDATE ON public.feature_rollout
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.feature_rollout ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_rollout_all" ON public.feature_rollout;
CREATE POLICY "feature_rollout_all" ON public.feature_rollout FOR ALL USING (true) WITH CHECK (true);

-- ── feature_dependencies ───────────────────────────────────────────────────
-- Explicit feature dependency mapping
CREATE TABLE IF NOT EXISTS public.feature_dependencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name    text NOT NULL REFERENCES public.feature_definitions(feature_name) ON DELETE CASCADE,
  depends_on      text NOT NULL REFERENCES public.feature_definitions(feature_name) ON DELETE CASCADE,

  -- Dependency type: required, optional, conflicts
  dependency_type text NOT NULL DEFAULT 'required' CHECK (dependency_type IN ('required','optional','conflicts')),

  -- Description of why this dependency exists
  reason          text,

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(feature_name, depends_on),
  CONSTRAINT no_self_dependency CHECK (feature_name != depends_on)
);

CREATE INDEX IF NOT EXISTS idx_feature_dependencies_feature ON public.feature_dependencies (feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_dependencies_depends_on ON public.feature_dependencies (depends_on);

ALTER TABLE public.feature_dependencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_dependencies_all" ON public.feature_dependencies;
CREATE POLICY "feature_dependencies_all" ON public.feature_dependencies FOR ALL USING (true) WITH CHECK (true);

-- ── feature_audit_log ──────────────────────────────────────────────────────
-- Complete audit trail of feature flag changes
CREATE TABLE IF NOT EXISTS public.feature_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  feature_name    text NOT NULL,

  -- Action: enabled, disabled, updated, rollout_started, rollout_completed, rollback
  action          text NOT NULL CHECK (action IN (
                  'enabled','disabled','updated','rollout_started','rollout_completed','rollback','config_changed')),

  -- What changed
  old_values      jsonb,
  new_values      jsonb,

  -- Who made the change
  performed_by    uuid,
  performed_by_email text,

  -- Context
  reason          text,
  ip_address      text,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_business ON public.feature_audit_log (business_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_feature ON public.feature_audit_log (feature_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.feature_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.feature_audit_log (created_at DESC);

ALTER TABLE public.feature_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select" ON public.feature_audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.feature_audit_log;
CREATE POLICY "audit_log_select" ON public.feature_audit_log FOR SELECT USING (true);
CREATE POLICY "audit_log_insert" ON public.feature_audit_log FOR INSERT WITH CHECK (true);

-- ── feature_analytics ──────────────────────────────────────────────────────
-- Feature usage and adoption metrics
CREATE TABLE IF NOT EXISTS public.feature_analytics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  feature_name    text NOT NULL,

  -- Aggregate metrics (refreshed daily)
  usage_count     bigint NOT NULL DEFAULT 0,
  unique_users    integer NOT NULL DEFAULT 0,
  activation_rate numeric(5,2) NOT NULL DEFAULT 0,  -- percentage

  -- Feature-specific metrics
  messaging_volume bigint DEFAULT 0,  -- for chat feature
  documents_signed bigint DEFAULT 0,  -- for e-signature
  queries_executed bigint DEFAULT 0,  -- for AI features

  -- Engagement metrics
  daily_active_users integer DEFAULT 0,
  avg_session_duration_seconds integer DEFAULT 0,
  feature_retention_rate numeric(5,2),  -- % of users who used it again next day

  -- Impact metrics
  associated_revenue numeric(12,2) DEFAULT 0,
  customer_satisfaction_score numeric(3,2),  -- 0-5 scale
  churn_impact_percentage numeric(5,2),  -- correlation with churn

  -- Error metrics
  error_count     integer DEFAULT 0,
  error_rate      numeric(5,2) DEFAULT 0,  -- percentage

  -- Period
  period_date     date NOT NULL,
  period_type     text NOT NULL DEFAULT 'daily' CHECK (period_type IN ('hourly','daily','weekly','monthly')),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, feature_name, period_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_analytics_business ON public.feature_analytics (business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_feature ON public.feature_analytics (feature_name);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON public.feature_analytics (business_id, period_date);
CREATE INDEX IF NOT EXISTS idx_analytics_adoption ON public.feature_analytics (business_id, activation_rate DESC);

DROP TRIGGER IF EXISTS feature_analytics_set_updated_at ON public.feature_analytics;
CREATE TRIGGER feature_analytics_set_updated_at BEFORE UPDATE ON public.feature_analytics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.feature_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_all" ON public.feature_analytics;
CREATE POLICY "analytics_all" ON public.feature_analytics FOR ALL USING (true) WITH CHECK (true);

-- ── feature_usage_events ───────────────────────────────────────────────────
-- Raw event stream for feature usage (for analytics aggregation)
CREATE TABLE IF NOT EXISTS public.feature_usage_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  user_id         uuid,
  feature_name    text NOT NULL REFERENCES public.feature_definitions(feature_name) ON DELETE RESTRICT,

  -- Event type: accessed, used, completed, error
  event_type      text NOT NULL CHECK (event_type IN ('accessed','used','completed','error')),

  -- Feature-specific event data
  event_data      jsonb NOT NULL DEFAULT '{}',

  -- Error tracking
  error_message   text,
  error_stack     text,

  -- Performance
  duration_ms     integer,
  timestamp       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_business ON public.feature_usage_events (business_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_feature ON public.feature_usage_events (feature_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON public.feature_usage_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON public.feature_usage_events (event_type);

ALTER TABLE public.feature_usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_events_all" ON public.feature_usage_events;
CREATE POLICY "usage_events_all" ON public.feature_usage_events FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: Core Features
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.feature_definitions (
  feature_name, description, category, min_plan_tier, dependencies, status
) VALUES
  ('chat', 'Real-time messaging system for team collaboration', 'messaging', 'professional', '[]', 'active'),
  ('esign', 'Electronic signature capabilities for documents', 'document', 'professional', '["document_storage"]', 'active'),
  ('advanced_analytics', 'Advanced reporting and data visualization', 'analytics', 'professional', '[]', 'active'),
  ('ai_manager', 'AI-powered task and workflow management', 'automation', 'enterprise', '["pipeline_system"]', 'beta'),
  ('mobile_optimization', 'Mobile-responsive UI and native features', 'mobile', 'professional', '[]', 'active'),
  ('document_storage', 'Secure document storage and management', 'document', 'starter', '[]', 'active'),
  ('pipeline_system', 'Sales pipeline and deal tracking', 'automation', 'starter', '[]', 'active'),
  ('two_factor_auth', 'Two-factor authentication for security', 'enterprise', 'professional', '[]', 'active'),
  ('sso_integration', 'Single sign-on with enterprise providers', 'integration', 'enterprise', '[]', 'active'),
  ('api_access', 'REST API and webhook access', 'integration', 'enterprise', '[]', 'active'),
  ('custom_branding', 'Custom domain and brand customization', 'integration', 'professional', '[]', 'active'),
  ('team_management', 'Advanced team roles and permissions', 'enterprise', 'professional', '[]', 'active'),
  ('audit_logging', 'Comprehensive audit trail and compliance logs', 'enterprise', 'enterprise', '[]', 'active'),
  ('data_export', 'Export data in multiple formats', 'integration', 'professional', '[]', 'active'),
  ('webhooks', 'Outgoing webhooks for integrations', 'integration', 'enterprise', '[]', 'active')
ON CONFLICT (feature_name) DO NOTHING;

-- Insert feature dependencies
INSERT INTO public.feature_dependencies (feature_name, depends_on, dependency_type, reason) VALUES
  ('esign', 'document_storage', 'required', 'E-signatures require document storage'),
  ('ai_manager', 'pipeline_system', 'required', 'AI manager depends on pipeline system'),
  ('advanced_analytics', 'pipeline_system', 'optional', 'Advanced analytics works better with pipeline data'),
  ('sso_integration', 'two_factor_auth', 'optional', 'Enterprise SSO benefits from 2FA'),
  ('api_access', 'team_management', 'optional', 'API access for team coordination'),
  ('webhooks', 'api_access', 'required', 'Webhooks require API access')
ON CONFLICT (feature_name, depends_on) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to check if a feature is available for a business
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_business_id text,
  p_feature_name text
) RETURNS boolean AS $$
DECLARE
  v_is_enabled boolean;
  v_rollout_percentage integer;
  v_plan_tier text;
BEGIN
  SELECT is_enabled, rollout_percentage
  INTO v_is_enabled, v_rollout_percentage
  FROM public.business_features
  WHERE business_id = p_business_id AND feature_name = p_feature_name;

  -- If no explicit setting, check min plan tier requirement
  IF v_is_enabled IS NULL THEN
    SELECT plan_tier INTO v_plan_tier FROM public.businesses WHERE id::text = p_business_id;

    -- Check if plan meets minimum requirement
    SELECT min_plan_tier INTO v_plan_tier FROM public.feature_definitions
    WHERE feature_name = p_feature_name;

    RETURN true;  -- Default allow if no restriction
  END IF;

  -- Check rollout percentage (simulated with hash-based deterministic rollout)
  IF v_rollout_percentage < 100 THEN
    -- Use hash of business_id to ensure consistent rollout
    RETURN (abs((hashtext(p_business_id) % 100)) < v_rollout_percentage);
  END IF;

  RETURN v_is_enabled;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all enabled features for a business
CREATE OR REPLACE FUNCTION public.get_enabled_features(p_business_id text)
RETURNS TABLE(feature_name text, is_enabled boolean, rollout_percentage integer) AS $$
BEGIN
  RETURN QUERY
  SELECT bf.feature_name, bf.is_enabled, bf.rollout_percentage
  FROM public.business_features bf
  WHERE bf.business_id = p_business_id
  AND bf.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Function to log feature access attempt
CREATE OR REPLACE FUNCTION public.log_feature_access(
  p_business_id text,
  p_feature_name text,
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.feature_usage_events (
    business_id, user_id, feature_name, event_type, event_data
  ) VALUES (p_business_id, p_user_id, p_feature_name, p_event_type, p_event_data)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log feature flag changes
CREATE OR REPLACE FUNCTION public.log_feature_audit(
  p_business_id text,
  p_feature_name text,
  p_action text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_performed_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO public.feature_audit_log (
    business_id, feature_name, action, old_values, new_values,
    performed_by, reason
  ) VALUES (p_business_id, p_feature_name, p_action, p_old_values, p_new_values, p_performed_by, p_reason)
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;
