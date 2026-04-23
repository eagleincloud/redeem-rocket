/**
 * Onboarding AI API Wrapper
 * Provides typed wrappers for Supabase Edge Functions calls
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Base API call function
 */
async function callSupabaseFunction<T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: ApiOptions
): Promise<T> {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured');
  }

  const url = `${SUPABASE_URL}/functions/v1/biz-onboarding-ai${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: options?.method || 'POST',
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`[onboarding-ai] Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Extract business info from website URL
 */
export async function extractBusinessData(
  url: string,
  businessType: string
): Promise<{
  businessDescription?: string;
  products?: string[];
  operatingHours?: string;
  contactInfo?: string;
  industries?: string[];
}> {
  return callSupabaseFunction('/extract-from-url', {
    url,
    businessType,
  });
}

/**
 * Generate product catalog from business data
 */
export async function generateProductCatalog(
  businessData: {
    businessType: string;
    businessName: string;
    websiteUrl?: string;
    description?: string;
  }
): Promise<{
  products: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price?: string;
  }>;
}> {
  return callSupabaseFunction('/build-products', {
    url: businessData.websiteUrl || '',
    businessType: businessData.businessType,
    businessName: businessData.businessName,
  });
}

/**
 * Create automation rules based on features
 */
export async function createAutomationRules(
  features: string[],
  businessType: string
): Promise<{
  automations: Array<{
    id: string;
    name: string;
    trigger: string;
    actions: string[];
    description: string;
  }>;
}> {
  return callSupabaseFunction('/generate-automations', {
    businessType,
    selectedFeatures: features,
    pipelines: [],
  });
}

/**
 * Parse natural language input (e.g., hours, locations)
 */
export async function parseNaturalLanguage(
  text: string,
  fieldType?: string
): Promise<{
  parsed: Record<string, any>;
  confidence: number;
  originalText: string;
}> {
  return callSupabaseFunction('/parse-natural-language', {
    text,
    fieldType,
  });
}

/**
 * Generate email sequences
 */
export async function generateEmailSequences(
  businessType: string,
  selectedFeatures: string[],
  businessData?: Record<string, any>
): Promise<{
  sequences: Array<{
    id: string;
    name: string;
    emails: Array<{
      order: number;
      subject: string;
      preview: string;
    }>;
  }>;
}> {
  return callSupabaseFunction('/generate-automations', {
    businessType,
    selectedFeatures,
    pipelines: [],
  });
}

/**
 * Generate complete pipelines
 */
export async function generatePipelines(
  businessType: string,
  businessName: string,
  selectedFeatures: string[],
  dynamicAnswers?: Record<string, any>
): Promise<{
  pipelines: Array<{
    id: string;
    name: string;
    description: string;
    stages: Array<{
      id: string;
      name: string;
      position: number;
    }>;
  }>;
}> {
  return callSupabaseFunction('/generate-pipelines', {
    businessType,
    businessName,
    selectedFeatures,
    dynamicAnswers: dynamicAnswers || {},
  });
}

/**
 * Describe business based on type and details
 */
export async function describeBusiness(
  businessType: string,
  businessName: string,
  websiteText?: string
): Promise<{
  descriptions: string[];
  recommendations?: Record<string, any>;
}> {
  return callSupabaseFunction('/describe', {
    businessType,
    businessName,
    websiteText: websiteText || '',
  });
}

/**
 * All-in-one smart setup function
 * Orchestrates multiple AI steps
 */
export async function smartSetup(params: {
  businessType: string;
  businessName: string;
  businessWebsite?: string;
  selectedFeatures: string[];
  dynamicAnswers?: Record<string, any>;
}): Promise<{
  businessDescription?: string;
  pipelines: any[];
  automations: any[];
  products?: any[];
  emailSequences?: any[];
  success: boolean;
}> {
  try {
    const results: {
      businessDescription?: string;
      pipelines: any[];
      automations: any[];
      products?: any[];
      emailSequences?: any[];
      success: boolean;
    } = {
      pipelines: [],
      automations: [],
      success: false,
    };

    // Step 1: Generate pipelines
    const pipelineResult = await generatePipelines(
      params.businessType,
      params.businessName,
      params.selectedFeatures,
      params.dynamicAnswers
    );
    results.pipelines = pipelineResult.pipelines;

    // Step 2: Generate automations
    const automationResult = await createAutomationRules(
      params.selectedFeatures,
      params.businessType
    );
    results.automations = automationResult.automations;

    // Step 3: Generate product catalog if needed
    if (params.selectedFeatures.includes('product_catalog') && params.businessWebsite) {
      try {
        const productResult = await generateProductCatalog({
          businessType: params.businessType,
          businessName: params.businessName,
          websiteUrl: params.businessWebsite,
        });
        results.products = productResult.products;
      } catch (error) {
        console.warn('[smartSetup] Product generation failed, continuing...', error);
      }
    }

    // Step 4: Generate email sequences if needed
    if (params.selectedFeatures.includes('email_campaigns')) {
      try {
        const emailResult = await generateEmailSequences(
          params.businessType,
          params.selectedFeatures,
          params.dynamicAnswers
        );
        results.emailSequences = emailResult.sequences;
      } catch (error) {
        console.warn('[smartSetup] Email sequence generation failed, continuing...', error);
      }
    }

    results.success = true;
    return results;
  } catch (error) {
    console.error('[smartSetup] Error during smart setup:', error);
    throw error;
  }
}

/**
 * Validate smart setup results
 */
export function validateSmartSetupResults(
  results: any
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!results.pipelines || results.pipelines.length === 0) {
    errors.push('No pipelines were generated');
  }

  if (!results.automations || results.automations.length === 0) {
    warnings.push('No automations were generated');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
