/**
 * Lead Segmentation & Analytics Service
 * Segment management and advanced analytics
 */

import { supabase } from '@/app/lib/supabase';
import type {
  Lead,
  LeadSegment,
  LeadAnalytics,
  SegmentRule,
  CreateSegmentRequest,
  SegmentLeadsResponse,
  ConversionFunnel,
} from '@/types/leads';
import { LeadStage } from '@/types/leads';

/**
 * Create a new segment
 */
export async function createSegment(
  businessId: string,
  request: CreateSegmentRequest
): Promise<LeadSegment | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('lead_segments')
    .insert([
      {
        business_id: businessId,
        name: request.name,
        description: request.description,
        filter_rules: request.filter_rules,
        lead_count: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating segment:', error);
    return null;
  }

  return data as LeadSegment;
}

/**
 * Get all segments for a business
 */
export async function getSegments(businessId: string): Promise<LeadSegment[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('lead_segments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching segments:', error);
    return [];
  }

  return (data || []) as LeadSegment[];
}

/**
 * Update a segment
 */
export async function updateSegment(
  segmentId: string,
  updates: Partial<LeadSegment>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('lead_segments')
    .update(updates)
    .eq('id', segmentId);

  if (error) {
    console.error('Error updating segment:', error);
    return false;
  }

  return true;
}

/**
 * Delete a segment
 */
export async function deleteSegment(segmentId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('lead_segments')
    .delete()
    .eq('id', segmentId);

  if (error) {
    console.error('Error deleting segment:', error);
    return false;
  }

  return true;
}

/**
 * Get leads in a segment
 */
export async function getSegmentLeads(
  segmentId: string,
  limit: number = 50,
  offset: number = 0
): Promise<SegmentLeadsResponse | null> {
  if (!supabase) return null;

  // Get segment
  const { data: segment, error: segmentError } = await supabase
    .from('lead_segments')
    .select('*')
    .eq('id', segmentId)
    .single();

  if (segmentError || !segment) {
    console.error('Error fetching segment:', segmentError);
    return null;
  }

  // Get all leads for the business
  const { data: allLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', segment.business_id);

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
    return null;
  }

  // Apply segment filters
  const filteredLeads = (allLeads || []).filter((lead) =>
    matchesFilters(lead, segment.filter_rules as SegmentRule[])
  );

  // Paginate
  const paginatedLeads = filteredLeads.slice(offset, offset + limit);

  return {
    segment: segment as LeadSegment,
    leads: paginatedLeads as Lead[],
    total_count: filteredLeads.length,
  };
}

/**
 * Check if a lead matches segment filters
 */
function matchesFilters(lead: Lead, rules: SegmentRule[]): boolean {
  if (!rules || rules.length === 0) return true;

  return rules.every((rule) => matchesRule(lead, rule));
}

/**
 * Check if a lead matches a single rule
 */
function matchesRule(lead: Lead, rule: SegmentRule): boolean {
  const leadValue = (lead as any)[rule.field];

  switch (rule.operator) {
    case 'eq':
      return leadValue === rule.value;

    case 'neq':
      return leadValue !== rule.value;

    case 'gt':
      return leadValue > rule.value;

    case 'gte':
      return leadValue >= rule.value;

    case 'lt':
      return leadValue < rule.value;

    case 'lte':
      return leadValue <= rule.value;

    case 'contains':
      return String(leadValue).includes(String(rule.value));

    case 'not_contains':
      return !String(leadValue).includes(String(rule.value));

    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(leadValue);

    case 'not_in':
      return !Array.isArray(rule.value) || !rule.value.includes(leadValue);

    default:
      return true;
  }
}

/**
 * Update segment lead count
 */
