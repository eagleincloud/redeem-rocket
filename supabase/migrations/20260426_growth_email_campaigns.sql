-- Growth Platform: Email Campaigns
-- Complete email automation, tracking, segmentation, and analytics
-- Created: 2026-04-26

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. EMAIL CAMPAIGNS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Basic info
  name varchar(255) NOT NULL,
  description text,
  subject varchar(255) NOT NULL,
  body text NOT NULL,

  -- Status and scheduling
  status varchar(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'sending', 'sent', 'paused', 'archived'
  )),
  send_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Template and segments
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES email_segments(id) ON DELETE SET NULL,

  -- Analytics
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  unsubscribe_count integer DEFAULT 0,
  complaint_count integer DEFAULT 0,

  -- Metadata
  content_json jsonb DEFAULT '{}',
  variables jsonb DEFAULT '{}',
  reply_to varchar(255),
  from_name varchar(255),
  is_test boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT campaign_name_unique UNIQUE(business_id, name)
);

CREATE INDEX idx_email_campaigns_business_id ON email_campaigns(business_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(business_id, status);
CREATE INDEX idx_email_campaigns_send_at ON email_campaigns(send_at);
CREATE INDEX idx_email_campaigns_created ON email_campaigns(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. EMAIL SEQUENCES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Sequence info
  name varchar(255) NOT NULL,
  description text,

  -- Trigger configuration
  is_active boolean DEFAULT true,
  trigger_type varchar(50) NOT NULL CHECK (trigger_type IN (
    'signup', 'purchase', 'manual', 'abandoned_cart', 'inactivity', 'tag_added', 'custom'
  )),
  trigger_config jsonb DEFAULT '{}',

  -- Steps stored as JSONB for flexibility
  steps jsonb NOT NULL DEFAULT '[]',
  step_count integer DEFAULT 0,

  -- Execution stats
  total_sends integer DEFAULT 0,
  total_opens integer DEFAULT 0,
  total_clicks integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT sequence_name_unique UNIQUE(business_id, name)
);

CREATE INDEX idx_email_sequences_business_id ON email_sequences(business_id);
CREATE INDEX idx_email_sequences_trigger ON email_sequences(business_id, trigger_type);
CREATE INDEX idx_email_sequences_active ON email_sequences(business_id, is_active);
CREATE INDEX idx_email_sequences_created ON email_sequences(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. EMAIL TEMPLATES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Template info
  name varchar(255) NOT NULL,
  category varchar(100),
  description text,

  -- Content
  subject_template varchar(255) NOT NULL,
  body_html text NOT NULL,
  body_text text,

  -- Template variables (e.g., {name}, {company}, {personalization})
  variables jsonb DEFAULT '{}',

  -- Metadata
  is_default boolean DEFAULT false,
  thumbnail_url text,
  tags text[] DEFAULT '{}',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT template_name_unique UNIQUE(business_id, name)
);

CREATE INDEX idx_email_templates_business_id ON email_templates(business_id);
CREATE INDEX idx_email_templates_category ON email_templates(business_id, category);
CREATE INDEX idx_email_templates_default ON email_templates(business_id, is_default);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. EMAIL TRACKING TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

  -- Recipient info
  recipient_email varchar(255) NOT NULL,
  recipient_id uuid REFERENCES leads(id) ON DELETE SET NULL,

  -- Send tracking
  sent_at timestamptz,
  delivery_status varchar(50) DEFAULT 'pending' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'bounced', 'soft_bounce', 'hard_bounce',
    'blocked', 'spam_complaint', 'unsubscribed'
  )),
  delivery_error text,

  -- Open tracking
  opened boolean DEFAULT false,
  opened_at timestamptz,
  open_count integer DEFAULT 0,
  open_client_name varchar(100),
  open_ip_address inet,
  open_user_agent text,

  -- Click tracking
  clicked boolean DEFAULT false,
  click_count integer DEFAULT 0,
  links_clicked jsonb DEFAULT '[]',

  -- Conversion tracking
  converted boolean DEFAULT false,
  converted_at timestamptz,
  conversion_value numeric(12, 2),
  conversion_metadata jsonb DEFAULT '{}',

  -- Metadata
  message_id varchar(255),
  email_json jsonb DEFAULT '{}',
  custom_variables jsonb DEFAULT '{}',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_campaign_recipient UNIQUE(campaign_id, recipient_email)
);

