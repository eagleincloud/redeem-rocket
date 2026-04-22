/**
 * Automation Engine API Service Layer
 * REST endpoints for CRUD operations, testing, execution, and email templates
 * Provides 20+ functions for rule management and execution tracking
 */

import { supabase } from '@/app/lib/supabase';
import {
  AutomationRule,
  Condition,
  Action,
  AutomationExecution,
  ExecutionLog,
  EmailTemplate,
  CreateRuleRequest,
  UpdateRuleRequest,
  RuleListResponse,
  ExecutionHistoryResponse,
  ExecutionStatsResponse,
  ValidationResult,
  TestTriggerResult,
  DryRunResult,
  TestEmailResult,
  TriggerType,
  ActionType,
  ValidationError,
  ConditionOperator,
  ActionConfig,
  CONDITION_OPERATORS_BY_TYPE,
  UNIVERSAL_OPERATORS,
} from '@/business/types/automation';
import {
  evaluateRule,
  evaluateConditions,
  validateAction,
  dryRunRule,
  isOperatorCompatibleWithType,
} from '@/business/services/automation/ruleEngine';

// ─────────────────────────────────────────────────────────────────────────────
// RULE CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all automation rules for a business
 */
export async function getRules(
  businessId: string,
  options?: { enabled?: boolean; triggerType?: TriggerType; limit?: number; offset?: number }
): Promise<RuleListResponse> {
  try {
    let query = supabase
      .from('automation_rules')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (options?.enabled !== undefined) {
      query = query.eq('enabled', options.enabled);
    }

    if (options?.triggerType) {
      query = query.eq('trigger_type', options.triggerType);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      rules: (data || []) as AutomationRule[],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
    };
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
}

/**
 * Get a single automation rule with its conditions and actions
 */
export async function getRule(ruleId: string): Promise<AutomationRule> {
  try {
    const { data: rule, error: ruleError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError) throw ruleError;

    const { data: conditions, error: condError } = await supabase
      .from('automation_conditions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('order_index', { ascending: true });

    if (condError) throw condError;

    const { data: actions, error: actError } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('order_index', { ascending: true });

    if (actError) throw actError;

    return {
      ...(rule as AutomationRule),
      conditions: (conditions || []) as Condition[],
      actions: (actions || []) as Action[],
    };
  } catch (error) {
    console.error('Error fetching rule:', error);
    throw error;
  }
}

/**
 * Create a new automation rule with conditions and actions
 * Performs comprehensive validation
 */
export async function createRule(
  businessId: string,
  userId: string,
  data: CreateRuleRequest
): Promise<AutomationRule> {
  // Validate rule data
  const validation = validateRuleData(data);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  try {
    // Create rule
    const { data: rule, error: ruleError } = await supabase
      .from('automation_rules')
      .insert([
        {
          business_id: businessId,
          created_by: userId,
          name: data.name,
          description: data.description,
          trigger_type: data.trigger_type,
          trigger_config: data.trigger_config,
          is_template: data.is_template || false,
          template_name: data.template_name,
          enabled: true,
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
        },
      ])
      .select()
      .single();

    if (ruleError) throw ruleError;

    const ruleId = (rule as AutomationRule).id;

    // Create conditions
    if (data.conditions && data.conditions.length > 0) {
      const conditions = data.conditions.map((cond, idx) => ({
        ...cond,
        rule_id: ruleId,
        order_index: idx,
      }));

      const { error: condError } = await supabase
        .from('automation_conditions')
        .insert(conditions);

      if (condError) throw condError;
    }

    // Create actions
    if (data.actions && data.actions.length > 0) {
      const actions = data.actions.map((act, idx) => ({
        ...act,
        rule_id: ruleId,
        order_index: idx,
      }));

      const { error: actError } = await supabase
        .from('automation_actions')
        .insert(actions);

      if (actError) throw actError;
    }

    return await getRule(ruleId);
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
}

/**
 * Update an automation rule
 */
export async function updateRule(
  ruleId: string,
  updates: UpdateRuleRequest
): Promise<AutomationRule> {
  try {
    // Update rule fields
    if (Object.keys(updates).some((k) => !['conditions', 'actions'].includes(k))) {
      const { error } = await supabase
        .from('automation_rules')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          ...(updates.enabled !== undefined && { enabled: updates.enabled }),
          ...(updates.trigger_config && { trigger_config: updates.trigger_config }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);

      if (error) throw error;
    }

    // Update conditions if provided
    if (updates.conditions) {
      // Delete existing conditions
      await supabase.from('automation_conditions').delete().eq('rule_id', ruleId);

      // Insert new conditions
      if (updates.conditions.length > 0) {
        const conditions = updates.conditions.map((cond, idx) => ({
          ...cond,
          rule_id: ruleId,
          order_index: idx,
        }));

        const { error: condError } = await supabase
          .from('automation_conditions')
          .insert(conditions);

        if (condError) throw condError;
      }
    }

    // Update actions if provided
    if (updates.actions) {
      // Delete existing actions
      await supabase.from('automation_actions').delete().eq('rule_id', ruleId);

      // Insert new actions
      if (updates.actions.length > 0) {
        const actions = updates.actions.map((act, idx) => ({
          ...act,
          rule_id: ruleId,
          order_index: idx,
        }));

        const { error: actError } = await supabase
          .from('automation_actions')
          .insert(actions);

        if (actError) throw actError;
      }
    }

    return await getRule(ruleId);
  } catch (error) {
    console.error('Error updating rule:', error);
    throw error;
  }
}

/**
 * Delete an automation rule and all related data
 */
export async function deleteRule(ruleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
}

/**
 * Enable a rule
 */
export async function enableRule(ruleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('automation_rules')
      .update({ enabled: true })
      .eq('id', ruleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error enabling rule:', error);
    throw error;
  }
}

/**
 * Disable a rule
 */
export async function disableRule(ruleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('automation_rules')
      .update({ enabled: false })
      .eq('id', ruleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error disabling rule:', error);
    throw error;
  }
}

/**
 * Duplicate a rule
 */
export async function duplicateRule(
  ruleId: string,
  businessId: string,
  userId: string
): Promise<AutomationRule> {
  try {
    const original = await getRule(ruleId);

    return await createRule(businessId, userId, {
      name: `${original.name} (Copy)`,
      description: original.description,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      conditions: (original.conditions || []).map(({ id, rule_id, created_at, ...rest }) => rest),
      actions: (original.actions || []).map(({ id, rule_id, created_at, ...rest }) => rest),
      is_template: original.is_template,
      template_name: original.template_name,
    });
  } catch (error) {
    console.error('Error duplicating rule:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTING & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test trigger evaluation with sample data
 */
export async function testTrigger(
  ruleId: string,
  entityData: Record<string, any>
): Promise<TestTriggerResult> {
  try {
    const rule = await getRule(ruleId);
    const evaluation = evaluateRule(rule, entityData);

    return {
      rule_id: ruleId,
      trigger_type: rule.trigger_type,
      passed: evaluation.triggerPassed,
      details: {
        trigger_passed: evaluation.triggerPassed,
        trigger_reason: evaluation.triggerDetails.reason,
        conditions_passed: evaluation.conditionsPassed,
      },
      message: evaluation.triggerPassed
        ? `Trigger passed. ${evaluation.conditionEvaluations.length} conditions to evaluate.`
        : `Trigger failed: ${evaluation.triggerDetails.reason}`,
    };
  } catch (error) {
    console.error('Error testing trigger:', error);
    throw error;
  }
}

/**
 * Dry-run a rule with sample data (no actions executed)
 */
export async function dryRunRule(
  ruleId: string,
  entityData: Record<string, any>
): Promise<DryRunResult> {
  try {
    const rule = await getRule(ruleId);
    return dryRunRule(rule, entityData);
  } catch (error) {
    console.error('Error dry-running rule:', error);
    throw error;
  }
}

/**
 * Validate rule data structure
 */
function validateRuleData(data: CreateRuleRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate basic fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Rule name is required', code: 'REQUIRED' });
  }

  if (!data.trigger_type) {
    errors.push({
      field: 'trigger_type',
      message: 'Trigger type is required',
      code: 'REQUIRED',
    });
  }

  // Validate trigger config based on type
  switch (data.trigger_type) {
    case TriggerType.INACTIVITY:
      if (!data.trigger_config.min_days || data.trigger_config.min_days < 1) {
        errors.push({
          field: 'trigger_config',
          message: 'Inactivity trigger requires min_days >= 1',
          code: 'INVALID',
        });
      }
      break;
  }

  // Validate conditions
  for (const condition of data.conditions || []) {
    if (!condition.field_name) {
      errors.push({
        field: 'field_name',
        message: 'Condition field_name is required',
        code: 'REQUIRED',
      });
    }

    if (!condition.operator) {
      errors.push({
        field: 'operator',
        message: 'Condition operator is required',
        code: 'REQUIRED',
      });
    }

    // Check operator compatibility
    if (
      condition.operator &&
      !isOperatorCompatibleWithType(condition.operator as ConditionOperator, condition.value_type)
    ) {
      errors.push({
        field: 'operator',
        message: `Operator ${condition.operator} is not compatible with type ${condition.value_type}`,
        code: 'INCOMPATIBLE',
      });
    }
  }

  // Validate actions
  for (const action of data.actions || []) {
    if (!action.action_type) {
      errors.push({
        field: 'action_type',
        message: 'Action type is required',
        code: 'REQUIRED',
      });
    }

    const actionValidation = validateAction(action as unknown as Action);
    if (!actionValidation.valid) {
      errors.push({
        field: 'action_config',
        message: actionValidation.errors[0],
        code: 'INVALID',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION HISTORY & LOGGING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get execution history for a rule
 */
export async function getExecutionHistory(
  ruleId: string,
  options?: { limit?: number; offset?: number; status?: string }
): Promise<ExecutionHistoryResponse> {
  try {
    let query = supabase
      .from('automation_executions')
      .select('*', { count: 'exact' })
      .eq('rule_id', ruleId)
      .order('started_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      executions: (data || []) as AutomationExecution[],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
    };
  } catch (error) {
    console.error('Error fetching execution history:', error);
    throw error;
  }
}

/**
 * Get detailed logs for an execution
 */
export async function getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
  try {
    const { data, error } = await supabase
      .from('automation_execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as ExecutionLog[];
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    throw error;
  }
}

/**
 * Get execution statistics for a business
 */
export async function getExecutionStats(businessId: string): Promise<ExecutionStatsResponse> {
  try {
    // Get rule count
    const { count: totalRules } = await supabase
      .from('automation_rules')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    const { count: activeRules } = await supabase
      .from('automation_rules')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('enabled', true);

    // Get execution stats
    const { data: executions, error } = await supabase
      .from('automation_executions')
      .select('status, duration_ms')
      .eq('business_id', businessId);

    if (error) throw error;

    const completedExecutions = (executions || []).filter((e) => e.status === 'completed');
    const successfulExecutions = (executions || []).filter(
      (e) => e.status === 'completed' && e.result?.actions_failed === 0
    );

    const totalDuration = (executions || []).reduce((sum, e) => sum + (e.duration_ms || 0), 0);
    const avgDuration =
      (executions || []).length > 0 ? totalDuration / (executions || []).length : 0;

    return {
      total_rules: totalRules || 0,
      active_rules: activeRules || 0,
      total_executions: (executions || []).length,
      successful_executions: successfulExecutions.length,
      failed_executions:
        (executions || []).filter((e) => e.status === 'failed').length +
        (executions || []).filter((e) => e.status === 'partial_failure').length,
      average_duration_ms: Math.round(avgDuration),
      success_rate: (executions || []).length > 0
        ? (successfulExecutions.length / completedExecutions.length) * 100
        : 0,
    };
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email templates for a business
 */
export async function getEmailTemplates(businessId: string): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('automation_email_templates')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as EmailTemplate[];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
}

/**
 * Get a single email template
 */
export async function getEmailTemplate(templateId: string): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('automation_email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    return data as EmailTemplate;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
}

/**
 * Create an email template
 */
export async function createEmailTemplate(
  businessId: string,
  userId: string,
  data: Omit<EmailTemplate, 'id' | 'business_id' | 'created_by' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate> {
  try {
    const { data: template, error } = await supabase
      .from('automation_email_templates')
      .insert([
        {
          business_id: businessId,
          created_by: userId,
          ...data,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return template as EmailTemplate;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<EmailTemplate>
): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('automation_email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return data as EmailTemplate;
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(templateId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('automation_email_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
}

/**
 * Test an email template (dry-run, no actual send)
 */
export async function testEmailTemplate(
  templateId: string,
  recipient: string,
  variables?: Record<string, any>
): Promise<TestEmailResult> {
  try {
    const template = await getEmailTemplate(templateId);

    // Render subject and body with variables
    const renderedSubject = renderTemplate(template.subject, variables || {});
    const renderedBody = renderTemplate(template.body, variables || {});

    return {
      template_id: templateId,
      sent: false, // Test only, not actually sent
      recipient,
      subject: renderedSubject,
      preview: renderedBody.substring(0, 200),
      message: 'Template test preview (not actually sent)',
    };
  } catch (error) {
    console.error('Error testing email template:', error);
    throw error;
  }
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  return rendered;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API Endpoints (20+ functions):
 *
 * RULES (7):
 * - getRules(businessId, options)
 * - getRule(ruleId)
 * - createRule(businessId, userId, data)
 * - updateRule(ruleId, updates)
 * - deleteRule(ruleId)
 * - enableRule(ruleId)
 * - disableRule(ruleId)
 * - duplicateRule(ruleId, businessId, userId)
 *
 * TESTING (3):
 * - testTrigger(ruleId, entityData)
 * - dryRunRule(ruleId, entityData)
 * - validateRuleData(data)
 *
 * EXECUTION (3):
 * - getExecutionHistory(ruleId, options)
 * - getExecutionLogs(executionId)
 * - getExecutionStats(businessId)
 *
 * EMAIL TEMPLATES (6):
 * - getEmailTemplates(businessId)
 * - getEmailTemplate(templateId)
 * - createEmailTemplate(businessId, userId, data)
 * - updateEmailTemplate(templateId, updates)
 * - deleteEmailTemplate(templateId)
 * - testEmailTemplate(templateId, recipient, variables)
 */
