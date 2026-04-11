-- Add optional column for Auctions filter: businesses that have an auction (e.g. today).
-- Run in Supabase SQL Editor if you use the Auctions category filter.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS has_auction boolean DEFAULT false;
