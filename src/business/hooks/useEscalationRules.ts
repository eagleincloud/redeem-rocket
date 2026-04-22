import { useEffect, useState, useCallback } from 'react';
import { EscalationRule } from '@/business/types';
import { createEscalationRule, updateEscalationRule, getEscalationRules } from '@/business/services/escalation-handler';

export function useEscalationRules(businessId: string) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await getEscalationRules(businessId);
      setRules(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const handleCreateRule = useCallback(async (rule: any) => {
    try {
      const created = await createEscalationRule(businessId, rule);
      if (created) setRules((p) => [...p, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    }
  }, [businessId]);

  const handleUpdateRule = useCallback(async (id: string, updates: any) => {
    try {
      const updated = await updateEscalationRule(id, updates);
      if (updated) setRules((p) => p.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    }
  }, []);

  const handleDeleteRule = useCallback(async (id: string) => {
    try {
      setRules((p) => p.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, createRule: handleCreateRule, updateRule: handleUpdateRule, deleteRule: handleDeleteRule, refetch: fetchRules };
}
