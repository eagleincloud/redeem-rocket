/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 1
 * Database Schema for Manager Portal & AI Recommendations
 *
 * This migration extends the existing manager layer with specialized tables
 * for the manager portal, AI communication assistant, and escalation workflows.
 *
 * Dependencies: Assumes manager_profiles, ai_recommendations, manager_assignments
 * already exist from Phase 6 migration.
 */

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. MANAGER PORTAL FOCUS ENTITIES
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS manager_focus_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,

  -- Focus metadata
  focus_type TEXT NOT NULL CHECK (focus_type IN ('urgent', 'high_value', 'at_risk', 'potential')),
  reason TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Action tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'archived')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  -- AI input
  ai_confidence DECIMAL(3, 2),
  ai_action_recommended TEXT,

  CONSTRAINT unique_manager_deal_focus UNIQUE(manager_id, deal_id)
);

CREATE INDEX idx_manager_focus_deals_business ON manager_focus_deals(business_id);
CREATE INDEX idx_manager_focus_deals_manager ON manager_focus_deals(manager_id);
CREATE INDEX idx_manager_focus_deals_status ON manager_focus_deals(status);
CREATE INDEX idx_manager_focus_deals_type ON manager_focus_deals(focus_type);

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. AI-SUGGESTED EMAIL DRAFTS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_email_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,
  manager_id UUID REFERENCES manager_profiles(id) ON DELETE SET NULL,

  -- Email content
  subject_line TEXT NOT NULL,
  body_text TEXT NOT NULL,

  -- Context
  suggested_action TEXT NOT NULL CHECK (suggested_action IN (
    'initial_outreach', 'follow_up', 'proposal', 'negotiation',
    'close', 'objection_handling', 'check_in', 'next_step'
  )),
  context JSONB, -- Includes deal history, customer profile, etc.

  -- AI metadata
  model_version TEXT,
  confidence_score DECIMAL(3, 2),
  personalization_score DECIMAL(3, 2),

  -- Manager interaction
  reviewed BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  modified_by_manager BOOLEAN DEFAULT FALSE,
  manager_modifications TEXT,

  -- Outcomes
  sent_at TIMESTAMP WITH TIME ZONE,
  response_received BOOLEAN,
  response_summary TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_email_suggestions_business ON ai_email_suggestions(business_id);
CREATE INDEX idx_ai_email_suggestions_deal ON ai_email_suggestions(deal_id);
CREATE INDEX idx_ai_email_suggestions_manager ON ai_email_suggestions(manager_id);
CREATE INDEX idx_ai_email_suggestions_created ON ai_email_suggestions(created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. MANAGER NOTES & DEAL PROGRESS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS manager_deal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,

  -- Note content
  note_type TEXT NOT NULL CHECK (note_type IN ('update', 'internal', 'objection', 'next_step', 'decision')),
  content TEXT NOT NULL,

  -- Context
  is_pinned BOOLEAN DEFAULT FALSE,
  status_change_to TEXT, -- What status should the deal move to

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manager_deal_notes_business ON manager_deal_notes(business_id);
CREATE INDEX idx_manager_deal_notes_deal ON manager_deal_notes(deal_id);
CREATE INDEX idx_manager_deal_notes_manager ON manager_deal_notes(manager_id);
CREATE INDEX idx_manager_deal_notes_type ON manager_deal_notes(note_type);

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. MANAGER ACTION ITEMS & FOLLOW-UPS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS manager_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,

  -- Action definition
  action_type TEXT NOT NULL CHECK (action_type IN (
    'send_email', 'schedule_call', 'send_proposal', 'follow_up',
    'negotiate', 'close', 'check_in', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'delegated')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_manager_id UUID REFERENCES manager_profiles(id),
  completion_notes TEXT,

  -- AI suggestions
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_suggestion_text TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manager_action_items_business ON manager_action_items(business_id);
CREATE INDEX idx_manager_action_items_manager ON manager_action_items(manager_id);
CREATE INDEX idx_manager_action_items_deal ON manager_action_items(deal_id);
CREATE INDEX idx_manager_action_items_status ON manager_action_items(status);
CREATE INDEX idx_manager_action_items_due ON manager_action_items(due_at);

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. ESCALATION LOG
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,

  -- Escalation metadata
  escalated_from_manager_id UUID REFERENCES manager_profiles(id) ON DELETE SET NULL,
  escalated_to_manager_id UUID REFERENCES manager_profiles(id) ON DELETE SET NULL,

  -- Reason
  escalation_reason TEXT NOT NULL,
  ai_triggered BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3, 2),

  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'reverted')),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escalation_log_business ON escalation_log(business_id);
