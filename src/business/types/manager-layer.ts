/**
 * LAYER 7: Manager Portal + AI Recommendation Engine Types
 * Comprehensive types for manager dashboard, AI recommendations, and lead qualification
 */

import { Lead } from './pipeline';

// ═════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═════════════════════════════════════════════════════════════════════════════

export enum RecommendationType {
  LEAD_HEALTH = 'lead_health',
  DEAL_CLOSING = 'deal_closing',
  EMAIL_DRAFT = 'email_draft',
  COACHING_TIP = 'coaching_tip',
  PRIORITY_ACTION = 'priority_action',
}

export enum RecommendationUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RecommendationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  ACTIONED = 'actioned',
  DISMISSED = 'dismissed',
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum QualificationStage {
  UNQUALIFIED = 'unqualified',
  PROSPECT = 'prospect',
  QUALIFIED = 'qualified',
  DEMO = 'demo',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
}

// ═════════════════════════════════════════════════════════════════════════════
// AI RECOMMENDATION TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface AIRecommendation {
  id: string;
  business_id: string;
  manager_id?: string;
  lead_id?: string;

  type: RecommendationType;
  title: string;
  description: string;

  urgency: RecommendationUrgency;
  status: RecommendationStatus;
  confidence_score: number;

  suggested_action?: string;
  reasoning?: string;
  estimated_impact?: string;

  reviewed_at?: string;
  actioned_at?: string;
  dismissed_at?: string;
  manager_notes?: string;

  created_at: string;
  updated_at: string;
}

export interface EmailDraft {
  id?: string;
  lead_id: string;
  subject: string;
  body: string;
  personalized_elements: string[];
  best_send_time?: string;
  preview_url?: string;
  created_at?: string;
}

export interface LeadQualificationScore {
  lead_id: string;
  business_id: string;
  score: number;
  recommended_stage: QualificationStage;
  reasoning: string;
  next_action: string;
  confidence: ConfidenceLevel;
  fit_factors: {
    industry_match: number;
    size_match: number;
    budget_match: number;
    engagement_score: number;
    timeline_alignment: number;
  };
  similar_won_deals: string[];
  created_at: string;
}

export interface CoachingTip {
  id: string;
  manager_id: string;
  title: string;
  description: string;
  metric: string;
  current_value: number;
  team_average: number;
  improvement_suggestion: string;
  expected_impact: string;
  created_at: string;
}

export interface ClosurePrediction {
  lead_id: string;
  close_probability: number;
  estimated_close_date: string;
  risk_factors: string[];
  success_factors: string[];
  recommended_actions: string[];
  confidence: ConfidenceLevel;
}

// ═════════════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ManagerStats {
  assigned_leads_count: number;
  closed_this_month: number;
  conversion_rate: number;
  avg_response_time_hours: number;
  total_pipeline_value: number;
  active_deals_count: number;
  at_risk_leads_count: number;
  avg_deal_size: number;
}

export interface ManagerDashboard {
  manager_id: string;
  business_id: string;
  manager_name: string;
  manager_email: string;

  stats: ManagerStats;
  recommendations: AIRecommendation[];
  assigned_leads: Lead[];
  recently_closed_deals: Lead[];

  team_stats?: {
    total_managers: number;
    total_leads: number;
    avg_conversion_rate: number;
    top_performer_id?: string;
  };

  last_updated: string;
}

export interface ManagerMetrics {
  id: string;
  business_id: string;
  manager_id: string;
  metric_date: string;

  leads_assigned: number;
  leads_closed: number;
  avg_response_time_hours: number;
  conversion_rate: number;
  avg_deal_size: number;
  pipeline_value: number;
  activity_count: number;

  created_at: string;
}

export interface TeamPerformance {
  manager_id: string;
  rank: number;
  conversion_rate: number;
  avg_deal_size: number;
  response_time_ranking: 'top' | 'above_average' | 'average' | 'below_average';
  trend: 'improving' | 'stable' | 'declining';
  insight: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// MANAGER TASK TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ManagerTask {
  id: string;
  manager_id: string;
  business_id: string;

  title: string;
  description?: string;
  task_type: 'follow_up' | 'send_proposal' | 'demo_call' | 'negotiation' | 'other';

  lead_id?: string;
  deal_id?: string;

  due_date: string;
  priority: RecommendationUrgency;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  related_recommendation_id?: string;

  completed_at?: string;
  created_at: string;
  updated_at: string;
}
