-- =============================================================================
-- Supabase: table "businesses" with same schema as MySQL scraped_businesses
-- Source: RedeemRocket.scraped_businesses (hrms-db RDS)
-- Run this in Supabase SQL Editor before running the data migration script.
-- WARNING: This drops the existing public.businesses table if present (different schema).
-- =============================================================================

DROP TABLE IF EXISTS public.businesses CASCADE;

CREATE TABLE public.businesses (
  id text NOT NULL PRIMARY KEY,
  merchant_key text,
  place_id text,
  name text NOT NULL,
  category text,
  subcategory text,
  address text,
  area text,
  city text,
  pincode text,
  phone text,
  mobile text,
  email text,
  website text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  review_count integer DEFAULT 0,
  price_level text,
  opening_hours text,
  business_status text DEFAULT 'OPERATIONAL',
  types text,
  description text,
  amenities text,
  verification_status text DEFAULT 'unverified',
  claimed_by_merchant_id text,
  verified_by_admin_id text,
  verified_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  business_type text
);

CREATE INDEX IF NOT EXISTS idx_businesses_latitude_longitude ON public.businesses (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses (name);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses (city);
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON public.businesses (place_id);

COMMENT ON TABLE public.businesses IS 'Migrated from MySQL RedeemRocket.scraped_businesses (same schema)';
