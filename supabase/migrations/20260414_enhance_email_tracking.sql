-- Enhance email_tracking table for comprehensive email event tracking
-- Safe to run on existing tables — uses ADD COLUMN IF NOT EXISTS

-- 1. Create table if it doesn't exist at all (fresh installs)
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Safely add columns to existing tables
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS email_id VARCHAR(255);
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS event_reason VARCHAR(255);
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS link_url VARCHAR(2048);
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add foreign key only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_campaign' AND conrelid = 'email_tracking'::regclass
  ) THEN
    ALTER TABLE email_tracking
      ADD CONSTRAINT fk_campaign
      FOREIGN KEY (campaign_id) REFERENCES outreach_campaigns(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore if outreach_campaigns table doesn't exist yet
  NULL;
END;
$$;

-- 4. Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id    ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient_email ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_event_type     ON email_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_id       ON email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_event_time     ON email_tracking(event_time DESC);

-- 5. Create a view for campaign statistics
CREATE OR REPLACE VIEW email_tracking_stats AS
SELECT
  campaign_id,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'sent'      THEN 1 END) as sent_count,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN event_type = 'open'      THEN 1 END) as open_count,
  COUNT(CASE WHEN event_type = 'click'     THEN 1 END) as click_count,
  COUNT(CASE WHEN event_type = 'bounce'    THEN 1 END) as bounce_count,
  COUNT(CASE WHEN event_type = 'complaint' THEN 1 END) as complaint_count,
  MIN(event_time) as first_event_time,
  MAX(event_time) as last_event_time
FROM email_tracking
WHERE campaign_id IS NOT NULL
GROUP BY campaign_id;

-- 6. Create suppression list for bounces and complaints
CREATE TABLE IF NOT EXISTS email_suppressions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  suppression_type VARCHAR(50)  NOT NULL,
  reason           VARCHAR(255),
  suppressed_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

-- 7. Indexes for suppression lookups
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_type  ON email_suppressions(suppression_type);

-- 8. Auto-suppress on bounce/complaint
CREATE OR REPLACE FUNCTION suppress_email_on_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type IN ('bounce', 'complaint') THEN
    INSERT INTO email_suppressions (email, suppression_type, reason)
    VALUES (NEW.recipient_email, NEW.event_type, NEW.event_reason)
    ON CONFLICT (email) DO UPDATE SET
      suppression_type = EXCLUDED.suppression_type,
      reason           = EXCLUDED.reason,
      suppressed_at    = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_suppress_email_on_event ON email_tracking;
CREATE TRIGGER trigger_suppress_email_on_event
  AFTER INSERT ON email_tracking
  FOR EACH ROW EXECUTE FUNCTION suppress_email_on_event();

-- 9. Enable RLS
ALTER TABLE email_tracking    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies (drop first to avoid duplicate errors)
DROP POLICY IF EXISTS "Users can view their campaign tracking"            ON email_tracking;
DROP POLICY IF EXISTS "Service role can manage all tracking"              ON email_tracking;
DROP POLICY IF EXISTS "Users can view suppressed emails for their business" ON email_suppressions;
DROP POLICY IF EXISTS "Service role can manage suppressions"              ON email_suppressions;

CREATE POLICY "Users can view their campaign tracking" ON email_tracking
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM outreach_campaigns WHERE business_id = auth.uid()::text
    )
  );

CREATE POLICY "Service role can manage all tracking" ON email_tracking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view suppressed emails for their business" ON email_suppressions
  FOR SELECT USING (
    email IN (
      SELECT recipient_email FROM email_tracking
      WHERE campaign_id IN (
        SELECT id FROM outreach_campaigns WHERE business_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Service role can manage suppressions" ON email_suppressions
  FOR ALL USING (auth.role() = 'service_role');

-- 11. Permissions
GRANT SELECT, INSERT ON email_tracking    TO authenticated;
GRANT SELECT          ON email_suppressions TO authenticated;
GRANT ALL             ON email_tracking, email_suppressions TO service_role;
GRANT SELECT          ON email_tracking_stats TO authenticated;