CREATE INDEX idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_recipient_email ON email_tracking(recipient_email);
CREATE INDEX idx_email_tracking_opened ON email_tracking(opened, opened_at);
CREATE INDEX idx_email_tracking_clicked ON email_tracking(clicked);
CREATE INDEX idx_email_tracking_status ON email_tracking(delivery_status);
CREATE INDEX idx_email_tracking_created ON email_tracking(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. EMAIL SEGMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Segment info
  name varchar(255) NOT NULL,
  description text,

  -- Segmentation criteria
  criteria jsonb NOT NULL DEFAULT '{}',

  -- Computed stats
  recipient_count integer DEFAULT 0,
  last_counted_at timestamptz,

  -- Status
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT segment_name_unique UNIQUE(business_id, name)
);

CREATE INDEX idx_email_segments_business_id ON email_segments(business_id);
CREATE INDEX idx_email_segments_active ON email_segments(business_id, is_active);
CREATE INDEX idx_email_segments_created ON email_segments(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. EMAIL PROVIDER CONFIG TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Provider info
  provider_type varchar(50) NOT NULL CHECK (provider_type IN (
    'resend', 'smtp', 'aws_ses', 'sendgrid', 'mailchimp', 'brevo'
  )),
  provider_name varchar(255),

  -- Configuration (encrypted in practice)
  config_json jsonb NOT NULL DEFAULT '{}',

  -- Verification
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT false,
  is_primary boolean DEFAULT false,

  -- Domain verification
  verified_domain varchar(255),
  dkim_record text,
  spf_record text,
  dmarc_record text,

  -- Rate limiting
  daily_limit integer,
  monthly_limit integer,
  emails_sent_today integer DEFAULT 0,
  emails_sent_this_month integer DEFAULT 0,
  last_send_at timestamptz,

  -- Error tracking
  last_error text,
  error_count integer DEFAULT 0,
  consecutive_failures integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT one_primary_provider UNIQUE(business_id, provider_type) WHERE is_primary = true
);

CREATE INDEX idx_email_provider_business_id ON email_provider_config(business_id);
CREATE INDEX idx_email_provider_active ON email_provider_config(business_id, is_active);
CREATE INDEX idx_email_provider_primary ON email_provider_config(business_id, is_primary);
CREATE INDEX idx_email_provider_type ON email_provider_config(business_id, provider_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. EMAIL UNSUBSCRIBE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Unsubscribe info
  email varchar(255) NOT NULL,
  reason varchar(100),
  unsubscribe_type varchar(50) DEFAULT 'all' CHECK (unsubscribe_type IN (
    'all', 'marketing', 'transactional', 'digest'
  )),

  -- Tracking
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  source varchar(50) CHECK (source IN ('link', 'api', 'manual', 'bounce')),
  source_campaign_id uuid REFERENCES email_campaigns(id) ON DELETE SET NULL,

  -- Metadata
  ip_address inet,
  user_agent text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_unsubscribe UNIQUE(business_id, email, unsubscribe_type)
);

