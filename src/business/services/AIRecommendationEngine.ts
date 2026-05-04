/**
 * Layer 7: AI Recommendation Engine
 * Claude-powered service for generating manager recommendations and email drafts
 *
 * NOTE: For production, all Anthropic API calls should be made via Supabase Edge Functions,
 * not directly in browser code (security risk - exposes API keys).
 *
 * This service provides mock implementations for development.
 * Production implementations call backend Edge Functions securely.
 */

export interface Lead {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  daysInStage: number;
  lastActivity: string;
  source: string;
  email: string;
  phone?: string;
}

export interface GeneratedRecommendation {
  type: 'lead_health' | 'action_suggestion' | 'coaching';
  leadId: string;
  leadName: string;
  title: string;
  description: string;
  actionUrl?: string;
  urgency: 'high' | 'medium' | 'low';
  estimatedImpact?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone?: 'professional' | 'warm' | 'urgent';
}

/**
 * Generate lead health alerts for stalled deals
 * Mock implementation - calls Edge Function in production
 */
export async function generateLeadHealthRecommendations(
  leads: Lead[],
  managerName: string
): Promise<GeneratedRecommendation[]> {
  const stalledLeads = leads.filter(l => l.daysInStage > 7 && l.daysInStage <= 30);

  if (stalledLeads.length === 0) return [];

  // Mock recommendations
  return stalledLeads.map((lead) => ({
    type: 'lead_health' as const,
    leadId: lead.id,
    leadName: lead.name,
    title: `Follow up with ${lead.name}`,
    description: `${lead.name} has been in ${lead.stage} for ${lead.daysInStage} days. Send a check-in email or schedule a call to understand any blockers.`,
    urgency: lead.daysInStage > 20 ? 'high' : 'medium',
    estimatedImpact: `Could move deal forward by 5-10 days`,
  }));
}

/**
 * Generate personalized email draft for a specific lead
 * Mock implementation - calls Edge Function in production
 */
export async function generateEmailDraft(lead: {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  daysInStage: number;
  lastActivity: string;
  source: string;
  email: string;
}): Promise<EmailDraft> {
  // Mock email draft based on stage
  const emailTemplates: { [key: string]: EmailDraft } = {
    lead: {
      subject: `Let's explore how we can help ${lead.company}`,
      body: `Hi ${lead.name},\n\nI wanted to follow up on our initial conversation about ${lead.company}'s needs. I'd love to learn more about your current priorities and see how we might be able to help.\n\nWould you have 15 minutes next week for a brief call?\n\nBest regards`,
      tone: 'warm',
    },
    qualified: {
      subject: `${lead.company}: Next steps`,
      body: `Hi ${lead.name},\n\nThank you for the great conversation last week. Based on what you shared, I think we have a strong fit for your needs.\n\nI'd like to schedule a more detailed discovery session to dive deeper. How does Thursday or Friday look for you?\n\nBest regards`,
      tone: 'professional',
    },
    proposal: {
      subject: `Your ${lead.company} proposal is ready`,
      body: `Hi ${lead.name},\n\nI've put together a customized proposal based on our discussions. I'm confident this addresses your key priorities.\n\nLet's schedule a time to walk through it together. I'm available this week.\n\nBest regards`,
      tone: 'professional',
    },
    negotiation: {
      subject: `Let's finalize the details`,
      body: `Hi ${lead.name},\n\nWe're close to getting this across the line. I wanted to touch base on the remaining items and see if we can resolve them.\n\nWould you be available for a quick call tomorrow?\n\nBest regards`,
      tone: 'urgent',
    },
  };

  const template = emailTemplates[lead.stage] || emailTemplates.lead;

  return {
    subject: template.subject,
    body: template.body,
    tone: template.tone,
  };
}

/**
 * Auto-qualify a lead using deal characteristics
 * Mock implementation - calls Edge Function in production
 */
export async function autoQualifyLead(
  lead: Lead,
  businessProfile: any
): Promise<{
  qualificationScore: number;
  reasoning: string;
  suggestedStage: string;
  recommendedAction: string;
}> {
  const avgDealValue = businessProfile?.avgDealValue || 50000;
  const dealValueAlignment = Math.min(100, (lead.value / avgDealValue) * 100);
  const engagementScore = Math.min(100, 100 - lead.daysInStage * 2);
  const overallScore = Math.round((dealValueAlignment + engagementScore) / 2);

  return {
    qualificationScore: overallScore,
    reasoning: `Deal value ${overallScore > 70 ? 'aligns well' : 'is below'} with your average. ${lead.daysInStage > 14 ? 'Engagement is declining.' : 'Good engagement.'}`,
    suggestedStage: overallScore > 75 ? 'qualified' : lead.stage,
    recommendedAction: overallScore > 75 ? 'Schedule proposal presentation' : 'Send discovery call invitation',
  };
}

/**
 * Generate coaching tips for managers
 * Mock implementation - calls Edge Function in production
 */
export async function generateCoachingTips(
  manager: { name: string; conversionRate: number; avgResponseTime: number },
  industryBenchmark: any
): Promise<string[]> {
  const tips = [];

  if (manager.conversionRate < (industryBenchmark?.conversionRate || 0.20)) {
    tips.push(
      '💡 Your conversion rate is below industry average. Try using shorter discovery calls to move deals faster.'
    );
  }

  if (manager.avgResponseTime > 24) {
    tips.push(
      '⚡ You respond in 24+ hours on average. Aim for under 4 hours to improve lead engagement.'
    );
  }

  if (tips.length === 0) {
    tips.push('✨ Great job! You\'re performing above industry benchmarks. Keep it up!');
  }

  return tips;
}
