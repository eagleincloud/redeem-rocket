-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 20240011 — Lead Groups (fast lineage querying)
-- Complements lead_entities (20240010) with explicit group membership table
-- ══════════════════════════════════════════════════════════════════════════════

-- ── lead_groups: named group per entity ───────────────────────────────────────
-- NOTE: business_id is text (not uuid) — consistent with all other tables in
--       this schema (businesses.id is text, not uuid, so no FK constraint).
CREATE TABLE IF NOT EXISTS lead_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  entity_id       uuid REFERENCES public.lead_entities(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  total_members   int  NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_groups_business ON public.lead_groups(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_groups_entity   ON public.lead_groups(entity_id);

-- ── lead_group_members: many-to-many leads ↔ groups ──────────────────────────
-- leads.id IS uuid (correct FK target)
CREATE TABLE IF NOT EXISTS lead_group_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES public.lead_groups(id) ON DELETE CASCADE,
  lead_id    uuid NOT NULL REFERENCES public.leads(id)        ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lgm_group ON public.lead_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_lgm_lead  ON public.lead_group_members(lead_id);

-- ── Trigger: keep lead_groups.total_members in sync ──────────────────────────
CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lead_groups
    SET total_members = total_members + 1, updated_at = now()
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lead_groups
    SET total_members = GREATEST(0, total_members - 1), updated_at = now()
    WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_group_members ON public.lead_group_members;
CREATE TRIGGER trg_sync_group_members
AFTER INSERT OR DELETE ON public.lead_group_members
FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.lead_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_access_groups"        ON public.lead_groups;
DROP POLICY IF EXISTS "business_access_group_members" ON public.lead_group_members;

CREATE POLICY "business_access_groups"
  ON public.lead_groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "business_access_group_members"
  ON public.lead_group_members FOR ALL USING (true) WITH CHECK (true);

-- ── Performance indexes on dependent tables ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id
  ON public.lead_activities(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_created
  ON public.lead_activities(lead_id, created_at DESC);

-- lead_follow_ups index for overdue detection (may already exist from 20240007)
CREATE INDEX IF NOT EXISTS idx_lead_fups_overdue
  ON public.lead_follow_ups(lead_id, due_at)
  WHERE completed = false;

-- ══════════════════════════════════════════════════════════════════════════════
-- Lead Scoring helper view
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.lead_scores AS
SELECT
  l.id,
  l.business_id,
  l.name,
  l.stage,
  l.priority,
  l.source,
  LEAST(100,
    (CASE WHEN l.phone            IS NOT NULL THEN 15 ELSE 0 END) +
    (CASE WHEN l.email            IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN l.company          IS NOT NULL THEN  8 ELSE 0 END) +
    (CASE WHEN l.deal_value       IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN l.product_interest IS NOT NULL THEN  7 ELSE 0 END) +
    (CASE l.stage
      WHEN 'new'         THEN  0
      WHEN 'contacted'   THEN 10
      WHEN 'qualified'   THEN 20
      WHEN 'proposal'    THEN 30
      WHEN 'negotiation' THEN 40
      ELSE 0
    END) +
    (CASE l.priority
      WHEN 'low'    THEN  0
      WHEN 'medium' THEN  5
      WHEN 'high'   THEN 10
      WHEN 'urgent' THEN 15
      ELSE 0
    END) +
    (CASE l.source
      WHEN 'referral' THEN 15
      WHEN 'walk_in'  THEN 12
      WHEN 'website'  THEN 10
      WHEN 'campaign' THEN  8
      WHEN 'scrape'   THEN  5
      WHEN 'csv'      THEN  5
      ELSE 3
    END)
  ) AS score,
  l.entity_id,
  l.created_at,
  l.updated_at
FROM public.leads l;

-- ══════════════════════════════════════════════════════════════════════════════
-- search_similar_entities RPC
-- NOTE: p_business_id is TEXT (matches lead_entities.business_id column type)
-- DROP first to allow changing the return type signature
-- ══════════════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.search_similar_entities(text,text,text,text,text,integer);
DROP FUNCTION IF EXISTS public.search_similar_entities(uuid,text,text,text,text,integer);

CREATE OR REPLACE FUNCTION public.search_similar_entities(
  p_business_id text,
  p_name        text DEFAULT NULL,
  p_phone       text DEFAULT NULL,
  p_email       text DEFAULT NULL,
  p_company     text DEFAULT NULL,
  p_limit       int  DEFAULT 5
)
RETURNS TABLE (
  entity_id    uuid,
  confidence   int,
  match_reason text
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.id AS entity_id,
    LEAST(100, GREATEST(
      CASE WHEN p_phone   IS NOT NULL AND e.phone = p_phone                        THEN 95 ELSE 0 END,
      CASE WHEN p_email   IS NOT NULL AND lower(e.email) = lower(p_email)          THEN 90 ELSE 0 END,
      CASE WHEN p_name    IS NOT NULL THEN (similarity(lower(e.name),    lower(p_name))    * 80)::int ELSE 0 END,
      CASE WHEN p_company IS NOT NULL AND e.company IS NOT NULL
        THEN (similarity(lower(e.company), lower(p_company)) * 70)::int ELSE 0 END
    )) AS confidence,
    CASE
      WHEN p_phone   IS NOT NULL AND e.phone = p_phone                              THEN 'Exact phone match'
      WHEN p_email   IS NOT NULL AND lower(e.email) = lower(p_email)               THEN 'Exact email match'
      WHEN p_name    IS NOT NULL AND similarity(lower(e.name), lower(p_name)) > 0.5 THEN 'Similar name'
      ELSE 'Similar company'
    END AS match_reason
  FROM public.lead_entities e
  WHERE e.business_id = p_business_id
    AND GREATEST(
      CASE WHEN p_phone   IS NOT NULL AND e.phone = p_phone                         THEN 95 ELSE 0 END,
      CASE WHEN p_email   IS NOT NULL AND lower(e.email) = lower(p_email)           THEN 90 ELSE 0 END,
      CASE WHEN p_name    IS NOT NULL THEN (similarity(lower(e.name),    lower(p_name))    * 80)::int ELSE 0 END,
      CASE WHEN p_company IS NOT NULL AND e.company IS NOT NULL
        THEN (similarity(lower(e.company), lower(p_company)) * 70)::int ELSE 0 END
    ) >= 28
  ORDER BY confidence DESC
  LIMIT p_limit;
$$;
