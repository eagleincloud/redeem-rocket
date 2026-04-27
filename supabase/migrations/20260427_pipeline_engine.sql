-- Pipeline Engine Database Schema
-- Implements core tables for structured pipeline execution with configurable stages
-- Supports Lead, Marketing, Retention, Support and custom pipelines
-- Created: 2026-04-27

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BUSINESS_PIPELINES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Metadata
  name varchar(255) NOT NULL,
  description text,
  pipeline_type varchar(50) NOT NULL DEFAULT 'custom'
    CHECK (pipeline_type IN ('lead', 'marketing', 'retention', 'support', 'custom')),

  -- Stages configuration (array of stage objects)
  -- Structure: [{id: 1, name: "Prospect", color: "#3B82F6", order: 1}, ...]
  stages jsonb NOT NULL DEFAULT '[]',

  -- Template tracking
  template_source varchar(255),
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,

  -- Audit trail
  created_by uuid REFERENCES public.biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Statistics
  total_entities integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  avg_cycle_time_days numeric(10,2),

  UNIQUE(business_id, name),
  CONSTRAINT valid_stages CHECK (jsonb_array_length(stages) > 0)
);

CREATE INDEX idx_business_pipelines_business_id ON public.business_pipelines(business_id);
CREATE INDEX idx_business_pipelines_type ON public.business_pipelines(business_id, pipeline_type);
CREATE INDEX idx_business_pipelines_active ON public.business_pipelines(business_id, is_active);
CREATE INDEX idx_business_pipelines_created_at ON public.business_pipelines(created_at DESC);

COMMENT ON TABLE public.business_pipelines IS 'Pipeline definitions with configurable stages and metadata';
COMMENT ON COLUMN public.business_pipelines.stages IS 'JSON array of stage objects: [{id, name, color, order}, ...]';
COMMENT ON COLUMN public.business_pipelines.pipeline_type IS 'Type of pipeline: lead (sales funnel), marketing (campaign), retention (customer), support (ticket)';
COMMENT ON COLUMN public.business_pipelines.template_source IS 'If created from template, reference to template name';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PIPELINE_ENTITIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipeline_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES public.business_pipelines(id) ON DELETE CASCADE,

  -- Entity reference (linking to leads, products, customers, etc)
  entity_type varchar(50) NOT NULL
    CHECK (entity_type IN ('lead', 'product', 'customer', 'opportunity', 'ticket', 'custom')),
  entity_id uuid,

  -- Entity data snapshot (for search/display)
  entity_data jsonb NOT NULL DEFAULT '{}',

  -- Stage tracking
  current_stage_id integer NOT NULL,
  current_stage_name varchar(255) NOT NULL,

  -- Stage history: [{stage_id, stage_name, entered_at, exited_at, duration_days}, ...]
  stage_history jsonb DEFAULT '[]',

  -- Conversion metrics
  entered_current_stage_at timestamptz DEFAULT now(),
  days_in_current_stage numeric(10,2) DEFAULT 0,
  total_cycle_days numeric(10,2),

  -- Custom fields
  custom_fields jsonb DEFAULT '{}',

  -- Status tracking
  is_active boolean DEFAULT true,
  completed_at timestamptz,
  completion_stage_id integer,

  -- Audit trail
  created_by uuid REFERENCES public.biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(pipeline_id, entity_type, entity_id)
);

CREATE INDEX idx_pipeline_entities_business_id ON public.pipeline_entities(business_id);
CREATE INDEX idx_pipeline_entities_pipeline_id ON public.pipeline_entities(pipeline_id);
CREATE INDEX idx_pipeline_entities_stage ON public.pipeline_entities(pipeline_id, current_stage_id);
CREATE INDEX idx_pipeline_entities_entity ON public.pipeline_entities(entity_type, entity_id);
CREATE INDEX idx_pipeline_entities_active ON public.pipeline_entities(is_active, created_at DESC);
CREATE INDEX idx_pipeline_entities_created_at ON public.pipeline_entities(created_at DESC);

