/**
 * Actionable Dashboard Insights API
 * Layer 5 - Real-time metrics, AI insights, and recommendations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface Insight {
  id: string;
  businessId: string;
  pipelineId?: string;
  insightType: 'bottleneck' | 'performance' | 'forecast' | 'anomaly' | 'trend' | 'health' | 'recommendation';
  title: string;
  description: string;
  impactScore: number;
  data: Record<string, any>;
  rootCause?: string;
  supportingMetrics: Record<string, any>;
  historicalContext: Record<string, any>;
  aiGenerated: boolean;
  aiModel?: string;
  confidenceScore?: number;
  dismissed: boolean;
  dismissedAt?: string;
  dismissedBy?: string;
  actionTaken: boolean;
  actionTakenAt?: string;
  actionDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  businessId: string;
  insightId?: string;
  title: string;
  description: string;
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact?: string;
  effortLevel?: 'trivial' | 'low' | 'medium' | 'high';
  confidenceScore?: number;
  reasoning?: string;
  status: 'suggested' | 'accepted' | 'rejected' | 'implemented' | 'archived';
  implementedAt?: string;
  implementedBy?: string;
  feedbackScore?: number;
  feedbackComment?: string;
  relatedEntities: string[];
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export async function getGoalProgress(businessId: string): Promise<any> {
  try {
    const { data: business } = await supabaseClient
      .from('biz_users')
      .select('monthly_revenue_goal')
      .eq('id', businessId)
      .single();

    const monthlyGoal = business?.monthly_revenue_goal || 100000;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: closedDeals } = await supabaseClient
      .from('leads')
      .select('deal_value')
      .eq('business_id', businessId)
      .eq('is_closed', true)
      .gte('closed_at', monthStart.toISOString())
      .lte('closed_at', monthEnd.toISOString());

    const currentProgress = (closedDeals || []).reduce((sum, deal) => sum + (deal.deal_value || 0), 0);
    const daysInMonth = monthEnd.getDate();
    const daysRemaining = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      monthly_goal: monthlyGoal,
      current_progress: currentProgress,
      progress_percentage: (currentProgress / monthlyGoal) * 100,
      days_remaining: Math.max(daysRemaining, 0),
      daily_pace_needed: daysRemaining > 0 ? Math.max((monthlyGoal - currentProgress) / daysRemaining, 0) : 0,
    };
  } catch (error) {
    console.error('Failed to get goal progress:', error);
    throw error;
  }
}

export async function dismissInsight(insightId: string, businessId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('dashboard_insights')
      .update({
        dismissed: true,
        dismissed_at: new Date().toISOString(),
        dismissed_by: userId,
      })
      .eq('id', insightId)
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to dismiss insight:', error);
    throw error;
  }
}

export async function getActiveInsights(businessId: string, limit: number = 10): Promise<Insight[]> {
  try {
    const { data, error } = await supabaseClient
      .from('dashboard_insights')
      .select('*')
      .eq('business_id', businessId)
      .eq('dismissed', false)
      .order('impact_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(formatInsight);
  } catch (error) {
    console.error('Failed to get active insights:', error);
    return [];
  }
}

export async function getRecommendations(
  businessId: string,
  status?: string,
  limit: number = 20
): Promise<Recommendation[]> {
  try {
    let query = supabaseClient
      .from('dashboard_recommendations')
      .select('*')
      .eq('business_id', businessId)
      .order('priority', { ascending: false })
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(formatRecommendation);
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}

export async function updateRecommendationStatus(
  recommendationId: string,
  businessId: string,
  status: string,
  userId: string,
  feedback?: { score?: number; comment?: string }
): Promise<Recommendation> {
  try {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'implemented') {
      updateData.implemented_at = new Date().toISOString();
      updateData.implemented_by = userId;
    }

    if (feedback?.score) {
      updateData.feedback_score = feedback.score;
    }

    if (feedback?.comment) {
      updateData.feedback_comment = feedback.comment;
    }

    const { data, error } = await supabaseClient
      .from('dashboard_recommendations')
      .update(updateData)
      .eq('id', recommendationId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;
    return formatRecommendation(data);
  } catch (error) {
    console.error('Failed to update recommendation:', error);
    throw error;
  }
}

function formatInsight(data: any): Insight {
  return {
    id: data.id,
    businessId: data.business_id,
    pipelineId: data.pipeline_id,
    insightType: data.insight_type,
    title: data.title,
    description: data.description,
    impactScore: data.impact_score,
    data: data.data,
    rootCause: data.root_cause,
    supportingMetrics: data.supporting_metrics,
    historicalContext: data.historical_context,
    aiGenerated: data.ai_generated,
    aiModel: data.ai_model,
    confidenceScore: data.confidence_score,
    dismissed: data.dismissed,
    dismissedAt: data.dismissed_at,
    dismissedBy: data.dismissed_by,
    actionTaken: data.action_taken,
    actionTakenAt: data.action_taken_at,
    actionDetails: data.action_details,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function formatRecommendation(data: any): Recommendation {
  return {
    id: data.id,
    businessId: data.business_id,
    insightId: data.insight_id,
    title: data.title,
    description: data.description,
    actionType: data.action_type,
    priority: data.priority,
    expectedImpact: data.expected_impact,
    effortLevel: data.effort_level,
    confidenceScore: data.confidence_score,
    reasoning: data.reasoning,
    status: data.status,
    implementedAt: data.implemented_at,
    implementedBy: data.implemented_by,
    feedbackScore: data.feedback_score,
    feedbackComment: data.feedback_comment,
    relatedEntities: data.related_entities,
    parameters: data.parameters,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
