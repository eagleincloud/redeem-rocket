-- Layer C: Advanced Analytics Tables
-- Purpose: Trends, forecasts, and predictive analytics

-- Table: trend_analysis
-- Stores metric trends over time periods
CREATE TABLE trend_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  metric_name VARCHAR(255) NOT NULL,
  period VARCHAR(50) NOT NULL, -- 'weekly' | 'monthly' | 'quarterly'

  -- Current vs Previous Metrics
  current_value NUMERIC NOT NULL,
  previous_value NUMERIC NOT NULL,
  change_percentage NUMERIC,
  trend_direction VARCHAR(20) NOT NULL, -- 'up' | 'down' | 'stable'

  -- Range Metrics
  min_value NUMERIC NOT NULL,
  max_value NUMERIC NOT NULL,
  average_value NUMERIC NOT NULL,

  -- Data Points (JSONB array)
  data_points JSONB NOT NULL, -- [{date, value, metric_name}]
  forecast_points JSONB, -- [{date, value, metric_name}]

  -- Insights
  insights JSONB, -- Array of insight strings

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_metric (business_id, metric_name),
  INDEX idx_business_created (business_id, created_at DESC),
  UNIQUE(business_id, metric_name, period)
);

-- Table: forecasts
-- ML-powered predictions for metrics
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  metric_name VARCHAR(255) NOT NULL,
  forecast_date DATE NOT NULL,

  -- Prediction with confidence intervals
  predicted_value NUMERIC NOT NULL,
  confidence_interval_low NUMERIC NOT NULL,
  confidence_interval_high NUMERIC NOT NULL,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Method used
  method VARCHAR(100) NOT NULL, -- 'linear_regression' | 'exponential_smoothing' | 'arima' | 'prophet'

  -- Actual value (filled in after forecast date passes)
  actual_value NUMERIC,
  accuracy NUMERIC, -- Deviation from prediction

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_date (business_id, forecast_date),
  INDEX idx_business_metric (business_id, metric_name),
  UNIQUE(business_id, metric_name, forecast_date, method)
);

-- Table: revenue_forecasts
-- Revenue predictions by pipeline
CREATE TABLE revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  forecast_date DATE NOT NULL,
  period VARCHAR(50) NOT NULL, -- 'weekly' | 'monthly' | 'quarterly'

  -- Revenue prediction
  predicted_revenue NUMERIC NOT NULL,
  confidence_low NUMERIC NOT NULL,
  confidence_high NUMERIC NOT NULL,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- By pipeline breakdown
  by_pipeline JSONB NOT NULL, -- [{pipeline_id, pipeline_name, predicted_revenue}]

  -- Actuals (filled in after period ends)
  actual_revenue NUMERIC,
  variance NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_date (business_id, forecast_date),
  INDEX idx_business_period (business_id, period),
  UNIQUE(business_id, forecast_date, period)
);

-- Table: deal_probability_scores
-- Lead-specific close probability
CREATE TABLE deal_probability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,

  -- Probability scoring
  close_probability INT CHECK (close_probability >= 0 AND close_probability <= 100),
  days_to_close INT,
  expected_value NUMERIC,

  -- Contributing factors
  factors JSONB NOT NULL, -- [{factor_name, weight, impact: 'positive'|'negative'|'neutral'}]

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_lead (business_id, lead_id),
  INDEX idx_business_probability (business_id, close_probability DESC),
  UNIQUE(business_id, lead_id)
);

-- Table: cohort_analysis
-- Customer cohort retention and metrics
CREATE TABLE cohort_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  cohort_name VARCHAR(255) NOT NULL, -- e.g., "Jan 2024 Signups"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Cohort size
  size INT NOT NULL, -- Number of leads in cohort

  -- Retention by period
  retention_by_period JSONB NOT NULL, -- {week_0: 100, week_1: 85, ...}

  -- Aggregated metrics
  metrics JSONB NOT NULL, -- {avg_deal_value, conversion_rate, avg_days_to_close}

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_cohort (business_id, cohort_name),
  INDEX idx_business_dates (business_id, period_start, period_end),
  UNIQUE(business_id, cohort_name)
);

-- Table: funnel_analysis
-- Pipeline stage conversion funnel
CREATE TABLE funnel_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES business_pipelines(id) ON DELETE CASCADE NOT NULL,

  -- Stage breakdown
  stages JSONB NOT NULL, -- [{stage_id, stage_name, count, percentage_of_total, conversion_to_next}]

  -- Overall metrics
  overall_conversion NUMERIC,
  bottleneck_stage VARCHAR(255), -- Stage with lowest conversion

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_pipeline (business_id, pipeline_id),
  INDEX idx_business_created (business_id, calculated_at DESC),
  UNIQUE(business_id, pipeline_id)
);

