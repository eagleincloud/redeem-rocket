/**
 * Automation Rule Engine
 * Core evaluation and execution logic for automation rules
 * Supports 18 operators, complex conditions, and 6 action types
 */

import {
  AutomationRule,
  Condition,
  Action,
  TriggerType,
  ConditionOperator,
  ActionType,
  ExecutionStatus,
  DryRunResult,
  ConditionEvaluationResult,
  ActionSimulation,
  CONDITION_OPERATORS_BY_TYPE,
  UNIVERSAL_OPERATORS,
  ValueType,
} from '../types/automation';

// ─────────────────────────────────────────────────────────────────────────────
// CONDITION EVALUATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single condition against entity data
 */
export function evaluateCondition(
  condition: Condition,
  entityData: Record<string, any>
): ConditionEvaluationResult {
  const fieldValue = getNestedProperty(entityData, condition.field_name);

  try {
    const passed = evaluateOperator(
      condition.operator,
      fieldValue,
      condition.value,
      condition.value_type
    );

    return {
      condition_id: condition.id,
      passed,
      field_name: condition.field_name,
      operator: condition.operator,
      field_value: fieldValue,
      expected_value: condition.value,
    };
  } catch (error) {
    return {
      condition_id: condition.id,
      passed: false,
      field_name: condition.field_name,
      operator: condition.operator,
      field_value: fieldValue,
      expected_value: condition.value,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Evaluates all conditions for a rule with AND/OR logic support
 */
export function evaluateConditions(
  conditions: Condition[],
  entityData: Record<string, any>
): { passed: boolean; evaluations: ConditionEvaluationResult[] } {
  if (!conditions || conditions.length === 0) {
    return { passed: true, evaluations: [] };
  }

  const evaluations = conditions.map((condition) =>
    evaluateCondition(condition, entityData)
  );

  // Group conditions by logic operator
  let currentGroup: ConditionEvaluationResult[] = [];
  const groups: { operator: string; evaluations: ConditionEvaluationResult[] }[] = [];

  for (let i = 0; i < evaluations.length; i++) {
    currentGroup.push(evaluations[i]);

    if (
      i < evaluations.length - 1 &&
      conditions[i].logic_operator !== conditions[i + 1].logic_operator
    ) {
      groups.push({
        operator: conditions[i].logic_operator,
        evaluations: [...currentGroup],
      });
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    groups.push({
      operator: conditions[conditions.length - 1].logic_operator,
      evaluations: currentGroup,
    });
  }

  // Evaluate each group
  const groupResults = groups.map((group) => {
    if (group.operator === 'AND') {
      return group.evaluations.every((e) => e.passed);
    } else {
      // OR
      return group.evaluations.some((e) => e.passed);
    }
  });

  const passed = groupResults.every((result) => result === true);

  return { passed, evaluations };
}

/**
 * Evaluates 18 condition operators
 */
function evaluateOperator(
  operator: ConditionOperator,
  fieldValue: any,
  expectedValue?: string,
  valueType?: ValueType
): boolean {
  // Handle null/undefined field values
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === ConditionOperator.IS_EMPTY) return true;
    if (operator === ConditionOperator.IS_NOT_EMPTY) return false;
  }

  // Handle empty string
  if (fieldValue === '') {
    if (operator === ConditionOperator.IS_EMPTY) return true;
    if (operator === ConditionOperator.IS_NOT_EMPTY) return false;
  }

  switch (operator) {
    // STRING OPERATORS (7)
    case ConditionOperator.EQUALS:
      return String(fieldValue).toLowerCase() === String(expectedValue).toLowerCase();

    case ConditionOperator.NOT_EQUALS:
      return String(fieldValue).toLowerCase() !== String(expectedValue).toLowerCase();

    case ConditionOperator.CONTAINS:
      return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());

    case ConditionOperator.NOT_CONTAINS:
      return !String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());

    case ConditionOperator.STARTS_WITH:
      return String(fieldValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());

    case ConditionOperator.ENDS_WITH:
      return String(fieldValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());

    case ConditionOperator.MATCHES_REGEX: {
      try {
        const regex = new RegExp(expectedValue || '');
        return regex.test(String(fieldValue));
      } catch (e) {
        throw new Error(`Invalid regex pattern: ${expectedValue}`);
      }
    }

    // NUMERIC OPERATORS (4)
    case ConditionOperator.GREATER_THAN: {
      const num = Number(fieldValue);
      const expected = Number(expectedValue);
      if (isNaN(num) || isNaN(expected)) throw new Error('Non-numeric value for greater_than');
      return num > expected;
    }

    case ConditionOperator.LESS_THAN: {
      const num = Number(fieldValue);
      const expected = Number(expectedValue);
      if (isNaN(num) || isNaN(expected)) throw new Error('Non-numeric value for less_than');
      return num < expected;
    }

    case ConditionOperator.BETWEEN: {
      const parts = (expectedValue || '').split(',');
      if (parts.length !== 2) throw new Error('between requires two comma-separated values');
      const num = Number(fieldValue);
      const min = Number(parts[0]);
      const max = Number(parts[1]);
      if (isNaN(num) || isNaN(min) || isNaN(max)) throw new Error('Non-numeric value for between');
      return num >= min && num <= max;
    }

    // EMPTY OPERATORS (2)
    case ConditionOperator.IS_EMPTY:
      return fieldValue === null || fieldValue === undefined || fieldValue === '';

    case ConditionOperator.IS_NOT_EMPTY:
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';

    // SET OPERATORS (2)
    case ConditionOperator.IN_LIST: {
      const list = (expectedValue || '').split(',').map((v) => v.trim());
      return list.includes(String(fieldValue));
    }

    case ConditionOperator.NOT_IN_LIST: {
      const list = (expectedValue || '').split(',').map((v) => v.trim());
      return !list.includes(String(fieldValue));
    }

    // PATTERN OPERATORS (1)
    case ConditionOperator.MATCHES_PATTERN: {
      // Convert wildcard pattern to regex
      const regexPattern = expectedValue
        ?.replace(/[.+^${}()|[\]\\]/g, '\\$&')
        ?.replace(/\*/g, '.*')
        ?.replace(/\?/g, '.');
      try {
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(String(fieldValue));
      } catch (e) {
        throw new Error(`Invalid pattern: ${expectedValue}`);
      }
    }

    // DATE OPERATORS (3)
    case ConditionOperator.DATE_EQUALS: {
      const date = new Date(String(fieldValue)).toISOString().split('T')[0];
      return date === expectedValue;
    }

    case ConditionOperator.DATE_AFTER: {
      const date = new Date(String(fieldValue));
      const expected = new Date(expectedValue || '');
      return date > expected;
    }

    case ConditionOperator.DATE_BEFORE: {
      const date = new Date(String(fieldValue));
      const expected = new Date(expectedValue || '');
      return date < expected;
    }

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates if a trigger condition is met
 */
export function evaluateTrigger(
  triggerType: TriggerType,
  triggerConfig: Record<string, any>,
  entityData: Record<string, any>
): { passed: boolean; reason: string } {
  try {
    switch (triggerType) {
      case TriggerType.LEAD_ADDED:
        // Lead added always fires if rule has this trigger
        return { passed: true, reason: 'New lead added to pipeline' };

      case TriggerType.STAGE_CHANGED: {
        const { from_stage_id, to_stage_id } = triggerConfig;
        const currentStageId = entityData.stage_id;

        if (to_stage_id && currentStageId !== to_stage_id) {
          return { passed: false, reason: `Entity not in target stage ${to_stage_id}` };
        }

        return { passed: true, reason: `Stage changed${to_stage_id ? ` to ${to_stage_id}` : ''}` };
      }

      case TriggerType.INACTIVITY: {
        const { min_days } = triggerConfig;
        const lastActivityAt = entityData.last_activity_at
          ? new Date(entityData.last_activity_at)
          : new Date(entityData.created_at);

        const daysSinceActivity = Math.floor(
          (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceActivity < min_days) {
          return {
            passed: false,
            reason: `Only ${daysSinceActivity} days inactive, need ${min_days}`,
          };
        }

        return { passed: true, reason: `${daysSinceActivity} days without activity` };
      }

      case TriggerType.EMAIL_OPENED:
        return { passed: true, reason: 'Email opened' };

      case TriggerType.EMAIL_CLICKED:
        return { passed: true, reason: 'Email link clicked' };

      case TriggerType.MILESTONE_REACHED:
        return { passed: true, reason: 'Milestone reached' };

      default:
        return { passed: false, reason: `Unknown trigger type: ${triggerType}` };
    }
  } catch (error) {
    return {
      passed: false,
      reason: `Trigger evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Evaluates a complete rule (trigger + conditions)
 */
export function evaluateRule(
  rule: AutomationRule,
  entityData: Record<string, any>
): {
  passed: boolean;
  triggerPassed: boolean;
  conditionsPassed: boolean;
  triggerDetails: { passed: boolean; reason: string };
  conditionEvaluations: ConditionEvaluationResult[];
} {
  // Evaluate trigger
  const triggerDetails = evaluateTrigger(rule.trigger_type, rule.trigger_config, entityData);

  // Evaluate conditions
  const { passed: conditionsPassed, evaluations: conditionEvaluations } = evaluateConditions(
    rule.conditions || [],
    entityData
  );

  return {
    passed: triggerDetails.passed && conditionsPassed,
    triggerPassed: triggerDetails.passed,
    conditionsPassed,
    triggerDetails,
    conditionEvaluations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION EXECUTION (SIMULATION)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates if an action can be executed with the given configuration
 */
export function validateAction(action: Action): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (action.action_type) {
    case ActionType.SEND_EMAIL: {
      const { template_id } = action.action_config;
      if (!template_id) errors.push('send_email requires template_id');
      break;
    }

    case ActionType.ASSIGN_USER: {
      const { assigned_to, assignment_type } = action.action_config;
      if (!assigned_to) errors.push('assign_user requires assigned_to');
      if (!assignment_type || !['user', 'team'].includes(assignment_type)) {
        errors.push('assign_user requires valid assignment_type (user or team)');
      }
      break;
    }

    case ActionType.ADD_TAG: {
      const { tags } = action.action_config;
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        errors.push('add_tag requires non-empty tags array');
      }
      break;
    }

    case ActionType.CREATE_TASK: {
      const { title } = action.action_config;
      if (!title) errors.push('create_task requires title');
      break;
    }

    case ActionType.WEBHOOK: {
      const { url } = action.action_config;
      if (!url) {
        errors.push('webhook requires url');
      } else {
        try {
          new URL(url);
        } catch (e) {
          errors.push(`webhook requires valid URL: ${url}`);
        }
      }
      break;
    }

    case ActionType.UPDATE_FIELD: {
      const { field_name, value } = action.action_config;
      if (!field_name) errors.push('update_field requires field_name');
      if (value === undefined) errors.push('update_field requires value');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Simulates action execution (for dry-run)
 */
export function simulateAction(action: Action): ActionSimulation {
  const validation = validateAction(action);

  return {
    action_id: action.id,
    action_type: action.action_type,
    config: action.action_config,
    would_execute: validation.valid,
    reason: validation.valid ? undefined : validation.errors[0],
    preview: generateActionPreview(action),
  };
}

/**
 * Generates human-readable preview of an action
 */
function generateActionPreview(action: Action): string {
  const config = action.action_config;

  switch (action.action_type) {
    case ActionType.SEND_EMAIL:
      return `Send email using template: ${config.template_id}`;

    case ActionType.ASSIGN_USER:
      return `Assign to ${config.assignment_type === 'team' ? 'team' : 'user'}: ${config.assigned_to}`;

    case ActionType.ADD_TAG:
      return `Add tags: ${(config.tags || []).join(', ')}`;

    case ActionType.CREATE_TASK:
      return `Create task: "${config.title}"${config.assigned_to ? ` assigned to ${config.assigned_to}` : ''}`;

    case ActionType.WEBHOOK:
      return `Send webhook to: ${config.url}`;

    case ActionType.UPDATE_FIELD:
      return `Update field "${config.field_name}" to: ${config.value}`;

    default:
      return 'Unknown action';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DRY RUN / SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates rule execution without actually executing actions
 * Returns detailed breakdown of what would happen
 */
export function dryRunRule(
  rule: AutomationRule,
  entityData: Record<string, any>
): DryRunResult {
  const evaluation = evaluateRule(rule, entityData);

  const actionSimulations = evaluation.passed
    ? (rule.actions || []).map((action) => simulateAction(action))
    : [];

  const warnings: string[] = [];

  // Check for validation issues
  for (const action of rule.actions || []) {
    const validation = validateAction(action);
    if (!validation.valid) {
      warnings.push(`Action ${action.id}: ${validation.errors.join(', ')}`);
    }
  }

  return {
    rule_id: rule.id,
    trigger_passed: evaluation.triggerPassed,
    trigger_details: {
      trigger_type: rule.trigger_type,
      passed: evaluation.triggerPassed,
      reason: evaluation.triggerDetails.reason,
    },
    condition_evaluations: evaluation.conditionEvaluations,
    conditions_passed: evaluation.conditionsPassed,
    action_simulations: actionSimulations,
    overall_result: evaluation.passed
      ? `Rule will execute ${actionSimulations.length} actions`
      : evaluation.triggerPassed
        ? 'Conditions not met, no actions will execute'
        : 'Trigger condition not met, rule will not fire',
    estimated_execution_time_ms: evaluation.passed
      ? Math.max(100, actionSimulations.length * 50)
      : 0,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets a nested property from an object using dot notation
 * Example: getNestedProperty({user: {name: "John"}}, "user.name") => "John"
 */
function getNestedProperty(obj: Record<string, any>, path: string): any {
  if (!path) return obj;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Validates operator compatibility with field type
 */
export function isOperatorCompatibleWithType(
  operator: ConditionOperator,
  valueType: ValueType
): boolean {
  const compatibleOperators = CONDITION_OPERATORS_BY_TYPE[valueType] || [];
  return compatibleOperators.includes(operator) || UNIVERSAL_OPERATORS.includes(operator);
}

/**
 * Gets valid operators for a value type
 */
export function getValidOperatorsForType(valueType: ValueType): ConditionOperator[] {
  return [...(CONDITION_OPERATORS_BY_TYPE[valueType] || []), ...UNIVERSAL_OPERATORS];
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Summary of rule engine exports:
 *
 * CONDITION EVALUATION:
 * - evaluateCondition(condition, entityData)
 * - evaluateConditions(conditions, entityData)
 * - evaluateOperator(operator, fieldValue, expectedValue)
 *
 * RULE EVALUATION:
 * - evaluateTrigger(triggerType, triggerConfig, entityData)
 * - evaluateRule(rule, entityData)
 *
 * ACTION EXECUTION:
 * - validateAction(action)
 * - simulateAction(action)
 *
 * DRY RUN:
 * - dryRunRule(rule, entityData)
 *
 * UTILITIES:
 * - isOperatorCompatibleWithType(operator, valueType)
 * - getValidOperatorsForType(valueType)
 */
