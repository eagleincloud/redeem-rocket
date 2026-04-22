import { useEffect, useState, useCallback } from 'react';
import { ManagerPerformanceMetrics } from '@/business/types';
import { calculateManagerMetrics } from '@/business/services/performance-calculator';

export function useManagerPerformance(managerId: string, periodDays: number = 30) {
  const [metrics, setMetrics] = useState<ManagerPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const calc = await calculateManagerMetrics(managerId, periodDays);
      setMetrics(calc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [managerId, periodDays]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
