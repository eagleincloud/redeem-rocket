/**
 * Custom Fields API - Complete CRUD for custom field system
 * Phase 8: Advanced Customization System
 */

import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Validation rule operations
export async function createValidationRule(businessId: string, rule: any) {
  return supabaseClient
    .from('field_validation_rules')
    .insert({
      business_id: businessId,
      field_id: rule.fieldId,
      rule_type: rule.ruleType,
      rule_value: rule.ruleValue ? JSON.stringify(rule.ruleValue) : null,
      error_message: rule.errorMessage,
      is_active: rule.isActive !== false,
    })
    .select()
    .single();
}

export async function getValidationRules(businessId: string, fieldId: string) {
  return supabaseClient
    .from('field_validation_rules')
    .select('*')
    .eq('business_id', businessId)
    .eq('field_id', fieldId)
    .order('created_at', { ascending: true });
}

export async function updateValidationRule(businessId: string, ruleId: string, updates: any) {
  const updateData: any = {};
  if (updates.errorMessage) updateData.error_message = updates.errorMessage;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  return supabaseClient
    .from('field_validation_rules')
    .update(updateData)
    .eq('id', ruleId)
    .eq('business_id', businessId)
    .select()
    .single();
}

export async function deleteValidationRule(businessId: string, ruleId: string) {
  return supabaseClient
    .from('field_validation_rules')
    .delete()
    .eq('id', ruleId)
    .eq('business_id', businessId);
}

// Conditional logic operations
export async function createConditionalLogic(businessId: string, logic: any) {
  return supabaseClient
    .from('field_conditional_logic')
    .insert({
      business_id: businessId,
      field_id: logic.fieldId,
      trigger_field_id: logic.triggerFieldId,
      condition_type: logic.conditionType,
      condition_value: logic.conditionValue,
      action: logic.action,
      action_value: logic.actionValue,
    })
    .select()
    .single();
}

export async function getConditionalLogics(businessId: string, fieldId: string) {
  return supabaseClient
    .from('field_conditional_logic')
    .select('*')
    .eq('business_id', businessId)
    .eq('field_id', fieldId)
    .order('created_at', { ascending: true });
}

export async function deleteConditionalLogic(businessId: string, logicId: string) {
  return supabaseClient
    .from('field_conditional_logic')
    .delete()
    .eq('id', logicId)
    .eq('business_id', businessId);
}

// Field permission operations
export async function setFieldPermission(businessId: string, permission: any) {
  const { data: existing } = await supabaseClient
    .from('field_permissions')
    .select('id')
    .eq('field_id', permission.fieldId)
    .eq('role_id', permission.roleId)
    .single();

  const data = {
    business_id: businessId,
    field_id: permission.fieldId,
    role_id: permission.roleId,
    permission_type: permission.permissionType,
    entity_type: permission.entityType,
    condition_json: permission.conditionJson,
  };

  if (existing) {
    return supabaseClient
      .from('field_permissions')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    return supabaseClient
      .from('field_permissions')
      .insert(data)
      .select()
      .single();
  }
}

export async function getFieldPermissions(businessId: string, fieldId: string) {
  return supabaseClient
    .from('field_permissions')
    .select('*')
    .eq('business_id', businessId)
    .eq('field_id', fieldId);
}

export async function getRoleFieldPermissions(businessId: string, roleId: string) {
  return supabaseClient
    .from('field_permissions')
    .select('*')
    .eq('business_id', businessId)
    .eq('role_id', roleId);
}

export async function deleteFieldPermission(businessId: string, permissionId: string) {
  return supabaseClient
    .from('field_permissions')
    .delete()
    .eq('id', permissionId)
    .eq('business_id', businessId);
}

// Audit log operations
export async function getFieldAuditLog(businessId: string, fieldId?: string, limit = 100) {
  let query = supabaseClient
    .from('field_audit_log')
    .select('*')
    .eq('business_id', businessId);

  if (fieldId) query = query.eq('field_id', fieldId);

  return query.order('created_at', { ascending: false }).limit(limit);
}

export async function getEntityChangeHistory(businessId: string, entityId: string, entityType: string) {
  return supabaseClient
    .from('field_audit_log')
    .select('*')
    .eq('business_id', businessId)
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .order('created_at', { ascending: false });
}

// Display preset operations
export async function createDisplayPreset(businessId: string, userId: string, preset: any) {
  return supabaseClient
    .from('field_display_presets')
    .insert({
      business_id: businessId,
      preset_name: preset.presetName,
      preset_slug: preset.presetSlug,
      display_config: preset.displayConfig,
      created_by: userId,
    })
    .select()
    .single();
}

export async function getDisplayPresets(businessId: string) {
  return supabaseClient
    .from('field_display_presets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
}

export async function updateDisplayPreset(businessId: string, presetId: string, updates: any) {
  const updateData: any = {};
  if (updates.presetName) updateData.preset_name = updates.presetName;
  if (updates.displayConfig) updateData.display_config = updates.displayConfig;

  return supabaseClient
    .from('field_display_presets')
    .update(updateData)
    .eq('id', presetId)
    .eq('business_id', businessId)
    .select()
    .single();
}

export async function deleteDisplayPreset(businessId: string, presetId: string) {
  return supabaseClient
    .from('field_display_presets')
    .delete()
    .eq('id', presetId)
    .eq('business_id', businessId);
}

// Validation utility
export async function validateFieldValue(businessId: string, fieldId: string, value: any) {
  const { data: rules, error } = await getValidationRules(businessId, fieldId);
  if (error || !rules) return { isValid: false, errors: ['Validation failed'] };

  const errors: string[] = [];
  for (const rule of rules) {
    if (!rule.is_active) continue;
    // Add validation logic here
  }

  return { isValid: errors.length === 0, errors };
}
