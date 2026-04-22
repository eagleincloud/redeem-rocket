-- Automation Engine Database Schema
-- Implements core tables for automation rules, conditions, actions, and execution tracking
-- Created: 2026-04-24

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUTOMATION_RULES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  
  -- Metadata
  name varchar(255) NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  
  -- Trigger configuration
  trigger_type varchar(50) NOT NULL,
  trigger_config jsonb DEFAULT '{}',
  
  -- Template support
  is_template boolean DEFAULT false,
  template_name varchar(255),
  
  -- Audit trail
  created_by uuid NOT NULL REFERENCES public.biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Statistics
  total_runs integer DEFAULT 0,
  successful_runs integer DEFAULT 0,
  failed_runs integer DEFAULT 0,
  last_run_at timestamptz,
  
  -- Display
  order_index integer,
  
  UNIQUE(business_id, name),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'lead_added', 'stage_changed', 'inactivity', 'email_opened', 'email_clicked', 'milestone_reached'
  ))
);

CREATE INDEX idx_automation_rules_business_id ON public.automation_rules(business_id);
CREATE INDEX idx_automation_rules_enabled ON public.automation_rules(enabled);
CREATE INDEX idx_automation_rules_trigger_type ON public.automation_rules(trigger_type);
CREATE INDEX idx_automation_rules_created_at ON public.automation_rules(created_at DESC);

COMMENT ON TABLE public.automation_rules IS 'Automation rules that trigger actions based on pipeline events';
COMMENT ON COLUMN public.automation_rules.trigger_config IS 'JSON configuration for trigger (e.g., stage_id, min_days for inactivity)';
COMMENT ON COLUMN public.automation_rules.is_template IS 'If true, this is a template rule that can be duplicated';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AUTOMATION_CONDITIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  
  -- Condition details
  field_name varchar(255) NOT NULL,
  operator varchar(50) NOT NULL,
  value varchar(1000),
  value_type varchar(50) DEFAULT 'string',
  
  -- Logic operators
  logic_operator varchar(10) DEFAULT 'AND',
  
  -- Nested support
  parent_id uuid REFERENCES public.automation_conditions(id) ON DELETE CASCADE,
  
  order_index integer,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_operator CHECK (operator IN (
    -- String operators
    'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'matches_regex',
    -- Numeric operators
    'greater_than', 'less_than', 'between',
    -- Empty operators
    'is_empty', 'is_not_empty',
    -- Set operators
    'in_list', 'not_in_list',
    -- Pattern operators
    'matches_pattern',
    -- Date operators
    'date_equals', 'date_after', 'date_before'
  )),
  CONSTRAINT valid_logic_operator CHECK (logic_operator IN ('AND', 'OR')),
  CONSTRAINT valid_value_type CHECK (value_type IN ('string', 'number', 'date', 'array'))
);

CREATE INDEX idx_automation_conditions_rule_id ON public.automation_conditions(rule_id);
CREATE INDEX idx_automation_conditions_field_name ON public.automation_conditions(field_name);
CREATE UNIQUE INDEX idx_automation_conditions_unique ON public.automation_conditions(rule_id, field_name, operator, COALESCE(value, ''));

COMMENT ON TABLE public.automation_conditions IS 'Conditions that must be evaluated for automation rules';
COMMENT ON COLUMN public.automation_conditions.operator IS '18 operators: equals, contains, greater_than, between, is_empty, in_list, matches_regex, date_after, etc';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUTOMATION_ACTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  
  -- Action configuration
  action_type varchar(50) NOT NULL,
  action_config jsonb NOT NULL,
  
  -- Execution control
  delay_seconds integer DEFAULT 0,
  order_index integer,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_action_type CHECK (action_type IN (
    'send_email', 'assign_user', 'add_tag', 'create_task', 'webhook', 'update_field'
  ))
);

CREATE INDEX idx_automation_actions_rule_id ON public.automation_actions(rule_id);
CREATE INDEX idx_automation_actions_action_type ON public.automation_actions(action_type);

COMMENT ON TABLE public.automation_actions IS 'Actions executed when automation rules fire';
COMMENT ON COLUMN public.automation_actions.action_config IS 'JSON configuration specific to action type (template_id, recipient, webhook_url, etc)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTOMATION_EXECUTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  
  -- Trigger context
  trigger_type varchar(50) NOT NULL,
  entity_id uuid,
  entity_type varchar(50),
  
  -- Execution details
  status varchar(50) DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  
  -- Result tracking
  result jsonb,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial_failure'))
);

CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions(rule_id);
CREATE INDEX idx_automation_executions_business_id ON public.automation_executions(business_id);
CREATE INDEX idx_automation_executions_entity_id ON public.automation_executions(entity_id);
CREATE INDEX idx_automation_executions_started_at ON public.automation_executions(started_at DESC);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);

