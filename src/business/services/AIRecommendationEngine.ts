/**
 * Layer 7: AI Recommendation Engine
 * Claude-powered service for generating manager recommendations and email drafts
 */

import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic();

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
 * Analyzes leads stuck in the same stage for extended periods
 */
export async function generateLeadHealthRecommendations(
  leads: Lead[],
  managerName: string
): Promise<GeneratedRecommendation[]> {
  const stalledLeads = leads.filter(l => l.daysInStage > 7 && l.daysInStage <= 30);

  if (stalledLeads.length === 0) return [];

  const prompt = `You are a sales expert analyzing stalled leads for a manager named ${managerName}.

Stalled Leads (in same stage > 7 days):
${stalledLeads
  .map(
    l => `
- ${l.name} (${l.company})
  Stage: ${l.stage}
  Days in stage: ${l.daysInStage}
  Deal value: $${l.value.toLocaleString()}
  Last activity: ${l.lastActivity}
  Source: ${l.source}
`
  )
  .join('\n')}

For each stalled lead, provide ONE specific, actionable recommendation to unblock the deal.
Focus on practical next steps based on the stage.

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON array:
[{
  "leadId": "id1",
  "leadName": "Lead Name",
  "title": "Action needed - specific action",
  "description": "Why this action will help unblock the deal",
  "urgency": "high"
}]`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn('No JSON array found in response');
          return [];
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((rec: any) => ({
          ...rec,
          type: 'lead_health' as const,
        }));
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error generating lead health recommendations:', error);
    return [];
  }
}

/**
 * Generate personalized email draft for a specific lead
 * Creates contextual follow-up emails based on deal stage and company
 */
export async function generateEmailDraft(
  lead: Lead,
  previousEmails?: string[]
): Promise<EmailDraft> {
  const prompt = `You are an expert sales email writer helping a sales manager.

Lead Information:
- Name: ${lead.name}
- Company: ${lead.company}
- Current Stage: ${lead.stage}
- Days in current stage: ${lead.daysInStage}
- Deal value: $${lead.value.toLocaleString()}
- Last contact: ${lead.lastActivity}
${previousEmails && previousEmails.length > 0 ? `\nPrevious email subjects:\n${previousEmails.join('\n')}` : ''}

Write a personalized follow-up email that:
1. References their company specifically and acknowledges context
2. Shows you understand their potential needs
3. Proposes a specific, valuable next step
4. Has a clear call-to-action
5. Is concise (3-4 sentences max for body)
6. Feels warm and human, not robotic

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON:
{
  "subject": "Subject line (6-8 words max)",
  "body": "Email body (3-4 sentences)"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || '',
          body: parsed.body || '',
          tone: 'warm',
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          subject: `Quick follow-up with ${lead.company}`,
          body: `Hi ${lead.name}, I wanted to check in on our conversation and see if you had any questions. Happy to answer anything or schedule a brief call.`,
          tone: 'professional',
        };
      }
    }
    return {
      subject: `Quick follow-up with ${lead.company}`,
      body: `Hi ${lead.name}, following up to see if you had any questions about how we can help ${lead.company}.`,
      tone: 'professional',
    };
  } catch (error) {
    console.error('Error generating email draft:', error);
    return {
      subject: `Check-in: ${lead.company}`,
      body: `Hi ${lead.name}, wanted to touch base and see where things stand.`,
      tone: 'professional',
    };
  }
}

/**
 * Auto-qualify a lead using ICP matching and deal health analysis
 * Returns qualification score and recommended next action
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
  const prompt = `You are a sales qualification expert analyzing a lead for a B2B sales team.

Lead Profile:
- Name: ${lead.name}
- Company: ${lead.company}
- Deal Value: $${lead.value.toLocaleString()}
- Source: ${lead.source}
- Days in current stage: ${lead.daysInStage}
- Current Stage: ${lead.stage}

Business Profile:
- Type: ${businessProfile.type || 'B2B SaaS'}
- Ideal Customer Size: ${businessProfile.targetCustomerSize || 'Mid-market'}
- Average Deal Value: $${businessProfile.avgDealValue?.toLocaleString() || '50000'}
- Sales Cycle: ${businessProfile.salesCycleDays || 60} days

Rate this lead's qualification from 0-100 based on:
1. Deal value alignment with your average
2. Company size fit to ICP
3. Sales cycle progress (current days / typical cycle)
4. Lead engagement signals

If they should move to a different stage, recommend it.

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON:
{
  "score": 75,
  "reasoning": "Brief explanation of score",
  "suggestedStage": "proposal",
  "recommendedAction": "Schedule discovery call"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found');
        }
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          qualificationScore: 0,
          reasoning: 'Unable to analyze lead',
          suggestedStage: lead.stage,
          recommendedAction: 'Manual review needed',
        };
      }
    }
    return {
      qualificationScore: 0,
      reasoning: '',
      suggestedStage: '',
      recommendedAction: '',
    };
  } catch (error) {
    console.error('Error auto-qualifying lead:', error);
    return {
      qualificationScore: 0,
      reasoning: 'Error during qualification',
      suggestedStage: lead.stage,
      recommendedAction: 'Try again later',
    };
  }
}

