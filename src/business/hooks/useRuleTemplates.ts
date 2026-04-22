/**
 * useRuleTemplates Hook
 * Pre-built automation rule templates for common business scenarios
 * Includes template management, application, and customization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../app/lib/supabase';
import {
  AutomationRule,
  TriggerType,
  ActionType,
  ConditionOperator,
  ValueType,
  LogicOperator,
  RecipientType,
} from '../types/automation';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type IndustryType = 'restaurant' | 'b2b' | 'ecommerce' | 'general';

export interface RuleTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  industry: IndustryType[];
  triggerType: TriggerType;
  triggerConfig: Record<string, any>;
  conditions: Array<{
    field_name: string;
    operator: ConditionOperator;
    value?: string;
    value_type: ValueType;
    logic_operator: LogicOperator;
  }>;
  actions: Array<{
    action_type: ActionType;
    action_config: Record<string, any>;
    delay_seconds?: number;
  }>;
  variables?: Record<string, string>;
  isCustom?: boolean;
  createdAt?: string;
}

export interface TemplateApplicationResult {
  success: boolean;
  ruleId?: string;
  message: string;
  rule?: AutomationRule;
}

export interface UseRuleTemplatesReturn {
  templates: RuleTemplate[];
  customTemplates: RuleTemplate[];
  loading: boolean;
  error: Error | null;
  getTemplates: () => RuleTemplate[];
  getTemplate: (name: string) => RuleTemplate | undefined;
  applyTemplate: (templateName: string, customization?: Record<string, any>) => Promise<TemplateApplicationResult>;
  saveCustomTemplate: (rule: AutomationRule, templateName: string, description: string) => Promise<RuleTemplate>;
  getTemplatesByIndustry: (industry: IndustryType) => RuleTemplate[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-BUILT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const BUILT_IN_TEMPLATES: RuleTemplate[] = [
  {
    id: 'template-welcome-leads',
    name: 'welcome_new_leads',
    displayName: 'Welcome New Leads',
    description: 'Send a welcome email to newly added leads',
    icon: 'mail-plus',
    industry: ['restaurant', 'b2b', 'ecommerce', 'general'],
    triggerType: TriggerType.LEAD_ADDED,
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        action_type: ActionType.SEND_EMAIL,
        action_config: {
          template_id: 'welcome_email',
          recipient_type: RecipientType.LEAD,
          variables: {
            lead_name: '{lead.name}',
            business_name: '{business.name}',
          },
        },
        delay_seconds: 0,
      },
    ],
  },

  {
    id: 'template-stalled-deals',
    name: 'stalled_deal_alert',
    displayName: 'Stalled Deal Alert',
    description: 'Alert manager when a deal has been inactive for 30 days',
    icon: 'alert-circle',
    industry: ['b2b', 'general'],
    triggerType: TriggerType.INACTIVITY,
    triggerConfig: {
      stage_id: 'any',
      min_days: 30,
    },
    conditions: [
      {
        field_name: 'deal_value',
        operator: ConditionOperator.GREATER_THAN,
        value: '5000',
        value_type: ValueType.NUMBER,
        logic_operator: LogicOperator.AND,
      },
    ],
    actions: [
      {
        action_type: ActionType.ASSIGN_USER,
        action_config: {
          assigned_to: 'current_owner',
          assignment_type: 'user',
          notify_user: true,
        },
        delay_seconds: 0,
      },
      {
        action_type: ActionType.CREATE_TASK,
        action_config: {
          title: 'Follow up on stalled deal: {lead.name}',
          description: 'This deal has been inactive for 30 days',
          priority: 'high',
          due_date_offset_days: 2,
        },
        delay_seconds: 300,
      },
    ],
  },

  {
    id: 'template-high-value-followup',
    name: 'high_value_followup',
    displayName: 'High Value Follow-up',
    description: 'Automatic follow-up for qualified leads with high deal value',
    icon: 'trending-up',
    industry: ['b2b', 'ecommerce'],
    triggerType: TriggerType.STAGE_CHANGED,
    triggerConfig: {
      to_stage_id: 'qualified',
    },
    conditions: [
      {
        field_name: 'deal_value',
        operator: ConditionOperator.GREATER_THAN,
        value: '10000',
        value_type: ValueType.NUMBER,
        logic_operator: LogicOperator.AND,
      },
      {
        field_name: 'contact_method',
        operator: ConditionOperator.NOT_EQUALS,
        value: 'do_not_contact',
        value_type: ValueType.STRING,
        logic_operator: LogicOperator.AND,
      },
    ],
    actions: [
      {
        action_type: ActionType.SEND_EMAIL,
        action_config: {
          template_id: 'high_value_proposal',
          recipient_type: RecipientType.LEAD,
          variables: {
            company_name: '{lead.company}',
            deal_value: '{lead.deal_value}',
          },
        },
        delay_seconds: 0,
      },
      {
        action_type: ActionType.ADD_TAG,
        action_config: {
          tags: ['high-value', 'priority-follow-up'],
          append: true,
        },
        delay_seconds: 600,
      },
    ],
  },

  {
    id: 'template-lead-enrichment',
    name: 'lead_enrichment',
    displayName: 'Lead Enrichment',
    description: 'Enrich new lead data via webhook to third-party service',
    icon: 'zap',
    industry: ['b2b', 'general'],
    triggerType: TriggerType.LEAD_ADDED,
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        action_type: ActionType.WEBHOOK,
        action_config: {
          url: 'https://api.enrichment-service.com/enrich',
          method: 'POST',
          headers: {
            'X-API-Key': '{env.ENRICHMENT_API_KEY}',
            'Content-Type': 'application/json',
          },
          payload: {
            email: '{lead.email}',
            company: '{lead.company}',
            domain: '{lead.domain}',
          },
          timeout_seconds: 10,
          retry_count: 2,
        },
        delay_seconds: 0,
      },
    ],
  },

  {
    id: 'template-abandoned-quote',
    name: 'abandoned_quote',
    displayName: 'Abandoned Quote Follow-up',
    description: 'Send follow-up email for quotes not accepted within 7 days',
    icon: 'file-alert',
    industry: ['b2b', 'ecommerce'],
    triggerType: TriggerType.INACTIVITY,
    triggerConfig: {
      stage_id: 'quote_sent',
      min_days: 7,
    },
    conditions: [
      {
        field_name: 'has_quote',
        operator: ConditionOperator.EQUALS,
        value: 'true',
        value_type: ValueType.STRING,
        logic_operator: LogicOperator.AND,
      },
      {
        field_name: 'quote_status',
        operator: ConditionOperator.EQUALS,
        value: 'pending',
        value_type: ValueType.STRING,
        logic_operator: LogicOperator.AND,
      },
    ],
    actions: [
      {
        action_type: ActionType.SEND_EMAIL,
        action_config: {
          template_id: 'abandoned_quote_reminder',
          recipient_type: RecipientType.LEAD,
          variables: {
            quote_amount: '{lead.quote_amount}',
            quote_date: '{lead.quote_created_date}',
          },
        },
        delay_seconds: 0,
      },
    ],
  },

  {
    id: 'template-vip-treatment',
    name: 'vip_treatment',
    displayName: 'VIP Customer Treatment',
    description: 'Special handling and notifications for VIP customers',
    icon: 'star',
    industry: ['restaurant', 'ecommerce', 'general'],
    triggerType: TriggerType.LEAD_ADDED,
    triggerConfig: {},
    conditions: [
      {
        field_name: 'is_vip',
        operator: ConditionOperator.EQUALS,
        value: 'true',
        value_type: ValueType.STRING,
        logic_operator: LogicOperator.AND,
      },
    ],
    actions: [
      {
        action_type: ActionType.ADD_TAG,
        action_config: {
          tags: ['vip', 'priority-service'],
          append: true,
        },
        delay_seconds: 0,
      },
      {
        action_type: ActionType.ASSIGN_USER,
        action_config: {
          assigned_to: 'vip_manager',
          assignment_type: 'user',
          notify_user: true,
        },
        delay_seconds: 0,
      },
      {
        action_type: ActionType.CREATE_TASK,
        action_config: {
          title: 'VIP onboarding: {lead.name}',
          description: 'Ensure white-glove service for this VIP customer',
          priority: 'critical',
          due_date_offset_days: 1,
        },
        delay_seconds: 1800,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRuleTemplates Hook
 *
 * Manages pre-built and custom automation rule templates.
 * Includes 6+ templates for common scenarios across different industries.
 * Supports custom template creation and industry-based filtering.
 *
 * @returns Object containing templates and template management functions
 *
 * @example
 * const { templates, applyTemplate } = useRuleTemplates();
 * const result = await applyTemplate('welcome_new_leads', { delaySeconds: 60 });
 */
