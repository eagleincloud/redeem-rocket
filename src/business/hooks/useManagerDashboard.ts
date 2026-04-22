import { useEffect, useState, useCallback } from 'react';
import { ManagerProfile, ManagerAssignment, AIRecommendation, ManagerInteraction, ManagerDashboardData } from '@/business/types';
import { calculateManagerMetrics } from '@/business/services/performance-calculator';

export function useManagerDashboard(managerId: string) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await calculateManagerMetrics(managerId, 30);
      setData({
        profile: {} as ManagerProfile,
        assignments: [],
        pending_recommendations: [],
        recent_interactions: [],
        performance_metrics: metrics || {} as any,
        schedule: {} as any,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
