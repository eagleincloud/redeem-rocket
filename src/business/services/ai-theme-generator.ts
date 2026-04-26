/**
 * AI Theme Generator Service
 *
 * Uses Claude AI to analyze onboarding answers and generate custom theme recommendations
 * Based on business type, features selected, and user preferences
 */

import { supabase } from '@/app/lib/supabase';

export interface OnboardingAnswers {
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

export interface ThemeConfig {
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

export interface ThemeGenerationResult {
  theme: ThemeConfig;
  rationale: string;
  recommendations: string[];
  confidence: number;
}

/**
 * Generate a custom theme using Claude AI based on onboarding answers
 */
export async function generateThemeWithAI(
  answers: OnboardingAnswers
): Promise<ThemeGenerationResult> {
  try {
    // Call Edge Function to generate theme with Claude
    const response = await supabase.functions.invoke('generate-theme', {
      body: {
        answers,
        timestamp: new Date().toISOString(),
      },
    });

    if (response.error) {
      console.error('Theme generation error:', response.error);
      return getDefaultTheme(answers);
    }

    return response.data as ThemeGenerationResult;
  } catch (error) {
    console.error('Failed to generate theme with AI:', error);
    return getDefaultTheme(answers);
  }
}

/**
 * Generate theme recommendations without AI (fallback)
 * Uses rule-based approach based on business type
 */
export function getDefaultTheme(answers: OnboardingAnswers): ThemeGenerationResult {
  const businessType = answers.businessType?.toLowerCase() || 'general';
  const features = answers.selectedFeatures || [];

  // Color schemes by business type
  const colorSchemes: Record<string, Partial<ThemeConfig>> = {
    restaurant: {
      primaryColor: '#FF6B35', // Warm orange
      secondaryColor: '#004E89', // Deep blue
      accentColor: '#F7931E', // Vibrant orange
      backgroundColor: '#FFF8F3',
      textColor: '#1A1A1A',
      borderColor: '#E0D5C7',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',
      layout: 'visual-focused',
      fontFamily: 'playful',
      borderRadius: 'rounded',
      shadowIntensity: 'medium',
      spacing: 'comfortable',
    },
    ecommerce: {
      primaryColor: '#7C3AED', // Purple
      secondaryColor: '#EC4899', // Pink
      accentColor: '#06B6D4', // Cyan
      backgroundColor: '#F8FAFC',
      textColor: '#0F172A',
      borderColor: '#CBD5E1',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',
      layout: 'data-heavy',
      fontFamily: 'modern',
      borderRadius: 'smooth',
      shadowIntensity: 'light',
      spacing: 'compact',
    },
    saas: {
      primaryColor: '#3B82F6', // Blue
      secondaryColor: '#8B5CF6', // Indigo
      accentColor: '#06B6D4', // Cyan
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      borderColor: '#E5E7EB',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',
      layout: 'data-heavy',
      fontFamily: 'professional',
      borderRadius: 'smooth',
      shadowIntensity: 'light',
      spacing: 'comfortable',
    },
    service: {
      primaryColor: '#059669', // Green
      secondaryColor: '#0891B2', // Cyan
      accentColor: '#F59E0B', // Amber
      backgroundColor: '#F0FDF4',
      textColor: '#064E3B',
      borderColor: '#D1FAE5',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',
      layout: 'minimalist',
      fontFamily: 'professional',
      borderRadius: 'rounded',
      shadowIntensity: 'medium',
      spacing: 'spacious',
    },
    creative: {
      primaryColor: '#EC4899', // Pink
      secondaryColor: '#F97316', // Orange
      accentColor: '#8B5CF6', // Purple
      backgroundColor: '#FAFAFA',
      textColor: '#1F2937',
      borderColor: '#E5E5E5',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',
      layout: 'visual-focused',
      fontFamily: 'playful',
      borderRadius: 'rounded',
      shadowIntensity: 'heavy',
      spacing: 'spacious',
    },
  };

  // Get base scheme or default
  const baseScheme = colorSchemes[businessType] || colorSchemes.general;

  // Adjust based on features
  let layout: ThemeConfig['layout'] = baseScheme.layout || 'data-heavy';
  if (features.length < 3) {
    layout = 'minimalist';
  } else if (features.length > 7) {
    layout = 'data-heavy';
  }

  const theme: ThemeConfig = {
    primaryColor: baseScheme.primaryColor || '#3B82F6',
    secondaryColor: baseScheme.secondaryColor || '#8B5CF6',
    accentColor: baseScheme.accentColor || '#06B6D4',
    backgroundColor: baseScheme.backgroundColor || '#FFFFFF',
    textColor: baseScheme.textColor || '#1F2937',
    borderColor: baseScheme.borderColor || '#E5E7EB',
    successColor: baseScheme.successColor || '#10B981',
    warningColor: baseScheme.warningColor || '#F59E0B',
    errorColor: baseScheme.errorColor || '#EF4444',
    infoColor: baseScheme.infoColor || '#3B82F6',
    layout,
    fontFamily: baseScheme.fontFamily || 'modern',
    borderRadius: baseScheme.borderRadius || 'rounded',
    shadowIntensity: baseScheme.shadowIntensity || 'medium',
    spacing: baseScheme.spacing || 'comfortable',
  };

  return {
    theme,
    rationale: `Default theme selected for ${businessType} business with ${features.length} features`,
    recommendations: [
      'Customize colors in settings to match your brand',
      'Try different layout options to find what works best',
      'Adjust font and spacing based on your preference',
    ],
    confidence: 0.6,
  };
}

/**
 * Convert theme config to CSS variables
 */
export function themeToCSSVariables(theme: ThemeConfig): string {
  return `
    --primary: ${theme.primaryColor};
    --secondary: ${theme.secondaryColor};
    --accent: ${theme.accentColor};
    --background: ${theme.backgroundColor};
    --text: ${theme.textColor};
    --border: ${theme.borderColor};
    --success: ${theme.successColor};
    --warning: ${theme.warningColor};
    --error: ${theme.errorColor};
    --info: ${theme.infoColor};
    --layout: ${theme.layout};
    --font-family: ${getFontFamily(theme.fontFamily)};
    --border-radius: ${getBorderRadius(theme.borderRadius)};
    --shadow-intensity: ${getShadowIntensity(theme.shadowIntensity)};
    --spacing: ${getSpacing(theme.spacing)};
  `;
}

/**
 * Apply theme to DOM
 */
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  const cssVars = themeToCSSVariables(theme);