COMMENT ON TABLE public.automation_executions IS 'Execution history and results for automation rules';
COMMENT ON COLUMN public.automation_executions.result IS 'JSON result: {trigger_passed, conditions_passed, actions_executed, actions_failed, errors}';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTOMATION_EXECUTION_LOGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  
  -- Log details
  action_id uuid REFERENCES public.automation_actions(id) ON DELETE SET NULL,
  log_type varchar(50) NOT NULL,
  message text,
  details jsonb,
  status varchar(50),
  
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_log_type CHECK (log_type IN (
    'trigger_eval', 'condition_eval', 'action_start', 'action_complete', 'action_error', 'execution_complete'
  )),
  CONSTRAINT valid_log_status CHECK (status IN ('success', 'failure', 'skipped', 'pending'))
);

CREATE INDEX idx_automation_execution_logs_execution_id ON public.automation_execution_logs(execution_id, created_at DESC);
CREATE INDEX idx_automation_execution_logs_log_type ON public.automation_execution_logs(log_type);

COMMENT ON TABLE public.automation_execution_logs IS 'Detailed logs for each automation execution';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUTOMATION_EMAIL_TEMPLATES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,
  
  -- Metadata
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  is_system boolean DEFAULT false,
  
  -- Content
  subject varchar(500) NOT NULL,
  body text NOT NULL,
  body_html text,
  
  -- Recipient configuration
  recipient_type varchar(50) DEFAULT 'lead',
  recipient_field varchar(255),
  
  -- Variables & configuration
  variables jsonb,
  include_attachments boolean DEFAULT false,
  track_opens boolean DEFAULT true,
  track_clicks boolean DEFAULT true,
  
  -- Audit
  created_by uuid NOT NULL REFERENCES public.biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(business_id, name),
  CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('lead', 'assigned_user', 'custom_email_field'))
);

CREATE INDEX idx_automation_email_templates_business_id ON public.automation_email_templates(business_id);
CREATE INDEX idx_automation_email_templates_category ON public.automation_email_templates(category);
CREATE INDEX idx_automation_email_templates_is_system ON public.automation_email_templates(is_system);

COMMENT ON TABLE public.automation_email_templates IS 'Email templates used by automation rules';
COMMENT ON COLUMN public.automation_email_templates.variables IS 'JSON schema for template variables with type and description';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_email_templates ENABLE ROW LEVEL SECURITY;

-- Automation Rules Policies
CREATE POLICY "Business owners can view their automation rules"
  ON public.automation_rules
  FOR SELECT
  USING (auth.uid()::uuid = (SELECT id FROM public.biz_users WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Business owners can create automation rules"
  ON public.automation_rules
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

CREATE POLICY "Business owners can update their automation rules"
  ON public.automation_rules
  FOR UPDATE
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

CREATE POLICY "Business owners can delete their automation rules"
  ON public.automation_rules
  FOR DELETE
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

-- Automation Conditions Policies
CREATE POLICY "Business owners can view conditions of their rules"
  ON public.automation_conditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can manage conditions of their rules"
  ON public.automation_conditions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can update conditions"
  ON public.automation_conditions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can delete conditions"
  ON public.automation_conditions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

-- Automation Actions Policies
CREATE POLICY "Business owners can view actions of their rules"
  ON public.automation_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can manage actions of their rules"
  ON public.automation_actions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can update actions"
  ON public.automation_actions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

CREATE POLICY "Business owners can delete actions"
  ON public.automation_actions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE id = rule_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

-- Automation Executions Policies
CREATE POLICY "Business owners can view execution history"
  ON public.automation_executions
  FOR SELECT
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

-- Automation Execution Logs Policies
CREATE POLICY "Business owners can view execution logs"
  ON public.automation_execution_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_executions
      WHERE id = execution_id AND auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id)
    )
  );

-- Automation Email Templates Policies
CREATE POLICY "Business owners can view their email templates"
  ON public.automation_email_templates
  FOR SELECT
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

CREATE POLICY "Business owners can create email templates"
  ON public.automation_email_templates
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

CREATE POLICY "Business owners can update their email templates"
  ON public.automation_email_templates
  FOR UPDATE
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

CREATE POLICY "Business owners can delete their email templates"
  ON public.automation_email_templates
  FOR DELETE
  USING (auth.uid()::uuid = (SELECT user_id FROM public.biz_users WHERE id = business_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. MIGRATION COMPLETION
-- ─────────────────────────────────────────────────────────────────────────────

-- Add comments for all tables
COMMENT ON COLUMN public.automation_rules.trigger_type IS 'Trigger type: lead_added, stage_changed, inactivity, email_opened, email_clicked, milestone_reached';
COMMENT ON COLUMN public.automation_conditions.operator IS '18 operators supporting string, numeric, date, empty, set, pattern matching';
COMMENT ON COLUMN public.automation_actions.action_type IS 'Action type: send_email, assign_user, add_tag, create_task, webhook, update_field';
COMMENT ON COLUMN public.automation_executions.status IS 'pending, running, completed, failed, or partial_failure';

GRANT SELECT ON public.automation_rules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT SELECT ON public.automation_conditions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.automation_conditions TO authenticated;
GRANT SELECT ON public.automation_actions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.automation_actions TO authenticated;
GRANT SELECT ON public.automation_executions TO authenticated;
GRANT SELECT ON public.automation_execution_logs TO authenticated;
GRANT SELECT ON public.automation_email_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.automation_email_templates TO authenticated;
