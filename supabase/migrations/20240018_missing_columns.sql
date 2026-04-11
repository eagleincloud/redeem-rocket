-- ── Missing Columns Patch ───────────────────────────────────────────────────
-- Adds columns that the frontend uses but are absent from existing tables.
-- Safe to re-run (ADD COLUMN IF NOT EXISTS throughout).

-- ── offers: add status, price, category, flash_deal, rejection_reason ────────
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('draft','pending_approval','approved','rejected','expired')),
  ADD COLUMN IF NOT EXISTS price            numeric(14,2),
  ADD COLUMN IF NOT EXISTS category         text,
  ADD COLUMN IF NOT EXISTS is_flash_deal    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Backfill status from is_active for existing rows
UPDATE public.offers
SET status = CASE
  WHEN is_active = true  THEN 'approved'
  WHEN is_active = false THEN 'pending_approval'
  ELSE 'pending_approval'
END
WHERE status = 'pending_approval';

CREATE INDEX IF NOT EXISTS idx_offers_business_status
  ON public.offers (business_id, status);

-- ── payment_submissions: add customer_name, notes, lead_id ──────────────────
ALTER TABLE public.payment_submissions
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS lead_id       uuid;

-- ── campaigns: add scheduled_at, sent_at, target_audience, channel_config ───
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at     timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at          timestamptz,
  ADD COLUMN IF NOT EXISTS target_audience  jsonb,
  ADD COLUMN IF NOT EXISTS channel_config   jsonb;

-- ── in_app_notifications: ensure metadata column exists ─────────────────────
ALTER TABLE public.in_app_notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ── leads: ensure entity_id FK index ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_entity_id
  ON public.leads (entity_id)
  WHERE entity_id IS NOT NULL;

-- ── biz_users: add plan columns used by BusinessContext ─────────────────────
ALTER TABLE public.biz_users
  ADD COLUMN IF NOT EXISTS plan            text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','basic','pro','enterprise')),
  ADD COLUMN IF NOT EXISTS plan_expiry     timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name   text,
  ADD COLUMN IF NOT EXISTS business_logo   text,
  ADD COLUMN IF NOT EXISTS business_category text;
