-- Smart AI-Powered Onboarding Schema
-- Adds feature preferences, AI data storage, and product management for smart onboarding

-- Add columns to biz_users table for smart onboarding
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS feature_preferences jsonb DEFAULT '{
  "product_catalog": true,
  "lead_management": false,
  "email_campaigns": false,
  "automation": false,
  "social_media": false
}'::jsonb;

ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_ai_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false;

-- Create business_products table for AI-generated and user-created products
CREATE TABLE IF NOT EXISTS business_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  price numeric(10, 2),
  image_url text,
  created_from_ai boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_business_products_business_id FOREIGN KEY (business_id) REFERENCES biz_users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_products_business_id ON business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_business_products_is_active ON business_products(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_biz_users_feature_preferences ON biz_users USING gin(feature_preferences);

-- Add updated_at trigger for business_products
CREATE OR REPLACE FUNCTION update_business_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_products_timestamp
BEFORE UPDATE ON business_products
FOR EACH ROW
EXECUTE FUNCTION update_business_products_updated_at();

-- Enable RLS on business_products table
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own business's products
CREATE POLICY business_products_select ON business_products
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM biz_users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert products for their own business
CREATE POLICY business_products_insert ON business_products
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM biz_users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only update their own business's products
CREATE POLICY business_products_update ON business_products
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM biz_users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete their own business's products
CREATE POLICY business_products_delete ON business_products
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM biz_users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only view their own biz_users record
CREATE POLICY biz_users_select ON biz_users
  FOR SELECT
  USING (
    id = auth.uid()
  );

-- RLS Policy: Users can only update their own biz_users record
CREATE POLICY biz_users_update ON biz_users
  FOR UPDATE
  USING (
    id = auth.uid()
  );
