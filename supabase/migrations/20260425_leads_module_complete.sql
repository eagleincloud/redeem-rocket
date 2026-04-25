-- ═══════════════════════════════════════════════════════════════════════════════
-- LEADS MANAGEMENT MODULE - COMPLETE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- Implementation Date: 2026-04-25
-- Includes: Leads table, Activities, Imports, Analytics views, and RLS policies

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ENHANCED LEADS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.leads (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      text         NOT NULL,
  name             text         NOT NULL,
  email            text,
  phone            text,
  company          text,
  product_interest text,
  source           text         NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('manual','csv','scrape','campaign','referral','walk_in','website','email','api','phone','ivr','import')),
  stage            text         NOT NULL DEFAULT 'new'
                   CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost','nurture')),
  priority         text         NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','urgent')),
  deal_value       numeric(14,2),
  currency         varchar(3)   DEFAULT 'USD',
  notes            text,
  tags             jsonb        DEFAULT '[]'::jsonb,
  custom_fields    jsonb        DEFAULT '{}'::jsonb,
  metadata         jsonb        DEFAULT '{}'::jsonb,
  assigned_to      uuid,
  lead_score       integer      DEFAULT 0,
  engagement_count integer      DEFAULT 0,
  last_contacted   timestamptz,
  next_followup    timestamptz,
  source_url       text,
  conversion_risk  text         DEFAULT 'medium'
                   CHECK (conversion_risk IN ('high','medium','low')),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT leads_business_id_not_empty CHECK (business_id != '')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads (business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_stage ON public.leads (business_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_business_priority ON public.leads (business_id, priority);
CREATE INDEX IF NOT EXISTS idx_leads_business_source ON public.leads (business_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads (business_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON public.leads (next_followup) WHERE next_followup IS NOT NULL;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.update_leads_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS leads_update_timestamp ON public.leads;
CREATE TRIGGER leads_update_timestamp
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. LEAD ACTIVITIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid          NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  business_id   text          NOT NULL,
  activity_type text          NOT NULL
                CHECK (activity_type IN ('note','call','email','sms','whatsapp','meeting','stage_change','tag_added','bulk_action','import','scoring_update')),
  description   text,
  performed_by  uuid,
  old_value     text,
  new_value     text,
  metadata      jsonb         DEFAULT '{}'::jsonb,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_business_id ON public.lead_activities (business_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_type ON public.lead_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities (created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. LEAD IMPORTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_imports (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       text          NOT NULL,
  file_name         text          NOT NULL,
  import_date       timestamptz   NOT NULL DEFAULT now(),
  record_count      integer       NOT NULL DEFAULT 0,
  success_count     integer       NOT NULL DEFAULT 0,
  failed_count      integer       NOT NULL DEFAULT 0,
  import_status     text          NOT NULL DEFAULT 'pending'
                    CHECK (import_status IN ('pending','processing','completed','failed','partial')),
  file_url          text,
  column_mapping    jsonb         DEFAULT '{}'::jsonb,
  error_log         jsonb         DEFAULT '[]'::jsonb,
  imported_by       uuid,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_imports_business_id ON public.lead_imports (business_id);
CREATE INDEX IF NOT EXISTS idx_lead_imports_created_at ON public.lead_imports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_imports_status ON public.lead_imports (import_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. LEAD SEGMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_segments (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   text          NOT NULL,
  name          text          NOT NULL,
  description   text,
  filter_rules  jsonb         NOT NULL DEFAULT '[]'::jsonb,
  lead_count    integer       DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),

  UNIQUE(business_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_segments_business_id ON public.lead_segments (business_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. LEAD ANALYTICS TABLE (Pre-calculated metrics)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_analytics (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       text          NOT NULL,
  date              date          NOT NULL,
  leads_created     integer       DEFAULT 0,
  leads_contacted   integer       DEFAULT 0,
  leads_qualified   integer       DEFAULT 0,
  conversion_count  integer       DEFAULT 0,
  conversion_rate   numeric(5,2)  DEFAULT 0,
  avg_deal_value    numeric(14,2) DEFAULT 0,
  avg_lead_score    integer       DEFAULT 0,
  total_revenue     numeric(14,2) DEFAULT 0,
  created_at        timestamptz   NOT NULL DEFAULT now(),

  UNIQUE(business_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_analytics_business_date ON public.lead_analytics (business_id, date DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS leads_select ON public.leads;
DROP POLICY IF EXISTS leads_insert ON public.leads;
DROP POLICY IF EXISTS leads_update ON public.leads;
DROP POLICY IF EXISTS leads_delete ON public.leads;

DROP POLICY IF EXISTS lead_activities_select ON public.lead_activities;
DROP POLICY IF EXISTS lead_activities_insert ON public.lead_activities;
DROP POLICY IF EXISTS lead_activities_update ON public.lead_activities;
DROP POLICY IF EXISTS lead_activities_delete ON public.lead_activities;

DROP POLICY IF EXISTS lead_imports_select ON public.lead_imports;
DROP POLICY IF EXISTS lead_imports_insert ON public.lead_imports;
DROP POLICY IF EXISTS lead_imports_update ON public.lead_imports;
DROP POLICY IF EXISTS lead_imports_delete ON public.lead_imports;

DROP POLICY IF EXISTS lead_segments_select ON public.lead_segments;
DROP POLICY IF EXISTS lead_segments_insert ON public.lead_segments;
DROP POLICY IF EXISTS lead_segments_update ON public.lead_segments;
DROP POLICY IF EXISTS lead_segments_delete ON public.lead_segments;

DROP POLICY IF EXISTS lead_analytics_select ON public.lead_analytics;

-- Leads policies (allow all for now, production should use business_id = auth.uid()::text)
CREATE POLICY leads_select ON public.leads FOR SELECT USING (true);
CREATE POLICY leads_insert ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY leads_update ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY leads_delete ON public.leads FOR DELETE USING (true);

-- Lead activities policies
CREATE POLICY lead_activities_select ON public.lead_activities FOR SELECT USING (true);
CREATE POLICY lead_activities_insert ON public.lead_activities FOR INSERT WITH CHECK (true);
CREATE POLICY lead_activities_update ON public.lead_activities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY lead_activities_delete ON public.lead_activities FOR DELETE USING (true);

-- Lead imports policies
CREATE POLICY lead_imports_select ON public.lead_imports FOR SELECT USING (true);
CREATE POLICY lead_imports_insert ON public.lead_imports FOR INSERT WITH CHECK (true);
CREATE POLICY lead_imports_update ON public.lead_imports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY lead_imports_delete ON public.lead_imports FOR DELETE USING (true);

-- Lead segments policies
CREATE POLICY lead_segments_select ON public.lead_segments FOR SELECT USING (true);
CREATE POLICY lead_segments_insert ON public.lead_segments FOR INSERT WITH CHECK (true);
CREATE POLICY lead_segments_update ON public.lead_segments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY lead_segments_delete ON public.lead_segments FOR DELETE USING (true);

-- Lead analytics policies
CREATE POLICY lead_analytics_select ON public.lead_analytics FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. UTILITY FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION public.calculate_lead_score(
  p_engagement_count integer,
  p_stage text,
  p_priority text,
  p_deal_value numeric
) RETURNS integer AS $$
DECLARE
  score integer := 0;
BEGIN
  -- Base score from engagement
  score := p_engagement_count * 5;

  -- Stage bonus
  score := score + CASE p_stage
    WHEN 'new' THEN 0
    WHEN 'contacted' THEN 10
    WHEN 'qualified' THEN 25
    WHEN 'proposal' THEN 40
    WHEN 'negotiation' THEN 55
    WHEN 'won' THEN 100
    WHEN 'lost' THEN -20
    WHEN 'nurture' THEN 5
    ELSE 0
  END;

  -- Priority bonus
  score := score + CASE p_priority
    WHEN 'low' THEN 0
    WHEN 'medium' THEN 5
    WHEN 'high' THEN 15
    WHEN 'urgent' THEN 25
    ELSE 0
  END;

  -- Deal value bonus
  IF p_deal_value IS NOT NULL AND p_deal_value > 0 THEN
    score := score + LEAST(25, (p_deal_value / 1000)::integer);
  END IF;

  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get lead stats for a business
CREATE OR REPLACE FUNCTION public.get_lead_stats(p_business_id text)
RETURNS TABLE (
  total_leads bigint,
  new_leads bigint,
  contacted_leads bigint,
  qualified_leads bigint,
  won_leads bigint,
  lost_leads bigint,
  avg_deal_value numeric,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE stage = 'new'),
    COUNT(*) FILTER (WHERE stage = 'contacted'),
    COUNT(*) FILTER (WHERE stage = 'qualified'),
    COUNT(*) FILTER (WHERE stage = 'won'),
    COUNT(*) FILTER (WHERE stage = 'lost'),
    AVG(deal_value) FILTER (WHERE deal_value IS NOT NULL),
    SUM(deal_value) FILTER (WHERE stage = 'won' AND deal_value IS NOT NULL)
  FROM public.leads
  WHERE business_id = p_business_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get source breakdown
CREATE OR REPLACE FUNCTION public.get_lead_source_breakdown(p_business_id text)
RETURNS TABLE (
  source text,
  count bigint,
  conversion_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.source,
    COUNT(*)::bigint,
    (COUNT(*) FILTER (WHERE l.stage = 'won')::numeric / COUNT(*) * 100)::numeric(5,2) AS conversion_rate
  FROM public.leads l
  WHERE l.business_id = p_business_id
  GROUP BY l.source
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert sample leads for testing
INSERT INTO public.leads (business_id, name, email, phone, company, product_interest, source, stage, priority, deal_value, notes, tags, lead_score)
VALUES
  ('biz-001', 'John Smith', 'john@acme.com', '+1-555-0101', 'ACME Corp', 'Enterprise Plan', 'website', 'qualified', 'high', 50000, 'Interested in demo', '["hot","enterprise"]'::jsonb, 75),
  ('biz-001', 'Jane Doe', 'jane@techstart.io', '+1-555-0102', 'TechStart Inc', 'Pro Plan', 'referral', 'proposal', 'high', 25000, 'Ready to purchase', '["warm","tech"]'::jsonb, 65),
  ('biz-001', 'Mike Johnson', 'mike@smallbiz.com', '+1-555-0103', 'Small Biz LLC', 'Startup Plan', 'csv', 'new', 'medium', null, 'Initial contact', '["cold"]'::jsonb, 20),
  ('biz-001', 'Sarah Williams', 'sarah@fastgrow.com', '+1-555-0104', 'FastGrow Co', 'Enterprise Plan', 'campaign', 'contacted', 'medium', 75000, 'High potential', '["hot","growth"]'::jsonb, 55),
  ('biz-001', 'Robert Brown', 'robert@innovation.net', '+1-555-0105', 'Innovation Labs', 'Pro Plan', 'email', 'negotiation', 'urgent', 45000, 'Near closure', '["hot","ready"]'::jsonb, 85)
ON CONFLICT DO NOTHING;