export function useRuleTemplates(): UseRuleTemplatesReturn {
  const [customTemplates, setCustomTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Load custom templates from Supabase on mount
   */
  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!supabase || !isMountedRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('automation_rules')
          .select('*')
          .eq('is_template', true);

        if (dbError) throw dbError;

        if (isMountedRef.current) {
          const customTemps = ((data || []) as AutomationRule[]).map((rule) => ({
            id: rule.id,
            name: rule.template_name || rule.id,
            displayName: rule.name,
            description: rule.description || '',
            icon: 'bookmark',
            industry: ['general' as const],
            triggerType: rule.trigger_type,
            triggerConfig: rule.trigger_config || {},
            conditions: rule.conditions || [],
            actions: rule.actions || [],
            isCustom: true,
            createdAt: rule.created_at,
          }));

          setCustomTemplates(customTemps);
        }
      } catch (err) {
        if (isMountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadCustomTemplates();
  }, []);

  /**
   * Get all available templates (built-in + custom)
   */
  const getTemplates = useCallback((): RuleTemplate[] => {
    return [...BUILT_IN_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  /**
   * Get a specific template by name
   */
  const getTemplate = useCallback(
    (name: string): RuleTemplate | undefined => {
      return getTemplates().find(
        (t) => t.name === name || t.displayName === name || t.id === name
      );
    },
    [getTemplates]
  );

  /**
   * Apply a template to create a new rule
   */
  const applyTemplate = useCallback(
    async (
      templateName: string,
      customization?: Record<string, any>
    ): Promise<TemplateApplicationResult> => {
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase client not available',
        };
      }

      try {
        setError(null);

        const template = getTemplate(templateName);
        if (!template) {
          return {
            success: false,
            message: `Template '${templateName}' not found`,
          };
        }

        // Merge template with customizations
        const ruleName = customization?.ruleName || `${template.displayName} (${new Date().toLocaleDateString()})`;
        const ruleDescription = customization?.description || template.description;

        // Create the rule
        const { data: rule, error: ruleError } = await supabase
          .from('automation_rules')
          .insert({
            name: ruleName,
            description: ruleDescription,
            trigger_type: template.triggerType,
            trigger_config: {
              ...template.triggerConfig,
              ...(customization?.triggerConfig || {}),
            },
            enabled: customization?.enabled !== false,
            is_template: false,
            total_runs: 0,
            successful_runs: 0,
            failed_runs: 0,
          })
          .select()
          .single();

        if (ruleError) throw ruleError;

        const newRule = rule as AutomationRule;

        // Insert conditions
        if (template.conditions && template.conditions.length > 0) {
          const { error: condError } = await supabase
            .from('automation_conditions')
            .insert(
              template.conditions.map((cond, idx) => ({
                rule_id: newRule.id,
                field_name: cond.field_name,
                operator: cond.operator,
                value: cond.value || null,
                value_type: cond.value_type,
                logic_operator: cond.logic_operator,
                parent_id: null,
                order_index: idx,
              }))
            );

          if (condError) throw condError;
        }

        // Insert actions
        if (template.actions && template.actions.length > 0) {
          const { error: actError } = await supabase
            .from('automation_actions')
            .insert(
              template.actions.map((act, idx) => ({
                rule_id: newRule.id,
                action_type: act.action_type,
                action_config: {
                  ...act.action_config,
                  ...(customization?.actionConfig?.[idx] || {}),
                },
                delay_seconds: customization?.delaySeconds ?? act.delay_seconds ?? 0,
                order_index: idx,
              }))
            );

          if (actError) throw actError;
        }

        return {
          success: true,
          ruleId: newRule.id,
          message: `Rule "${ruleName}" created successfully from template`,
          rule: newRule,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(error);
        }
        return {
          success: false,
          message: error.message,
        };
      }
    },
    [getTemplate]
  );

  /**
   * Save current rule as a custom template
   */
  const saveCustomTemplate = useCallback(
    async (rule: AutomationRule, templateName: string, description: string): Promise<RuleTemplate> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      try {
        setError(null);

        const { data: savedRule, error: dbError } = await supabase
          .from('automation_rules')
          .update({
            is_template: true,
            template_name: templateName,
            description,
          })
          .eq('id', rule.id)
          .select()
          .single();

        if (dbError) throw dbError;

        const template: RuleTemplate = {
          id: savedRule.id,
          name: templateName,
          displayName: rule.name,
          description,
          icon: 'bookmark',
          industry: ['general'],
          triggerType: rule.trigger_type,
          triggerConfig: rule.trigger_config,
          conditions: rule.conditions || [],
          actions: rule.actions || [],
          isCustom: true,
          createdAt: new Date().toISOString(),
        };

        if (isMountedRef.current) {
          setCustomTemplates((prev) => [...prev, template]);
        }

        return template;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      }
    },
    []
  );

  /**
   * Get templates filtered by industry
   */
  const getTemplatesByIndustry = useCallback(
    (industry: IndustryType): RuleTemplate[] => {
      return getTemplates().filter((t) => t.industry.includes(industry));
    },
    [getTemplates]
  );

  return {
    templates: getTemplates(),
    customTemplates,
    loading,
    error,
    getTemplates,
    getTemplate,
    applyTemplate,
    saveCustomTemplate,
    getTemplatesByIndustry,
  };
}
