-- Migration: Auto Business Onboarding — enrich scraped_businesses + outreach log
-- Adds enrichment fields, claim token flow, and delivery tracking table.

-- ── Expand scraped_businesses ────────────────────────────────────────────────

ALTER TABLE public.scraped_businesses
  ADD COLUMN IF NOT EXISTS website           text,
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS category          text,
  ADD COLUMN IF NOT EXISTS rating            numeric(3,2),
  ADD COLUMN IF NOT EXISTS review_count      int,
  ADD COLUMN IF NOT EXISTS photos_json       jsonb,   -- [{url, caption}]
  ADD COLUMN IF NOT EXISTS menu_json         jsonb,   -- [{item, price, category}]
  ADD COLUMN IF NOT EXISTS business_hours    jsonb,   -- [{day, open, close, closed}]
  ADD COLUMN IF NOT EXISTS enrichment_status text NOT NULL DEFAULT 'raw'
    CHECK (enrichment_status IN ('raw','enriched','outreach_sent','claimed','rejected')),
  ADD COLUMN IF NOT EXISTS claim_token       text UNIQUE,
  ADD COLUMN IF NOT EXISTS outreach_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS outreach_channel  text,
  ADD COLUMN IF NOT EXISTS enriched_at       timestamptz;

-- ── Outreach delivery log ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.onboarding_outreach_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scraped_biz_id  uuid        REFERENCES public.scraped_businesses(id) ON DELETE CASCADE,
  channel         text        CHECK (channel IN ('whatsapp','sms','email')),
  message_body    text,
  status          text        CHECK (status IN ('sent','delivered','failed')) DEFAULT 'sent',
  sent_at         timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scraped_enrich_status
  ON public.scraped_businesses (enrichment_status);

CREATE INDEX IF NOT EXISTS idx_scraped_claim_token
  ON public.scraped_businesses (claim_token)
  WHERE claim_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_log_biz
  ON public.onboarding_outreach_log (scraped_biz_id);
