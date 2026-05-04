-- Layer 5: Actionable Dashboard Schema
-- Metrics, recommendations, and insights for business owners

-- Table for storing calculated pipeline metrics
CREATE TABLE IF NOT EXISTS pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES business_pipelines(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,

  -- Conversion metrics
  total_entities INT DEFAULT 0,
  converted_entities INT DEFAULT 0,
  conversion_rate DECIMAL(5,2),

  -- Time metrics
  avg_time_in_pipeline INT,
  avg_time_in_stage JSONB, -- {stage_id: days}

  -- Velocity metrics
  entities_added_this_week INT DEFAULT 0,
  entities_converted_this_week INT DEFAULT 0,

  -- Value metrics
  total_pipeline_value DECIMAL(15,2),
  avg_deal_value DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, pipeline_id, metric_date),
  INDEX (business_id, metric_date DESC),
  INDEX (pipeline_id, metric_date DESC)
);

-- Table for storing smart recommendations
CREATE TABLE IF NOT EXISTS smart_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  recommendation_type VARCHAR(100), -- 'bottleneck', 'performance', 'automation', 'campaign'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Impact scoring
  impact_score INT CHECK (impact_score >= 0 AND impact_score <= 100),
  estimated_benefit VARCHAR(255),

  -- Call-to-action
  action_type VARCHAR(100), -- 'create_automation', 'update_email', 'start_campaign'
  action_url VARCHAR(500),
  action_params JSONB,

  -- Tracking
  dismissed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (business_id, created_at DESC),
  INDEX (business_id, impact_score DESC)
);

-- Table for dashboard insights (cached data for performance)
CREATE TABLE IF NOT EXISTS dashboard_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  insight_type VARCHAR(100), -- 'bottleneck', 'performance', 'alert', 'celebration'
  insight_category VARCHAR(100), -- 'pipeline', 'email', 'automation', 'team'

  title VARCHAR(255) NOT NULL,
  description TEXT,
  metric_name VARCHAR(100),
  metric_value DECIMAL(15,2),
  metric_unit VARCHAR(50),

  severity VARCHAR(20), -- 'high', 'medium', 'low', 'success'
  actionable BOOLEAN DEFAULT false,
  action_label VARCHAR(100),
  action_url VARCHAR(500),

  -- Performance comparison
  vs_previous_period DECIMAL(5,2), -- percentage change
  vs_industry_avg DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  INDEX (business_id, created_at DESC),
  INDEX (business_id, insight_type),
  INDEX (business_id, severity)
);

-- Table for performance goals (target KPIs)
CREATE TABLE IF NOT EXISTS performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  metric_name VARCHAR(100) NOT NULL, -- 'conversion_rate', 'avg_deal_value', 'pipeline_velocity'
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2),

  period VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
  start_date DATE,
  end_date DATE,

  status VARCHAR(20), -- 'on_track', 'behind', 'beating'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, metric_name, period),
  INDEX (business_id, metric_name)
);

-- Table for bottleneck analysis (which stages lose the most deals)
CREATE TABLE IF NOT EXISTS stage_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES business_pipelines(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES business_pipeline_stages(id) ON DELETE CASCADE,

  -- Metrics
  total_entities INT DEFAULT 0,
  entities_advancing INT DEFAULT 0,
  entities_stuck INT DEFAULT 0,
  avg_days_in_stage INT,
  conversion_to_next_stage DECIMAL(5,2), -- percentage

  -- Comparison
  avg_days_vs_historical INT, -- days over/under average
  conversion_vs_goal DECIMAL(5,2), -- percentage difference from goal

  calculated_date DATE,

  INDEX (business_id, pipeline_id),
  INDEX (stage_id, calculated_date DESC)
);

-- RLS Policies for pipeline_metrics
ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business metrics"
  ON pipeline_metrics FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage metrics"
  ON pipeline_metrics FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for smart_recommendations
ALTER TABLE smart_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their recommendations"
  ON smart_recommendations FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can dismiss recommendations"
  ON smart_recommendations FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for dashboard_insights
ALTER TABLE dashboard_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their insights"
  ON dashboard_insights FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for performance_goals
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their goals"
  ON performance_goals FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for stage_bottlenecks
ALTER TABLE stage_bottlenecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bottleneck analysis"
  ON stage_bottlenecks FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_pipeline_metrics_business_date ON pipeline_metrics(business_id, metric_date DESC);
CREATE INDEX idx_smart_recommendations_business_impact ON smart_recommendations(business_id, impact_score DESC);
CREATE INDEX idx_dashboard_insights_business_severity ON dashboard_insights(business_id, severity);
CREATE INDEX idx_performance_goals_business_metric ON performance_goals(business_id, metric_name);
CREATE INDEX idx_stage_bottlenecks_pipeline ON stage_bottlenecks(pipeline_id, calculated_date DESC);