COMMENT ON TABLE public.pipeline_entities IS 'Entities (leads, products, customers) moving through pipelines';
COMMENT ON COLUMN public.pipeline_entities.entity_data IS 'Snapshot of entity data for quick access (name, email, phone, etc)';
COMMENT ON COLUMN public.pipeline_entities.stage_history IS 'Array of stage transitions: [{stage_id, stage_name, entered_at, exited_at}, ...]';
COMMENT ON COLUMN public.pipeline_entities.custom_fields IS 'Custom field values specific to this pipeline entity';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PIPELINE_STAGE_TRANSITIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipeline_stage_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  pipeline_entity_id uuid NOT NULL REFERENCES public.pipeline_entities(id) ON DELETE CASCADE,

  -- Stage transition details
  from_stage_id integer,
  from_stage_name varchar(255),
  to_stage_id integer NOT NULL,
  to_stage_name varchar(255) NOT NULL,

  -- Reason for transition
  transition_reason varchar(255),
  notes text,

  -- Automation trigger
  triggered_by varchar(50) DEFAULT 'manual'
    CHECK (triggered_by IN ('manual', 'automation', 'system', 'webhook')),
  automation_rule_id uuid,

  -- Audit
  transition_by uuid REFERENCES public.biz_users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pipeline_stage_transitions_entity ON public.pipeline_stage_transitions(pipeline_entity_id);
CREATE INDEX idx_pipeline_stage_transitions_created_at ON public.pipeline_stage_transitions(created_at DESC);
CREATE INDEX idx_pipeline_stage_transitions_triggered ON public.pipeline_stage_transitions(triggered_by);

COMMENT ON TABLE public.pipeline_stage_transitions IS 'Audit trail of entity movements between pipeline stages';
COMMENT ON COLUMN public.pipeline_stage_transitions.triggered_by IS 'Who/what triggered the transition: manual user, automation rule, system, or webhook';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PIPELINE_STATS TABLE (For caching aggregated metrics)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipeline_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES public.business_pipelines(id) ON DELETE CASCADE,

  -- Stage-level metrics
  stage_id integer NOT NULL,
  stage_name varchar(255) NOT NULL,
  entity_count integer DEFAULT 0,

  -- Conversion metrics
  conversion_rate numeric(5,2) DEFAULT 0,
  avg_cycle_time_days numeric(10,2),
  completed_count integer DEFAULT 0,

  -- Calculation timestamp
  calculated_at timestamptz DEFAULT now(),

  UNIQUE(pipeline_id, stage_id)
);

CREATE INDEX idx_pipeline_stats_pipeline_id ON public.pipeline_stats(pipeline_id);
CREATE INDEX idx_pipeline_stats_calculated_at ON public.pipeline_stats(calculated_at DESC);

COMMENT ON TABLE public.pipeline_stats IS 'Cached aggregated metrics per pipeline stage for performance';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTO-UPDATE TRIGGER FOR updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_pipelines_set_updated_at ON public.business_pipelines;
CREATE TRIGGER business_pipelines_set_updated_at BEFORE UPDATE ON public.business_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pipeline_entities_set_updated_at ON public.pipeline_entities;
CREATE TRIGGER pipeline_entities_set_updated_at BEFORE UPDATE ON public.pipeline_entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.business_pipelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_pipelines_select" ON public.business_pipelines;
DROP POLICY IF EXISTS "business_pipelines_insert" ON public.business_pipelines;
DROP POLICY IF EXISTS "business_pipelines_update" ON public.business_pipelines;
DROP POLICY IF EXISTS "business_pipelines_delete" ON public.business_pipelines;

CREATE POLICY "business_pipelines_select" ON public.business_pipelines
  FOR SELECT USING (true);
CREATE POLICY "business_pipelines_insert" ON public.business_pipelines
  FOR INSERT WITH CHECK (true);
