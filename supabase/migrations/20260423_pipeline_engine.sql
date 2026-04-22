-- Pipeline Engine Schema
-- Production-grade sales/opportunity pipeline system
-- Created: 2026-04-23

-- ═══════════════════════════════════════════════════════════════════════════
-- BUSINESS PIPELINES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS business_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  icon varchar(50),
  color varchar(7) DEFAULT '#3B82F6',
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_by uuid NOT NULL REFERENCES biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  total_entities integer DEFAULT 0,
  total_value numeric(15, 2) DEFAULT 0,
  conversion_rate numeric(5, 2) DEFAULT 0,

  CONSTRAINT unique_pipeline_name UNIQUE(business_id, name)
);

CREATE INDEX idx_business_pipelines_business_id ON business_pipelines(business_id);
CREATE INDEX idx_business_pipelines_status ON business_pipelines(business_id, status);
CREATE INDEX idx_business_pipelines_created_at ON business_pipelines(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE STAGES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  order_index integer NOT NULL,
  color varchar(7) DEFAULT '#E5E7EB',
  description text,
  is_terminal boolean DEFAULT false,
  is_win_stage boolean DEFAULT false,
  probability_weight numeric(3, 2) DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_stage_order UNIQUE(pipeline_id, order_index)
);

CREATE INDEX idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX idx_pipeline_stages_order ON pipeline_stages(pipeline_id, order_index);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE ENTITIES TABLE (Main pipeline items)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  name varchar(255) NOT NULL,
  entity_type varchar(50) NOT NULL,
  value numeric(15, 2),
  currency varchar(3) DEFAULT 'USD',
  priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'paused')),

  assigned_to uuid REFERENCES biz_users(id) ON DELETE SET NULL,
  related_to uuid REFERENCES pipeline_entities(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  entered_stage_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  expected_close_date date,
  closed_at timestamptz,

  deleted_at timestamptz,

  custom_fields jsonb DEFAULT '{}',
  tags text[] DEFAULT ARRAY[]::text[],
  notes text
);

CREATE INDEX idx_pipeline_entities_pipeline_stage ON pipeline_entities(pipeline_id, stage_id);
CREATE INDEX idx_pipeline_entities_assigned_to ON pipeline_entities(assigned_to);
CREATE INDEX idx_pipeline_entities_created_at ON pipeline_entities(created_at DESC);
CREATE INDEX idx_pipeline_entities_last_activity ON pipeline_entities(last_activity_at DESC);
CREATE INDEX idx_pipeline_entities_status ON pipeline_entities(status);
CREATE INDEX idx_pipeline_entities_business_id ON pipeline_entities(business_id);
CREATE INDEX idx_pipeline_entities_deleted ON pipeline_entities(deleted_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE HISTORY TABLE (Audit trail)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES pipeline_entities(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,

  action varchar(50) NOT NULL CHECK (action IN ('created', 'moved', 'updated', 'deleted', 'noted')),
  old_values jsonb,
  new_values jsonb,

  changed_by uuid NOT NULL REFERENCES biz_users(id),
  change_reason text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pipeline_history_entity ON pipeline_history(entity_id, created_at DESC);
CREATE INDEX idx_pipeline_history_pipeline ON pipeline_history(pipeline_id, created_at DESC);
CREATE INDEX idx_pipeline_history_action ON pipeline_history(action);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE CUSTOM FIELDS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,

  field_name varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'checkbox')),
  required boolean DEFAULT false,
  options jsonb,

  order_index integer,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_custom_field UNIQUE(pipeline_id, field_name)
);

CREATE INDEX idx_pipeline_custom_fields_pipeline ON pipeline_custom_fields(pipeline_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE METRICS TABLE (Cached)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES pipeline_stages(id) ON DELETE CASCADE,

  metric_type varchar(50) NOT NULL,
  metric_value numeric(15, 2),

  calculated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '5 minutes'
);

CREATE INDEX idx_pipeline_metrics_pipeline ON pipeline_metrics(pipeline_id, metric_type);
CREATE INDEX idx_pipeline_metrics_stage ON pipeline_metrics(stage_id, metric_type);
CREATE INDEX idx_pipeline_metrics_expiry ON pipeline_metrics(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- PIPELINE WEBHOOKS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  url text NOT NULL,
  events text[] NOT NULL,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  last_triggered_at timestamptz,
  failure_count integer DEFAULT 0
);