/**
 * Generate performance coaching tips based on manager metrics
 * Provides actionable improvements for sales performance
 */
export async function generateCoachingTips(managerStats: {
  conversionRate: number;
  avgResponseTime: number;
  pipelineValue: number;
  dealsClosedThisMonth: number;
  totalLeads: number;
}): Promise<string[]> {
  const prompt = `You are an expert sales coach. Analyze this manager's performance and provide 2-3 specific, immediately actionable coaching tips.

Manager Performance:
- Conversion Rate: ${managerStats.conversionRate}% (industry target: 25%)
- Avg Response Time: ${managerStats.avgResponseTime}h (target: 4h)
- Pipeline Value: $${managerStats.pipelineValue.toLocaleString()}
- Deals Closed This Month: ${managerStats.dealsClosedThisMonth}
- Total Leads: ${managerStats.totalLeads}

Provide 2-3 specific tips that are:
- Immediately actionable (can be done this week)
- Data-backed (based on their metrics)
- Focused on highest impact areas
- Practical for a busy sales manager

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON array of strings:
["Tip 1: specific action", "Tip 2: specific action", "Tip 3: specific action"]`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found');
        }
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return [
          'Focus on reducing response time to under 4 hours',
          'Prioritize high-value deals in your pipeline',
          'Schedule weekly pipeline reviews',
        ];
      }
    }
    return [];
  } catch (error) {
    console.error('Error generating coaching tips:', error);
    return [];
  }
}

/**
 * Predict deal closure probability and risk factors
 * ML-style prediction for deal likelihood and timeline
 */
export async function predictDealClosureProbability(
  leads: Lead[]
): Promise<
  Array<{
    leadId: string;
    leadName: string;
    closureProbability: number;
    estimatedClosureDate: string;
    riskFactors: string[];
  }>
> {
  if (leads.length === 0) return [];

  const prompt = `You are a predictive sales analytics expert. Analyze these leads and predict closure probability.

Leads:
${leads
  .map(
    l => `
- ${l.name} (${l.company})
  Stage: ${l.stage}
  Days in stage: ${l.daysInStage}
  Value: $${l.value.toLocaleString()}
  Last activity: ${l.lastActivity}
  Source: ${l.source}
`
  )
  .join('\n')}

For each lead predict:
1. Closure probability (0-100%)
2. Estimated days to close from today
3. Top 2-3 risk factors that could block closure

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON array:
[{
  "leadId": "id1",
  "leadName": "Lead Name",
  "closureProbability": 75,
  "estimatedClosureDate": "2026-05-15",
  "riskFactors": ["Risk 1", "Risk 2"]
}]`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found');
        }
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return leads.map(l => ({
          leadId: l.id,
          leadName: l.name,
          closureProbability: 50,
          estimatedClosureDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          riskFactors: ['Insufficient data', 'Manual review needed'],
        }));
      }
    }
    return [];
  } catch (error) {
    console.error('Error predicting deal closure:', error);
    return [];
  }
}

/**
 * Generate pipeline health summary for team analysis
 * High-level insights about pipeline composition and risk
 */
export async function generatePipelineHealthSummary(leads: Lead[]): Promise<{
  healthScore: number;
  summary: string;
  recommendations: string[];
}> {
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const avgDealSize = totalValue / (leads.length || 1);
  const stalledCount = leads.filter(l => l.daysInStage > 14).length;

  const prompt = `You are a sales operations expert analyzing a sales pipeline.

Pipeline Summary:
- Total Leads: ${leads.length}
- Total Pipeline Value: $${totalValue.toLocaleString()}
- Average Deal Size: $${avgDealSize.toFixed(0).toLocaleString()}
- Stalled Deals (>14 days): ${stalledCount}
- Stage Distribution:
${Object.entries(
  leads.reduce(
    (acc, l) => {
      acc[l.stage] = (acc[l.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  )
)
  .map(([stage, count]) => `  ${stage}: ${count}`)
  .join('\n')}

Provide:
1. Health score (0-100)
2. One-sentence summary of pipeline health
3. Top 2-3 actions to improve pipeline quality

IMPORTANT: Return ONLY valid JSON, no additional text.

Format as JSON:
{
  "healthScore": 75,
  "summary": "Pipeline shows moderate health with some stalled deals",
  "recommendations": ["Action 1", "Action 2", "Action 3"]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found');
        }
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          healthScore: 70,
          summary: 'Pipeline health analysis unavailable',
          recommendations: [
            'Review stalled deals',
            'Increase activity on at-risk deals',
            'Qualify new leads',
          ],
        };
      }
    }
    return {
      healthScore: 70,
      summary: 'Pipeline health analysis unavailable',
      recommendations: ['Manual review recommended'],
    };
  } catch (error) {
    console.error('Error generating pipeline health summary:', error);
    return {
      healthScore: 70,
      summary: 'Error analyzing pipeline',
      recommendations: ['Try again later'],
    };
  }
}
