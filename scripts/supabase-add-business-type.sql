-- Add business_type column for map pin icons (AI- or rule-derived).
-- Run in Supabase SQL Editor if the table already exists without this column.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS business_type text;

COMMENT ON COLUMN public.businesses.business_type IS 'One of: restaurant, grocery, pharmacy, salon, hotel, atm, other (for map icons)';
