/**
 * Lead Scoring Engine
 * Intelligent scoring system to prioritize leads based on multiple factors
 */

import { supabase } from '@/app/lib/supabase';
import type {
  Lead,
  ScoringCriteria,
  ScoringResult,
  LeadActivity,
} from '@/types/leads';
import { LeadStage, LeadPriority, ConversionRisk } from '@/types/leads';

/**
 * Default scoring criteria with weights
 */
export const DEFAULT_SCORING_CRITERIA: ScoringCriteria = {
  engagement_weight: 20,
  stage_weight: 30,
  priority_weight: 20,
  deal_value_weight: 20,
  recency_weight: 10,
};

/**
 * Calculate lead score
 */
export async function calculateLeadScore(
  lead: Lead,
  criteria: ScoringCriteria = DEFAULT_SCORING_CRITERIA
): Promise<ScoringResult> {
  const stageScore = calculateStageScore(lead.stage);
  const engagementScore = calculateEngagementScore(lead.engagement_count);
  const priorityScore = calculatePriorityScore(lead.priority);
  const dealValueScore = calculateDealValueScore(lead.deal_value);
  const recencyScore = calculateRecencyScore(lead.last_contacted);

  // Weighted total
  const totalScore = Math.round(
    (stageScore * criteria.stage_weight +
      engagementScore * criteria.engagement_weight +
      priorityScore * criteria.priority_weight +
      dealValueScore * criteria.deal_value_weight +
      recencyScore * criteria.recency_weight) /
      (criteria.stage_weight +
        criteria.engagement_weight +
        criteria.priority_weight +
        criteria.deal_value_weight +
        criteria.recency_weight)
  );

  return {
    lead_id: lead.id,
    score: Math.min(100, Math.max(0, totalScore)),
    stage_score: stageScore,
    engagement_score: engagementScore,
    priority_score: priorityScore,
    deal_value_score: dealValueScore,
    recency_score: recencyScore,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate stage-based score (0-100)
 */
function calculateStageScore(stage: LeadStage): number {
  const stageScores: Record<LeadStage, number> = {
    [LeadStage.New]: 5,
    [LeadStage.Contacted]: 20,
    [LeadStage.Qualified]: 40,
    [LeadStage.Proposal]: 60,
    [LeadStage.Negotiation]: 80,
    [LeadStage.Won]: 100,
    [LeadStage.Lost]: 0,
    [LeadStage.Nurture]: 10,
  };

  return stageScores[stage] || 0;
}

/**
 * Calculate engagement-based score (0-100)
 * Based on number of interactions
 */
function calculateEngagementScore(engagementCount: number): number {
  // More interactions = higher score
  // 0 interactions = 0, 10+ interactions = 100
  return Math.min(100, engagementCount * 10);
}

/**
 * Calculate priority-based score (0-100)
 */
function calculatePriorityScore(priority: LeadPriority | string): number {
  const priorityScores: Record<string, number> = {
    [LeadPriority.Low]: 20,
    [LeadPriority.Medium]: 50,
    [LeadPriority.High]: 75,
    [LeadPriority.Urgent]: 100,
  };

  return priorityScores[priority] || 50;
}

/**
 * Calculate deal value-based score (0-100)
 * Logarithmic scale: higher deal values get diminishing returns
 */
function calculateDealValueScore(dealValue?: number | null): number {
  if (!dealValue || dealValue <= 0) {
    return 0;
  }

  // Logarithmic scale: $0 = 0, $100k = 50, $1M = 70, $10M = 90
  const score = Math.log10(dealValue / 100) * 10;
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate recency-based score (0-100)
 * More recent interactions = higher score
 */
function calculateRecencyScore(lastContactedIso?: string): number {
  if (!lastContactedIso) {
    return 20; // Not contacted yet but some points for potential
  }

  const lastContact = new Date(lastContactedIso).getTime();
  const now = Date.now();
  const daysSinceContact = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

  // Score decays over time: 0 days = 100, 7 days = 70, 30 days = 20, 90+ days = 0
  if (daysSinceContact <= 0) return 100;
  if (daysSinceContact <= 7) return Math.max(70, 100 - daysSinceContact * 4);
  if (daysSinceContact <= 30) return Math.max(20, 70 - (daysSinceContact - 7) * 2);
  if (daysSinceContact <= 90) return Math.max(0, 20 - (daysSinceContact - 30) * 0.33);
  return 0;
}

/**
 * Batch score calculation for all leads in a business
 */
export async function scoreAllLeads(
  businessId: string,
  criteria?: ScoringCriteria
): Promise<ScoringResult[]> {
  if (!supabase) return [];

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for scoring:', error);
    return [];
  }

  const scoringCriteria = criteria || DEFAULT_SCORING_CRITERIA;
  const results: ScoringResult[] = [];

  for (const lead of leads || []) {
    const result = await calculateLeadScore(lead, scoringCriteria);
    results.push(result);

    // Update the lead's score in the database
    await updateLeadScore(lead.id, result.score);
  }

  return results;
}

/**
 * Update lead score in database
 */
async function updateLeadScore(leadId: string, score: number): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('leads')
    .update({ lead_score: Math.round(score) })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead score:', error);
    return false;
  }

  return true;
}

