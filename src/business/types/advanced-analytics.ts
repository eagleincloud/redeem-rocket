/**
 * Layer C: Advanced Analytics Types
 * Trends, forecasts, and predictive analytics
 */

// Trend Data Point
export interface TrendDataPoint {
  date: string;
  value: number;
  metric_name: string;
}

// Trend Analysis
export interface TrendAnalysis {
  metric_name: string;
  period: 'weekly' | 'monthly' | 'quarterly';

  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';

  min_value: number;
  max_value: number;
  average_value: number;

  data_points: TrendDataPoint[];
  forecast_points?: TrendDataPoint[];

  insights: string[];
}

// Forecast
export interface Forecast {
  metric_name: string;
  forecast_date: string;

  predicted_value: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  confidence_score: number; // 0-100

  method: 'linear_regression' | 'exponential_smoothing' | 'arima' | 'prophet';

  created_at: string;
}

// Revenue Forecast
export interface RevenueForecast {
  business_id: string;
  forecast_date: string;
  period: 'weekly' | 'monthly' | 'quarterly';

  predicted_revenue: number;
  confidence_low: number;
  confidence_high: number;

  by_pipeline: Array<{
    pipeline_id: string;
    pipeline_name: string;
    predicted_revenue: number;
  }>;

  created_at: string;
}

// Deal Probability Scoring
export interface DealProbability {
  lead_id: string;
  business_id: string;

  close_probability: number; // 0-100
  days_to_close: number;
  expected_value: number;

  factors: Array<{
    factor_name: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;

  calculated_at: string;
}

// Cohort Analysis
export interface CohortAnalysis {
  cohort_name: string; // e.g., "Jan 2024 Signups"
  period_start: string;
  period_end: string;

  size: number; // Number of leads in cohort
  retention_by_week: Record<string, number>; // week_0: 100%, week_1: 85%, etc.

  metrics: {
    avg_deal_value: number;
    conversion_rate: number;
    avg_days_to_close: number;
  };
}

// Funnel Analysis
export interface FunnelAnalysis {
  pipeline_id: string;
  pipeline_name: string;

  stages: Array<{
    stage_id: string;
    stage_name: string;
    count: number;
    percentage_of_total: number;
    conversion_to_next: number; // percentage
  }>;

  overall_conversion: number;
  bottleneck_stage: string;

  calculated_at: string;
}

// Attribution Analysis (which channels generate value)
export interface AttributionAnalysis {
  metric_name: string;

  by_source: Array<{
    source: string;
    leads: number;
    conversions: number;
    conversion_rate: number;
    total_value: number;
    avg_deal_value: number;
  }>;

  by_pipeline: Array<{
    pipeline_name: string;
    leads: number;
    conversions: number;
    revenue: number;
  }>;

  period: 'weekly' | 'monthly' | 'quarterly';
  calculated_at: string;
}

// Churn Prediction
export interface ChurnPrediction {
  lead_id: string;
  business_id: string;

  churn_probability: number; // 0-100
  risk_level: 'high' | 'medium' | 'low';

  risk_factors: Array<{
    factor: string;
    weight: number;
  }>;

  predicted_churn_date?: string;
  recommended_action?: string;

  calculated_at: string;
}

// Segment Analysis (customer segments with different behaviors)
export interface SegmentAnalysis {
  segment_name: string;
  segment_id: string;

  size: number; // Number of leads
  avg_deal_value: number;
  conversion_rate: number;

  characteristics: {
    industry?: string;
    company_size?: string;
    location?: string;
    source?: string;
  };

  ltv: number; // Lifetime value
  cac: number; // Cost of acquisition

  created_at: string;
}