CREATE INDEX idx_escalation_log_deal ON escalation_log(deal_id);
CREATE INDEX idx_escalation_log_to_manager ON escalation_log(escalated_to_manager_id);
CREATE INDEX idx_escalation_log_created ON escalation_log(created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. MANAGER NOTIFICATIONS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS manager_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'assignment', 'escalation', 'ai_recommendation', 'action_due',
    'follow_up_reminder', 'deal_update', 'performance', 'system'
  )),

  -- Related entity
  entity_type TEXT,
  entity_id UUID,

  -- Interaction
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_manager_notifications_business ON manager_notifications(business_id);
CREATE INDEX idx_manager_notifications_manager ON manager_notifications(manager_id);
CREATE INDEX idx_manager_notifications_read ON manager_notifications(read);
CREATE INDEX idx_manager_notifications_created ON manager_notifications(created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. AI CONFIDENCE CALCULATION HELPER
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_confidence_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,

  -- Factor breakdown
  deal_value_fit DECIMAL(3, 2), -- 0-1: does deal value match our sweet spot
  customer_profile_match DECIMAL(3, 2), -- 0-1: does customer match ideal profile
  sales_cycle_alignment DECIMAL(3, 2), -- 0-1: is deal at right stage
  manager_success_rate DECIMAL(3, 2), -- 0-1: manager's historical success with similar deals
  activity_momentum DECIMAL(3, 2), -- 0-1: is activity trending up or down

  -- Composite
  overall_confidence DECIMAL(3, 2), -- Weighted average
  recommendation_text TEXT,

  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  calculation_version TEXT DEFAULT '1.0',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_confidence_factors_business ON ai_confidence_factors(business_id);
CREATE INDEX idx_ai_confidence_factors_deal ON ai_confidence_factors(deal_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. ENABLE RLS ON NEW TABLES
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE manager_focus_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_confidence_factors ENABLE ROW LEVEL SECURITY;

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════════════

-- Manager Focus Deals RLS
CREATE POLICY "manager_focus_deals_select_own_business"
  ON manager_focus_deals FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_focus_deals_insert_own_business"
  ON manager_focus_deals FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_focus_deals_update_own_business"
  ON manager_focus_deals FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- AI Email Suggestions RLS
CREATE POLICY "ai_email_suggestions_select_own_business"
  ON ai_email_suggestions FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "ai_email_suggestions_insert_own_business"
  ON ai_email_suggestions FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "ai_email_suggestions_update_own_business"
  ON ai_email_suggestions FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Manager Deal Notes RLS
CREATE POLICY "manager_deal_notes_select_own_business"
  ON manager_deal_notes FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_deal_notes_insert_own_business"
  ON manager_deal_notes FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_deal_notes_update_own_business"
  ON manager_deal_notes FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Manager Action Items RLS
CREATE POLICY "manager_action_items_select_own_business"
  ON manager_action_items FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_action_items_insert_own_business"
  ON manager_action_items FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_action_items_update_own_business"
  ON manager_action_items FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Escalation Log RLS
CREATE POLICY "escalation_log_select_own_business"
  ON escalation_log FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "escalation_log_insert_own_business"
  ON escalation_log FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Manager Notifications RLS
CREATE POLICY "manager_notifications_select_own"
  ON manager_notifications FOR SELECT
  USING (manager_id IN (SELECT id FROM manager_profiles WHERE user_id = auth.uid()));

CREATE POLICY "manager_notifications_insert_own_business"
  ON manager_notifications FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "manager_notifications_update_own"
  ON manager_notifications FOR UPDATE
  USING (manager_id IN (SELECT id FROM manager_profiles WHERE user_id = auth.uid()));

-- AI Confidence Factors RLS
CREATE POLICY "ai_confidence_factors_select_own_business"
  ON ai_confidence_factors FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "ai_confidence_factors_insert_own_business"
  ON ai_confidence_factors FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- ═════════════════════════════════════════════════════════════════════════════
-- 10. TRIGGERS FOR TIMESTAMPS
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER manager_deal_notes_update_timestamp
BEFORE UPDATE ON manager_deal_notes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER manager_action_items_update_timestamp
BEFORE UPDATE ON manager_action_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER ai_email_suggestions_update_timestamp
BEFORE UPDATE ON ai_email_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER escalation_log_update_timestamp
BEFORE UPDATE ON escalation_log
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ═════════════════════════════════════════════════════════════════════════════
-- 11. HELPER FUNCTIONS
-- ═════════════════════════════════════════════════════════════════════════════

-- Get pending action items for a manager
CREATE OR REPLACE FUNCTION get_manager_pending_actions(p_manager_id UUID)
RETURNS TABLE (
  id UUID,
  deal_id UUID,
  action_type TEXT,
  title TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  priority TEXT,
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mai.id,
    mai.deal_id,
    mai.action_type,
    mai.title,
    mai.due_at,
    mai.priority,
    EXTRACT(DAY FROM (mai.due_at - NOW()))::INTEGER
  FROM manager_action_items mai
  WHERE mai.manager_id = p_manager_id
    AND mai.status IN ('pending', 'in_progress')
  ORDER BY mai.due_at ASC, mai.priority DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get manager focus deals by type
CREATE OR REPLACE FUNCTION get_manager_focus_deals(
  p_manager_id UUID,
  p_focus_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  deal_id UUID,
  focus_type TEXT,
  reason TEXT,
  ai_confidence DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mfd.id,
    mfd.deal_id,
    mfd.focus_type,
    mfd.reason,
    mfd.ai_confidence,
    mfd.status
  FROM manager_focus_deals mfd
  WHERE mfd.manager_id = p_manager_id
    AND mfd.status = 'active'
    AND (p_focus_type IS NULL OR mfd.focus_type = p_focus_type)
  ORDER BY mfd.ai_confidence DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═════════════════════════════════════════════════════════════════════════════
-- End of Phase 7: AI + Manager Layer - CHECKPOINT 1
-- ═════════════════════════════════════════════════════════════════════════════
