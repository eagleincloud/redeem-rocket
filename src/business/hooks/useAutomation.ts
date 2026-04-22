/**
 * useAutomation Hook
 * Main automation CRUD hook for managing automation rules
 * Provides state management, CRUD operations, and rule statistics
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../app/lib/supabase';
import {
  AutomationRule,
  Condition,
  Action,
  CreateRuleRequest,
  UpdateRuleRequest,
  DryRunResult,
  ValidationError,
} from '../types/automation';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface RuleStats {
  totalRules: number;
  activeRules: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  errorsThisMonth: number;
}

export interface TestResult {
  ruleId: string;
  passed: boolean;
  message: string;
  details: Record<string, any>;
  dryRunResult?: DryRunResult;
}

export interface UseAutomationReturn {
  rules: AutomationRule[];
  loading: boolean;
  error: Error | null;
  testResults: TestResult[];
  fetchRules: () => Promise<void>;
  createRule: (rule: CreateRuleRequest) => Promise<AutomationRule>;
  updateRule: (id: string, changes: UpdateRuleRequest) => Promise<AutomationRule>;
  deleteRule: (id: string) => Promise<void>;
  toggleRuleActive: (id: string, active: boolean) => Promise<void>;
  testRule: (ruleId: string, testData?: Record<string, any>) => Promise<TestResult>;
  getRuleStats: () => Promise<RuleStats>;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function validateRule(rule: CreateRuleRequest | UpdateRuleRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if ('name' in rule && rule.name) {
    if (rule.name.length < 3) {
      errors.push({
        field: 'name',
        message: 'Rule name must be at least 3 characters',
        code: 'INVALID_NAME_LENGTH',
      });
    }
    if (rule.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Rule name must not exceed 255 characters',
        code: 'INVALID_NAME_LENGTH',
      });
    }
  }

  if ('trigger_type' in rule && !rule.trigger_type) {
    errors.push({
      field: 'trigger_type',
      message: 'Trigger type is required',
      code: 'MISSING_TRIGGER_TYPE',
    });
  }

  if ('trigger_config' in rule && rule.trigger_config) {
    if (typeof rule.trigger_config !== 'object') {
      errors.push({
        field: 'trigger_config',
        message: 'Trigger config must be a valid object',
        code: 'INVALID_TRIGGER_CONFIG',
      });
    }
  }

  if ('actions' in rule && rule.actions) {
    if (!Array.isArray(rule.actions)) {
      errors.push({
        field: 'actions',
        message: 'Actions must be an array',
        code: 'INVALID_ACTIONS',
      });
    } else if (rule.actions.length === 0) {
      errors.push({
        field: 'actions',
        message: 'At least one action is required',
        code: 'NO_ACTIONS',
      });
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useAutomation Hook
 *
 * Main hook for automation rule management with CRUD operations, testing, and statistics.
 * Integrates with Supabase using RLS policies for business_id isolation.
 *
 * @returns Object containing rules, loading state, error, and CRUD functions
 *
 * @example
 * const { rules, fetchRules, createRule, testRule } = useAutomation();
 * useEffect(() => { fetchRules(); }, [fetchRules]);
 */