  // Set CSS variables
  cssVars.split(';').forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      root.style.setProperty(key, value);
    }
  });

  // Store in localStorage
  localStorage.setItem('selectedTheme', JSON.stringify(theme));

  // Add data attribute for CSS selectors
  root.setAttribute('data-layout', theme.layout);
  root.setAttribute('data-font', theme.fontFamily);
}

/**
 * Get font family value
 */
function getFontFamily(font: string): string {
  const fonts: Record<string, string> = {
    modern: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    traditional: "Georgia, 'Times New Roman', serif",
    playful: "'Comic Sans MS', 'Trebuchet MS', cursive",
    professional: "'Helvetica Neue', Arial, sans-serif",
  };
  return fonts[font] || fonts.modern;
}

/**
 * Get border radius value
 */
function getBorderRadius(radius: string): string {
  const radiuses: Record<string, string> = {
    sharp: '0px',
    rounded: '8px',
    smooth: '16px',
  };
  return radiuses[radius] || '8px';
}

/**
 * Get shadow intensity value
 */
function getShadowIntensity(intensity: string): string {
  const shadows: Record<string, string> = {
    light: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    heavy: '0 20px 25px rgba(0, 0, 0, 0.15)',
  };
  return shadows[intensity] || shadows.medium;
}

/**
 * Get spacing value
 */
function getSpacing(spacing: string): string {
  const spacings: Record<string, string> = {
    compact: '8px',
    comfortable: '16px',
    spacious: '24px',
  };
  return spacings[spacing] || '16px';
}

/**
 * Save theme to database
 */
export async function saveThemeToDatabase(
  businessId: string,
  theme: ThemeConfig,
  answers: OnboardingAnswers
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('business_themes')
      .upsert(
        {
          business_id: businessId,
          theme_config: theme,
          onboarding_answers: answers,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id' }
      );

    if (error) {
      console.error('Error saving theme:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save theme to database:', error);
    return false;
  }
}

/**
 * Load theme from database
 */
export async function loadThemeFromDatabase(
  businessId: string
): Promise<ThemeConfig | null> {
  try {
    const { data, error } = await supabase
      .from('business_themes')
      .select('theme_config')
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.theme_config as ThemeConfig;
  } catch (error) {
    console.error('Failed to load theme from database:', error);
    return null;
  }
}
