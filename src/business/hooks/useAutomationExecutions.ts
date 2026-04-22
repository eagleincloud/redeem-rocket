/**
 * useAutomationExecutions Hook
 * Tracks automation rule executions, logs, and provides real-time execution updates
 * Includes pagination, filtering, and execution statistics
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../app/lib/supabase';
import { AutomationExecution, ExecutionLog, ExecutionStatus } from '../types/automation';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutionFilterOptions {
  ruleId?: string;
  status?: ExecutionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  partialFailures: number;
  averageExecutionTime: number;
  successRate: number;
  errorCount: number;
}

export interface ExecutionSubscription {
  unsubscribe: () => void;
}

export interface UseAutomationExecutionsReturn {
  executions: AutomationExecution[];
  logs: Record<string, ExecutionLog[]>;
  loading: boolean;
  error: Error | null;
  paginated: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
  fetchExecutions: (options?: ExecutionFilterOptions) => Promise<void>;
  fetchLogs: (executionId: string) => Promise<ExecutionLog[]>;
  clearOldLogs: (olderThanDays: number) => Promise<number>;
  getExecutionStats: () => Promise<ExecutionStats>;
  subscribeToExecutions: (ruleId: string) => ExecutionSubscription;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION STATE
// ─────────────────────────────────────────────────────────────────────────────

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useAutomationExecutions Hook
 *
 * Manages automation execution tracking, detailed logs, and real-time updates.
 * Supports pagination, date range filtering, and status filtering.
 * Default pagination: 50 executions per page.
 *
 * @returns Object containing executions, logs, pagination state, and query functions
 *
 * @example
 * const { executions, fetchExecutions, subscribeToExecutions } = useAutomationExecutions();
 * useEffect(() => { fetchExecutions({ ruleId: 'rule-123' }); }, [fetchExecutions]);
 */
