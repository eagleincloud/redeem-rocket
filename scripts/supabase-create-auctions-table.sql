-- =============================================================================
-- Auctions table: link businesses to time-bound auction windows.
-- Use start_at / end_at to know if "auction is on" (now() between start_at and end_at).
-- Run in Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT auctions_end_after_start CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_auctions_business_id ON public.auctions (business_id);
CREATE INDEX IF NOT EXISTS idx_auctions_time_window ON public.auctions (start_at, end_at);
COMMENT ON TABLE public.auctions IS 'Time-bound auction sessions per business; query where now() between start_at and end_at for active auctions';

-- Example: add an auction for a business (replace <business_id> with a real id from public.businesses)
-- INSERT INTO public.auctions (business_id, title, start_at, end_at)
-- VALUES (
--   '<business_id>',
--   'Today''s flash auction',
--   date_trunc('day', now()) + time '09:00',
--   date_trunc('day', now()) + time '18:00'
-- );
