-- Phase 6: AI + Manager Layer Migration
-- Intelligent automation with human oversight

-- Manager Profiles Table
CREATE TABLE IF NOT EXISTS manager_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specializations TEXT[] DEFAULT '{}',
  expertise_level TEXT CHECK (expertise_level IN ('junior', 'mid', 'senior', 'expert')),
  availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
  current_workload INTEGER DEFAULT 0,
  max_concurrent_leads INTEGER DEFAULT 50,
  target_response_time_minutes INTEGER DEFAULT 15,
  target_close_rate_percent DECIMAL(5,2) DEFAULT 35.00,
  target_satisfaction_score DECIMAL(3,2) DEFAULT 4.50,
  auto_assign BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_manager_profiles_business ON manager_profiles(business_id);
CREATE INDEX idx_manager_profiles_availability ON manager_profiles(availability_status);

-- Manager Assignments Table
CREATE TABLE IF NOT EXISTS manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  lead_id UUID NOT NULL,
  manager_id UUID NOT NULL REFERENCES manager_profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assignment_reason TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('auto', 'manual', 'escalation', 'reassignment')),
  status TEXT CHECK (status IN ('active', 'completed', 'reassigned', 'cancelled')),
  response_time_minutes INTEGER,
  interaction_count INTEGER DEFAULT 0,
  satisfaction_score DECIMAL(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manager_assignments_business ON manager_assignments(business_id);
CREATE INDEX idx_manager_assignments_manager ON manager_assignments(manager_id);
CREATE INDEX idx_manager_assignments_status ON manager_assignments(status);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  recommendation_text TEXT NOT NULL,
  action_type TEXT NOT NULL,
  priority TEXT,
  confidence_score DECIMAL(3,2),
  reasoning_details JSONB,
  reviewed_by UUID,
  is_accepted BOOLEAN,
  manager_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_recommendations_business ON ai_recommendations(business_id);
CREATE INDEX idx_ai_recommendations_entity ON ai_recommendations(entity_type, entity_id);

-- Manager Interactions Table
CREATE TABLE IF NOT EXISTS manager_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  manager_id UUID NOT NULL REFERENCES manager_profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  channel TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manager_interactions_manager ON manager_interactions(manager_id);

-- AI Performance Metrics Table
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,4),
  time_period TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  target_value DECIMAL(10,4),
  is_within_threshold BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_performance_metrics_business ON ai_performance_metrics(business_id);

-- Manager Schedules Table
CREATE TABLE IF NOT EXISTS manager_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL UNIQUE REFERENCES manager_profiles(id),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  availability_json JSONB NOT NULL,
  auto_offline_after_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escalation Rules Table
CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_config JSONB NOT NULL,
  escalation_target TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rule_order INTEGER,
  escalations_triggered INTEGER DEFAULT 0,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escalation_rules_business ON escalation_rules(business_id);
CREATE INDEX idx_escalation_rules_active ON escalation_rules(is_active);

-- Hybrid Workflows Table
CREATE TABLE IF NOT EXISTS hybrid_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  ai_handles_initial_qualification BOOLEAN DEFAULT true,
  ai_handles_nurture BOOLEAN DEFAULT true,
  manager_handles_high_value BOOLEAN DEFAULT true,
  ai_to_manager_threshold_value DECIMAL(10,2),
  auto_escalate_after_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hybrid_workflows_business ON hybrid_workflows(business_id);

-- Enable RLS
ALTER TABLE manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "manager_profiles_select" ON manager_profiles FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_profiles_insert" ON manager_profiles FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_assignments_select" ON manager_assignments FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "ai_recommendations_select" ON ai_recommendations FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "ai_recommendations_insert" ON ai_recommendations FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "escalation_rules_select" ON escalation_rules FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "hybrid_workflows_select" ON hybrid_workflows FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Update timestamp functions
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manager_profiles_update_timestamp
BEFORE UPDATE ON manager_profiles FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER ai_recommendations_update_timestamp
BEFORE UPDATE ON ai_recommendations FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER escalation_rules_update_timestamp
BEFORE UPDATE ON escalation_rules FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER manager_schedules_update_timestamp
BEFORE UPDATE ON manager_schedules FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- End Phase 6 Migration
