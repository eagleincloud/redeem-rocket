import { useEffect, useState, useCallback } from 'react';
import { AIRecommendation } from '@/business/types';
import { reviewRecommendation } from '@/business/services/ai-manager-orchestrator';

export function useAIRecommendations(businessId: string, filters?: any) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [businessId, filters]);

  const handleReviewRecommendation = useCallback(
    async (id: string, accepted: boolean, notes?: string) => {
      try {
        await reviewRecommendation(id, 'manager-id', accepted, notes);
        setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, is_accepted: accepted } : r)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      }
    },
    [],
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, reviewRecommendation: handleReviewRecommendation, refetch: fetchRecommendations };
}