CREATE POLICY "business_pipelines_update" ON public.business_pipelines
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "business_pipelines_delete" ON public.business_pipelines
  FOR DELETE USING (true);

ALTER TABLE public.pipeline_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pipeline_entities_select" ON public.pipeline_entities;
DROP POLICY IF EXISTS "pipeline_entities_insert" ON public.pipeline_entities;
DROP POLICY IF EXISTS "pipeline_entities_update" ON public.pipeline_entities;
DROP POLICY IF EXISTS "pipeline_entities_delete" ON public.pipeline_entities;

CREATE POLICY "pipeline_entities_select" ON public.pipeline_entities
  FOR SELECT USING (true);
CREATE POLICY "pipeline_entities_insert" ON public.pipeline_entities
  FOR INSERT WITH CHECK (true);
CREATE POLICY "pipeline_entities_update" ON public.pipeline_entities
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "pipeline_entities_delete" ON public.pipeline_entities
  FOR DELETE USING (true);

ALTER TABLE public.pipeline_stage_transitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pipeline_stage_transitions_select" ON public.pipeline_stage_transitions;
DROP POLICY IF EXISTS "pipeline_stage_transitions_insert" ON public.pipeline_stage_transitions;
DROP POLICY IF EXISTS "pipeline_stage_transitions_all" ON public.pipeline_stage_transitions;

CREATE POLICY "pipeline_stage_transitions_select" ON public.pipeline_stage_transitions
  FOR SELECT USING (true);
CREATE POLICY "pipeline_stage_transitions_insert" ON public.pipeline_stage_transitions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "pipeline_stage_transitions_all" ON public.pipeline_stage_transitions
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pipeline_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pipeline_stats_all" ON public.pipeline_stats;
CREATE POLICY "pipeline_stats_all" ON public.pipeline_stats
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. SAMPLE DATA FOR TESTING
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to create sample pipelines (optional, can be removed)
CREATE OR REPLACE FUNCTION public.create_sample_pipelines(p_business_id uuid)
RETURNS TABLE (pipeline_id uuid, pipeline_name text) AS $$
DECLARE
  v_lead_pipeline uuid;
  v_marketing_pipeline uuid;
BEGIN
  -- Create Lead Pipeline
  INSERT INTO public.business_pipelines (
    business_id, name, pipeline_type, stages, is_default, created_by
  ) VALUES (
    p_business_id,
    'Lead Sales Pipeline',
    'lead',
    '[
      {"id": 1, "name": "Prospect", "color": "#3B82F6", "order": 1},
      {"id": 2, "name": "Qualified", "color": "#8B5CF6", "order": 2},
      {"id": 3, "name": "Negotiation", "color": "#F59E0B", "order": 3},
      {"id": 4, "name": "Won", "color": "#10B981", "order": 4},
      {"id": 5, "name": "Lost", "color": "#EF4444", "order": 5}
    ]'::jsonb,
    true,
    p_business_id
  ) RETURNING id INTO v_lead_pipeline;

  -- Create Marketing Pipeline
  INSERT INTO public.business_pipelines (
    business_id, name, pipeline_type, stages, created_by
  ) VALUES (
    p_business_id,
    'Marketing Campaign Pipeline',
    'marketing',
    '[
      {"id": 1, "name": "Planning", "color": "#06B6D4", "order": 1},
      {"id": 2, "name": "Launch", "color": "#0EA5E9", "order": 2},
      {"id": 3, "name": "Active", "color": "#2563EB", "order": 3},
      {"id": 4, "name": "Complete", "color": "#10B981", "order": 4}
    ]'::jsonb,
    p_business_id
  ) RETURNING id INTO v_marketing_pipeline;

  RETURN QUERY
  SELECT v_lead_pipeline, 'Lead Sales Pipeline'::text
  UNION ALL
  SELECT v_marketing_pipeline, 'Marketing Campaign Pipeline'::text;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_sample_pipelines IS 'Helper function to create default pipelines for a business';
