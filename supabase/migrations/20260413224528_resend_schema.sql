-- Resend Integration Database Schema
-- SAFE TO RE-RUN: uses IF NOT EXISTS, DROP IF EXISTS, and exception handling

-- ── 1. Email Tracking Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_tracking (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  link_url       TEXT,
  user_agent     TEXT,
  ip_address     TEXT,
  event_time     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Safely add check constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_tracking_event_type_check'
      AND conrelid = 'email_tracking'::regclass
  ) THEN
    ALTER TABLE email_tracking
      ADD CONSTRAINT email_tracking_event_type_check
      CHECK (event_type IN ('open', 'click', 'bounce', 'delivery', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complaint'));
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS email_tracking_campaign_id_idx     ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS email_tracking_recipient_email_idx ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS email_tracking_event_type_idx      ON email_tracking(event_type);
CREATE INDEX IF NOT EXISTS email_tracking_event_time_idx      ON email_tracking(event_time DESC);

-- ── 2. Outreach Email Tracking Table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outreach_email_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     TEXT,
  recipient_email TEXT NOT NULL,
  business_id     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'sent',
  sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMP WITH TIME ZONE,
  opened_at       TIMESTAMP WITH TIME ZONE,
  clicked_at      TIMESTAMP WITH TIME ZONE,
  bounced_at      TIMESTAMP WITH TIME ZONE,
  bounce_reason   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'outreach_email_status_check'
      AND conrelid = 'outreach_email_tracking'::regclass
  ) THEN
    ALTER TABLE outreach_email_tracking
      ADD CONSTRAINT outreach_email_status_check
      CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS outreach_email_tracking_campaign_id_idx  ON outreach_email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS outreach_email_tracking_business_id_idx  ON outreach_email_tracking(business_id);
CREATE INDEX IF NOT EXISTS outreach_email_tracking_status_idx       ON outreach_email_tracking(status);
CREATE INDEX IF NOT EXISTS outreach_email_tracking_email_idx        ON outreach_email_tracking(recipient_email);

-- ── 3. Email Preferences Table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          TEXT NOT NULL,
  recipient_email      TEXT NOT NULL,
  unsubscribed_at      TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason   TEXT,
  preference_categories JSONB DEFAULT '{
    "marketing": true,
    "newsletters": true,
    "announcements": true,
    "promotions": true
  }'::jsonb,
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS email_preferences_business_id_idx    ON email_preferences(business_id);
CREATE INDEX IF NOT EXISTS email_preferences_recipient_email_idx ON email_preferences(recipient_email);

-- ── 4. Campaign Email Lists Table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_email_lists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      TEXT NOT NULL,
  list_name        TEXT NOT NULL,
  list_description TEXT,
  subscriber_count INT DEFAULT 0,
  created_by       UUID,    -- soft reference to biz_users(id); no FK to stay flexible
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, list_name)
);

-- Try to add FK to biz_users if that table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'biz_users')
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaign_email_lists_created_by_fkey'
  ) THEN
    ALTER TABLE campaign_email_lists
      ADD CONSTRAINT campaign_email_lists_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES biz_users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS campaign_email_lists_business_id_idx ON campaign_email_lists(business_id);

-- ── 5. Campaign List Subscribers Table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_list_subscribers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id             UUID NOT NULL REFERENCES campaign_email_lists(id) ON DELETE CASCADE,
  subscriber_email    TEXT NOT NULL,
  subscriber_name     TEXT,
  subscriber_metadata JSONB DEFAULT '{}'::jsonb,
  subscribed_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  unsubscribed_at     TIMESTAMP WITH TIME ZONE,
  UNIQUE(list_id, subscriber_email)
);

CREATE INDEX IF NOT EXISTS campaign_list_subscribers_list_id_idx ON campaign_list_subscribers(list_id);
CREATE INDEX IF NOT EXISTS campaign_list_subscribers_email_idx   ON campaign_list_subscribers(subscriber_email);

-- ── 6. Email Unsubscribe Tokens Table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT UNIQUE NOT NULL,
  business_id     TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  campaign_id     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  used_at         TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_business_id_idx ON email_unsubscribe_tokens(business_id);
CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_token_idx        ON email_unsubscribe_tokens(token);

-- ── 7. Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE outreach_email_tracking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_email_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_list_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe on re-run)
DROP POLICY IF EXISTS outreach_email_tracking_business_access     ON outreach_email_tracking;
DROP POLICY IF EXISTS email_preferences_business_access           ON email_preferences;
DROP POLICY IF EXISTS campaign_email_lists_business_access        ON campaign_email_lists;
DROP POLICY IF EXISTS campaign_list_subscribers_business_access   ON campaign_list_subscribers;

CREATE POLICY outreach_email_tracking_business_access ON outreach_email_tracking
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY email_preferences_business_access ON email_preferences
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY campaign_email_lists_business_access ON campaign_email_lists
  FOR ALL USING (business_id = auth.uid()::text);

CREATE POLICY campaign_list_subscribers_business_access ON campaign_list_subscribers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaign_email_lists
      WHERE id = list_id AND business_id = auth.uid()::text
    )
  );

-- ── 8. Functions ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_email_delivered(p_campaign_id TEXT, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
  WHERE campaign_id = p_campaign_id AND recipient_email = p_email AND status = 'sent';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_email_opened(p_campaign_id TEXT, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'opened', opened_at = NOW(), updated_at = NOW()
  WHERE campaign_id = p_campaign_id AND recipient_email = p_email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_email_clicked(p_campaign_id TEXT, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE outreach_email_tracking
  SET status = 'clicked', clicked_at = NOW(), updated_at = NOW()
  WHERE campaign_id = p_campaign_id AND recipient_email = p_email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id TEXT)
RETURNS TABLE (
  sent_count      INT,
  delivered_count INT,
  opened_count    INT,
  clicked_count   INT,
  bounce_count    INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status IN ('sent','delivered','opened','clicked','bounced'))::INT,
    COUNT(*) FILTER (WHERE status IN ('delivered','opened','clicked'))::INT,
    COUNT(*) FILTER (WHERE status IN ('opened','clicked'))::INT,
    COUNT(*) FILTER (WHERE status = 'clicked')::INT,
    COUNT(*) FILTER (WHERE status = 'bounced')::INT
  FROM outreach_email_tracking
  WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- ── 9. Subscriber Count Trigger ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_list_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaign_email_lists
  SET subscriber_count = (
    SELECT COUNT(*) FROM campaign_list_subscribers
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
      AND unsubscribed_at IS NULL
  )
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_list_subscribers_count_trigger ON campaign_list_subscribers;
CREATE TRIGGER campaign_list_subscribers_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON campaign_list_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_list_subscriber_count();
