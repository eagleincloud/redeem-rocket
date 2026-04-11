-- ═══════════════════════════════════════════════════════════════════════════════
-- LEAD LINEAGE SCHEMA
-- Tables: lead_entities (canonical person/company records)
-- Modifications: leads.entity_id (groups all leads for same entity)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── lead_entities ─────────────────────────────────────────────────────────────
-- Represents a canonical real-world person or company.
-- Multiple leads can reference the same entity, forming a lineage.
CREATE TABLE IF NOT EXISTS public.lead_entities (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  text  NOT NULL,
  entity_type  text  NOT NULL DEFAULT 'person'
               CHECK (entity_type IN ('person','company','both')),
  name         text  NOT NULL,   -- canonical / best-known name
  phone        text,
  email        text,
  company      text,
  notes        text,
  total_deals  int     DEFAULT 0,   -- denormalised: count of all linked leads
  total_value  numeric(14,2) DEFAULT 0, -- sum of closed_value across won leads
  last_stage   text,                -- stage of the most recent lead
  last_seen_at timestamptz,         -- updated_at of most recent lead
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_le_business ON public.lead_entities (business_id);
CREATE INDEX IF NOT EXISTS idx_le_name_trgm ON public.lead_entities USING gin (name gin_trgm_ops);
ALTER TABLE public.lead_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "le_all" ON public.lead_entities FOR ALL USING (true) WITH CHECK (true);

-- ── Add entity_id to leads ────────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.lead_entities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_entity ON public.leads (entity_id)
  WHERE entity_id IS NOT NULL;

-- ── Auto-update lead_entities denormalised fields ─────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_lead_entity_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_entity_id uuid;
BEGIN
  v_entity_id := COALESCE(NEW.entity_id, OLD.entity_id);
  IF v_entity_id IS NULL THEN RETURN NEW; END IF;

  UPDATE public.lead_entities
  SET
    total_deals  = (SELECT COUNT(*)         FROM public.leads WHERE entity_id = v_entity_id),
    total_value  = (SELECT COALESCE(SUM(closed_value),0) FROM public.leads WHERE entity_id = v_entity_id AND stage = 'won'),
    last_stage   = (SELECT stage            FROM public.leads WHERE entity_id = v_entity_id ORDER BY updated_at DESC LIMIT 1),
    last_seen_at = (SELECT MAX(updated_at)  FROM public.leads WHERE entity_id = v_entity_id)
  WHERE id = v_entity_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_entity_stats ON public.leads;
CREATE TRIGGER trg_sync_entity_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_entity_stats();

-- ── search_similar_entities RPC ───────────────────────────────────────────────
-- Used during import to find matching entities for lineage grouping
CREATE OR REPLACE FUNCTION public.search_similar_entities(
  p_business_id text,
  p_name        text    DEFAULT NULL,
  p_phone       text    DEFAULT NULL,
  p_email       text    DEFAULT NULL,
  p_company     text    DEFAULT NULL,
  p_limit       int     DEFAULT 3
)
RETURNS TABLE (
  entity_id  uuid,
  confidence numeric,
  match_reason text
)
LANGUAGE sql STABLE AS $$
  SELECT
    id AS entity_id,
    GREATEST(
      CASE WHEN p_phone IS NOT NULL AND phone IS NOT NULL AND phone = p_phone THEN 95 ELSE 0 END,
      CASE WHEN p_email IS NOT NULL AND email IS NOT NULL AND lower(email) = lower(p_email) THEN 90 ELSE 0 END,
      CASE WHEN p_name  IS NOT NULL AND name  IS NOT NULL THEN round((similarity(lower(name),    lower(p_name))    * 80)::numeric, 1) ELSE 0 END,
      CASE WHEN p_company IS NOT NULL AND company IS NOT NULL THEN round((similarity(lower(company), lower(p_company)) * 70)::numeric, 1) ELSE 0 END
    ) AS confidence,
    CASE
      WHEN p_phone IS NOT NULL AND phone = p_phone THEN 'Phone match'
      WHEN p_email IS NOT NULL AND lower(email) = lower(p_email) THEN 'Email match'
      WHEN p_name  IS NOT NULL AND similarity(lower(name), lower(p_name)) > 0.4 THEN 'Name match'
      ELSE 'Company match'
    END AS match_reason
  FROM public.lead_entities
  WHERE business_id = p_business_id
    AND (
      (p_phone   IS NOT NULL AND phone   IS NOT NULL AND phone = p_phone) OR
      (p_email   IS NOT NULL AND email   IS NOT NULL AND lower(email) = lower(p_email)) OR
      (p_name    IS NOT NULL AND name    IS NOT NULL AND similarity(lower(name),    lower(p_name))    > 0.3) OR
      (p_company IS NOT NULL AND company IS NOT NULL AND similarity(lower(company), lower(p_company)) > 0.3)
    )
  ORDER BY confidence DESC
  LIMIT p_limit;
$$;
