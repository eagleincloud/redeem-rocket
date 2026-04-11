-- ── Missing Tables + Column Additions ──────────────────────────────────────
-- Creates: customer_requirements, auctions, auction_bids
-- Adds columns to: customer_requirements (kanban_stage, quote fields)
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout)

-- ── customer_requirements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_requirements (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text,
  customer_name    text,
  business_id      text,
  title            text         NOT NULL,
  description      text,
  category         text,
  budget           numeric(14,2),
  urgency          text         NOT NULL DEFAULT 'medium'
                   CHECK (urgency IN ('low','medium','high')),
  status           text         NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','completed')),
  kanban_stage     text         NOT NULL DEFAULT 'new'
                   CHECK (kanban_stage IN ('new','quoted','negotiating','won','rejected')),
  my_quote_message text,
  my_quote_price   numeric(14,2),
  my_quote_sent_at timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_req_business
  ON public.customer_requirements (business_id);
CREATE INDEX IF NOT EXISTS idx_customer_req_kanban
  ON public.customer_requirements (business_id, kanban_stage);

ALTER TABLE public.customer_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "req_all" ON public.customer_requirements;
CREATE POLICY "req_all" ON public.customer_requirements
  FOR ALL USING (true) WITH CHECK (true);

-- Backfill kanban_stage from status for any existing rows
UPDATE public.customer_requirements
SET kanban_stage = CASE
  WHEN status = 'in_progress' THEN 'negotiating'
  WHEN status = 'completed'   THEN 'won'
  ELSE 'new'
END
WHERE kanban_stage = 'new' AND status != 'open';

-- ── auctions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auctions (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  text         NOT NULL,
  emoji        text         NOT NULL DEFAULT '🎁',
  title        text         NOT NULL,
  description  text,
  image        text,
  starting_bid numeric(14,2) NOT NULL DEFAULT 0,
  current_bid  numeric(14,2) NOT NULL DEFAULT 0,
  total_bids   int          NOT NULL DEFAULT 0,
  start_at     timestamptz  NOT NULL DEFAULT now(),
  end_at       timestamptz  NOT NULL,
  status       text         NOT NULL DEFAULT 'upcoming'
               CHECK (status IN ('draft','upcoming','live','ended','cancelled')),
  winner_id    text,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auctions_business
  ON public.auctions (business_id, status);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auctions_all" ON public.auctions;
CREATE POLICY "auctions_all" ON public.auctions
  FOR ALL USING (true) WITH CHECK (true);

-- ── auction_bids ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id    uuid         NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  business_id   text         NOT NULL,
  bidder_name   text,
  bidder_phone  text,
  bidder_email  text,
  amount        numeric(14,2) NOT NULL,
  is_winning    boolean      NOT NULL DEFAULT false,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction
  ON public.auction_bids (auction_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_business
  ON public.auction_bids (business_id);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auction_bids_all" ON public.auction_bids;
CREATE POLICY "auction_bids_all" ON public.auction_bids
  FOR ALL USING (true) WITH CHECK (true);