export function useAutomationExecutions(): UseAutomationExecutionsReturn {
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [logs, setLogs] = useState<Record<string, ExecutionLog[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
  });

  const [filterOptions, setFilterOptions] = useState<ExecutionFilterOptions | undefined>();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clean up subscriptions
      subscriptionsRef.current.forEach((sub) => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  /**
   * Fetch executions with pagination and filtering
   * Default: 50 executions per page
   */
  const fetchExecutions = useCallback(async (options?: ExecutionFilterOptions) => {
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

      const pageSize = options?.limit || 50;
      const pageNum = options?.offset ? Math.floor(options.offset / pageSize) + 1 : 1;
      const offset = (pageNum - 1) * pageSize;

      let query = supabase
        .from('automation_executions')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false });

      // Apply filters
      if (options?.ruleId) {
        query = query.eq('rule_id', options.ruleId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.startDate) {
        query = query.gte('started_at', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('started_at', options.endDate);
      }

      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error: dbError } = await query;

      if (dbError) throw dbError;

      if (isMountedRef.current && abortControllerRef.current?.signal.aborted === false) {
        setExecutions((data as AutomationExecution[]) || []);
        setPagination({
          currentPage: pageNum,
          pageSize,
          totalCount: count || 0,
        });
        setFilterOptions(options);
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
   * Fetch detailed logs for a specific execution
   */
  const fetchLogs = useCallback(async (executionId: string): Promise<ExecutionLog[]> => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      setError(null);

      const { data, error: dbError } = await supabase
        .from('automation_execution_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true });

      if (dbError) throw dbError;

      const executionLogs = (data as ExecutionLog[]) || [];

      if (isMountedRef.current) {
        setLogs((prev) => ({
          ...prev,
          [executionId]: executionLogs,
        }));
      }

      return executionLogs;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
      }
      throw error;
    }
  }, []);

  /**
   * Clear old execution logs older than specified days
   * Returns number of logs deleted
   */
  const clearOldLogs = useCallback(async (olderThanDays: number): Promise<number> => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      setError(null);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { count, error: dbError } = await supabase
        .from('automation_execution_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (dbError) throw dbError;

      return count || 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
      }
      throw error;
    }
  }, []);

  /**
   * Get execution statistics across all rules
   */
  const getExecutionStats = useCallback(async (): Promise<ExecutionStats> => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      setError(null);

      // Get all execution statuses
      const { data: statusData, error: statusError } = await supabase
        .from('automation_executions')
        .select('status, duration_ms');

      if (statusError) throw statusError;

      const execData = statusData || [];

      // Count executions by status
      const counts = {
        total: execData.length,
        successful: 0,
        failed: 0,
        partial: 0,
      };

      let totalDuration = 0;
      let durationCount = 0;

      execData.forEach((exec) => {
        if (exec.status === 'completed') counts.successful++;
        else if (exec.status === 'failed') counts.failed++;
        else if (exec.status === 'partial_failure') counts.partial++;

        if (exec.duration_ms) {
          totalDuration += exec.duration_ms;
          durationCount++;
        }
      });

      return {
        totalExecutions: counts.total,
        successfulExecutions: counts.successful,
        failedExecutions: counts.failed,
        partialFailures: counts.partial,
        averageExecutionTime: durationCount > 0 ? totalDuration / durationCount : 0,
        successRate:
          counts.total > 0 ? ((counts.successful / counts.total) * 100) : 0,
        errorCount: counts.failed + counts.partial,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
      }
      throw error;
    }
  }, []);

  /**
   * Subscribe to real-time execution updates for a specific rule
   * Returns unsubscribe function
   */
  const subscribeToExecutions = useCallback((ruleId: string): ExecutionSubscription => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const subscription = supabase
      .channel(`executions:${ruleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_executions',
          filter: `rule_id=eq.${ruleId}`,
        },
        (payload) => {
          if (isMountedRef.current) {
            const newExecution = payload.new as AutomationExecution;
            setExecutions((prev) => [newExecution, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_executions',
          filter: `rule_id=eq.${ruleId}`,
        },
        (payload) => {
          if (isMountedRef.current) {
            const updatedExecution = payload.new as AutomationExecution;
            setExecutions((prev) =>
              prev.map((exec) => (exec.id === updatedExecution.id ? updatedExecution : exec))
            );
          }
        }
      )
      .subscribe();

    subscriptionsRef.current.set(ruleId, subscription);

    return {
      unsubscribe: () => {
        subscription?.unsubscribe();
        subscriptionsRef.current.delete(ruleId);
      },
    };
  }, []);

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(async () => {
    const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
    if (pagination.currentPage < totalPages) {
      await fetchExecutions({
        ...filterOptions,
        offset: pagination.currentPage * pagination.pageSize,
        limit: pagination.pageSize,
      });
    }
  }, [pagination, fetchExecutions, filterOptions]);

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(async () => {
    if (pagination.currentPage > 1) {
      await fetchExecutions({
        ...filterOptions,
        offset: (pagination.currentPage - 2) * pagination.pageSize,
        limit: pagination.pageSize,
      });
    }
  }, [pagination, fetchExecutions, filterOptions]);

  /**
   * Jump to specific page
   */
  const goToPage = useCallback(
    async (page: number) => {
      const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
      if (page >= 1 && page <= totalPages) {
        await fetchExecutions({
          ...filterOptions,
          offset: (page - 1) * pagination.pageSize,
          limit: pagination.pageSize,
        });
      }
    },
    [pagination, fetchExecutions, filterOptions]
  );

  return {
    executions,
    logs,
    loading,
    error,
    paginated: {
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(pagination.totalCount / pagination.pageSize),
      totalCount: pagination.totalCount,
    },
    fetchExecutions,
    fetchLogs,
    clearOldLogs,
    getExecutionStats,
    subscribeToExecutions,
    nextPage,
    previousPage,
    goToPage,
  };
}
