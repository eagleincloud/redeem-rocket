/**
 * Configurable System API Functions
 * Layer 4 - Platform Customization without Code
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Type Definitions
export interface CustomFieldData {
  id: string;
  businessId: string;
  fieldName: string;
  fieldSlug: string;
  fieldType: 'text' | 'number' | 'date' | 'dropdown' | 'multiselect' | 'checkbox' | 'email' | 'phone' | 'url' | 'rich_text';
  displayType: string;
  isRequired: boolean;
  defaultValue?: string;
  helpText?: string;
  placeholderText?: string;
  options?: Array<{ label: string; value: string; color?: string }>;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageConfig {
  id: string;
  businessId: string;
  pipelineId: string;
  stageName: string;
  stageOrder: number;
  stageColor: string;
  stageIcon?: string;
  description?: string;
  isTerminalStage: boolean;
  autoArchiveAfterDays?: number;
  warnAfterDays?: number;
  canSkipStage: boolean;
  requiredFieldsToAdvance?: string[];
  createdAt: string;
}

export interface RolePermission {
  id: string;
  businessId: string;
  roleName: string;
  roleSlug: string;
  description?: string;
  isSystem: boolean;
  permissions: Record<string, any>;
  fieldPermissions?: Record<string, any>;
  canOnlyEditAssignedEntities: boolean;
  canOnlyViewOwnTeam: boolean;
  maxEntitiesCanCreate?: number;
  apiRateLimit: number;
  userCount: number;
}

// Custom Field Management
export async function createCustomField(
  businessId: string,
  fieldData: Omit<CustomFieldData, 'id' | 'businessId' | 'isSystem' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<CustomFieldData> {
  try {
    const { data, error } = await supabaseClient
      .from('custom_fields')
      .insert({
        business_id: businessId,
        field_name: fieldData.fieldName,
        field_slug: fieldData.fieldSlug,
        field_type: fieldData.fieldType,
        display_type: fieldData.displayType,
        is_required: fieldData.isRequired,
        default_value: fieldData.defaultValue,
        help_text: fieldData.helpText,
        placeholder_text: fieldData.placeholderText,
        options: fieldData.options || [],
        created_by: userId,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create custom field');

    return formatCustomField(data);
  } catch (error) {
    console.error('Failed to create custom field:', error);
    throw error;
  }
}

export async function updateCustomField(
  businessId: string,
  fieldId: string,
  userId: string,
  updates: Partial<Omit<CustomFieldData, 'id' | 'businessId' | 'fieldSlug' | 'fieldType' | 'isSystem'>>
): Promise<CustomFieldData> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.fieldName) updateData.field_name = updates.fieldName;
    if (updates.displayType) updateData.display_type = updates.displayType;
    if (updates.isRequired !== undefined) updateData.is_required = updates.isRequired;
    if (updates.defaultValue) updateData.default_value = updates.defaultValue;
    if (updates.helpText) updateData.help_text = updates.helpText;
    if (updates.placeholderText) updateData.placeholder_text = updates.placeholderText;
    if (updates.options) updateData.options = updates.options;

    const { data, error } = await supabaseClient
      .from('custom_fields')
      .update(updateData)
      .eq('id', fieldId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Custom field not found');

    return formatCustomField(data);
  } catch (error) {
    console.error('Failed to update custom field:', error);
    throw error;
  }
}

export async function deleteCustomField(businessId: string, fieldId: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('custom_fields')
      .delete()
      .eq('id', fieldId)
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete custom field:', error);
    throw error;
  }
}

export async function getCustomFields(businessId: string): Promise<CustomFieldData[]> {
  try {
    const { data, error } = await supabaseClient
      .from('custom_fields')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(formatCustomField);
  } catch (error) {
    console.error('Failed to get custom fields:', error);
    throw error;
  }
}

// Pipeline Stage Management
export async function updatePipelineStages(
  businessId: string,
  pipelineId: string,
  stages: Omit<PipelineStageConfig, 'id' | 'businessId' | 'pipelineId' | 'createdAt'>[]
): Promise<PipelineStageConfig[]> {
  try {
    await supabaseClient
      .from('pipeline_stages_config')
      .delete()
      .eq('pipeline_id', pipelineId)
      .eq('business_id', businessId);

    const stageData = stages.map(stage => ({
      business_id: businessId,
      pipeline_id: pipelineId,
      stage_name: stage.stageName,
      stage_order: stage.stageOrder,
      stage_color: stage.stageColor,
      stage_icon: stage.stageIcon,
      description: stage.description,
      is_terminal_stage: stage.isTerminalStage,
      auto_archive_after_days: stage.autoArchiveAfterDays,
      warn_after_days: stage.warnAfterDays,
      can_skip_stage: stage.canSkipStage,
      required_fields_to_advance: stage.requiredFieldsToAdvance || [],
    }));

    const { data, error } = await supabaseClient
      .from('pipeline_stages_config')
      .insert(stageData)
      .select();

    if (error) throw error;
    return (data || []).map(formatPipelineStage);
  } catch (error) {
    console.error('Failed to update pipeline stages:', error);
    throw error;
  }
}

export async function getRoles(businessId: string): Promise<RolePermission[]> {
  try {
    const { data, error } = await supabaseClient
      .from('role_permissions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(formatRole);
  } catch (error) {
    console.error('Failed to get roles:', error);
    throw error;
  }
}

export async function updatePermission(
  roleId: string,
  businessId: string,
  feature: string,
  action: string,
  isAllowed: boolean
): Promise<any> {
  try {
    const { data, error } = await supabaseClient
      .from('permission_matrix')
      .upsert(
        {
          role_id: roleId,
          business_id: businessId,
          feature,
          action,
          is_allowed: isAllowed,
        },
        { onConflict: 'role_id,feature,action' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update permission:', error);
    throw error;
  }
}

// Utility Functions
function formatCustomField(data: any): CustomFieldData {
  return {
    id: data.id,
    businessId: data.business_id,
    fieldName: data.field_name,
    fieldSlug: data.field_slug,
    fieldType: data.field_type,
    displayType: data.display_type,
    isRequired: data.is_required,
    defaultValue: data.default_value,
    helpText: data.help_text,
    placeholderText: data.placeholder_text,
    options: data.options,
    isSystem: data.is_system,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function formatPipelineStage(data: any): PipelineStageConfig {
  return {
    id: data.id,
    businessId: data.business_id,
    pipelineId: data.pipeline_id,
    stageName: data.stage_name,
    stageOrder: data.stage_order,
    stageColor: data.stage_color,
    stageIcon: data.stage_icon,
    description: data.description,
    isTerminalStage: data.is_terminal_stage,
    autoArchiveAfterDays: data.auto_archive_after_days,
    warnAfterDays: data.warn_after_days,
    canSkipStage: data.can_skip_stage,
    requiredFieldsToAdvance: data.required_fields_to_advance,
    createdAt: data.created_at,
  };
}

function formatRole(data: any): RolePermission {
  return {
    id: data.id,
    businessId: data.business_id,
    roleName: data.role_name,
    roleSlug: data.role_slug,
    description: data.description,
    isSystem: data.is_system,
    permissions: data.permissions,
    fieldPermissions: data.field_permissions,
    canOnlyEditAssignedEntities: data.can_only_edit_assigned_entities,
    canOnlyViewOwnTeam: data.can_only_view_own_team,
    maxEntitiesCanCreate: data.max_entities_can_create,
    apiRateLimit: data.api_rate_limit,
    userCount: data.user_count,
  };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}
