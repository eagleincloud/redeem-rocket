-- Layer 7: AI + Manager Layer Tables
-- Manager dashboards, recommendations, tasks, and activity logs

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  urgency VARCHAR(50),

  action_url VARCHAR(500),
  estimated_impact VARCHAR(255),

  actioned_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX (manager_id, created_at),
  INDEX (business_id, dismissed_at)
);

-- Manager Metrics
CREATE TABLE IF NOT EXISTS manager_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  metric_date DATE NOT NULL,

  total_leads_assigned INT,
  leads_in_pipeline INT,
  deals_closed INT,
  revenue_closed DECIMAL(15,2),

  conversion_rate DECIMAL(5,2),
  avg_response_time_hours INT,
  avg_deal_value DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, metric_date)
);

-- Manager Tasks
CREATE TABLE IF NOT EXISTS manager_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50),

  due_date DATE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX (manager_id, completed_at)
);

-- Manager Activity Logs
CREATE TABLE IF NOT EXISTS manager_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  activity_type VARCHAR(100),
  lead_id UUID REFERENCES leads(id),
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX (manager_id, created_at)
);

-- Email Drafts
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),

  subject VARCHAR(255),
  body TEXT,

  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX (manager_id, created_at)
);

-- Add manager_id to leads if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD INDEX IF NOT EXISTS idx_leads_manager ON leads(business_id, manager_id);

-- Enable RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Managers can view own recommendations"
  ON ai_recommendations FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can dismiss own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "Team can view manager metrics for own business"
  ON manager_metrics FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers can view own tasks"
  ON manager_tasks FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Team can view activity logs for own business"
  ON manager_activity_logs FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers can view own email drafts"
  ON email_drafts FOR SELECT
  USING (manager_id = auth.uid());
