/**
 * Generate Theme - Supabase Edge Function
 *
 * Uses Claude AI to analyze onboarding answers and generate a custom theme
 * Called from the frontend after onboarding questions are completed
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.20.11';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

interface OnboardingAnswers {
  businessType: string;
  businessName: string;
  selectedFeatures: string[];
  businessDescription?: string;
  targetAudience?: string;
  industryCategory?: string;
  colorPreference?: string;
  stylePreference?: string;
  additionalNotes?: string;
}

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  layout: 'minimalist' | 'data-heavy' | 'visual-focused' | 'custom';
  fontFamily: 'modern' | 'traditional' | 'playful' | 'professional';
  borderRadius: 'sharp' | 'rounded' | 'smooth';
  shadowIntensity: 'light' | 'medium' | 'heavy';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { answers } = await req.json() as { answers: OnboardingAnswers };

    // Validate input
    if (!answers || !answers.businessType || !Array.isArray(answers.selectedFeatures)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create prompt for Claude
    const prompt = `
You are an expert UI/UX designer and brand strategist. Based on the following business information, generate a custom color scheme and design theme for their dashboard.

Business Information:
- Business Type: ${answers.businessType}
- Business Name: ${answers.businessName}
- Description: ${answers.businessDescription || 'Not provided'}
- Target Audience: ${answers.targetAudience || 'Not specified'}
- Selected Features: ${answers.selectedFeatures.join(', ')}
- Color Preference: ${answers.colorPreference || 'No preference'}
- Style Preference: ${answers.stylePreference || 'Balanced'}
- Additional Notes: ${answers.additionalNotes || 'None'}

Please provide a JSON response with the following structure (NO markdown, pure JSON):
{
  "theme": {
    "primaryColor": "#RRGGBB",
    "secondaryColor": "#RRGGBB",
    "accentColor": "#RRGGBB",
    "backgroundColor": "#RRGGBB",
    "textColor": "#RRGGBB",
    "borderColor": "#RRGGBB",
    "successColor": "#10B981",
    "warningColor": "#F59E0B",
    "errorColor": "#EF4444",
    "infoColor": "#3B82F6",
    "layout": "minimalist|data-heavy|visual-focused|custom",
    "fontFamily": "modern|traditional|playful|professional",
    "borderRadius": "sharp|rounded|smooth",
    "shadowIntensity": "light|medium|heavy",
    "spacing": "compact|comfortable|spacious"
  },
  "rationale": "Explanation of why this theme was chosen",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ],
  "confidence": 0.85
}

Guidelines:
- Use colors that match the business type and target audience
- Choose layout based on feature complexity (more features = data-heavy)
- Pick fonts that reflect the brand personality
- Ensure sufficient contrast for accessibility
- Match overall aesthetic to the industry

Respond with ONLY the JSON object, no additional text.
`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract response text
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let themeResponse;
    try {
      themeResponse = JSON.parse(responseText);
    } catch {
      // If parsing fails, return a basic theme
      console.error('Failed to parse Claude response:', responseText);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
          theme: getDefaultTheme(answers),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate theme response
    if (!themeResponse.theme || !isValidTheme(themeResponse.theme)) {
      console.error('Invalid theme structure from Claude');
      return new Response(
        JSON.stringify({
          error: 'Invalid theme from AI',
          theme: getDefaultTheme(answers),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(themeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Theme generation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate theme',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate theme structure
 */
function isValidTheme(theme: Record<string, unknown>): boolean {
  const requiredFields = [
    'primaryColor',
    'secondaryColor',
    'accentColor',
    'backgroundColor',
    'textColor',
    'borderColor',
    'successColor',
    'warningColor',
    'errorColor',
    'infoColor',
    'layout',
    'fontFamily',
    'borderRadius',
    'shadowIntensity',
    'spacing',
  ];

  return requiredFields.every(field => {
    const value = theme[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Default theme fallback
 */
function getDefaultTheme(answers: OnboardingAnswers) {
  return {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    accentColor: '#06B6D4',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#E5E7EB',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    infoColor: '#3B82F6',
    layout: 'data-heavy' as const,
    fontFamily: 'modern' as const,
    borderRadius: 'rounded' as const,
    shadowIntensity: 'medium' as const,
    spacing: 'comfortable' as const,
  };
}