export async function updateSegmentLeadCount(segmentId: string): Promise<number> {
  if (!supabase) return 0;

  const { data: segment, error: segmentError } = await supabase
    .from('lead_segments')
    .select('*')
    .eq('id', segmentId)
    .single();

  if (segmentError || !segment) {
    return 0;
  }

  const { data: allLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', segment.business_id);

  if (leadsError) {
    return 0;
  }

  const filteredLeads = (allLeads || []).filter((lead) =>
    matchesFilters(lead, segment.filter_rules as SegmentRule[])
  );

  const count = filteredLeads.length;

  await updateSegment(segmentId, { lead_count: count });

  return count;
}

/**
 * Get conversion funnel for a business
 */
export async function getConversionFunnel(
  businessId: string
): Promise<ConversionFunnel[]> {
  if (!supabase) return [];

  const stages: LeadStage[] = [
    LeadStage.New,
    LeadStage.Contacted,
    LeadStage.Qualified,
    LeadStage.Proposal,
    LeadStage.Negotiation,
    LeadStage.Won,
  ];

  const { data: leads, error } = await supabase
    .from('leads')
    .select('stage')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for funnel:', error);
    return [];
  }

  const stageCounts: Record<LeadStage, number> = {} as any;
  stages.forEach((stage) => {
    stageCounts[stage] = 0;
  });

  for (const lead of leads || []) {
    if (stageCounts[lead.stage] !== undefined) {
      stageCounts[lead.stage]++;
    }
  }

  const funnel: ConversionFunnel[] = [];
  let previousCount = 0;

  for (const stage of stages) {
    const count = stageCounts[stage] || 0;
    const conversionRate =
      previousCount > 0 ? Math.round((count / previousCount) * 100) : 100;

    funnel.push({
      stage,
      count,
      conversion_from_previous: conversionRate,
    });

    previousCount = count;
  }

  return funnel;
}

/**
 * Calculate analytics for a business
 */
export async function calculateAnalytics(
  businessId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<LeadAnalytics | null> {
  if (!supabase) return null;

  const dateObj = new Date(date);
  const dayStart = new Date(dateObj);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateObj);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId);

  if (leadsError) {
    console.error('Error fetching leads for analytics:', leadsError);
    return null;
  }

  const leadsList = leads || [];

  // Count leads created today
  const leadsCreatedToday = leadsList.filter((l) => {
    const createdAt = new Date(l.created_at);
    return createdAt >= dayStart && createdAt <= dayEnd;
  }).length;

  // Count by stage
  const leadsContacted = leadsList.filter((l) => l.stage === LeadStage.Contacted).length;
  const leadsQualified = leadsList.filter((l) => l.stage === LeadStage.Qualified).length;
  const leadsWon = leadsList.filter((l) => l.stage === LeadStage.Won).length;

  // Calculate conversion rate
  const conversionRate = leadsList.length > 0 ? (leadsWon / leadsList.length) * 100 : 0;

  // Calculate avg deal value
  const wonLeads = leadsList.filter((l) => l.stage === LeadStage.Won);
  const avgDealValue = wonLeads.length > 0
    ? wonLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0) / wonLeads.length
    : 0;

  // Calculate avg lead score
  const avgLeadScore = leadsList.length > 0
    ? Math.round(leadsList.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leadsList.length)
    : 0;

  // Calculate total revenue
  const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  const analytics: LeadAnalytics = {
    id: `${businessId}_${date}`,
    business_id: businessId,
    date,
    leads_created: leadsCreatedToday,
    leads_contacted: leadsContacted,
    leads_qualified: leadsQualified,
    conversion_count: leadsWon,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_deal_value: Math.round(avgDealValue * 100) / 100,
    avg_lead_score: avgLeadScore,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    created_at: new Date().toISOString(),
  };

  return analytics;
}

/**
 * Get analytics for a date range
 */