export function useAutomation(): UseAutomationReturn {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Fetch all automation rules for the business
   * RLS policies ensure only business-owned rules are returned
   */
  const fetchRules = useCallback(async () => {
    if (!supabase) {
      const err = new Error('Supabase client not available');
      if (isMountedRef.current) setError(err);
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      const { data, error: dbError } = await supabase
        .from('automation_rules')
        .select(
          `
          *,
          conditions:automation_conditions(
            id,
            rule_id,
            field_name,
            operator,
            value,
            value_type,
            logic_operator,
            parent_id,
            order_index
          ),
          actions:automation_actions(
            id,
            rule_id,
            action_type,
            action_config,
            delay_seconds,
            order_index
          )
        `
        )
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      if (isMountedRef.current) {
        setRules((data as AutomationRule[]) || []);
      }
    } catch (err) {
      if (isMountedRef.current && abortControllerRef.current?.signal.aborted === false) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Create a new automation rule with validation
   */
  const createRule = useCallback(
    async (ruleData: CreateRuleRequest): Promise<AutomationRule> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const validationErrors = validateRule(ruleData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map((e) => e.message).join(', ')}`);
      }

      try {
        setError(null);

        const { data: rule, error: ruleError } = await supabase
          .from('automation_rules')
          .insert({
            name: ruleData.name,
            description: ruleData.description || null,
            trigger_type: ruleData.trigger_type,
            trigger_config: ruleData.trigger_config,
            enabled: true,
            is_template: ruleData.is_template || false,
            template_name: ruleData.template_name || null,
            total_runs: 0,
            successful_runs: 0,
            failed_runs: 0,
          })
          .select()
          .single();

        if (ruleError) throw ruleError;

        const newRule = rule as AutomationRule;

        // Insert conditions
        if (ruleData.conditions && ruleData.conditions.length > 0) {
          const { error: condError } = await supabase
            .from('automation_conditions')
            .insert(
              ruleData.conditions.map((cond, idx) => ({
                rule_id: newRule.id,
                field_name: cond.field_name,
                operator: cond.operator,
                value: cond.value || null,
                value_type: cond.value_type,
                logic_operator: cond.logic_operator,
                parent_id: cond.parent_id || null,
                order_index: idx,
              }))
            );

          if (condError) throw condError;
        }

        // Insert actions
        if (ruleData.actions && ruleData.actions.length > 0) {
          const { error: actError } = await supabase
            .from('automation_actions')
            .insert(
              ruleData.actions.map((act, idx) => ({
                rule_id: newRule.id,
                action_type: act.action_type,
                action_config: act.action_config,
                delay_seconds: act.delay_seconds || 0,
                order_index: idx,
              }))
            );

          if (actError) throw actError;
        }

        if (isMountedRef.current) {
          await fetchRules();
        }

        return newRule;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      }
    },
    [fetchRules]
  );

  /**
   * Update an existing automation rule
   */
  const updateRule = useCallback(
    async (ruleId: string, changes: UpdateRuleRequest): Promise<AutomationRule> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      try {
        setError(null);

        const updatePayload: Record<string, any> = {};
        if (changes.name !== undefined) updatePayload.name = changes.name;
        if (changes.description !== undefined) updatePayload.description = changes.description;
        if (changes.enabled !== undefined) updatePayload.enabled = changes.enabled;
        if (changes.trigger_config !== undefined) updatePayload.trigger_config = changes.trigger_config;

        const { data: rule, error: ruleError } = await supabase
          .from('automation_rules')
          .update(updatePayload)
          .eq('id', ruleId)
          .select()
          .single();

        if (ruleError) throw ruleError;

        const updatedRule = rule as AutomationRule;

        // Update conditions if provided
        if (changes.conditions) {
          // Delete old conditions
          const { error: delError } = await supabase
            .from('automation_conditions')
            .delete()
            .eq('rule_id', ruleId);

          if (delError) throw delError;

          // Insert new conditions
          if (changes.conditions.length > 0) {
            const { error: insError } = await supabase
              .from('automation_conditions')
              .insert(
                changes.conditions.map((cond, idx) => ({
                  rule_id: ruleId,
                  field_name: cond.field_name,
                  operator: cond.operator,
                  value: cond.value || null,
                  value_type: cond.value_type,
                  logic_operator: cond.logic_operator,
                  parent_id: cond.parent_id || null,
                  order_index: idx,
                }))
              );

            if (insError) throw insError;
          }
        }

        // Update actions if provided
        if (changes.actions) {
          // Delete old actions
          const { error: delError } = await supabase
            .from('automation_actions')
            .delete()
            .eq('rule_id', ruleId);

          if (delError) throw delError;

          // Insert new actions
          if (changes.actions.length > 0) {
            const { error: insError } = await supabase
              .from('automation_actions')
              .insert(
                changes.actions.map((act, idx) => ({
                  rule_id: ruleId,
                  action_type: act.action_type,
                  action_config: act.action_config,
                  delay_seconds: act.delay_seconds || 0,
                  order_index: idx,
                }))
              );

            if (insError) throw insError;
          }
        }

        if (isMountedRef.current) {
          await fetchRules();
        }

        return updatedRule;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      }
    },
    [fetchRules]
  );

  /**
   * Delete an automation rule with confirmation
   */
  const deleteRule = useCallback(
    async (ruleId: string): Promise<void> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Request user confirmation
      const confirmed = window.confirm(
        'Are you sure you want to delete this automation rule? This action cannot be undone.'
      );
      if (!confirmed) return;

      try {
        setError(null);

        // Delete conditions
        const { error: condError } = await supabase
          .from('automation_conditions')
          .delete()
          .eq('rule_id', ruleId);

        if (condError) throw condError;

        // Delete actions
        const { error: actError } = await supabase
          .from('automation_actions')
          .delete()
          .eq('rule_id', ruleId);

        if (actError) throw actError;

        // Delete executions and logs
        const { error: execError } = await supabase
          .from('automation_executions')
          .delete()
          .eq('rule_id', ruleId);

        if (execError) throw execError;

        // Delete rule
        const { error: ruleError } = await supabase
          .from('automation_rules')
          .delete()
          .eq('id', ruleId);

        if (ruleError) throw ruleError;

        if (isMountedRef.current) {
          await fetchRules();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(error);
        }
        throw error;
      }
    },
    [fetchRules]
  );

  /**
   * Toggle a rule's active status
   */
  const toggleRuleActive = useCallback(
    async (ruleId: string, active: boolean): Promise<void> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      try {
        setError(null);

        const { error: dbError } = await supabase
          .from('automation_rules')
          .update({ enabled: active })
          .eq('id', ruleId);

        if (dbError) throw dbError;

        if (isMountedRef.current) {
          setRules((prevRules) =>
            prevRules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: active } : rule))
          );
        }
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
   * Test a rule execution with optional test data
   */
  const testRule = useCallback(
    async (ruleId: string, testData?: Record<string, any>): Promise<TestResult> => {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      try {
        setError(null);

        const response = await fetch('/api/automation/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ruleId, testData: testData || {} }),
        });

        if (!response.ok) {
          throw new Error(`Test failed: ${response.statusText}`);
        }

        const result = (await response.json()) as TestResult;

        if (isMountedRef.current) {
          setTestResults((prev) => [result, ...prev.slice(0, 9)]);
        }

        return result;
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
   * Get rule statistics for the current month
   */
  const getRuleStats = useCallback(async (): Promise<RuleStats> => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      setError(null);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get rules count
      const { count: totalRules } = await supabase
        .from('automation_rules')
        .select('*', { count: 'exact', head: true });

      const { count: activeRules } = await supabase
        .from('automation_rules')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);

      // Get execution stats
      const { data: executionStats } = await supabase
        .from('automation_rules')
        .select('total_runs, successful_runs, failed_runs');

      const stats = executionStats || [];
      const totalRuns = stats.reduce((sum, r) => sum + (r.total_runs || 0), 0);
      const successfulRuns = stats.reduce((sum, r) => sum + (r.successful_runs || 0), 0);
      const failedRuns = stats.reduce((sum, r) => sum + (r.failed_runs || 0), 0);

      // Get errors this month
      const { count: monthErrors } = await supabase
        .from('automation_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('started_at', monthStart.toISOString());

      return {
        totalRules: totalRules || 0,
        activeRules: activeRules || 0,
        totalRuns,
        successfulRuns,
        failedRuns,
        successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0,
        errorsThisMonth: monthErrors || 0,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
      }
      throw error;
    }
  }, []);

  return {
    rules,
    loading,
    error,
    testResults,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    testRule,
    getRuleStats,
  };
}
