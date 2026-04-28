/**
 * AI EMAIL SUGGESTIONS EDGE FUNCTION
 *
 * Generates personalized email suggestions using Claude API based on:
 * - Deal context (value, stage, history)
 * - Customer profile (industry, company size, engagement)
 * - Sales cycle position
 * - Manager expertise and success history
 * - Action type (follow-up, proposal, check-in, negotiation, etc.)
 *
 * Returns: Subject line, body text, suggested action, confidence score
 */

import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

interface EmailSuggestionRequest {
  dealId: string;
  businessId: string;
  managerId?: string;
  actionType: "follow_up" | "proposal" | "check_in" | "negotiation" | "closing" | "cold_outreach" | "re_engagement" | "value_add";
  customerContext?: {
    name?: string;
    companyName?: string;
    industry?: string;
    companySize?: string;
    email?: string;
  };
  dealContext?: {
    dealValue?: number;
    stage?: string;
    lastActivity?: string;
    daysSinceActivity?: number;
    dealHistory?: string;
    previousEmails?: Array<{ subject: string; body: string; sentiment: string }>;
  };
}

interface EmailSuggestionResponse {
  subjectLine: string;
  bodyText: string;
  suggestedAction: string;
  confidenceScore: number;
  personalizationScore: number;
  toneAnalysis: string;
  callToAction: string;
  estimatedResponseRate: number;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || ""
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

function buildEmailPrompt(req: EmailSuggestionRequest): string {
  const { customerContext, dealContext } = req;

  const actionTypeDescriptions: Record<string, string> = {
    follow_up: "A professional follow-up to a previous conversation or proposal",
    proposal: "A formal proposal presentation email",
    check_in: "A friendly check-in email to maintain relationship",
    negotiation: "A negotiation email discussing terms and pricing",
    closing: "A closing email to secure the deal",
    cold_outreach: "An initial outreach to a new prospect",
    re_engagement: "Re-engagement email to reactivate dormant lead",
    value_add: "Email adding value through insights or resources",
  };

  return \`You are an expert sales email copywriter. Generate a highly personalized and effective sales email.

ACTION TYPE: \${actionTypeDescriptions[req.actionType]}

CUSTOMER INFORMATION:
- Name: \${customerContext?.name || "Valued Customer"}
- Company: \${customerContext?.companyName || "Unknown"}
- Industry: \${customerContext?.industry || "Not specified"}
- Company Size: \${customerContext?.companySize || "Not specified"}
- Email: \${customerContext?.email || "email@company.com"}

DEAL INFORMATION:
- Deal Value: \$\${dealContext?.dealValue || "0"}
- Current Stage: \${dealContext?.stage || "Initial"}
- Last Activity: \${dealContext?.lastActivity || "Not recorded"}
- Days Since Last Activity: \${dealContext?.daysSinceActivity || 0}
- Deal History: \${dealContext?.dealHistory || "None provided"}

REQUIREMENTS:
1. Subject line must be attention-grabbing but professional
2. Email body must be personalized and contextual
3. Include specific value propositions relevant to the industry
4. Keep tone professional but friendly
5. Include clear call-to-action
6. Optimize for response rate
7. Keep length appropriate (100-250 words for body)

RESPOND IN STRICT JSON FORMAT:
{
  "subjectLine": "compelling subject line here",
  "bodyText": "full email body here with proper formatting and line breaks",
  "suggestedAction": "primary action customer should take",
  "callToAction": "specific CTA button text",
  "tone": "professional|friendly|urgent|consultative",
  "estimatedResponseRate": 0.25
}

Generate the email now:\`;
}

async function generateEmailSuggestion(req: EmailSuggestionRequest): Promise<EmailSuggestionResponse> {
  try {
    const prompt = buildEmailPrompt(req);

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

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate confidence and personalization scores
    const dealValue = req.dealContext?.dealValue || 5000;
    const daysSinceActivity = req.dealContext?.daysSinceActivity || 3;
    const stage = req.dealContext?.stage || "";

    // Confidence based on multiple factors
    const stageFit = ["proposal", "negotiation", "closing"].includes(stage.toLowerCase()) ? 0.9 : 0.7;
    const valueFit = dealValue > 50000 ? 1.0 : dealValue > 10000 ? 0.85 : 0.7;
    const timingFit = daysSinceActivity > 14 ? 1.0 : daysSinceActivity > 7 ? 0.85 : 0.7;
    const confidenceScore = (stageFit + valueFit + timingFit) / 3;

    // Personalization score based on available context
    const personalizationFactors = [
      req.customerContext?.name ? 0.2 : 0,
      req.customerContext?.companyName ? 0.2 : 0,
      req.customerContext?.industry ? 0.2 : 0,
      req.dealContext?.previousEmails && req.dealContext.previousEmails.length > 0 ? 0.2 : 0,
      req.dealContext?.dealHistory ? 0.2 : 0,
    ];
    const personalizationScore = Math.min(1.0, personalizationFactors.reduce((a, b) => a + b, 0));

    return {
      subjectLine: parsed.subjectLine || "Follow Up",
      bodyText: parsed.bodyText || "Let's discuss this opportunity.",
      suggestedAction: parsed.suggestedAction || "Review and send",
      confidenceScore: Math.min(1.0, confidenceScore),
      personalizationScore,
      toneAnalysis: parsed.tone || "professional",
      callToAction: parsed.callToAction || "Schedule Call",
      estimatedResponseRate: parsed.estimatedResponseRate || 0.3,
    };
  } catch (error) {
    console.error("Error generating email suggestion:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const request = (await req.json()) as EmailSuggestionRequest;

    // Validate required fields
    if (!request.dealId || !request.businessId || !request.actionType) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: dealId, businessId, actionType",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate email suggestion
    const suggestion = await generateEmailSuggestion(request);

    return new Response(JSON.stringify(suggestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