export async function getAnalyticsRange(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<LeadAnalytics[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const analytics: LeadAnalytics[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayAnalytics = await calculateAnalytics(businessId, dateStr);
    if (dayAnalytics) {
      analytics.push(dayAnalytics);
    }
  }

  return analytics;
}

/**
 * Get lead source analytics
 */
export async function getSourceAnalytics(businessId: string) {
  if (!supabase) return null;

  const { data: leads, error } = await supabase
    .from('leads')
    .select('source, stage, deal_value')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for source analytics:', error);
    return null;
  }

  const sources: Record<string, any> = {};

  for (const lead of leads || []) {
    const source = lead.source || 'unknown';

    if (!sources[source]) {
      sources[source] = {
        source,
        total: 0,
        won: 0,
        lost: 0,
        revenue: 0,
        avg_deal_value: 0,
        conversion_rate: 0,
      };
    }

    sources[source].total++;

    if (lead.stage === LeadStage.Won) {
      sources[source].won++;
      sources[source].revenue += lead.deal_value || 0;
    }

    if (lead.stage === LeadStage.Lost) {
      sources[source].lost++;
    }
  }

  // Calculate rates and averages
  for (const source of Object.values(sources) as any[]) {
    source.conversion_rate = source.total > 0 ? Math.round((source.won / source.total) * 100) : 0;
    source.avg_deal_value = source.won > 0 ? Math.round(source.revenue / source.won) : 0;
  }

  return Object.values(sources);
}

/**
 * Get team member performance analytics
 */
export async function getTeamPerformance(businessId: string) {
  if (!supabase) return null;

  const { data: leads, error } = await supabase
    .from('leads')
    .select('assigned_to, stage, deal_value, engagement_count, lead_score')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for team analytics:', error);
    return null;
  }

  const members: Record<string, any> = {};

  for (const lead of leads || []) {
    const userId = lead.assigned_to || 'unassigned';

    if (!members[userId]) {
      members[userId] = {
        user_id: userId,
        leads_assigned: 0,
        leads_won: 0,
        leads_lost: 0,
        total_revenue: 0,
        avg_engagement: 0,
        avg_score: 0,
        total_engagement: 0,
        scores: [],
      };
    }

    members[userId].leads_assigned++;

    if (lead.stage === LeadStage.Won) {
      members[userId].leads_won++;
      members[userId].total_revenue += lead.deal_value || 0;
    }

    if (lead.stage === LeadStage.Lost) {
      members[userId].leads_lost++;
    }

    members[userId].total_engagement += lead.engagement_count || 0;
    members[userId].scores.push(lead.lead_score || 0);
  }

  // Calculate averages
  for (const member of Object.values(members) as any[]) {
    member.avg_engagement = member.leads_assigned > 0
      ? Math.round((member.total_engagement / member.leads_assigned) * 10) / 10
      : 0;

    member.avg_score = member.scores.length > 0
      ? Math.round(member.scores.reduce((a: any, b: any) => a + b, 0) / member.scores.length)
      : 0;

    delete member.scores;
    delete member.total_engagement;
  }

  return Object.values(members);
}

/**
 * Get time-based analytics
 */
export async function getTimeBasedAnalytics(businessId: string) {
  if (!supabase) return null;

  const { data: activities, error } = await supabase
    .from('lead_activities')
    .select('created_at, activity_type')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching activities for time analytics:', error);
    return null;
  }

  const byDay: Record<string, any> = {};
  const byHour: Record<number, number> = {};
  const byActivityType: Record<string, number> = {};

  for (const activity of activities || []) {
    const date = new Date(activity.created_at);
    const dayStr = date.toISOString().split('T')[0];
    const hour = date.getHours();

    // Day stats
    if (!byDay[dayStr]) {
      byDay[dayStr] = 0;
    }
    byDay[dayStr]++;

    // Hour stats
    byHour[hour] = (byHour[hour] || 0) + 1;

    // Activity type stats
    byActivityType[activity.activity_type] = (byActivityType[activity.activity_type] || 0) + 1;
  }

  return {
    by_day: byDay,
    by_hour: byHour,
    by_activity_type: byActivityType,
  };
}
