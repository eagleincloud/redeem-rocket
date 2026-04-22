import { useEffect, useState, useCallback } from 'react';
import { HybridWorkflow } from '@/business/types';
import { orchestrateLeadHandling } from '@/business/services/ai-manager-orchestrator';

export function useHybridWorkflow(businessId: string) {
  const [workflows, setWorkflows] = useState<HybridWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setWorkflows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const handleCreateWorkflow = useCallback(async (input: any) => {
    try {
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    }
  }, [businessId]);

  const handleUpdateWorkflow = useCallback(async (id: string, updates: any) => {
    try {
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    }
  }, []);

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    try {
      setWorkflows((p) => p.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, []);

  const handleExecuteWorkflow = useCallback(async (entityId: string, entityType: string, entityData?: any) => {
    try {
      const result = await orchestrateLeadHandling(businessId, { entity_id: entityId, entity_type: entityType, ...entityData });
      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Error' };
    }
  }, [businessId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    createWorkflow: handleCreateWorkflow,
    updateWorkflow: handleUpdateWorkflow,
    deleteWorkflow: handleDeleteWorkflow,
    executeWorkflow: handleExecuteWorkflow,
    refetch: fetchWorkflows,
  };
}
