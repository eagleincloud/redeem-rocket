-- Resend Integration Database Schema
-- Run this SQL in Supabase to set up email tracking and outreach tables

-- ── Email Tracking Table ──────────────────────────────────────────────────────
-- Tracks opens, clicks, and bounces for email campaigns

CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'open', 'click', 'bounce', 'delivery'
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT email_tracking_event_type_check
    CHECK (event_type IN ('open', 'click', 'bounce', 'delivery'))
);

CREATE INDEX IF NOT EXISTS email_tracking_campaign_id_idx
  ON email_tracking(campaign_id);

CREATE INDEX IF NOT EXISTS email_tracking_recipient_email_idx
  ON email_tracking(recipient_email);

CREATE INDEX IF NOT EXISTS email_tracking_event_type_idx
  ON email_tracking(event_type);

CREATE INDEX IF NOT EXISTS email_tracking_event_time_idx
  ON email_tracking(event_time DESC);

-- ── Outreach Email Tracking Table ─────────────────────────────────────────────
-- Extended tracking for bulk outreach campaigns

CREATE TABLE IF NOT EXISTS outreach_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT outreach_email_status_check
    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'))
);

CREATE INDEX IF NOT EXISTS outreach_email_tracking_campaign_id_idx
  ON outreach_email_tracking(campaign_id);

CREATE INDEX IF NOT EXISTS outreach_email_tracking_business_id_idx
  ON outreach_email_tracking(business_id);

CREATE INDEX IF NOT EXISTS outreach_email_tracking_status_idx
  ON outreach_email_tracking(status);

CREATE INDEX IF NOT EXISTS outreach_email_tracking_email_idx
  ON outreach_email_tracking(recipient_email);

-- ── Email Preferences Table ───────────────────────────────────────────────────
-- Store recipient preferences for email frequency and types

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason TEXT,
  preference_categories JSONB DEFAULT '{
    "marketing": true,
    "newsletters": true,
    "announcements": true,
    "promotions": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(business_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS email_preferences_business_id_idx
  ON email_preferences(business_id);

CREATE INDEX IF NOT EXISTS email_preferences_recipient_email_idx
  ON email_preferences(recipient_email);

-- ── Campaign Email Lists Table ────────────────────────────────────────────────
-- Store email lists for segmentation and bulk sends

CREATE TABLE IF NOT EXISTS campaign_email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL,
  list_description TEXT,
  subscriber_count INT DEFAULT 0,
  created_by UUID REFERENCES biz_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(business_id, list_name)
);

CREATE INDEX IF NOT EXISTS campaign_email_lists_business_id_idx
  ON campaign_email_lists(business_id);

-- ── Campaign List Subscribers Table ───────────────────────────────────────────
-- Map subscribers to email lists with metadata

CREATE TABLE IF NOT EXISTS campaign_list_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES campaign_email_lists(id) ON DELETE CASCADE,
  subscriber_email TEXT NOT NULL,
  subscriber_name TEXT,
  subscriber_metadata JSONB DEFAULT '{}'::jsonb,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(list_id, subscriber_email)
);

CREATE INDEX IF NOT EXISTS campaign_list_subscribers_list_id_idx
  ON campaign_list_subscribers(list_id);

CREATE INDEX IF NOT EXISTS campaign_list_subscribers_email_idx
  ON campaign_list_subscribers(subscriber_email);

-- ── Email Unsubscribe Links Table ────────────────────────────────────────────
-- Track unsubscribe tokens for safe list management

CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  campaign_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT token_uniqueness UNIQUE (business_id, recipient_email, campaign_id)
);

CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_business_id_idx
  ON email_unsubscribe_tokens(business_id);

CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_token_idx
  ON email_unsubscribe_tokens(token);

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_list_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow access to own business data
CREATE POLICY email_tracking_business_access ON email_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE id = campaign_id
      AND business_id = auth.uid()::uuid
    )
  );

CREATE POLICY outreach_email_tracking_business_access ON outreach_email_tracking
  FOR SELECT USING (business_id = auth.uid()::uuid);

CREATE POLICY email_preferences_business_access ON email_preferences
  FOR SELECT USING (business_id = auth.uid()::uuid);

CREATE POLICY campaign_email_lists_business_access ON campaign_email_lists
  FOR ALL USING (business_id = auth.uid()::uuid);

CREATE POLICY campaign_list_subscribers_business_access ON campaign_list_subscribers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaign_email_lists
      WHERE id = list_id
      AND business_id = auth.uid()::uuid
    )
  );

CREATE POLICY email_unsubscribe_tokens_public ON email_unsubscribe_tokens
  FOR SELECT USING (true); -- Public unsubscribe endpoint

-- ── Functions ─────────────────────────────────────────────────────────────────

-- Function to mark email as delivered
CREATE OR REPLACE FUNCTION mark_email_delivered(
  p_campaign_id UUID,
  p_email TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'delivered',
      delivered_at = NOW(),
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND recipient_email = p_email
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as opened
CREATE OR REPLACE FUNCTION mark_email_opened(
  p_campaign_id UUID,
  p_email TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'opened',
      opened_at = NOW(),
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND recipient_email = p_email;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email as clicked
CREATE OR REPLACE FUNCTION mark_email_clicked(
  p_campaign_id UUID,
  p_email TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'clicked',
      clicked_at = NOW(),
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND recipient_email = p_email;
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(
  p_campaign_id UUID
)
RETURNS TABLE (
  sent_count INT,
  delivered_count INT,
  opened_count INT,
  clicked_count INT,
  bounce_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced')) AS sent_count,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) AS delivered_count,
    COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) AS opened_count,
    COUNT(*) FILTER (WHERE status = 'clicked') AS clicked_count,
    COUNT(*) FILTER (WHERE status = 'bounced') AS bounce_count
  FROM outreach_email_tracking
  WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update list subscriber count
CREATE OR REPLACE FUNCTION update_list_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaign_email_lists
  SET subscriber_count = (
    SELECT COUNT(*)
    FROM campaign_list_subscribers
    WHERE list_id = NEW.list_id
      AND unsubscribed_at IS NULL
  )
  WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_list_subscribers_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON campaign_list_subscribers
FOR EACH ROW
EXECUTE FUNCTION update_list_subscriber_count();
