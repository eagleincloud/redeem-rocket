-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: PayNow / Invoices schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add UPI + cashback columns to businesses ──────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS upi_id        text,
  ADD COLUMN IF NOT EXISTS cashback_rate numeric(5,2) DEFAULT 5.00;

-- ── 2. payment_submissions table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  business_id     text        NOT NULL,
  business_name   text        NOT NULL DEFAULT '',
  amount          numeric(12,2) NOT NULL,
  payment_method  text        NOT NULL CHECK (payment_method IN ('upi','cash')),
  bill_url        text,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','acknowledged','approved','rejected')),
  cashback_amount numeric(10,2),
  cashback_rate   numeric(5,2) DEFAULT 5.00,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_business_id
  ON payment_submissions (business_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_user_id
  ON payment_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_status
  ON payment_submissions (status);

-- ── 3. Row-level security ─────────────────────────────────────────────────────
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_insert"       ON payment_submissions;
DROP POLICY IF EXISTS "customer_select"       ON payment_submissions;
DROP POLICY IF EXISTS "business_read"         ON payment_submissions;
DROP POLICY IF EXISTS "business_update_status" ON payment_submissions;

-- Open policies (app uses localStorage auth, not Supabase JWT — auth.uid() is always NULL)
CREATE POLICY "customer_insert"
  ON payment_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "customer_select"
  ON payment_submissions FOR SELECT
  USING (true);

CREATE POLICY "business_read"
  ON payment_submissions FOR SELECT
  USING (true);

CREATE POLICY "business_update_status"
  ON payment_submissions FOR UPDATE
  USING (true) WITH CHECK (true);

-- ── 4. Campaigns + contacts tables ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      text NOT NULL,
  name             text NOT NULL,
  message_template text NOT NULL,
  channel          text NOT NULL CHECK (channel IN ('whatsapp','sms','push')),
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','active','completed','paused')),
  contact_count    int  DEFAULT 0,
  sent_count       int  DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business_id
  ON campaigns (business_id);

CREATE TABLE IF NOT EXISTS campaign_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  business_id text NOT NULL,
  name        text NOT NULL,
  phone       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','sent','failed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_business_id
  ON campaign_contacts (business_id);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id
  ON campaign_contacts (campaign_id);

-- ── 5. Storage bucket ─────────────────────────────────────────────────────────
-- Run this separately if using Supabase CLI, or create via Dashboard:
-- Storage → New bucket → name: payment-bills → Public: true
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('payment-bills', 'payment-bills', true)
-- ON CONFLICT (id) DO NOTHING;
