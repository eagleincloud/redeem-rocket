-- =============================================================================
-- Sample auction rows for testing the Auctions filter.
-- Run after: 1) public.businesses exists, 2) public.auctions table is created
--   (run supabase-create-auctions-table.sql first).
-- Inserts auctions for up to 5 businesses; start/end are set so the auction
-- is active when you run this (now() is between start_at and end_at).
-- =============================================================================

INSERT INTO public.auctions (business_id, title, start_at, end_at)
SELECT id,
  'Flash auction – ' || COALESCE(name, 'Store') || ' today',
  date_trunc('hour', now()) - interval '1 hour',
  date_trunc('hour', now()) + interval '6 hours'
FROM (
  SELECT id, name FROM public.businesses
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  LIMIT 5
) t;

-- Optional: add evening auctions for 3 more businesses (active 18:00–21:00 today)
INSERT INTO public.auctions (business_id, title, start_at, end_at)
SELECT id,
  'Evening auction',
  date_trunc('day', now()) + time '18:00',
  date_trunc('day', now()) + time '21:00'
FROM (
  SELECT id FROM public.businesses
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  OFFSET 5
  LIMIT 3
) t;

-- If you run this script again you will get duplicate auctions. To reset and re-seed:
--   DELETE FROM public.auctions;
-- then run this script again.
