-- Email Drafts Table for Single Email Sending Feature
-- Allows users to save email drafts for later sending

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint (assuming business exists in businesses table)
  CONSTRAINT fk_business_id
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_drafts_business_id ON email_drafts(business_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_created_at ON email_drafts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access drafts for their business
CREATE POLICY "Users can view own business drafts"
  ON email_drafts
  FOR SELECT
  USING (
    business_id = (
      SELECT id FROM businesses
      WHERE id = (auth.jwt() ->> 'business_id')::text
      LIMIT 1
    )
  );

CREATE POLICY "Users can insert drafts for own business"
  ON email_drafts
  FOR INSERT
  WITH CHECK (
    business_id = (auth.jwt() ->> 'business_id')::text
  );

CREATE POLICY "Users can delete own business drafts"
  ON email_drafts
  FOR DELETE
  USING (
    business_id = (auth.jwt() ->> 'business_id')::text
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON email_drafts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_drafts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the timestamp function
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_drafts_timestamp();
