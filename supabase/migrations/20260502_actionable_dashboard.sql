-- Layer 5: Actionable Dashboard Tables
-- Metrics and Recommendations for intelligent insights

-- Dashboard Daily Metrics
CREATE TABLE IF NOT EXISTS dashboard_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES business_pipelines(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,

  total_entities INT DEFAULT 0,
  converted_entities INT DEFAULT 0,
  conversion_rate DECIMAL(5,2),

  avg_time_in_pipeline INT,
  avg_time_in_stage JSONB,

  entities_added_this_week INT,
  entities_converted_this_week INT,

  total_pipeline_value DECIMAL(15,2),
  avg_deal_value DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, pipeline_id, metric_date)
);

-- Smart Recommendations
CREATE TABLE IF NOT EXISTS smart_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  recommendation_type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,

  impact_score INT,
  estimated_benefit VARCHAR(255),

  action_type VARCHAR(100),
  action_url VARCHAR(500),
  action_params JSONB,

  dismissed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (business_id, created_at)
);

-- Enable RLS
ALTER TABLE dashboard_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_daily_metrics
CREATE POLICY "Users can view own business metrics"
  ON dashboard_daily_metrics FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Business owner can manage metrics"
  ON dashboard_daily_metrics FOR ALL
  USING (business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));

-- RLS Policies for smart_recommendations
CREATE POLICY "Users can view own business recommendations"
  ON smart_recommendations FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Business owner can manage recommendations"
  ON smart_recommendations FOR ALL
  USING (business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_business ON dashboard_daily_metrics(business_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_business ON smart_recommendations(business_id, created_at);
