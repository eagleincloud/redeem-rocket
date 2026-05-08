-- =====================================================================
-- SMART ONBOARDING & FEATURE MARKETPLACE SCHEMA MIGRATION
-- Redeem Rocket Customer App
-- Created: May 8, 2026
-- =====================================================================

-- This migration adds support for:
-- 1. Feature preferences per business
-- 2. Onboarding status tracking
-- 3. Feature configurations
-- 4. Feature usage analytics
-- 5. Feature integrations

-- =====================================================================
-- 1. UPDATE biz_users TABLE - Add onboarding fields
-- =====================================================================

ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS feature_preferences JSONB DEFAULT '
{
  "product_catalog": true,
  "lead_management": true,
  "email_campaigns": false,
  "automation": false,
  "social_media": false
}';

ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'pending';
-- Values: 'pending' | 'in_progress' | 'completed'

ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_biz_users_onboarding_status
ON biz_users(user_id, onboarding_status);

-- =====================================================================
-- 2. NEW TABLE: business_enabled_features
-- =====================================================================

CREATE TABLE IF NOT EXISTS business_enabled_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  config JSONB, -- Feature-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, feature_id)
);

CREATE INDEX idx_business_enabled_features_business ON business_enabled_features(business_id);
CREATE INDEX idx_business_enabled_features_active ON business_enabled_features(business_id, is_active);

-- =====================================================================
-- 3. NEW TABLE: business_feature_configs
-- =====================================================================

CREATE TABLE IF NOT EXISTS business_feature_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  config_type VARCHAR(100) NOT NULL,
  -- config_type: 'email_provider' | 'payment_provider' | 'messaging' | 'storage' | 'analytics'
  provider_type VARCHAR(100),
  -- provider_type: 'resend' | 'smtp' | 'stripe' | 'whatsapp' | 'twilio' | etc
  config_data JSONB NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, feature_id, config_type, provider_type)
);

CREATE INDEX idx_business_feature_configs_business ON business_feature_configs(business_id);
CREATE INDEX idx_business_feature_configs_primary ON business_feature_configs(business_id, config_type, is_primary);

-- =====================================================================
-- 4. NEW TABLE: feature_usage_analytics
-- =====================================================================

CREATE TABLE IF NOT EXISTS feature_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  usage_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, feature_id, date)
);

CREATE INDEX idx_feature_usage_analytics_business ON feature_usage_analytics(business_id);
CREATE INDEX idx_feature_usage_analytics_date ON feature_usage_analytics(date);

-- =====================================================================
-- 5. NEW TABLE: automation_rules
-- =====================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  -- trigger_type: 'lead_added' | 'lead_contacted' | 'stage_changed' | 'email_opened' | 'email_clicked' | 'inactivity_30d'
  trigger_config JSONB, -- Trigger-specific config
  conditions JSONB, -- Array of AND/OR conditions
  action_type VARCHAR(100) NOT NULL,
  -- action_type: 'send_email' | 'send_whatsapp' | 'send_sms' | 'add_tag' | 'update_field' | 'notify_manager'
  action_config JSONB, -- Action-specific config
  is_active BOOLEAN DEFAULT true,
  run_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  created_from_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_business ON automation_rules(business_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(business_id, is_active);

-- =====================================================================
-- 6. NEW TABLE: automation_executions
-- =====================================================================

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_id VARCHAR(100), -- lead_id, customer_id, etc
  entity_type VARCHAR(50), -- 'lead' | 'customer' | 'order'
  status VARCHAR(50), -- 'pending' | 'executed' | 'failed' | 'skipped'
  result JSONB, -- Execution result/response
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_executions_rule ON automation_executions(rule_id);
CREATE INDEX idx_automation_executions_business ON automation_executions(business_id);
CREATE INDEX idx_automation_executions_created ON automation_executions(created_at);

-- =====================================================================
-- 7. NEW TABLE: email_campaigns
-- =====================================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100), -- 'manual' | 'signup' | 'purchase' | 'abandoned_cart'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'active' | 'paused' | 'completed'
  steps JSONB NOT NULL, -- Array of email steps
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_business ON email_campaigns(business_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(business_id, status);

-- =====================================================================
-- 8. NEW TABLE: pipeline_stages
-- =====================================================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pipeline_name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(255) NOT NULL,
  stage_order INT,
  color VARCHAR(7), -- Hex color
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, pipeline_name, stage_name)
);

CREATE INDEX idx_pipeline_stages_business ON pipeline_stages(business_id);

-- =====================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all new tables
ALTER TABLE business_enabled_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see features for their own business
CREATE POLICY "Users see own features" ON business_enabled_features
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own features" ON business_enabled_features
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see configs for their own business
CREATE POLICY "Users see own configs" ON business_feature_configs
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own configs" ON business_feature_configs
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see analytics for their own business
CREATE POLICY "Users see own analytics" ON feature_usage_analytics
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see automation rules for their own business
CREATE POLICY "Users see own automation" ON automation_rules
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own automation" ON automation_rules
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see executions for their own business
CREATE POLICY "Users see own executions" ON automation_executions
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see campaigns for their own business
CREATE POLICY "Users see own campaigns" ON email_campaigns
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own campaigns" ON email_campaigns
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only see pipeline stages for their own business
CREATE POLICY "Users see own pipeline" ON pipeline_stages
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own pipeline" ON pipeline_stages
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- =====================================================================
-- 10. HELPER VIEWS
-- =====================================================================

-- View: User's enabled features summary
CREATE OR REPLACE VIEW user_enabled_features AS
SELECT
  b.id as business_id,
  b.user_id,
  bef.feature_id,
  bef.is_active,
  bef.config,
  bef.enabled_at
FROM business_enabled_features bef
JOIN businesses b ON bef.business_id = b.id
WHERE bef.is_active = true;

-- View: Automation rule execution summary
CREATE OR REPLACE VIEW automation_summary AS
SELECT
  ar.id as rule_id,
  ar.business_id,
  ar.name,
  ar.is_active,
  COUNT(CASE WHEN ae.status = 'executed' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN ae.status = 'failed' THEN 1 END) as failed_runs,
  MAX(ae.executed_at) as last_executed
FROM automation_rules ar
LEFT JOIN automation_executions ae ON ar.id = ae.rule_id
GROUP BY ar.id, ar.business_id, ar.name, ar.is_active;

-- =====================================================================
-- 11. CHANGELOG
-- =====================================================================
/*
Version 1.0.0 (May 8, 2026):
- Added onboarding fields to biz_users
- Created business_enabled_features table
- Created business_feature_configs table
- Created feature_usage_analytics table
- Created automation_rules table
- Created automation_executions table
- Created email_campaigns table
- Created pipeline_stages table
- Applied RLS policies for data isolation
- Created helper views for analytics
*/

-- =====================================================================
-- MIGRATION COMPLETE
-- Run this file against your Supabase database to apply the schema
-- =====================================================================
