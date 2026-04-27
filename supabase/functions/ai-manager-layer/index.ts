/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * AI-Powered Email Drafting and Confidence Calculation
 *
 * This edge function provides:
 * 1. AI email drafting using Claude Haiku (8 action types)
 * 2. Confidence score calculation (5-factor model)
 * 3. Manager recommendations with priority scoring
 * 4. Escalation threshold detection
 *
 * Dependencies: Anthropic SDK (Claude Haiku 3.5), Supabase client
 */

import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import type { Database } from "../database.types.ts";

// ═════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

interface DealContext {
  dealId: string;
  businessId: string;
  managerId: string;
  customerName?: string;
  companyName?: string;
  dealValue?: number;
  stage?: string;
  lastActivity?: string;
  daysSinceActivity?: number;
  dealHistory?: string;
}

interface EmailSuggestion {
  subjectLine: string;
  bodyText: string;
  suggestedAction: string;
  confidenceScore: number;
  personalizationScore: number;
}

interface ConfidenceFactors {
  dealValueFit: number;
  customerProfileMatch: number;
  salesCycleAlignment: number;
  managerSuccessRate: number;
  activityMomentum: number;
  overallConfidence: number;
}

interface ManagerRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  rationale: string;
  estimatedOutcome: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || ""
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

// ═════════════════════════════════════════════════════════════════════════════
// CLAUDE HAIKU EMAIL DRAFTING
// ═════════════════════════════════════════════════════════════════════════════

async function draftEmailWithClaude(
  context: DealContext,
  actionType: string
): Promise<EmailSuggestion> {
  const prompt = buildEmailPrompt(context, actionType);

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return parseEmailResponse(content.text, actionType);
}

function buildEmailPrompt(context: DealContext, actionType: string): string {
  const actionDescriptions: Record<string, string> = {
    initial_outreach:
      "First point of contact - introduce yourself and gauge interest",
    follow_up: "Gentle reminder about previous conversation",
    proposal:
      "Present a formal proposal with specific terms and value proposition",
    negotiation:
      "Address objections and move toward agreement on key terms",
    close: "Final push to secure commitment and agreement",
    objection_handling: "Directly address customer concerns raised",
    check_in: "Maintain relationship - no hard sell, just checking in",
    next_step:
      "Guide customer to next stage in sales process (e.g., demo, trial, meeting)",
  };

  const actionDesc = actionDescriptions[actionType] || actionType;

  return `You are an expert sales manager helping draft a professional email to a prospect.

DEAL CONTEXT:
- Customer: ${context.customerName || "Prospect"}
- Company: ${context.companyName || "Unknown"}
- Deal Value: ${context.dealValue ? `$${context.dealValue}` : "Unknown"}
- Current Stage: ${context.stage || "Initial Contact"}
- Last Activity: ${context.lastActivity || "No prior activity"}
- Days Since Last Contact: ${context.daysSinceActivity || "N/A"}

EMAIL PURPOSE: ${actionDesc}

REQUIREMENTS:
1. Professional yet personable tone
2. Specific to their situation (use names, company details when available)
3. Clear call-to-action
4. Concise (under 200 words)
5. Must include business value/benefit
6. Avoid generic templates

Please provide the email in this exact JSON format:
{
  "subject": "email subject line",
  "body": "email body text",
  "personalization_score": 0.0-1.0 (how personalized is it to this specific customer),
  "confidence": 0.0-1.0 (likelihood this email will get positive response)
}`;
}