/**
 * Get top scoring leads for a business
 */
export async function getTopLeads(
  businessId: string,
  limit: number = 10
): Promise<Lead[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .order('lead_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top leads:', error);
    return [];
  }

  return (data || []) as Lead[];
}

/**
 * Categorize leads by score ranges
 */
export async function categorizeLeadsByScore(
  businessId: string
): Promise<Record<string, Lead[]>> {
  if (!supabase) return {};

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .order('lead_score', { ascending: false });

  if (error) {
    console.error('Error fetching leads for categorization:', error);
    return {};
  }

  const categories: Record<string, Lead[]> = {
    hot: [],     // 80-100
    warm: [],    // 60-79
    cool: [],    // 40-59
    cold: [],    // 0-39
  };

  for (const lead of leads || []) {
    const score = lead.lead_score || 0;
    if (score >= 80) {
      categories.hot.push(lead);
    } else if (score >= 60) {
      categories.warm.push(lead);
    } else if (score >= 40) {
      categories.cool.push(lead);
    } else {
      categories.cold.push(lead);
    }
  }

  return categories;
}

/**
 * Determine conversion risk based on score and stage
 */
export function assessConversionRisk(lead: Lead): ConversionRisk {
  const score = lead.lead_score || 0;
  const stage = lead.stage;

  // Lost leads are high risk (no conversion)
  if (stage === LeadStage.Lost) {
    return ConversionRisk.High;
  }

  // Won leads are low risk (already converted)
  if (stage === LeadStage.Won) {
    return ConversionRisk.Low;
  }

  // Scoring-based assessment
  if (score >= 75 && (stage === LeadStage.Negotiation || stage === LeadStage.Proposal)) {
    return ConversionRisk.Low;
  }

  if (score >= 50 && stage === LeadStage.Qualified) {
    return ConversionRisk.Medium;
  }

  if (score < 30 && stage === LeadStage.New) {
    return ConversionRisk.High;
  }

  return ConversionRisk.Medium;
}

/**
 * Score leads based on activity frequency
 */
export async function updateScoreFromActivity(
  leadId: string,
  activities: LeadActivity[]
): Promise<number> {
  if (!supabase) return 0;

  // Get current lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    console.error('Error fetching lead for activity scoring:', leadError);
    return 0;
  }

  // Update engagement count
  const newEngagementCount = activities.length;

  // Calculate new score
  const engagementScore = calculateEngagementScore(newEngagementCount);
  const stageScore = calculateStageScore(lead.stage);
  const priorityScore = calculatePriorityScore(lead.priority);
  const dealValueScore = calculateDealValueScore(lead.deal_value);
  const recencyScore = calculateRecencyScore(lead.last_contacted);

  const newScore = Math.round(
    (stageScore * 30 +
      engagementScore * 20 +
      priorityScore * 20 +
      dealValueScore * 20 +
      recencyScore * 10) /
      100
  );

  // Update lead
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      lead_score: newScore,
      engagement_count: newEngagementCount,
    })
    .eq('id', leadId);

  if (updateError) {
    console.error('Error updating lead score from activity:', updateError);
    return 0;
  }

  return newScore;
}

/**
 * Get scoring insights for a business
 */
export async function getScoringInsights(businessId: string) {
  if (!supabase) return null;

  const { data: leads, error } = await supabase
    .from('leads')
    .select('lead_score, stage')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for scoring insights:', error);
    return null;
  }

  const scores = (leads || []).map((l) => l.lead_score || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Stage distribution
  const stageDistribution: Record<string, number> = {};
  for (const lead of leads || []) {
    const stage = lead.stage;
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
  }

  // Score distribution
  const scoreDistribution = {
    hot: scores.filter((s) => s >= 80).length,
    warm: scores.filter((s) => s >= 60 && s < 80).length,
    cool: scores.filter((s) => s >= 40 && s < 60).length,
    cold: scores.filter((s) => s < 40).length,
  };

  return {
    total_leads: scores.length,
    avg_score: avgScore,
    max_score: maxScore,
    min_score: minScore,
    stage_distribution: stageDistribution,
    score_distribution: scoreDistribution,
  };
}

/**
 * Recommend next action for a lead based on score and stage
 */
export function recommendNextAction(lead: Lead): string {
  const score = lead.lead_score || 0;
  const stage = lead.stage;

  if (stage === LeadStage.Won) {
    return 'Nurture for repeat business';
  }

  if (stage === LeadStage.Lost) {
    return 'Archive or follow up in 6 months';
  }

  if (score >= 80) {
    if (stage === LeadStage.Negotiation) {
      return 'Close the deal immediately';
    }
    if (stage === LeadStage.Proposal) {
      return 'Follow up on proposal';
    }
    if (stage === LeadStage.Qualified) {
      return 'Send proposal';
    }
    return 'High priority - schedule meeting';
  }

  if (score >= 60) {
    if (stage === LeadStage.Qualified) {
      return 'Qualify further and prepare proposal';
    }
    return 'Schedule discovery call';
  }

  if (score >= 40) {
    return 'Continue nurturing';
  }

  if (score >= 20) {
    return 'Add to nurture campaign';
  }

  return 'Initial outreach required';
}
