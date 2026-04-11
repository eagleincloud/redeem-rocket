-- ── Auction Bids Table ──────────────────────────────────────────────────────
-- Stores individual bids placed on business auctions.
-- Used by AuctionsManagePage to display bid history.
--
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id    uuid         NOT NULL,
  business_id   text         NOT NULL,
  bidder_name   text,
  bidder_phone  text,
  bidder_email  text,
  amount        numeric(14,2) NOT NULL,
  is_winning    boolean      NOT NULL DEFAULT false,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id
  ON public.auction_bids (auction_id, amount DESC);

CREATE INDEX IF NOT EXISTS idx_auction_bids_business_id
  ON public.auction_bids (business_id);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auction_bids_all" ON public.auction_bids;
CREATE POLICY "auction_bids_all" ON public.auction_bids
  FOR ALL USING (true) WITH CHECK (true);

-- ── Ensure auctions table has draft status ─────────────────────────────────
-- The kanban view adds 'draft' as a status. Add it to the check constraint
-- if the auctions table already exists with a restrictive CHECK.
-- (Safe to run even if the constraint doesn't exist.)
DO $$
BEGIN
  -- Add 'draft' to auctions.status if the column exists and lacks it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'auctions'
      AND column_name  = 'status'
  ) THEN
    -- Drop old constraint if it exists, then re-add with draft included
    ALTER TABLE public.auctions
      DROP CONSTRAINT IF EXISTS auctions_status_check;

    ALTER TABLE public.auctions
      ADD CONSTRAINT auctions_status_check
        CHECK (status IN ('draft','upcoming','live','ended','cancelled'));
  END IF;
END;
$$;
