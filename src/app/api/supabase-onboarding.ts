/**
 * Smart Onboarding Database Integration Layer
 * Comprehensive CRUD operations for onboarding data, preferences, pipelines, and automations
 */

import { supabase } from '../lib/supabase';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

export interface FeaturePreferences {
  product_catalog: boolean;
  lead_management: boolean;
  email_campaigns: boolean;
  automation: boolean;
  social_media: boolean;
  [key: string]: boolean;
}

export interface ThemePreference {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  layout: 'compact' | 'comfortable' | 'spacious';
  darkMode: boolean;
}

const DEFAULT_THEME: ThemePreference = {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#F59E0B',
  layout: 'comfortable',
  darkMode: false,
};

const DEFAULT_FEATURES: FeaturePreferences = {
  product_catalog: true,
  lead_management: false,
  email_campaigns: false,
  automation: false,
  social_media: false,
};

export interface Pipeline {
  id?: string;
  businessId: string;
  name: string;
  description?: string;
  stages: Array<{ name: string; order: number }>;
  createdFromAI?: boolean;
}

export interface AutomationRule {
  id?: string;
  businessId: string;
  ruleName: string;
  triggerType: string;
  triggerConditions?: Record<string, any>;
  actionType: string;
  actionConfig?: Record<string, any>;
  isActive?: boolean;
  createdFromOnboarding?: boolean;
}

export interface JourneyAnswers {
  businessGoals?: string[];
  targetAudience?: string;
  currentChallenges?: string[];
  preferredFeatures?: string[];
  monthlyBudget?: string;
  [key: string]: any;
}

export interface OnboardingData {
  featurePreferences: FeaturePreferences;
  themePreference: ThemePreference;
  featuredFeatures: string[];
  pipelineTemplates: string[];
  journeyAnswers: JourneyAnswers;
}

export interface CompleteOnboardingData extends OnboardingData {
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  pipelines: Pipeline[];
  automations: AutomationRule[];
}

export interface OnboardingStatus {
  status: 'pending' | 'in_progress' | 'completed';
  phase?: number;
  completedAt?: string;
}

// ─── VALIDATION FUNCTIONS ───────────────────────────────────────────────────

function validateFeaturePreferences(prefs: any): FeaturePreferences {
  if (!prefs || typeof prefs !== 'object') return DEFAULT_FEATURES;
  const validated: FeaturePreferences = { ...DEFAULT_FEATURES };
  for (const key of Object.keys(validated)) {
    if (typeof prefs[key] === 'boolean') validated[key] = prefs[key];
  }
  return validated;
}

function validateThemePreference(theme: any): ThemePreference {
  if (!theme || typeof theme !== 'object') return DEFAULT_THEME;
  const validated: ThemePreference = { ...DEFAULT_THEME };
  if (typeof theme.primaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(theme.primaryColor)) {
    validated.primaryColor = theme.primaryColor;
  }
  if (typeof theme.secondaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(theme.secondaryColor)) {
    validated.secondaryColor = theme.secondaryColor;
  }
  if (typeof theme.accentColor === 'string' && /^#[0-9A-F]{6}$/i.test(theme.accentColor)) {
    validated.accentColor = theme.accentColor;
  }
  if (['compact', 'comfortable', 'spacious'].includes(theme.layout)) {
    validated.layout = theme.layout;
  }
  if (typeof theme.darkMode === 'boolean') validated.darkMode = theme.darkMode;
  return validated;
}

function validateJsonB(data: any, maxDepth: number = 5): Record<string, any> {
  if (maxDepth <= 0) throw new Error('JSON structure exceeds maximum nesting depth');
  if (data === null || data === undefined) return {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid JSONB structure: must be an object');
  }
  const validated: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      console.warn(`Skipping invalid key: ${key}`);
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      validated[key] = validateJsonB(value, maxDepth - 1);
    } else if (Array.isArray(value)) {
      validated[key] = value.filter((v) => v !== null);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      validated[key] = value;
    }
  }
  return validated;
}