function parseEmailResponse(response: string, actionType: string): EmailSuggestion {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback response if JSON parsing fails
    return {
      subjectLine: `Regarding our discussion`,
      bodyText:
        `Hi,\n\nI wanted to follow up on our conversation.\n\nLooking forward to connecting soon.\n\nBest regards`,
      suggestedAction: actionType,
      confidenceScore: 0.5,
      personalizationScore: 0.3,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    subjectLine: parsed.subject || "Follow up",
    bodyText: parsed.body || "",
    suggestedAction: actionType,
    confidenceScore: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    personalizationScore: Math.min(
      1,
      Math.max(0, parsed.personalization_score || 0.5)
    ),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORE CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

async function calculateConfidenceFactors(
  dealId: string,
  businessId: string,
  context: DealContext
): Promise<ConfidenceFactors> {
  // In production, these would query actual historical data
  // For now, we'll use heuristics based on available context

  // 1. Deal Value Fit (0-1): Is deal in ideal value range?
  // Assumes sweet spot is $10K-$100K
  const dealValueFit = calculateDealValueFit(context.dealValue);

  // 2. Customer Profile Match (0-1): Does customer match ideal profile?
  // Based on company size hints, activity pattern
  const customerProfileMatch = calculateCustomerProfileMatch(
    context.companyName
  );

  // 3. Sales Cycle Alignment (0-1): Is deal at right stage?
  // Based on stage and days since activity
  const salesCycleAlignment = calculateSalesCycleAlignment(
    context.stage,
    context.daysSinceActivity
  );

  // 4. Manager Success Rate (0-1): Historical success with similar deals
  // Query manager's past conversion rates
  const managerSuccessRate = await getManagerSuccessRate(
    context.managerId,
    context.dealValue
  );

  // 5. Activity Momentum (0-1): Is engagement trending up or down?
  const activityMomentum = calculateActivityMomentum(
    context.daysSinceActivity
  );

  // Calculate weighted average (equal weighting for now)
  const weights = [0.2, 0.2, 0.2, 2, 0.2];
  const factors = [
    dealValueFit,
    customerProfileMatch,
    salesCycleAlignment,
    managerSuccessRate,
    activityMomentum,
  ];

  const overallConfidence =
    factors.reduce((sum, factor, i) => sum + factor * weights[i], 0) /
    weights.reduce((a, b) => a + b, 0);

  return {
    dealValueFit,
    customerProfileMatch,
    salesCycleAlignment,
    managerSuccessRate,
    activityMomentum,
    overallConfidence: Math.min(1, Math.max(0, overallConfidence)),
  };
}

function calculateDealValueFit(dealValue?: number): number {
  if (!dealValue) return 0.5; // Neutral if unknown

  // Sweet spot: $10K - $100K
  if (dealValue >= 10000 && dealValue <= 100000) {
    return 0.9 + (Math.random() * 0.1 - 0.05); // 0.85-0.95
  }
  if (dealValue >= 5000 && dealValue <= 200000) {
    return 0.7 + (Math.random() * 0.2 - 0.1); // 0.6-0.8
  }
  if (dealValue > 200000) {
    return 0.6 + (Math.random() * 0.2 - 0.1); // High value = high risk
  }

  return 0.4 + (Math.random() * 0.2 - 0.1); // Below $5K = lower priority
}

function calculateCustomerProfileMatch(companyName?: string): number {
  if (!companyName) return 0.5;

  // Simple heuristic: longer company names suggest established firms
  const nameLength = companyName.split(" ").length;
  return Math.min(1, 0.5 + nameLength * 0.1);
}

function calculateSalesCycleAlignment(
  stage?: string,
  daysSinceActivity?: number
): number {
  const stageWeights: Record<string, number> = {
    "initial_contact": 0.4,
    "qualification": 0.6,
    "proposal": 0.8,
    "negotiation": 0.85,
    "close": 0.9,
  };

  const stageScore = stageWeights[stage?.toLowerCase() || ""] || 0.5;

  // Adjust for activity recency
  if (daysSinceActivity === undefined) return stageScore;
  if (daysSinceActivity <= 3) return stageScore + 0.1;
  if (daysSinceActivity <= 7) return stageScore + 0.05;
  if (daysSinceActivity >= 30) return Math.max(0.3, stageScore - 0.2);

  return stageScore;
}

async function getManagerSuccessRate(
  managerId: string,
  dealValue?: number
): Promise<number> {
  try {
    // Query manager's historical conversion rate
    const { data, error } = await supabase
      .from("pipeline_stats")
      .select("win_rate")
      .eq("manager_id", managerId)
      .single();

    if (error || !data) {
      return 0.6; // Default if no history
    }

    return Math.min(1, (data.win_rate || 0.6) / 100);
  } catch {
    return 0.6; // Fallback
  }
}

function calculateActivityMomentum(daysSinceActivity?: number): number {
  if (daysSinceActivity === undefined) return 0.5;
  if (daysSinceActivity <= 1) return 0.95; // Very recent = high momentum
  if (daysSinceActivity <= 7) return 0.75; // Recent
  if (daysSinceActivity <= 14) return 0.6; // Moderate
  if (daysSinceActivity <= 30) return 0.4; // Stale
  return 0.2; // Very stale
}

// ═════════════════════════════════════════════════════════════════════════════
// MANAGER RECOMMENDATION ENGINE
// ═════════════════════════════════════════════════════════════════════════════

function generateRecommendations(
  context: DealContext,
  confidence: ConfidenceFactors
): ManagerRecommendation[] {
  const recommendations: ManagerRecommendation[] = [];

  // Recommendation 1: Based on Activity Momentum
  if (context.daysSinceActivity && context.daysSinceActivity > 14) {
    recommendations.push({
      priority: confidence.activityMomentum < 0.3 ? "high" : "medium",
      action: "send_outreach_email",
      rationale: "Deal has been inactive for extended period",
      estimatedOutcome:
        "Re-engage customer and assess current interest level",
    });
  }

  // Recommendation 2: Based on Sales Cycle
  if (context.stage === "proposal" || context.stage === "negotiation") {
    recommendations.push({
      priority: "high",
      action: "send_proposal_follow_up",
      rationale: "Deal in critical stage requires active management",
      estimatedOutcome:
        "Move deal closer to close with targeted follow-up",
    });
  }

  // Recommendation 3: Based on Deal Value
  if (context.dealValue && context.dealValue > 50000) {
    recommendations.push({
      priority: "high",
      action: "schedule_call",
      rationale: "High-value deal warrants direct conversation",
      estimatedOutcome:
        "Personal touch increases close probability by 40%+",
    });
  }

  // Recommendation 4: Based on Overall Confidence
  if (confidence.overallConfidence > 0.8) {
    recommendations.push({
      priority: "high",
      action: "accelerate_close",
      rationale:
        confidence.overallConfidence > 0.9
          ? "Strong signals indicate ready to close"
          : "High confidence suggests good timing for close attempt",
      estimatedOutcome: "Close deal in next 1-2 weeks",
    });
  }

  // Recommendation 5: At-Risk Detection
  if (confidence.activityMomentum < 0.3 && confidence.dealValueFit > 0.7) {
    recommendations.push({
      priority: "critical",
      action: "escalate_or_reclaim",
      rationale:
        "At-risk: High-value deal losing momentum - may be lost soon",
      estimatedOutcome:
        "Escalation to senior manager or intensive recovery attempt",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { dealId, businessId, managerId, context } = await req.json();

    if (!dealId || !businessId || !managerId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: dealId, businessId, managerId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Generate Email Suggestions
    const emailSuggestions: EmailSuggestion[] = [];
    const actionTypes = [
      "initial_outreach",
      "follow_up",
      "proposal",
      "negotiation",
      "close",
      "objection_handling",
      "check_in",
      "next_step",
    ];

    // Generate 2-3 most relevant email suggestions
    const relevantActions = actionTypes.slice(0, 3);

    for (const action of relevantActions) {
      try {
        const suggestion = await draftEmailWithClaude({ ...context, dealId }, action);
        emailSuggestions.push(suggestion);
      } catch (error) {
        console.error(`Error drafting email for ${action}:`, error);
      }
    }

    // 2. Calculate Confidence Factors
    const confidenceFactors = await calculateConfidenceFactors(
      dealId,
      businessId,
      { ...context, dealId }
    );

    // 3. Generate Recommendations
    const recommendations = generateRecommendations(
      { ...context, dealId },
      confidenceFactors
    );

    // 4. Store in Database (if database calls succeed)
    try {
      // Store first email suggestion
      if (emailSuggestions.length > 0) {
        const topSuggestion = emailSuggestions[0];
        await supabase.from("ai_email_suggestions").insert({
          business_id: businessId,
          deal_id: dealId,
          manager_id: managerId,
          subject_line: topSuggestion.subjectLine,
          body_text: topSuggestion.bodyText,
          suggested_action: topSuggestion.suggestedAction,
          context: context,
          model_version: "claude-3-5-haiku-20241022",
          confidence_score: topSuggestion.confidenceScore,
          personalization_score: topSuggestion.personalizationScore,
          reviewed: false,
          used: false,
        });
      }

      // Store confidence factors
      await supabase.from("ai_confidence_factors").insert({
        business_id: businessId,
        deal_id: dealId,
        deal_value_fit: confidenceFactors.dealValueFit,
        customer_profile_match: confidenceFactors.customerProfileMatch,
        sales_cycle_alignment: confidenceFactors.salesCycleAlignment,
        manager_success_rate: confidenceFactors.managerSuccessRate,
        activity_momentum: confidenceFactors.activityMomentum,
        overall_confidence: confidenceFactors.overallConfidence,
        recommendation_text: recommendations[0]?.rationale || "",
        calculation_version: "1.0",
      });
    } catch (dbError) {
      console.error("Error storing in database:", dbError);
      // Continue anyway - return results even if DB save fails
    }

    return new Response(
      JSON.stringify({
        emailSuggestions,
        confidenceFactors,
        recommendations,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in ai-manager-layer function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
