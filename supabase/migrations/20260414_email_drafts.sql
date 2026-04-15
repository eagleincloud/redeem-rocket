-- Email Drafts Table — SAFE TO RE-RUN

-- 1. Create table without FK (businesses.id may be UUID, business_id is TEXT)
CREATE TABLE IF NOT EXISTS email_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject         TEXT NOT NULL,
  html_content    TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_email_drafts_business_id ON email_drafts(business_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_created_at  ON email_drafts(created_at DESC);

-- 3. RLS
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business drafts"        ON email_drafts;
DROP POLICY IF EXISTS "Users can insert drafts for own business"  ON email_drafts;
DROP POLICY IF EXISTS "Users can delete own business drafts"      ON email_drafts;

CREATE POLICY "Users can view own business drafts" ON email_drafts
  FOR SELECT USING (business_id = (auth.jwt() ->> 'business_id')::text);

CREATE POLICY "Users can insert drafts for own business" ON email_drafts
  FOR INSERT WITH CHECK (business_id = (auth.jwt() ->> 'business_id')::text);

CREATE POLICY "Users can delete own business drafts" ON email_drafts
  FOR DELETE USING (business_id = (auth.jwt() ->> 'business_id')::text);

-- 4. Permissions
GRANT SELECT, INSERT, DELETE ON email_drafts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_drafts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_drafts_updated_at ON email_drafts;
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_email_drafts_timestamp();
