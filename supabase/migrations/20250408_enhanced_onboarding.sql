-- Enhanced Business Onboarding Schema
-- Adds comprehensive profile fields and document management to biz_users table

-- Add new columns to biz_users table for enhanced profiles
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS owner_photo_url text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS owner_bio text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_description text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_website text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_email text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_phone text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_whatsapp text;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS service_radius numeric(5,2);
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS service_areas text[];
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS map_lat numeric(9,6);
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS map_lng numeric(9,6);
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS accepted_payments text[];
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '{}'::jsonb;

-- Create business_documents table for document uploads
CREATE TABLE IF NOT EXISTS business_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('business_license', 'tax_id', 'owner_id', 'address_proof', 'bank_details')),
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster document lookups
CREATE INDEX IF NOT EXISTS idx_business_documents_business_id ON business_documents(business_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_document_type ON business_documents(business_id, document_type);

-- Add updated_at trigger for business_documents
CREATE OR REPLACE FUNCTION update_business_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_documents_timestamp
BEFORE UPDATE ON business_documents
FOR EACH ROW
EXECUTE FUNCTION update_business_documents_updated_at();
