-- Phase 4: Actionable Dashboard Schema
-- AI-powered insights, anomaly detection, forecasting, and recommendations
-- Created: 2026-04-25

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DASHBOARD METRICS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES business_pipelines(id) ON DELETE CASCADE,

  -- Metric identification
  metric_type varchar(50) NOT NULL CHECK (metric_type IN (
    'conversion_rate', 'avg_deal_size', 'pipeline_value', 'sales_velocity',
    'win_loss_rate', 'response_rate', 'follow_up_rate', 'team_performance',
    'forecast_accuracy', 'activity_rate', 'lead_quality_score'
  )),
  metric_key varchar(100) NOT NULL,
  metric_label varchar(255) NOT NULL,

  -- Metric values
  current_value numeric(15, 4) NOT NULL,
  previous_value numeric(15, 4),
  target_value numeric(15, 4),
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,

  -- Metadata
  unit varchar(20) DEFAULT 'count',
  trend varchar(20) DEFAULT 'neutral' CHECK (trend IN ('up', 'down', 'neutral')),
  trend_percentage numeric(5, 2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_metric_period UNIQUE(business_id, metric_type, period_start_date, period_end_date)
);

CREATE INDEX idx_dashboard_metrics_business_id ON dashboard_metrics(business_id);
CREATE INDEX idx_dashboard_metrics_type ON dashboard_metrics(business_id, metric_type);
CREATE INDEX idx_dashboard_metrics_period ON dashboard_metrics(period_start_date, period_end_date);
CREATE INDEX idx_dashboard_metrics_updated ON dashboard_metrics(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. DASHBOARD INSIGHTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES business_pipelines(id) ON DELETE CASCADE,

  -- Insight content
  insight_type varchar(50) NOT NULL CHECK (insight_type IN (
    'bottleneck', 'performance', 'forecast', 'anomaly', 'trend', 'health', 'recommendation'
  )),
  title varchar(255) NOT NULL,
  description text NOT NULL,
  impact_score numeric(3, 2) CHECK (impact_score >= 0 AND impact_score <= 1),

  -- Insight data
  data jsonb DEFAULT '{}',
  root_cause text,
  supporting_metrics jsonb DEFAULT '{}',
  historical_context jsonb DEFAULT '{}',

  -- Generation metadata
  ai_generated boolean DEFAULT false,
  ai_model varchar(50),
  confidence_score numeric(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- User interaction
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  dismissed_by uuid REFERENCES biz_users(id),
  action_taken boolean DEFAULT false,
  action_taken_at timestamptz,
  action_details jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_confidence CHECK (ai_generated = false OR confidence_score IS NOT NULL)
);

CREATE INDEX idx_dashboard_insights_business_id ON dashboard_insights(business_id);
CREATE INDEX idx_dashboard_insights_type ON dashboard_insights(business_id, insight_type);
CREATE INDEX idx_dashboard_insights_dismissed ON dashboard_insights(dismissed, dismissed_at);
CREATE INDEX idx_dashboard_insights_impact ON dashboard_insights(impact_score DESC);
CREATE INDEX idx_dashboard_insights_created ON dashboard_insights(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RECOMMENDATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  insight_id uuid REFERENCES dashboard_insights(id) ON DELETE CASCADE,

  -- Recommendation content
  title varchar(255) NOT NULL,
  description text NOT NULL,
  action_type varchar(50) NOT NULL CHECK (action_type IN (
    'follow_up_call', 'send_email', 'reassign_lead', 're_qualify',
    'create_task', 'adjust_strategy', 'update_timeline', 'investigate'
  )),

  -- Priority & impact
  priority varchar(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  expected_impact varchar(255),
  effort_level varchar(20) CHECK (effort_level IN ('trivial', 'low', 'medium', 'high')),

  -- AI metadata
  confidence_score numeric(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning text,

  -- Action tracking
  status varchar(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'rejected', 'implemented', 'archived')),
  implemented_at timestamptz,
  implemented_by uuid REFERENCES biz_users(id),
  feedback_score integer CHECK (feedback_score IS NULL OR (feedback_score >= 1 AND feedback_score <= 5)),
  feedback_comment text,

  -- Implementation details
  related_entities uuid[] DEFAULT ARRAY[]::uuid[],
  parameters jsonb DEFAULT '{}',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_implementation CHECK (status != 'implemented' OR implemented_at IS NOT NULL)
);

CREATE INDEX idx_dashboard_recommendations_business_id ON dashboard_recommendations(business_id);
CREATE INDEX idx_dashboard_recommendations_insight ON dashboard_recommendations(insight_id);
CREATE INDEX idx_dashboard_recommendations_status ON dashboard_recommendations(status);
CREATE INDEX idx_dashboard_recommendations_priority ON dashboard_recommendations(priority);
CREATE INDEX idx_dashboard_recommendations_confidence ON dashboard_recommendations(confidence_score DESC);
CREATE INDEX idx_dashboard_recommendations_created ON dashboard_recommendations(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ANOMALIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Anomaly identification
  anomaly_type varchar(50) NOT NULL CHECK (anomaly_type IN (
    'unusual_activity', 'performance_drop', 'spike', 'data_quality',
    'pattern_break', 'threshold_breach'
  )),
  affected_metric varchar(100) NOT NULL,
  affected_entities uuid[] DEFAULT ARRAY[]::uuid[],

  -- Anomaly details
  description text NOT NULL,
  severity varchar(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  baseline_value numeric(15, 4),
  detected_value numeric(15, 4),
  deviation_percentage numeric(5, 2),

  -- Detection metadata
  detection_method varchar(50) DEFAULT 'statistical',
  standard_deviations numeric(5, 2),
  confidence_score numeric(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  likely_causes text[] DEFAULT ARRAY[]::text[],

  -- Resolution
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES biz_users(id),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolution_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_resolution CHECK (resolved = false OR resolved_at IS NOT NULL)
);

CREATE INDEX idx_dashboard_anomalies_business_id ON dashboard_anomalies(business_id);
CREATE INDEX idx_dashboard_anomalies_severity ON dashboard_anomalies(severity);
CREATE INDEX idx_dashboard_anomalies_acknowledged ON dashboard_anomalies(acknowledged);
CREATE INDEX idx_dashboard_anomalies_resolved ON dashboard_anomalies(resolved);
CREATE INDEX idx_dashboard_anomalies_created ON dashboard_anomalies(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FORECASTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES business_pipelines(id) ON DELETE CASCADE,

  -- Forecast metadata
  forecast_type varchar(50) NOT NULL CHECK (forecast_type IN (
    'revenue', 'deals_closed', 'conversion_rate', 'pipeline_value', 'velocity'
  )),
  forecast_period varchar(20) DEFAULT 'month' CHECK (forecast_period IN ('week', 'month', 'quarter', 'year')),

  -- Forecast window
  forecast_start_date date NOT NULL,
  forecast_end_date date NOT NULL,
  generated_at timestamptz NOT NULL,

  -- Forecast values
  predicted_value numeric(15, 4) NOT NULL,
  lower_bound numeric(15, 4),
  upper_bound numeric(15, 4),
  confidence_level numeric(3, 2) CHECK (confidence_level >= 0 AND confidence_level <= 1),

  -- Model info
  model_type varchar(50) DEFAULT 'exponential_smoothing',
  training_data_points integer,
  model_accuracy numeric(3, 2),

  -- Actual values (populated after forecast period ends)
  actual_value numeric(15, 4),
  actual_recorded_at timestamptz,
  accuracy_error numeric(5, 2),

  -- Factors affecting forecast
  key_factors jsonb DEFAULT '{}',
  assumptions text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_bounds CHECK (predicted_value >= lower_bound OR lower_bound IS NULL)
);

CREATE INDEX idx_dashboard_forecasts_business_id ON dashboard_forecasts(business_id);
CREATE INDEX idx_dashboard_forecasts_type ON dashboard_forecasts(forecast_type);
CREATE INDEX idx_dashboard_forecasts_window ON dashboard_forecasts(forecast_start_date, forecast_end_date);
CREATE INDEX idx_dashboard_forecasts_confidence ON dashboard_forecasts(confidence_level DESC);
CREATE INDEX idx_dashboard_forecasts_created ON dashboard_forecasts(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. DASHBOARD EVENTS TABLE (Audit trail for insights/recommendations)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Event metadata
  event_type varchar(50) NOT NULL CHECK (event_type IN (
    'insight_generated', 'insight_dismissed', 'recommendation_suggested',
    'recommendation_implemented', 'anomaly_detected', 'forecast_generated',
    'metric_updated', 'alert_triggered'
  )),

  -- Reference data
  insight_id uuid REFERENCES dashboard_insights(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES dashboard_recommendations(id) ON DELETE SET NULL,
  anomaly_id uuid REFERENCES dashboard_anomalies(id) ON DELETE SET NULL,
  forecast_id uuid REFERENCES dashboard_forecasts(id) ON DELETE SET NULL,

  -- Event details
  user_id uuid REFERENCES biz_users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dashboard_events_business_id ON dashboard_events(business_id);
CREATE INDEX idx_dashboard_events_type ON dashboard_events(event_type);
CREATE INDEX idx_dashboard_events_insight ON dashboard_events(insight_id);
CREATE INDEX idx_dashboard_events_recommendation ON dashboard_events(recommendation_id);
CREATE INDEX idx_dashboard_events_created ON dashboard_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. INSIGHT LOGS TABLE (Detailed logging for debugging)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_insight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  insight_id uuid REFERENCES dashboard_insights(id) ON DELETE SET NULL,

  -- Log details
  log_level varchar(20) CHECK (log_level IN ('debug', 'info', 'warning', 'error')),
  message text NOT NULL,
  context jsonb DEFAULT '{}',

  -- Error tracking
  error_type varchar(100),
  error_stack text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dashboard_insight_logs_business_id ON dashboard_insight_logs(business_id);
CREATE INDEX idx_dashboard_insight_logs_insight ON dashboard_insight_logs(insight_id);
CREATE INDEX idx_dashboard_insight_logs_level ON dashboard_insight_logs(log_level);
CREATE INDEX idx_dashboard_insight_logs_created ON dashboard_insight_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ALERT CONFIGURATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dashboard_alert_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Alert configuration
  alert_name varchar(255) NOT NULL,
  alert_type varchar(50) NOT NULL CHECK (alert_type IN (
    'anomaly', 'performance_drop', 'threshold_breach', 'forecast_warning',
    'bottleneck', 'quality_issue', 'activity_drop'
  )),

  -- Trigger conditions
  metric_type varchar(100) NOT NULL,
  trigger_condition varchar(50) CHECK (trigger_condition IN (
    'above_threshold', 'below_threshold', 'equals', 'deviates_by_percent', 'deviates_by_std_dev'
  )),
  threshold_value numeric(15, 4),
  deviation_percent numeric(5, 2),
  std_dev_count numeric(5, 2),

  -- Alert severity
  severity varchar(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Notification settings
  notify_users uuid[] DEFAULT ARRAY[]::uuid[],
  notification_methods text[] DEFAULT ARRAY[]::text[],
  enable_email_notifications boolean DEFAULT true,
  enable_in_app_notifications boolean DEFAULT true,

  -- Configuration
  enabled boolean DEFAULT true,
  description text,
  created_by uuid REFERENCES biz_users(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_alert_name UNIQUE(business_id, alert_name)
);

CREATE INDEX idx_dashboard_alert_configurations_business_id ON dashboard_alert_configurations(business_id);
CREATE INDEX idx_dashboard_alert_configurations_type ON dashboard_alert_configurations(alert_type);
CREATE INDEX idx_dashboard_alert_configurations_enabled ON dashboard_alert_configurations(enabled);

-- ═══════════════════════════════════════════════════════════════════════════
-- MATERIALIZED VIEWS FOR EXPENSIVE CALCULATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Recent active insights for dashboard home
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_recent_active_insights AS
SELECT
  i.id,
  i.business_id,
  i.insight_type,
  i.title,
  i.description,
  i.impact_score,
  i.confidence_score,
  i.created_at,
  COUNT(r.id) as recommendation_count
FROM dashboard_insights i
LEFT JOIN dashboard_recommendations r ON r.insight_id = i.id AND r.status != 'archived'
WHERE i.dismissed = false
GROUP BY i.id, i.business_id, i.insight_type, i.title, i.description, i.impact_score, i.confidence_score, i.created_at
ORDER BY i.created_at DESC;

CREATE UNIQUE INDEX idx_mv_recent_insights_business ON mv_recent_active_insights(business_id);

-- View: Metric summary by business
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_business_metric_summary AS
SELECT
  business_id,
  metric_type,
  COUNT(*) as metric_count,
  AVG(current_value) as avg_value,
  MAX(current_value) as max_value,
  MIN(current_value) as min_value,
  MAX(updated_at) as last_updated
FROM dashboard_metrics
GROUP BY business_id, metric_type;

CREATE UNIQUE INDEX idx_mv_metric_summary_business_type ON mv_business_metric_summary(business_id, metric_type);

-- View: High-impact recommendations pending action
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pending_high_impact_recommendations AS
SELECT
  r.id,
  r.business_id,
  r.insight_id,
  r.title,
  r.priority,
  r.expected_impact,
  r.confidence_score,
  r.created_at,
  CASE
    WHEN r.priority = 'critical' THEN 1
    WHEN r.priority = 'high' THEN 2
    WHEN r.priority = 'medium' THEN 3
    ELSE 4
  END as priority_order
FROM dashboard_recommendations r
WHERE r.status = 'suggested'
  AND r.priority IN ('high', 'critical')
ORDER BY priority_order, r.created_at DESC;

CREATE UNIQUE INDEX idx_mv_pending_recommendations_business ON mv_pending_high_impact_recommendations(business_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS FOR METRIC CALCULATION & ANOMALY DETECTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Calculate conversion rate for a pipeline
CREATE OR REPLACE FUNCTION calculate_pipeline_conversion_rate(
  p_pipeline_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS numeric AS $$
DECLARE
  v_total_entities integer;
  v_won_entities integer;
  v_conversion_rate numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_entities
  FROM pipeline_entities
  WHERE pipeline_id = p_pipeline_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;

  SELECT COUNT(*) INTO v_won_entities
  FROM pipeline_entities
  WHERE pipeline_id = p_pipeline_id
    AND status = 'won'
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;

  IF v_total_entities = 0 THEN
    RETURN 0;
  END IF;

  v_conversion_rate := (v_won_entities::numeric / v_total_entities::numeric) * 100;
  RETURN ROUND(v_conversion_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate average deal size
CREATE OR REPLACE FUNCTION calculate_avg_deal_size(
  p_pipeline_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    ROUND(
      AVG(value),
      2
    ),
    0
  )
  FROM pipeline_entities
  WHERE pipeline_id = p_pipeline_id
    AND value IS NOT NULL
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Detect anomalies using statistical methods
CREATE OR REPLACE FUNCTION detect_metric_anomalies(
  p_business_id uuid,
  p_metric_type varchar,
  p_std_dev_threshold numeric DEFAULT 2.0
)
RETURNS TABLE (
  metric_key varchar,
  current_value numeric,
  baseline_value numeric,
  std_devs numeric,
  is_anomaly boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH metric_stats AS (
    SELECT
      metric_key,
      current_value,
      AVG(current_value) OVER (PARTITION BY metric_key) as avg_value,
      STDDEV(current_value) OVER (PARTITION BY metric_key) as std_value
    FROM dashboard_metrics
    WHERE business_id = p_business_id
      AND metric_type = p_metric_type
      AND created_at >= now() - interval '90 days'
  )
  SELECT
    ms.metric_key,
    ms.current_value,
    ms.avg_value::numeric,
    CASE
      WHEN ms.std_value = 0 THEN 0
      ELSE ABS(ms.current_value - ms.avg_value) / ms.std_value
    END as std_devs,
    CASE
      WHEN ms.std_value = 0 THEN false
      ELSE ABS(ms.current_value - ms.avg_value) / ms.std_value >= p_std_dev_threshold
    END as is_anomaly
  FROM metric_stats ms;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Generate forecast using simple exponential smoothing
CREATE OR REPLACE FUNCTION forecast_metric_value(
  p_metric_type varchar,
  p_business_id uuid,
  p_periods_ahead integer,
  p_alpha numeric DEFAULT 0.3
)
RETURNS TABLE (
  forecast_date date,
  predicted_value numeric,
  forecast_confidence numeric
) AS $$
DECLARE
  v_last_value numeric;
  v_smoothed_value numeric;
  v_history_count integer;
  v_forecast_value numeric;
  i integer;
BEGIN
  -- Get historical data
  SELECT current_value INTO v_last_value
  FROM dashboard_metrics
  WHERE business_id = p_business_id
    AND metric_type = p_metric_type
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT COUNT(*) INTO v_history_count
  FROM dashboard_metrics
  WHERE business_id = p_business_id
    AND metric_type = p_metric_type;

  IF v_last_value IS NULL OR v_history_count < 5 THEN
    RETURN;
  END IF;

  v_smoothed_value := v_last_value;

  FOR i IN 1..p_periods_ahead LOOP
    v_forecast_value := v_smoothed_value;
    RETURN QUERY SELECT
      (CURRENT_DATE + (i || ' days')::interval)::date,
      ROUND(v_forecast_value, 2),
      LEAST(v_history_count::numeric / 100, 1.0)::numeric;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate sales velocity (days in stage)
CREATE OR REPLACE FUNCTION calculate_sales_velocity(
  p_pipeline_id uuid,
  p_days_lookback integer DEFAULT 90
)
RETURNS TABLE (
  stage_name varchar,
  avg_days_in_stage numeric,
  median_days_in_stage numeric,
  entities_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.name as stage_name,
    ROUND(AVG(
      CASE
        WHEN pe.closed_at IS NOT NULL THEN
          EXTRACT(DAY FROM (pe.closed_at - pe.entered_stage_at))
        ELSE
          EXTRACT(DAY FROM (now() - pe.entered_stage_at))
      END
    ), 1)::numeric,
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY
        CASE
          WHEN pe.closed_at IS NOT NULL THEN
            EXTRACT(DAY FROM (pe.closed_at - pe.entered_stage_at))
          ELSE
            EXTRACT(DAY FROM (now() - pe.entered_stage_at))
        END
    )::numeric,
    COUNT(*)::integer
  FROM pipeline_stages ps
  LEFT JOIN pipeline_entities pe ON pe.stage_id = ps.id
    AND pe.created_at >= now() - (p_days_lookback || ' days')::interval
  WHERE ps.pipeline_id = p_pipeline_id
  GROUP BY ps.id, ps.name, ps.order_index
  ORDER BY ps.order_index;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES (Multi-tenant isolation)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_insight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alert_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for dashboard_metrics
CREATE POLICY "Users can view their business metrics"
ON dashboard_metrics FOR SELECT
USING (business_id IN (
  SELECT id FROM biz_users WHERE id = auth.uid()
  UNION
  SELECT business_id FROM biz_users WHERE id = auth.uid()
));

CREATE POLICY "Users can insert metrics for their business"
ON dashboard_metrics FOR INSERT
WITH CHECK (business_id IN (
  SELECT id FROM biz_users WHERE id = auth.uid()
));

CREATE POLICY "Users can update their business metrics"
ON dashboard_metrics FOR UPDATE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_insights
CREATE POLICY "Users can view insights for their business"
ON dashboard_insights FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can manage insights for their business"
ON dashboard_insights FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can update insights for their business"
ON dashboard_insights FOR UPDATE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_recommendations
CREATE POLICY "Users can view recommendations for their business"
ON dashboard_recommendations FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can create recommendations for their business"
ON dashboard_recommendations FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can update recommendations for their business"
ON dashboard_recommendations FOR UPDATE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_anomalies
CREATE POLICY "Users can view anomalies for their business"
ON dashboard_anomalies FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can manage anomalies for their business"
ON dashboard_anomalies FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can update anomalies for their business"
ON dashboard_anomalies FOR UPDATE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_forecasts
CREATE POLICY "Users can view forecasts for their business"
ON dashboard_forecasts FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can create forecasts for their business"
ON dashboard_forecasts FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_events
CREATE POLICY "Users can view events for their business"
ON dashboard_events FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can create events for their business"
ON dashboard_events FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_insight_logs
CREATE POLICY "Users can view insight logs for their business"
ON dashboard_insight_logs FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- Policies for dashboard_alert_configurations
CREATE POLICY "Users can view alert configurations for their business"
ON dashboard_alert_configurations FOR SELECT
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can manage alert configurations for their business"
ON dashboard_alert_configurations FOR INSERT
WITH CHECK (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can update alert configurations for their business"
ON dashboard_alert_configurations FOR UPDATE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

CREATE POLICY "Users can delete alert configurations for their business"
ON dashboard_alert_configurations FOR DELETE
USING (business_id IN (SELECT id FROM biz_users WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- CRON JOB SETUP (for periodic metric calculations - requires pg_cron extension)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: These require pg_cron extension and Supabase support
-- Uncomment if pg_cron is available in your Supabase project

-- Refresh materialized views every 6 hours
-- SELECT cron.schedule('refresh_dashboard_insights_mv', '0 */6 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_active_insights');
-- SELECT cron.schedule('refresh_metric_summary_mv', '0 */6 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_business_metric_summary');
-- SELECT cron.schedule('refresh_recommendations_mv', '0 */4 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pending_high_impact_recommendations');

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS & DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE dashboard_metrics IS 'Cached metrics for dashboard display and analysis. Updated regularly with conversions, deal sizes, velocities, and team performance.';
COMMENT ON TABLE dashboard_insights IS 'AI-generated and system-generated insights about business performance, bottlenecks, and opportunities.';
COMMENT ON TABLE dashboard_recommendations IS 'Actionable recommendations based on insights with confidence scores and implementation tracking.';
COMMENT ON TABLE dashboard_anomalies IS 'Detected anomalies and unusual patterns in metrics and activity with severity levels.';
COMMENT ON TABLE dashboard_forecasts IS 'Predictive models for future performance with confidence intervals and accuracy tracking.';
COMMENT ON TABLE dashboard_events IS 'Audit trail for all dashboard events and user actions for analytics and debugging.';
COMMENT ON TABLE dashboard_insight_logs IS 'Detailed logging for insight generation and AI processing for troubleshooting.';
COMMENT ON TABLE dashboard_alert_configurations IS 'User-configurable alerts for anomalies and performance issues.';
