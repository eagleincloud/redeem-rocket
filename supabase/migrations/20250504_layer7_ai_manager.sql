-- Layer 7: AI + Manager Layer Schema
-- Manager assignments, AI recommendations, and hybrid support system

-- Table for manager assignments
CREATE TABLE IF NOT EXISTS manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  reason VARCHAR(255),

  UNIQUE(manager_id, lead_id),
  INDEX (manager_id),
  INDEX (lead_id)
);

-- Table for AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),

  type VARCHAR(50), -- 'lead_health', 'action_suggestion', 'coaching', 'escalation'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  urgency VARCHAR(20), -- 'high', 'medium', 'low'
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  action_type VARCHAR(100),
  action_url VARCHAR(500),
  action_params JSONB,

  actioned_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (business_id, created_at DESC),
  INDEX (manager_id, created_at DESC),
  INDEX (lead_id, created_at DESC)
);

-- Table for manager tasks
CREATE TABLE IF NOT EXISTS manager_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),

  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50), -- 'follow_up', 'call', 'email', 'meeting', 'proposal', 'negotiation'

  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (manager_id, status),
  INDEX (manager_id, due_date),
  INDEX (lead_id, status)
);

-- Table for lead health scores
CREATE TABLE IF NOT EXISTS lead_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  health_score INT CHECK (health_score >= 0 AND health_score <= 100),
  risk_level VARCHAR(20), -- 'high', 'medium', 'low'

  last_activity_days_ago INT,
  engagement_level VARCHAR(20), -- 'high', 'medium', 'low'
  activity_trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing'

  reasons JSONB, -- [{ reason: string, weight: number }]

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id),
  INDEX (business_id, health_score DESC),
  INDEX (lead_id, calculated_at DESC)
);

-- Table for AI-generated email drafts
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  manager_id UUID REFERENCES auth.users(id),

  template_type VARCHAR(100),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  alternatives JSONB, -- [{ subject, body }]

  sent_at TIMESTAMPTZ,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (manager_id, created_at DESC),
  INDEX (lead_id, created_at DESC)
);

-- Table for manager interactions
CREATE TABLE IF NOT EXISTS manager_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),

  interaction_type VARCHAR(50), -- 'email', 'call', 'meeting', 'note', 'proposal', 'document'
  details JSONB,
  outcome VARCHAR(255),
  next_action VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (manager_id, created_at DESC),
  INDEX (lead_id, created_at DESC)
);

-- RLS Policies
ALTER TABLE manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_interactions ENABLE ROW LEVEL SECURITY;

-- Manager can view/manage their assignments
CREATE POLICY "Managers can view their assignments"
  ON manager_assignments FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Business owner can view all assignments"
  ON manager_assignments FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

-- AI recommendations policies
CREATE POLICY "Managers can view their recommendations"
  ON ai_recommendations FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Service role can create recommendations"
  ON ai_recommendations FOR INSERT
  USING (auth.role() = 'service_role');

-- Manager tasks policies
CREATE POLICY "Managers can manage their tasks"
  ON manager_tasks FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Health scores policies
CREATE POLICY "Users can view lead health scores"
  ON lead_health_scores FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Email drafts policies
CREATE POLICY "Managers can view their drafts"
  ON email_drafts FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can create drafts"
  ON email_drafts FOR INSERT
  USING (manager_id = auth.uid());

-- Manager interactions policies
CREATE POLICY "Managers can view their interactions"
  ON manager_interactions FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can create interactions"
  ON manager_interactions FOR INSERT
  USING (manager_id = auth.uid());