CREATE INDEX idx_email_unsubscribes_business_id ON email_unsubscribes(business_id);
CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);
CREATE INDEX idx_email_unsubscribes_type ON email_unsubscribes(business_id, unsubscribe_type);
CREATE INDEX idx_email_unsubscribes_date ON email_unsubscribes(unsubscribed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. EMAIL AB TEST TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

  -- Test info
  name varchar(255) NOT NULL,
  test_type varchar(50) NOT NULL CHECK (test_type IN (
    'subject', 'content', 'send_time', 'from_name', 'sender_email'
  )),

  -- Variants
  variant_a_id uuid REFERENCES email_campaigns(id),
  variant_b_id uuid REFERENCES email_campaigns(id),

  split_percentage numeric(3, 2) DEFAULT 0.5,

  -- Results
  winner varchar(1),
  is_complete boolean DEFAULT false,
  completed_at timestamptz,
  confidence_level numeric(3, 2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_ab_tests_campaign_id ON email_ab_tests(campaign_id);
CREATE INDEX idx_email_ab_tests_business_id ON email_ab_tests(business_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. EMAIL BOUNCE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_bounces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Bounce info
  email varchar(255) NOT NULL,
  bounce_type varchar(50) NOT NULL CHECK (bounce_type IN (
    'permanent', 'temporary', 'complaint', 'transient'
  )),
  bounce_reason varchar(255),

  -- Tracking
  bounced_at timestamptz NOT NULL DEFAULT now(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE SET NULL,
  message_id varchar(255),

  -- Metadata
  raw_response text,
  suppression_list_added boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_bounce UNIQUE(business_id, email, bounce_type)
);

CREATE INDEX idx_email_bounces_business_id ON email_bounces(business_id);
CREATE INDEX idx_email_bounces_email ON email_bounces(email);
CREATE INDEX idx_email_bounces_type ON email_bounces(bounce_type);
CREATE INDEX idx_email_bounces_date ON email_bounces(bounced_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Campaigns RLS
CREATE POLICY campaigns_user_select ON email_campaigns FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY campaigns_user_insert ON email_campaigns FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY campaigns_user_update ON email_campaigns FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY campaigns_user_delete ON email_campaigns FOR DELETE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Sequences RLS
CREATE POLICY sequences_user_select ON email_sequences FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY sequences_user_insert ON email_sequences FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY sequences_user_update ON email_sequences FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY sequences_user_delete ON email_sequences FOR DELETE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Templates RLS
CREATE POLICY templates_user_select ON email_templates FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY templates_user_insert ON email_templates FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY templates_user_update ON email_templates FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY templates_user_delete ON email_templates FOR DELETE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Tracking RLS (read-only for users)
CREATE POLICY tracking_user_select ON email_tracking FOR SELECT USING (
  campaign_id IN (
    SELECT id FROM email_campaigns
    WHERE business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
  )
);

-- Segments RLS
CREATE POLICY segments_user_select ON email_segments FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY segments_user_insert ON email_segments FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY segments_user_update ON email_segments FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY segments_user_delete ON email_segments FOR DELETE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Provider Config RLS
CREATE POLICY provider_user_select ON email_provider_config FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY provider_user_insert ON email_provider_config FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY provider_user_update ON email_provider_config FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY provider_user_delete ON email_provider_config FOR DELETE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Unsubscribes RLS
CREATE POLICY unsubscribes_user_select ON email_unsubscribes FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY unsubscribes_user_insert ON email_unsubscribes FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- AB Tests RLS
CREATE POLICY ab_tests_user_select ON email_ab_tests FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY ab_tests_user_insert ON email_ab_tests FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY ab_tests_user_update ON email_ab_tests FOR UPDATE USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- Bounces RLS
CREATE POLICY bounces_user_select ON email_bounces FOR SELECT USING (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);
CREATE POLICY bounces_user_insert ON email_bounces FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM biz_users WHERE auth_user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. DATABASE FUNCTIONS FOR OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to calculate campaign metrics
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(campaign_id uuid)
RETURNS TABLE (
  sent_count integer,
  delivered_count integer,
  bounced_count integer,
  open_count integer,
  click_count integer,
  open_rate numeric,
  click_rate numeric,
  conversion_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as sent_count,
    COUNT(*) FILTER (WHERE delivery_status = 'delivered')::integer as delivered_count,
    COUNT(*) FILTER (WHERE delivery_status IN ('bounced', 'hard_bounce', 'soft_bounce'))::integer as bounced_count,
    COUNT(*) FILTER (WHERE opened = true)::integer as open_count,
    COUNT(*) FILTER (WHERE clicked = true)::integer as click_count,
    CASE WHEN COUNT(*) > 0 THEN
      ROUND(COUNT(*) FILTER (WHERE opened = true)::numeric / COUNT(*) * 100, 2)
    ELSE 0 END as open_rate,
    CASE WHEN COUNT(*) > 0 THEN
      ROUND(COUNT(*) FILTER (WHERE clicked = true)::numeric / COUNT(*) * 100, 2)
    ELSE 0 END as click_rate,
    COUNT(*) FILTER (WHERE converted = true)::integer as conversion_count
  FROM email_tracking
  WHERE email_tracking.campaign_id = calculate_campaign_metrics.campaign_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to track email open
CREATE OR REPLACE FUNCTION track_email_open(
  p_campaign_id uuid,
  p_recipient_email varchar,
  p_client_name varchar DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE email_tracking
  SET
    opened = true,
    opened_at = CASE WHEN opened = false THEN now() ELSE opened_at END,
    open_count = open_count + 1,
    open_client_name = COALESCE(p_client_name, open_client_name),
    open_ip_address = COALESCE(p_ip_address, open_ip_address),
    open_user_agent = COALESCE(p_user_agent, open_user_agent),
    updated_at = now()
  WHERE campaign_id = p_campaign_id
    AND recipient_email = p_recipient_email;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track email click
CREATE OR REPLACE FUNCTION track_email_click(
  p_campaign_id uuid,
  p_recipient_email varchar,
  p_link_url varchar,
  p_link_index integer DEFAULT 0
)
RETURNS boolean AS $$
DECLARE
  v_current_links jsonb;
BEGIN
  -- Get current links
  SELECT links_clicked INTO v_current_links
  FROM email_tracking
  WHERE campaign_id = p_campaign_id AND recipient_email = p_recipient_email;

  -- Initialize if null
  IF v_current_links IS NULL THEN
    v_current_links := '[]'::jsonb;
  END IF;

  -- Add new click
  v_current_links := v_current_links || jsonb_build_object(
    'url', p_link_url,
    'clicked_at', now()::text,
    'link_index', p_link_index
  );

  UPDATE email_tracking
  SET
    clicked = true,
    click_count = click_count + 1,
    links_clicked = v_current_links,
    updated_at = now()
  WHERE campaign_id = p_campaign_id
    AND recipient_email = p_recipient_email;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to segment recipients
CREATE OR REPLACE FUNCTION count_segment_recipients(segment_id uuid)
RETURNS integer AS $$
DECLARE
  v_criteria jsonb;
  v_count integer;
BEGIN
  SELECT criteria INTO v_criteria FROM email_segments WHERE id = segment_id;

  -- Build dynamic query based on criteria (simplified example)
  -- In production, this would be more sophisticated
  SELECT COUNT(*)::integer INTO v_count
  FROM leads
  WHERE business_id = (SELECT business_id FROM email_segments WHERE id = segment_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. UPDATED TIMESTAMPS TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_email_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_campaigns_timestamp BEFORE UPDATE ON email_campaigns
FOR EACH ROW EXECUTE FUNCTION update_email_campaigns_timestamp();

CREATE TRIGGER email_sequences_timestamp BEFORE UPDATE ON email_sequences
FOR EACH ROW EXECUTE FUNCTION update_email_campaigns_timestamp();

CREATE TRIGGER email_templates_timestamp BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_email_campaigns_timestamp();

CREATE TRIGGER email_segments_timestamp BEFORE UPDATE ON email_segments
FOR EACH ROW EXECUTE FUNCTION update_email_campaigns_timestamp();

CREATE TRIGGER email_provider_timestamp BEFORE UPDATE ON email_provider_config
FOR EACH ROW EXECUTE FUNCTION update_email_campaigns_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify migration success
DO $$
DECLARE
  v_tables_created integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'email_campaigns', 'email_sequences', 'email_templates', 'email_tracking',
    'email_segments', 'email_provider_config', 'email_unsubscribes',
    'email_ab_tests', 'email_bounces'
  );

  IF v_tables_created = 9 THEN
    RAISE NOTICE 'Email Campaigns migration successful. All 9 tables created.';
  ELSE
    RAISE WARNING 'Email Campaigns migration partial. % of 9 tables created.', v_tables_created;
  END IF;
END $$;