// ─── SAVE FUNCTIONS ─────────────────────────────────────────────────────────

export async function saveOnboardingData(userId: string, data: OnboardingData): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId provided');

  try {
    const validatedPreferences = validateFeaturePreferences(data.featurePreferences);
    const validatedTheme = validateThemePreference(data.themePreference);
    const validatedAnswers = validateJsonB(data.journeyAnswers);
    const featuredFeatures = Array.isArray(data.featuredFeatures) ? data.featuredFeatures : [];
    const pipelineTemplates = Array.isArray(data.pipelineTemplates) ? data.pipelineTemplates : [];

    const { error } = await supabase
      .from('biz_users')
      .update({
        feature_preferences: validatedPreferences,
        theme_preference: validatedTheme,
        featured_features: featuredFeatures,
        pipeline_templates: pipelineTemplates,
        journey_answers: validatedAnswers,
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw new Error(`Failed to save onboarding data: ${error.message}`);
  } catch (err) {
    console.error('saveOnboardingData error:', err);
    throw err;
  }
}

export async function saveGeneratedPipelines(businessId: string, pipelines: Pipeline[]): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!businessId || !Array.isArray(pipelines) || pipelines.length === 0) return;

  try {
    const records = pipelines.map((pipeline) => ({
      business_id: businessId,
      name: pipeline.name || 'Untitled Pipeline',
      description: pipeline.description || null,
      stages: pipeline.stages || [],
      created_from_onboarding: true,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('business_pipelines').insert(records);

    if (error) {
      if (error.code === '23505') {
        console.warn('Some pipelines already exist, skipping duplicates');
        return;
      }
      throw new Error(`Failed to save pipelines: ${error.message}`);
    }
  } catch (err) {
    console.error('saveGeneratedPipelines error:', err);
    throw err;
  }
}

export async function saveGeneratedAutomations(
  businessId: string,
  automations: AutomationRule[]
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!businessId || !Array.isArray(automations) || automations.length === 0) return;

  try {
    const records = automations.map((automation) => ({
      business_id: businessId,
      rule_name: automation.ruleName || 'Untitled Rule',
      trigger_type: automation.triggerType || 'manual',
      trigger_conditions: automation.triggerConditions || {},
      action_type: automation.actionType || 'unknown',
      action_config: automation.actionConfig || {},
      is_active: automation.isActive !== false,
      created_from_onboarding: true,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('automation_rules').insert(records);

    if (error) {
      if (error.code === '23505') {
        console.warn('Some automation rules already exist, skipping duplicates');
        return;
      }
      throw new Error(`Failed to save automations: ${error.message}`);
    }
  } catch (err) {
    console.error('saveGeneratedAutomations error:', err);
    throw err;
  }
}

export async function updateOnboardingStatus(
  userId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');
  if (!['pending', 'in_progress', 'completed'].includes(status)) throw new Error('Invalid status');

  try {
    const updateData: any = { onboarding_status: status };
    if (status === 'completed') {
      updateData.onboarding_completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('biz_users').update(updateData).eq('id', userId);
    if (error) throw new Error(`Failed to update status: ${error.message}`);
  } catch (err) {
    console.error('updateOnboardingStatus error:', err);
    throw err;
  }
}

export async function updateFeaturePreferences(
  userId: string,
  prefs: Partial<FeaturePreferences>
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data, error: fetchError } = await supabase
      .from('biz_users')
      .select('feature_preferences')
      .eq('id', userId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch existing preferences: ${fetchError.message}`);

    const existing = (data?.feature_preferences as FeaturePreferences) || DEFAULT_FEATURES;
    const merged = { ...existing, ...prefs };
    const validated = validateFeaturePreferences(merged);

    const { error } = await supabase
      .from('biz_users')
      .update({ feature_preferences: validated })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  } catch (err) {
    console.error('updateFeaturePreferences error:', err);
    throw err;
  }
}

export async function updateThemePreference(
  userId: string,
  theme: Partial<ThemePreference>
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data, error: fetchError } = await supabase
      .from('biz_users')
      .select('theme_preference')
      .eq('id', userId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch existing theme: ${fetchError.message}`);

    const existing = (data?.theme_preference as ThemePreference) || DEFAULT_THEME;
    const merged = { ...existing, ...theme };
    const validated = validateThemePreference(merged);

    const { error } = await supabase
      .from('biz_users')
      .update({ theme_preference: validated })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update theme: ${error.message}`);
  } catch (err) {
    console.error('updateThemePreference error:', err);
    throw err;
  }
}

// ─── FETCH FUNCTIONS ────────────────────────────────────────────────────────

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data, error } = await supabase
      .from('biz_users')
      .select('onboarding_status, onboarding_step, onboarding_completed_at')
      .eq('id', userId)
      .single();

    if (error) throw new Error(`Failed to fetch status: ${error.message}`);
    if (!data) throw new Error('User not found');

    return {
      status: (data.onboarding_status || 'pending') as 'pending' | 'in_progress' | 'completed',
      phase: data.onboarding_step || 0,
      completedAt: data.onboarding_completed_at || undefined,
    };
  } catch (err) {
    console.error('getOnboardingStatus error:', err);
    throw err;
  }
}

export async function getFeaturePreferences(userId: string): Promise<FeaturePreferences> {
  if (!supabase) return DEFAULT_FEATURES;
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data, error } = await supabase
      .from('biz_users')
      .select('feature_preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Failed to fetch preferences, returning defaults');
      return DEFAULT_FEATURES;
    }

    return validateFeaturePreferences(data?.feature_preferences);
  } catch (err) {
    console.warn('getFeaturePreferences error, returning defaults');
    return DEFAULT_FEATURES;
  }
}

export async function getThemePreference(userId: string): Promise<ThemePreference> {
  if (!supabase) return DEFAULT_THEME;
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data, error } = await supabase
      .from('biz_users')
      .select('theme_preference')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Failed to fetch theme, returning defaults');
      return DEFAULT_THEME;
    }

    return validateThemePreference(data?.theme_preference);
  } catch (err) {
    console.warn('getThemePreference error, returning defaults');
    return DEFAULT_THEME;
  }
}

export async function getOnboardingData(userId: string): Promise<CompleteOnboardingData> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');

  try {
    const { data: userData, error: userError } = await supabase
      .from('biz_users')
      .select(
        'id, feature_preferences, theme_preference, featured_features, pipeline_templates, journey_answers, onboarding_status, onboarding_completed_at, business_id'
      )
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`Failed to fetch user data: ${userError.message}`);
    if (!userData) throw new Error('User not found');

    const { data: pipelines = [], error: pipelinesError } = await supabase
      .from('business_pipelines')
      .select('*')
      .eq('business_id', userData.business_id || userId)
      .eq('created_from_onboarding', true)
      .limit(50);

    if (pipelinesError) console.warn('Failed to fetch pipelines');

    const { data: automations = [], error: automationsError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('business_id', userData.business_id || userId)
      .eq('created_from_onboarding', true)
      .limit(50);

    if (automationsError) console.warn('Failed to fetch automations');

    return {
      status: (userData.onboarding_status || 'pending') as 'pending' | 'in_progress' | 'completed',
      completedAt: userData.onboarding_completed_at,
      featurePreferences: validateFeaturePreferences(userData.feature_preferences),
      themePreference: validateThemePreference(userData.theme_preference),
      featuredFeatures: Array.isArray(userData.featured_features) ? userData.featured_features : [],
      pipelineTemplates: Array.isArray(userData.pipeline_templates) ? userData.pipeline_templates : [],
      journeyAnswers: userData.journey_answers || {},
      pipelines: (pipelines || []).map((p) => ({
        id: p.id,
        businessId: p.business_id,
        name: p.name,
        description: p.description,
        stages: p.stages || [],
      })),
      automations: (automations || []).map((a) => ({
        id: a.id,
        businessId: a.business_id,
        ruleName: a.rule_name,
        triggerType: a.trigger_type,
        triggerConditions: a.trigger_conditions,
        actionType: a.action_type,
        actionConfig: a.action_config,
        isActive: a.is_active,
      })),
    };
  } catch (err) {
    console.error('getOnboardingData error:', err);
    throw err;
  }
}

export async function getBusinessPipelines(businessId: string): Promise<Pipeline[]> {
  if (!supabase) return [];
  if (!businessId) throw new Error('Invalid businessId');

  try {
    const { data, error } = await supabase
      .from('business_pipelines')
      .select('id, business_id, name, description, stages')
      .eq('business_id', businessId)
      .eq('created_from_onboarding', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Failed to fetch pipelines');
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      businessId: p.business_id,
      name: p.name,
      description: p.description,
      stages: p.stages || [],
    }));
  } catch (err) {
    console.warn('getBusinessPipelines error');
    return [];
  }
}

export async function getBusinessAutomations(businessId: string): Promise<AutomationRule[]> {
  if (!supabase) return [];
  if (!businessId) throw new Error('Invalid businessId');

  try {
    const { data, error } = await supabase
      .from('automation_rules')
      .select(
        'id, business_id, rule_name, trigger_type, trigger_conditions, action_type, action_config, is_active'
      )
      .eq('business_id', businessId)
      .eq('created_from_onboarding', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Failed to fetch automations');
      return [];
    }

    return (data || []).map((a) => ({
      id: a.id,
      businessId: a.business_id,
      ruleName: a.rule_name,
      triggerType: a.trigger_type,
      triggerConditions: a.trigger_conditions,
      actionType: a.action_type,
      actionConfig: a.action_config,
      isActive: a.is_active,
    }));
  } catch (err) {
    console.warn('getBusinessAutomations error');
    return [];
  }
}

// ─── DELETE FUNCTIONS ──────────────────────────────────────────────────────

export async function clearOnboardingData(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('Invalid userId');

  try {
    const { error } = await supabase
      .from('biz_users')
      .update({
        onboarding_status: 'pending',
        onboarding_step: 0,
        onboarding_ai_data: {},
        onboarding_done: false,
      })
      .eq('id', userId);

    if (error) throw new Error(`Failed to clear onboarding data: ${error.message}`);
  } catch (err) {
    console.error('clearOnboardingData error:', err);
    throw err;
  }
}

export async function deleteGeneratedPipelines(businessId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!businessId) throw new Error('Invalid businessId');

  try {
    const { error: autoError } = await supabase
      .from('automation_rules')
      .delete()
      .eq('business_id', businessId)
      .eq('created_from_onboarding', true);

    if (autoError) console.warn('Failed to delete automations');

    const { error: pipelineError } = await supabase
      .from('business_pipelines')
      .delete()
      .eq('business_id', businessId)
      .eq('created_from_onboarding', true);

    if (pipelineError) throw new Error(`Failed to delete pipelines: ${pipelineError.message}`);
  } catch (err) {
    console.error('deleteGeneratedPipelines error:', err);
    throw err;
  }
}

export async function deleteGeneratedAutomations(businessId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!businessId) throw new Error('Invalid businessId');

  try {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('business_id', businessId)
      .eq('created_from_onboarding', true);

    if (error) throw new Error(`Failed to delete automations: ${error.message}`);
  } catch (err) {
    console.error('deleteGeneratedAutomations error:', err);
    throw err;
  }
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const status = await getOnboardingStatus(userId);
    return status.status === 'completed';
  } catch {
    return false;
  }
}

export async function resetCompleteOnboarding(userId: string, businessId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    await clearOnboardingData(userId);
    await updateFeaturePreferences(userId, DEFAULT_FEATURES);
    await updateThemePreference(userId, DEFAULT_THEME);
    await deleteGeneratedPipelines(businessId);
    console.log('Successfully reset onboarding for user:', userId);
  } catch (err) {
    console.error('resetCompleteOnboarding error:', err);
    throw err;
  }
}
