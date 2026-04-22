/**
 * Automation Engine TypeScript Type Definitions
 * Comprehensive types for rules, conditions, actions, and execution tracking
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & UNIONS
// ─────────────────────────────────────────────────────────────────────────────

export enum TriggerType {
  LEAD_ADDED = 'lead_added',
  STAGE_CHANGED = 'stage_changed',
  INACTIVITY = 'inactivity',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  MILESTONE_REACHED = 'milestone_reached',
}

export enum ConditionOperator {
  // String operators (7)
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  MATCHES_REGEX = 'matches_regex',

  // Numeric operators (4)
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',

  // Empty operators (2)
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  // Set operators (2)
  IN_LIST = 'in_list',
  NOT_IN_LIST = 'not_in_list',

  // Pattern operators (1)
  MATCHES_PATTERN = 'matches_pattern',

  // Date operators (3)
  DATE_EQUALS = 'date_equals',
  DATE_AFTER = 'date_after',
  DATE_BEFORE = 'date_before',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  ASSIGN_USER = 'assign_user',
  ADD_TAG = 'add_tag',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
  UPDATE_FIELD = 'update_field',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL_FAILURE = 'partial_failure',
}

export enum LogType {
  TRIGGER_EVAL = 'trigger_eval',
  CONDITION_EVAL = 'condition_eval',
  ACTION_START = 'action_start',
  ACTION_COMPLETE = 'action_complete',
  ACTION_ERROR = 'action_error',
  EXECUTION_COMPLETE = 'execution_complete',
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
  PENDING = 'pending',
}

export enum ValueType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  ARRAY = 'array',
}

export enum LogicOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum RecipientType {
  LEAD = 'lead',
  ASSIGNED_USER = 'assigned_user',
  CUSTOM_EMAIL_FIELD = 'custom_email_field',
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER CONFIGURATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BaseTriggerConfig {
  type: TriggerType;
}

export interface LeadAddedTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.LEAD_ADDED;
  pipeline_id?: string;
}

export interface StageChangedTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.STAGE_CHANGED;
  pipeline_id?: string;
  from_stage_id?: string;
  to_stage_id?: string;
}

export interface InactivityTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.INACTIVITY;
  stage_id: string;
  min_days: number;
}

export interface EmailOpenedTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.EMAIL_OPENED;
  track_all?: boolean;
  template_id?: string;
}

export interface EmailClickedTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.EMAIL_CLICKED;
  track_all?: boolean;
  template_id?: string;
  link?: string;
}

export interface MilestoneReachedTriggerConfig extends BaseTriggerConfig {
  type: TriggerType.MILESTONE_REACHED;
  event_name: string;
  milestone_value?: number;
}

export type TriggerConfig =
  | LeadAddedTriggerConfig
  | StageChangedTriggerConfig
  | InactivityTriggerConfig
  | EmailOpenedTriggerConfig
  | EmailClickedTriggerConfig
  | MilestoneReachedTriggerConfig;

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CONFIGURATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BaseSendEmailConfig {
  type: ActionType.SEND_EMAIL;
  template_id: string;
  recipient_type?: 'lead' | 'assigned_user' | 'custom_email_field';
  recipient_field?: string;
  variables?: Record<string, string>;
}

export interface AssignUserConfig {
  type: ActionType.ASSIGN_USER;
  assigned_to: string; // user_id or team_id
  assignment_type: 'user' | 'team';
  override_current?: boolean;
  notify_user?: boolean;
}

export interface AddTagConfig {
  type: ActionType.ADD_TAG;
  tags: string[];
  append?: boolean;
  remove_conflicting?: boolean;
}

export interface CreateTaskConfig {
  type: ActionType.CREATE_TASK;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date_offset_days?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

export interface WebhookConfig {
  type: ActionType.WEBHOOK;
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
  timeout_seconds?: number;
  retry_count?: number;
}

export interface UpdateFieldConfig {
  type: ActionType.UPDATE_FIELD;
  field_name: string;
  value: string | number | boolean;
  value_type: ValueType;
  condition_match?: 'any' | 'all';
}

export type ActionConfig =
  | BaseSendEmailConfig
  | AssignUserConfig
  | AddTagConfig
  | CreateTaskConfig
  | WebhookConfig
  | UpdateFieldConfig;

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENTITY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AutomationRule {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  is_template: boolean;
  template_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at?: string;
  order_index?: number;
  // Denormalized for UI
  conditions?: Condition[];
  actions?: Action[];
}

export interface Condition {
  id: string;
  rule_id: string;
  field_name: string;
  operator: ConditionOperator;
  value?: string;
  value_type: ValueType;
  logic_operator: LogicOperator;
  parent_id?: string;
  order_index: number;
}

export interface Action {
  id: string;
  rule_id: string;
  action_type: ActionType;
  action_config: Record<string, any>;
  delay_seconds?: number;
  order_index: number;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  business_id: string;
  trigger_type: TriggerType;
  entity_id?: string;
  entity_type?: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  result: {
    trigger_passed: boolean;
    conditions_passed: boolean;
    actions_executed: number;
    actions_failed: number;
    errors: string[];
  };
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  action_id?: string;
  log_type: LogType;
  message?: string;
  details?: Record<string, any>;
  status?: LogStatus;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  category?: string;
  is_system: boolean;
  subject: string;
  body: string;
  body_html?: string;
  recipient_type: RecipientType;
  recipient_field?: string;
  variables?: Record<string, VariableDefinition>;
  include_attachments: boolean;
  track_opens: boolean;
  track_clicks: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VariableDefinition {
  type: ValueType;
  description: string;
  required?: boolean;
  example?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRuleRequest {
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  conditions: Omit<Condition, 'id' | 'rule_id' | 'created_at'>[];
  actions: Omit<Action, 'id' | 'rule_id' | 'created_at'>[];
  is_template?: boolean;
  template_name?: string;
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  trigger_config?: Record<string, any>;
  conditions?: Omit<Condition, 'id' | 'rule_id' | 'created_at'>[];
  actions?: Omit<Action, 'id' | 'rule_id' | 'created_at'>[];
}

export interface TestTriggerRequest {
  entity_data: Record<string, any>;
}

export interface DryRunRuleRequest {
  entity_data: Record<string, any>;
}

export interface TestEmailRequest {
  recipient_email: string;
  variables?: Record<string, any>;
}

export interface RuleListResponse {
  rules: AutomationRule[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExecutionHistoryResponse {
  executions: AutomationExecution[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExecutionStatsResponse {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_ms: number;
  success_rate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION CONTEXT & SIMULATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ConditionEvaluationResult {
  condition_id: string;
  passed: boolean;
  field_name: string;
  operator: ConditionOperator;
  field_value: any;
  expected_value: any;
  error?: string;
}

export interface ActionSimulation {
  action_id: string;
  action_type: ActionType;
  config: Record<string, any>;
  would_execute: boolean;
  reason?: string;
  preview?: string;
}

export interface DryRunResult {
  rule_id: string;
  trigger_passed: boolean;
  trigger_details: {
    trigger_type: TriggerType;
    passed: boolean;
    reason: string;
  };
  condition_evaluations: ConditionEvaluationResult[];
  conditions_passed: boolean;
  action_simulations: ActionSimulation[];
  overall_result: string;
  estimated_execution_time_ms?: number;
  warnings?: string[];
}

export interface TestTriggerResult {
  rule_id: string;
  trigger_type: TriggerType;
  passed: boolean;
  details: Record<string, any>;
  message: string;
}

export interface TestEmailResult {
  template_id: string;
  sent: boolean;
  recipient: string;
  subject: string;
  preview: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION & ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConditionValidationError extends ValidationError {
  field: 'field_name' | 'operator' | 'value';
}

export interface ActionValidationError extends ValidationError {
  field: 'action_type' | 'action_config';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER TYPES FOR COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface RuleBuilderState {
  step: 1 | 2 | 3 | 4;
  rule: Partial<AutomationRule>;
  conditions: Omit<Condition, 'id' | 'rule_id' | 'created_at'>[];
  actions: Omit<Action, 'id' | 'rule_id' | 'created_at'>[];
  errors: ValidationError[];
  isDirty: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
  type: ValueType;
  description?: string;
}

export interface OperatorOption {
  value: ConditionOperator;
  label: string;
  description?: string;
  compatible_types: ValueType[];
  value_input_type: 'text' | 'number' | 'date' | 'array' | 'none';
}

export interface TriggerOption {
  value: TriggerType;
  label: string;
  description: string;
  icon?: string;
  config_fields?: FieldOption[];
}

export interface ActionOption {
  value: ActionType;
  label: string;
  description: string;
  icon?: string;
  config_schema?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT DEFAULTS AND CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const CONDITION_OPERATORS_BY_TYPE: Record<ValueType, ConditionOperator[]> = {
  [ValueType.STRING]: [
    ConditionOperator.EQUALS,
    ConditionOperator.NOT_EQUALS,
    ConditionOperator.CONTAINS,
    ConditionOperator.NOT_CONTAINS,
    ConditionOperator.STARTS_WITH,
    ConditionOperator.ENDS_WITH,
    ConditionOperator.MATCHES_REGEX,
  ],
  [ValueType.NUMBER]: [
    ConditionOperator.EQUALS,
    ConditionOperator.GREATER_THAN,
    ConditionOperator.LESS_THAN,
    ConditionOperator.BETWEEN,
  ],
  [ValueType.DATE]: [
    ConditionOperator.DATE_EQUALS,
    ConditionOperator.DATE_AFTER,
    ConditionOperator.DATE_BEFORE,
  ],
  [ValueType.ARRAY]: [
    ConditionOperator.IN_LIST,
    ConditionOperator.NOT_IN_LIST,
  ],
};

export const UNIVERSAL_OPERATORS = [
  ConditionOperator.IS_EMPTY,
  ConditionOperator.IS_NOT_EMPTY,
  ConditionOperator.MATCHES_PATTERN,
];

export const DEFAULT_AUTOMATION_RULE: Partial<AutomationRule> = {
  enabled: true,
  is_template: false,
  total_runs: 0,
  successful_runs: 0,
  failed_runs: 0,
};

export const DEFAULT_EMAIL_TEMPLATE: Partial<EmailTemplate> = {
  is_system: false,
  recipient_type: RecipientType.LEAD,
  include_attachments: false,
  track_opens: true,
  track_clicks: true,
};
