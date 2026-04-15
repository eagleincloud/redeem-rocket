-- Growth Platform Tables: Email Sequences, Automation, Social, Lead Connectors, Providers
-- All tables follow the pattern: UUID PK, TEXT business_id, timestamps, RLS policies

-- 1. EMAIL PROVIDER CONFIG (SMTP/SES/Resend configuration per business)
CREATE TABLE IF NOT EXISTS email_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  provider_type VARCHAR(50) NOT NULL, -- 'smtp', 'ses', 'resend'
  provider_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  config_data JSONB, -- {smtp_host, smtp_port, smtp_user, smtp_pass} or {aws_access_key, aws_secret} or {resend_api_key}
  verified_domain VARCHAR(255),
  dkim_record VARCHAR(1024),
  spf_record VARCHAR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_provider_configs_business_id ON email_provider_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_primary ON email_provider_configs(business_id, is_primary);

DROP POLICY IF EXISTS email_provider_configs_select ON email_provider_configs;
DROP POLICY IF EXISTS email_provider_configs_insert ON email_provider_configs;
DROP POLICY IF EXISTS email_provider_configs_update ON email_provider_configs;
DROP POLICY IF EXISTS email_provider_configs_delete ON email_provider_configs;

ALTER TABLE email_provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_provider_configs_select ON email_provider_configs
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY email_provider_configs_insert ON email_provider_configs
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY email_provider_configs_update ON email_provider_configs
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY email_provider_configs_delete ON email_provider_configs
  FOR DELETE USING (business_id = auth.uid()::text);

-- 2. EMAIL SEQUENCES (Drip campaigns with Day 1, 3, 7 steps)
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  campaign_id UUID,
  sequence_name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'signup', 'purchase', 'manual', 'abandoned_cart'
  step_number INT NOT NULL,
  step_delay_days INT NOT NULL, -- 0, 3, 7, 14 etc
  email_subject VARCHAR(255) NOT NULL,
  email_body TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_business_id ON email_sequences(business_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign_id ON email_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger_type ON email_sequences(trigger_type);

DROP POLICY IF EXISTS email_sequences_select ON email_sequences;
DROP POLICY IF EXISTS email_sequences_insert ON email_sequences;
DROP POLICY IF EXISTS email_sequences_update ON email_sequences;
DROP POLICY IF EXISTS email_sequences_delete ON email_sequences;

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_sequences_select ON email_sequences
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY email_sequences_insert ON email_sequences
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY email_sequences_update ON email_sequences
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY email_sequences_delete ON email_sequences
  FOR DELETE USING (business_id = auth.uid()::text);

-- 3. SOCIAL ACCOUNTS (Connected Twitter, Facebook, LinkedIn, Instagram accounts)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'facebook', 'linkedin', 'instagram', 'tiktok'
  account_name VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT TRUE,
  followers_count INT DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_business_id ON social_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(business_id, platform);

DROP POLICY IF EXISTS social_accounts_select ON social_accounts;
DROP POLICY IF EXISTS social_accounts_insert ON social_accounts;
DROP POLICY IF EXISTS social_accounts_update ON social_accounts;
DROP POLICY IF EXISTS social_accounts_delete ON social_accounts;

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_accounts_select ON social_accounts
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY social_accounts_insert ON social_accounts
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY social_accounts_update ON social_accounts
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY social_accounts_delete ON social_accounts
  FOR DELETE USING (business_id = auth.uid()::text);

-- 4. SOCIAL POSTS (Scheduled posts to social platforms)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  social_account_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  post_content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video', 'carousel'
  media_urls TEXT[], -- Array of image/video URLs
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  likes_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_business_id ON social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_account_id ON social_posts(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(business_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);

DROP POLICY IF EXISTS social_posts_select ON social_posts;
DROP POLICY IF EXISTS social_posts_insert ON social_posts;
DROP POLICY IF EXISTS social_posts_update ON social_posts;
DROP POLICY IF EXISTS social_posts_delete ON social_posts;

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_posts_select ON social_posts
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY social_posts_insert ON social_posts
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY social_posts_update ON social_posts
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY social_posts_delete ON social_posts
  FOR DELETE USING (business_id = auth.uid()::text);

-- 5. AUTOMATION RULES (If/Then automation workflows)
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL, -- 'lead_added', 'email_opened', 'email_clicked', 'lead_qualified', 'inactivity_30d'
  trigger_conditions JSONB, -- {field: 'status', operator: 'equals', value: 'hot'}
  action_type VARCHAR(100) NOT NULL, -- 'send_email', 'send_sms', 'create_task', 'add_tag', 'update_field', 'webhook'
  action_config JSONB, -- {email_template_id: '...', sms_body: '...', webhook_url: '...'}
  is_active BOOLEAN DEFAULT TRUE,
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_business_id ON automation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON automation_rules(business_id, trigger_type);

DROP POLICY IF EXISTS automation_rules_select ON automation_rules;
DROP POLICY IF EXISTS automation_rules_insert ON automation_rules;
DROP POLICY IF EXISTS automation_rules_update ON automation_rules;
DROP POLICY IF EXISTS automation_rules_delete ON automation_rules;

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_rules_select ON automation_rules
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY automation_rules_insert ON automation_rules
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY automation_rules_update ON automation_rules
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY automation_rules_delete ON automation_rules
  FOR DELETE USING (business_id = auth.uid()::text);

-- 6. LEAD CONNECTORS (CSV uploads, webhook URLs, form embeds, API keys)
CREATE TABLE IF NOT EXISTS lead_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_name VARCHAR(255) NOT NULL,
  connector_type VARCHAR(50) NOT NULL, -- 'csv_upload', 'webhook', 'form_embed', 'api_key', 'zapier'
  source_name VARCHAR(255), -- e.g., 'Shopify', 'WooCommerce', 'Typeform', 'Calendly'
  webhook_url VARCHAR(1024),
  api_key VARCHAR(255),
  form_embed_code TEXT,
  field_mapping JSONB, -- {remote_field: 'local_field', ...}
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_connectors_business_id ON lead_connectors(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_connectors_type ON lead_connectors(business_id, connector_type);

DROP POLICY IF EXISTS lead_connectors_select ON lead_connectors;
DROP POLICY IF EXISTS lead_connectors_insert ON lead_connectors;
DROP POLICY IF EXISTS lead_connectors_update ON lead_connectors;
DROP POLICY IF EXISTS lead_connectors_delete ON lead_connectors;

ALTER TABLE lead_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_connectors_select ON lead_connectors
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY lead_connectors_insert ON lead_connectors
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY lead_connectors_update ON lead_connectors
  FOR UPDATE USING (business_id = auth.uid()::text);

CREATE POLICY lead_connectors_delete ON lead_connectors
  FOR DELETE USING (business_id = auth.uid()::text);