CREATE INDEX idx_pipeline_webhooks_business ON pipeline_webhooks(business_id, is_active);
CREATE INDEX idx_pipeline_webhooks_pipeline ON pipeline_webhooks(pipeline_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Update timestamp on pipeline modification
CREATE OR REPLACE FUNCTION update_business_pipelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_pipelines_timestamp
BEFORE UPDATE ON business_pipelines
FOR EACH ROW
EXECUTE FUNCTION update_business_pipelines_updated_at();

-- Update timestamp on stage modification
CREATE OR REPLACE FUNCTION update_pipeline_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_stages_timestamp
BEFORE UPDATE ON pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stages_updated_at();

-- Update timestamp on entity modification
CREATE OR REPLACE FUNCTION update_pipeline_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_entities_timestamp
BEFORE UPDATE ON pipeline_entities
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION update_pipeline_entities_updated_at();

-- Auto-track history on entity creation
CREATE OR REPLACE FUNCTION track_entity_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_history (
    entity_id,
    pipeline_id,
    action,
    new_values,
    changed_by,
    created_at
  ) VALUES (
    NEW.id,
    NEW.pipeline_id,
    'created',
    jsonb_build_object(
      'name', NEW.name,
      'entity_type', NEW.entity_type,
      'value', NEW.value,
      'priority', NEW.priority,
      'assigned_to', NEW.assigned_to
    ),
    auth.uid(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_entity_creation_trigger
AFTER INSERT ON pipeline_entities
FOR EACH ROW
EXECUTE FUNCTION track_entity_creation();

-- Auto-track history on entity stage movement
CREATE OR REPLACE FUNCTION track_entity_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO pipeline_history (
      entity_id,
      pipeline_id,
      action,
      old_values,
      new_values,
      changed_by,
      created_at
    ) VALUES (
      NEW.id,
      NEW.pipeline_id,
      'moved',
      jsonb_build_object('stage_id', OLD.stage_id),
      jsonb_build_object('stage_id', NEW.stage_id),
      auth.uid(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_entity_movement_trigger
AFTER UPDATE ON pipeline_entities
FOR EACH ROW
WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
EXECUTE FUNCTION track_entity_movement();

-- Update pipeline stats on entity changes
CREATE OR REPLACE FUNCTION update_pipeline_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_entities INTEGER;
  v_total_value NUMERIC;
  v_win_count INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(value), 0)
  INTO v_total_entities, v_total_value
  FROM pipeline_entities
  WHERE pipeline_id = NEW.pipeline_id AND deleted_at IS NULL;

  SELECT COUNT(*)
  INTO v_win_count
  FROM pipeline_entities
  WHERE pipeline_id = NEW.pipeline_id AND status = 'won' AND deleted_at IS NULL;

  UPDATE business_pipelines
  SET
    total_entities = v_total_entities,
    total_value = v_total_value,
    conversion_rate = CASE
      WHEN v_total_entities > 0 THEN ROUND((v_win_count::numeric / v_total_entities) * 100, 2)
      ELSE 0
    END
  WHERE id = NEW.pipeline_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_stats_on_insert
AFTER INSERT ON pipeline_entities
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stats();

CREATE TRIGGER update_pipeline_stats_on_update
AFTER UPDATE ON pipeline_entities
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stats();

CREATE TRIGGER update_pipeline_stats_on_delete
AFTER DELETE ON pipeline_entities
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_webhooks ENABLE ROW LEVEL SECURITY;

-- Pipelines: Users can only see/edit their own business pipelines
CREATE POLICY business_pipelines_select ON business_pipelines
  FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY business_pipelines_insert ON business_pipelines
  FOR INSERT
  WITH CHECK (business_id = auth.uid());

CREATE POLICY business_pipelines_update ON business_pipelines
  FOR UPDATE
  USING (business_id = auth.uid());

CREATE POLICY business_pipelines_delete ON business_pipelines
  FOR DELETE
  USING (business_id = auth.uid());

-- Stages: Users can see/edit stages of their own pipelines
CREATE POLICY pipeline_stages_select ON pipeline_stages
  FOR SELECT
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_stages_insert ON pipeline_stages
  FOR INSERT
  WITH CHECK (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_stages_update ON pipeline_stages
  FOR UPDATE
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_stages_delete ON pipeline_stages
  FOR DELETE
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

-- Entities: Users can see/edit entities in their own pipelines
CREATE POLICY pipeline_entities_select ON pipeline_entities
  FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY pipeline_entities_insert ON pipeline_entities
  FOR INSERT
  WITH CHECK (business_id = auth.uid());

CREATE POLICY pipeline_entities_update ON pipeline_entities
  FOR UPDATE
  USING (business_id = auth.uid());

CREATE POLICY pipeline_entities_delete ON pipeline_entities
  FOR DELETE
  USING (business_id = auth.uid());

-- History: Users can see history of their own pipelines
CREATE POLICY pipeline_history_select ON pipeline_history
  FOR SELECT
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

-- Custom fields: Users can see/edit custom fields for their pipelines
CREATE POLICY pipeline_custom_fields_select ON pipeline_custom_fields
  FOR SELECT
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_custom_fields_insert ON pipeline_custom_fields
  FOR INSERT
  WITH CHECK (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_custom_fields_update ON pipeline_custom_fields
  FOR UPDATE
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

CREATE POLICY pipeline_custom_fields_delete ON pipeline_custom_fields
  FOR DELETE
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

-- Metrics: Users can see metrics for their pipelines
CREATE POLICY pipeline_metrics_select ON pipeline_metrics
  FOR SELECT
  USING (pipeline_id IN (SELECT id FROM business_pipelines WHERE business_id = auth.uid()));

-- Webhooks: Users can see/edit webhooks for their pipelines
CREATE POLICY pipeline_webhooks_select ON pipeline_webhooks
  FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY pipeline_webhooks_insert ON pipeline_webhooks
  FOR INSERT
  WITH CHECK (business_id = auth.uid());

CREATE POLICY pipeline_webhooks_update ON pipeline_webhooks
  FOR UPDATE
  USING (business_id = auth.uid());

CREATE POLICY pipeline_webhooks_delete ON pipeline_webhooks
  FOR DELETE
  USING (business_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- UTILITY FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Move entity to a different stage
CREATE OR REPLACE FUNCTION move_entity_to_stage(
  p_entity_id uuid,
  p_new_stage_id uuid,
  p_change_reason text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  pipeline_id uuid,
  stage_id uuid,
  name varchar,
  updated_at timestamptz
) AS $$
DECLARE
  v_pipeline_id uuid;
  v_old_stage_id uuid;
BEGIN
  -- Get current stage
  SELECT stage_id, pipeline_id
  INTO v_old_stage_id, v_pipeline_id
  FROM pipeline_entities
  WHERE id = p_entity_id;

  -- Update entity
  UPDATE pipeline_entities
  SET
    stage_id = p_new_stage_id,
    entered_stage_at = now(),
    last_activity_at = now()
  WHERE id = p_entity_id
  RETURNING
    pipeline_entities.id,
    pipeline_entities.pipeline_id,
    pipeline_entities.stage_id,
    pipeline_entities.name,
    pipeline_entities.updated_at;

  -- Record history (trigger will handle it)
  -- But we can add change_reason here
  UPDATE pipeline_history
  SET change_reason = p_change_reason
  WHERE entity_id = p_entity_id
  AND action = 'moved'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Calculate metrics for a pipeline
CREATE OR REPLACE FUNCTION calculate_pipeline_metrics(p_pipeline_id uuid)
RETURNS TABLE (
  metric_type varchar,
  stage_id uuid,
  metric_value numeric
) AS $$
BEGIN
  -- Entity count per stage
  RETURN QUERY
  SELECT
    'entity_count'::varchar,
    ps.id,
    COUNT(pe.id)::numeric
  FROM pipeline_stages ps
  LEFT JOIN pipeline_entities pe ON ps.id = pe.stage_id AND pe.deleted_at IS NULL
  WHERE ps.pipeline_id = p_pipeline_id
  GROUP BY ps.id;

  -- Value per stage
  RETURN QUERY
  SELECT
    'stage_value'::varchar,
    ps.id,
    COALESCE(SUM(pe.value), 0)::numeric
  FROM pipeline_stages ps
  LEFT JOIN pipeline_entities pe ON ps.id = pe.stage_id AND pe.deleted_at IS NULL
  WHERE ps.pipeline_id = p_pipeline_id
  GROUP BY ps.id;

  -- Average time in stage (days)
  RETURN QUERY
  SELECT
    'avg_time_in_stage'::varchar,
    ps.id,
    AVG(EXTRACT(DAY FROM (pe.updated_at - pe.entered_stage_at)))::numeric
  FROM pipeline_stages ps
  LEFT JOIN pipeline_entities pe ON ps.id = pe.stage_id AND pe.deleted_at IS NULL
  WHERE ps.pipeline_id = p_pipeline_id
  GROUP BY ps.id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════

-- Mark migration as complete by creating a log entry (if needed)
-- Can be used for tracking migration execution
