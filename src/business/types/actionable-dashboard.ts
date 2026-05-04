/**
 * Layer 5: Actionable Dashboard Types
 * Metrics, insights, and recommendations for business owners
 */

// Pipeline Metrics
export interface PipelineMetric {
  id: string;
  business_id: string;
  pipeline_id: string;
  metric_date: string;

  // Conversion metrics
  total_entities: number;
  converted_entities: number;
  conversion_rate: number;

  // Time metrics
  avg_time_in_pipeline: number; // days
  avg_time_in_stage: Record<string, number>; // stage_id: days

  // Velocity metrics
  entities_added_this_week: number;
  entities_converted_this_week: number;

  // Value metrics
  total_pipeline_value: number;
  avg_deal_value: number;

  created_at: string;
  updated_at: string;
}

// Smart Recommendations
export interface SmartRecommendation {
  id: string;
  business_id: string;

  recommendation_type: 'bottleneck' | 'performance' | 'automation' | 'campaign';
  title: string;
  description: string;

  // Impact scoring
  impact_score: number; // 0-100
  estimated_benefit: string;

  // Call-to-action
  action_type: 'create_automation' | 'update_email' | 'start_campaign' | 'assign_manager';
  action_url: string;
  action_params: Record<string, any>;

  // Tracking
  dismissed_at: string | null;
  actioned_at: string | null;
  created_at: string;
}

// Dashboard Insights
export interface DashboardInsight {
  id: string;
  business_id: string;

  insight_type: 'bottleneck' | 'performance' | 'alert' | 'celebration';
  insight_category: 'pipeline' | 'email' | 'automation' | 'team';

  title: string;
  description: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;

  severity: 'high' | 'medium' | 'low' | 'success';
  actionable: boolean;
  action_label?: string;
  action_url?: string;

  // Performance comparison
  vs_previous_period: number; // percentage change
  vs_industry_avg: number;

  created_at: string;
  expires_at: string | null;
}

// Performance Goals
export interface PerformanceGoal {
  id: string;
  business_id: string;

  metric_name: string;
  target_value: number;
  current_value: number;

  period: 'weekly' | 'monthly' | 'quarterly';
  start_date: string;
  end_date: string;

  status: 'on_track' | 'behind' | 'beating';

  created_at: string;
  updated_at: string;
}

// Bottleneck Analysis
export interface StageBottleneck {
  id: string;
  business_id: string;
  pipeline_id: string;
  stage_id: string;

  // Metrics
  total_entities: number;
  entities_advancing: number;
  entities_stuck: number;
  avg_days_in_stage: number;
  conversion_to_next_stage: number; // percentage

  // Comparison
  avg_days_vs_historical: number;
  conversion_vs_goal: number; // percentage difference

  calculated_date: string;
}

// Dashboard Summary (aggregated for display)
export interface DashboardSummary {
  metrics: PipelineMetric[];
  insights: DashboardInsight[];
  recommendations: SmartRecommendation[];
  goals: PerformanceGoal[];
  bottlenecks: StageBottleneck[];
  top_opportunities: Array<{
    title: string;
    impact: number;
    action: string;
  }>;
}

// Query Filters
export interface MetricsFilter {
  pipeline_id?: string;
  start_date?: string;
  end_date?: string;
  metric_type?: 'conversion' | 'velocity' | 'value' | 'time';
}

export interface InsightFilter {
  insight_type?: DashboardInsight['insight_type'];
  severity?: DashboardInsight['severity'];
  actionable_only?: boolean;
}