-- Table: attribution_analysis
-- Which channels/sources generate value
CREATE TABLE attribution_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  metric_name VARCHAR(255) NOT NULL,

  -- Attribution by source
  by_source JSONB NOT NULL, -- [{source, leads, conversions, conversion_rate, total_value, avg_deal_value}]

  -- Attribution by pipeline
  by_pipeline JSONB NOT NULL, -- [{pipeline_name, leads, conversions, revenue}]

  period VARCHAR(50) NOT NULL, -- 'weekly' | 'monthly' | 'quarterly'
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_metric (business_id, metric_name),
  INDEX idx_business_period (business_id, period),
  UNIQUE(business_id, metric_name, period)
);

-- Table: churn_prediction
-- Predict which customers/leads will churn
CREATE TABLE churn_prediction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,

  -- Churn risk
  churn_probability INT CHECK (churn_probability >= 0 AND churn_probability <= 100),
  risk_level VARCHAR(20) NOT NULL, -- 'high' | 'medium' | 'low'

  -- Contributing factors
  risk_factors JSONB NOT NULL, -- [{factor, weight}]

  -- Predictions
  predicted_churn_date DATE,
  recommended_action TEXT,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_lead (business_id, lead_id),
  INDEX idx_business_risk (business_id, risk_level),
  UNIQUE(business_id, lead_id)
);

-- Table: segment_analysis
-- Customer segments with different behaviors
CREATE TABLE segment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  segment_name VARCHAR(255) NOT NULL,
  segment_id VARCHAR(255) NOT NULL,

  -- Segment metrics
  size INT NOT NULL, -- Number of leads
  avg_deal_value NUMERIC,
  conversion_rate NUMERIC,

  -- Segment characteristics
  characteristics JSONB, -- {industry, company_size, location, source}

  -- Business metrics
  ltv NUMERIC, -- Lifetime value
  cac NUMERIC, -- Cost of acquisition

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_business_segment (business_id, segment_id),
  INDEX idx_business_created (business_id, created_at DESC),
  UNIQUE(business_id, segment_id)
);

-- RLS Policies
ALTER TABLE trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_probability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_prediction ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_analysis ENABLE ROW LEVEL SECURITY;

-- RLS: trend_analysis
CREATE POLICY "Users can view trend data for their business"
  ON trend_analysis FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert trend analysis"
  ON trend_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update trend analysis"
  ON trend_analysis FOR UPDATE
  USING (true);

-- RLS: forecasts
CREATE POLICY "Users can view forecasts for their business"
  ON forecasts FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage forecasts"
  ON forecasts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update forecasts"
  ON forecasts FOR UPDATE
  USING (true);

-- RLS: revenue_forecasts
CREATE POLICY "Users can view revenue forecasts for their business"
  ON revenue_forecasts FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage revenue forecasts"
  ON revenue_forecasts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update revenue forecasts"
  ON revenue_forecasts FOR UPDATE
  USING (true);

-- RLS: deal_probability_scores
CREATE POLICY "Users can view deal scores for their business"
  ON deal_probability_scores FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage deal scores"
  ON deal_probability_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update deal scores"
  ON deal_probability_scores FOR UPDATE
  USING (true);

-- RLS: cohort_analysis
CREATE POLICY "Users can view cohort analysis for their business"
  ON cohort_analysis FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage cohort analysis"
  ON cohort_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update cohort analysis"
  ON cohort_analysis FOR UPDATE
  USING (true);

-- RLS: funnel_analysis
CREATE POLICY "Users can view funnel analysis for their business"
  ON funnel_analysis FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage funnel analysis"
  ON funnel_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update funnel analysis"
  ON funnel_analysis FOR UPDATE
  USING (true);

-- RLS: attribution_analysis
CREATE POLICY "Users can view attribution analysis for their business"
  ON attribution_analysis FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage attribution analysis"
  ON attribution_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update attribution analysis"
  ON attribution_analysis FOR UPDATE
  USING (true);

-- RLS: churn_prediction
CREATE POLICY "Users can view churn predictions for their business"
  ON churn_prediction FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage churn predictions"
  ON churn_prediction FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update churn predictions"
  ON churn_prediction FOR UPDATE
  USING (true);

-- RLS: segment_analysis
CREATE POLICY "Users can view segment analysis for their business"
  ON segment_analysis FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage segment analysis"
  ON segment_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update segment analysis"
  ON segment_analysis FOR UPDATE
  USING (true);
