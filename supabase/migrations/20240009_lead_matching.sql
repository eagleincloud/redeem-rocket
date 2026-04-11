-- ═══════════════════════════════════════════════════════════════════════════════
-- LEAD MATCHING — pg_trgm fuzzy search + lead_match_links
-- Run: CREATE EXTENSION IF NOT EXISTS pg_trgm; in SQL editor first
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable trigram extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast trigram search on leads
CREATE INDEX IF NOT EXISTS idx_leads_name_trgm    ON public.leads USING gin (name    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_company_trgm ON public.leads USING gin (company gin_trgm_ops);

-- ── lead_match_links ──────────────────────────────────────────────────────────
-- Records confirmed relationships between leads (same person / same company)
CREATE TABLE IF NOT EXISTS public.lead_match_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  primary_lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  linked_lead_id  uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  confidence      numeric(5,2),          -- 0–100 score from match engine
  linked_by       text DEFAULT 'manual', -- 'auto' | 'manual'
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (primary_lead_id, linked_lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lml_primary ON public.lead_match_links (primary_lead_id);
CREATE INDEX IF NOT EXISTS idx_lml_linked  ON public.lead_match_links (linked_lead_id);
ALTER TABLE public.lead_match_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lml_all" ON public.lead_match_links FOR ALL USING (true) WITH CHECK (true);

-- ── search_similar_leads RPC ──────────────────────────────────────────────────
-- Called by the AI match panel when a salesperson types in the Add Lead form.
-- Returns top N leads ordered by confidence score (0–100).
CREATE OR REPLACE FUNCTION public.search_similar_leads(
  p_business_id text,
  p_name        text    DEFAULT NULL,
  p_phone       text    DEFAULT NULL,
  p_email       text    DEFAULT NULL,
  p_company     text    DEFAULT NULL,
  p_exclude_id  uuid    DEFAULT NULL,
  p_limit       int     DEFAULT 5
)
RETURNS TABLE (
  lead_id      uuid,
  confidence   numeric,
  match_reason text
)
LANGUAGE sql STABLE AS $$
  SELECT
    id AS lead_id,
    GREATEST(
      CASE WHEN p_phone IS NOT NULL AND phone IS NOT NULL AND phone = p_phone THEN 95 ELSE 0 END,
      CASE WHEN p_email IS NOT NULL AND email IS NOT NULL AND lower(email) = lower(p_email) THEN 90 ELSE 0 END,
      CASE WHEN p_name  IS NOT NULL AND name  IS NOT NULL THEN round((similarity(lower(name), lower(p_name)) * 80)::numeric, 1) ELSE 0 END,
      CASE WHEN p_company IS NOT NULL AND company IS NOT NULL THEN round((similarity(lower(company), lower(p_company)) * 70)::numeric, 1) ELSE 0 END
    ) AS confidence,
    CASE
      WHEN p_phone IS NOT NULL AND phone = p_phone THEN 'Phone match'
      WHEN p_email IS NOT NULL AND lower(email) = lower(p_email) THEN 'Email match'
      WHEN p_name  IS NOT NULL AND similarity(lower(name), lower(p_name)) > 0.4 THEN 'Name match'
      WHEN p_company IS NOT NULL AND similarity(lower(company), lower(p_company)) > 0.35 THEN 'Company match'
      ELSE 'Partial match'
    END AS match_reason
  FROM public.leads
  WHERE business_id = p_business_id
    AND (p_exclude_id IS NULL OR id <> p_exclude_id)
    AND (
      (p_phone   IS NOT NULL AND phone   IS NOT NULL AND phone = p_phone) OR
      (p_email   IS NOT NULL AND email   IS NOT NULL AND lower(email) = lower(p_email)) OR
      (p_name    IS NOT NULL AND name    IS NOT NULL AND similarity(lower(name),    lower(p_name))    > 0.28) OR
      (p_company IS NOT NULL AND company IS NOT NULL AND similarity(lower(company), lower(p_company)) > 0.28)
    )
  ORDER BY confidence DESC
  LIMIT p_limit;
$$;
