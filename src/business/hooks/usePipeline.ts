/**
 * Pipeline Custom Hooks
 * Provides React hooks for pipeline management and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Pipeline,
  PipelineEntity,
  PipelineMetrics,
  PipelineStage,
  EntityFilters,
  UpdatePipelineRequest,
  UpdateEntityRequest,
  CreateStageRequest,
  UpdateStageRequest,
  UsePipelineReturn,
  UsePipelineEntitiesReturn,
  UsePipelineMetricsReturn,
  UseEntityMoveReturn,
  UsePipelineEditReturn,
  UsePipelineSubscriptionReturn,
  RealtimeChange,
} from '../types/pipeline';
import {
  getPipeline,
  updatePipeline as updatePipelineApi,
  getEntities,
  moveEntity as moveEntityApi,
  getPipelineMetrics,
  getStagesByPipeline,
  createStage as createStageApi,
  updateStage as updateStageApi,
  deleteStage as deleteStageApi,
  reorderStages as reorderStagesApi,
} from '../../app/api/pipeline';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// usePipeline Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get and manage a specific pipeline with refetch capability
 */
export function usePipeline(pipelineId: string): UsePipelineReturn {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPipeline(pipelineId);
      setPipeline(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    if (pipelineId) {
      fetchPipeline();
    }
  }, [pipelineId, fetchPipeline]);

  const updateName = useCallback(async (name: string) => {
    try {
      const updated = await updatePipelineApi(pipelineId, { name });
      setPipeline(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [pipelineId]);

  const updateColor = useCallback(async (color: string) => {
    try {
      const updated = await updatePipelineApi(pipelineId, { color });
      setPipeline(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [pipelineId]);

  const updateDescription = useCallback(async (description: string) => {
    try {
      const updated = await updatePipelineApi(pipelineId, { description });
      setPipeline(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [pipelineId]);

  return {
    pipeline,
    loading,
    error,
    refetch: fetchPipeline,
    updateName,
    updateColor,
    updateDescription,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// usePipelineEntities Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get entities with advanced filtering and pagination
 */
export function usePipelineEntities(
  pipelineId: string,
  initialFilters?: EntityFilters,
  initialPage: number = 1
): UsePipelineEntitiesReturn {
  const [entities, setEntities] = useState<PipelineEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<EntityFilters>(initialFilters || {});
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEntities(pipelineId, filters, {
        page,
        limit,
      });
      setEntities(data);
      setTotal(data.length + (page - 1) * limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [pipelineId, filters, page]);

  useEffect(() => {
    if (pipelineId) {
      fetchEntities();
    }
  }, [pipelineId, fetchEntities]);

  const search = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setPage(1);
  }, []);

  const filterByStage = useCallback((stageId: string) => {
    setFilters(prev => ({ ...prev, stage_id: stageId }));
    setPage(1);
  }, []);

  const filterByAssignee = useCallback((userId: string) => {
    setFilters(prev => ({ ...prev, assigned_to: userId }));
    setPage(1);
  }, []);

  const filterByPriority = useCallback((priority) => {
    setFilters(prev => ({ ...prev, priority }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    entities,
    loading,
    error,
    pagination: { page, total, limit },
    setPage,
    search,
    filterByStage,
    filterByAssignee,
    filterByPriority,
    clearFilters,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// usePipelineMetrics Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get pipeline metrics with caching (5 min TTL)
 */
export function usePipelineMetrics(pipelineId: string): UsePipelineMetricsReturn {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{ data: PipelineMetrics; timestamp: number } | null>(null);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.timestamp < CACHE_TTL) {
        setMetrics(cacheRef.current.data);
        setLoading(false);
        return;
      }

      const data = await getPipelineMetrics(pipelineId);
      cacheRef.current = { data, timestamp: now };
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    if (pipelineId) {
      refresh();
    }
  }, [pipelineId, refresh]);

  return {
    metrics,
    loading,
    error,
    refresh,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useEntityMove Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle moving an entity to a different stage
 */
export function useEntityMove(entityId: string): UseEntityMoveReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const moveEntity = useCallback(async (newStageId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await moveEntityApi(entityId, newStageId, reason);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  return {
    moveEntity,
    loading,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// usePipelineEdit Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle all pipeline editing operations
 */
export function usePipelineEdit(pipelineId: string): UsePipelineEditReturn {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error | null>>({});

  const updateBasics = useCallback(async (name: string, description: string) => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, updateBasics: null }));
      await updatePipelineApi(pipelineId, { name, description });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrors(prev => ({ ...prev, updateBasics: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const addStage = useCallback(async (stage: CreateStageRequest): Promise<PipelineStage> => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, addStage: null }));
      const result = await createStageApi(pipelineId, stage);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrors(prev => ({ ...prev, addStage: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const updateStage = useCallback(async (stageId: string, updates: UpdateStageRequest) => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, updateStage: null }));
      await updateStageApi(stageId, updates);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrors(prev => ({ ...prev, updateStage: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStage = useCallback(async (stageId: string) => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, deleteStage: null }));
      await deleteStageApi(stageId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrors(prev => ({ ...prev, deleteStage: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderStages = useCallback(async (stageIds: string[]) => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, reorderStages: null }));
      await reorderStagesApi(pipelineId, stageIds);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrors(prev => ({ ...prev, reorderStages: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  return {
    updateBasics,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    loading,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// usePipelineSubscription Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Real-time subscription to pipeline changes
 */
export function usePipelineSubscription(
  pipelineId: string
): UsePipelineSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const subscribe = useCallback((callback: (change: RealtimeChange) => void) => {
    if (!pipelineId) return () => {};

    try {
      // Subscribe to entity changes
      const entitySubscription = supabase
        .from(`pipeline_entities:pipeline_id=eq.${pipelineId}`)
        .on('*', (payload) => {
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'pipeline_entities',
            record: payload.new,
            old_record: payload.old,
          });
        })
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      subscriptionRef.current = entitySubscription;

      // Cleanup function
      return () => {
        if (subscriptionRef.current) {
          supabase.removeSubscription(subscriptionRef.current);
        }
      };
    } catch (error) {
      console.error('Subscription error:', error);
      return () => {};
    }
  }, [pipelineId]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeSubscription(subscriptionRef.current);
      }
    };
  }, []);

  return {
    subscribe,
    isConnected,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const PipelineHooks = {
  usePipeline,
  usePipelineEntities,
  usePipelineMetrics,
  useEntityMove,
  usePipelineEdit,
  usePipelineSubscription,
};
