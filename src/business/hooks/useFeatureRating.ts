/**
 * useFeatureRating Hook
 * Manage feature ratings for current user
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureRating, RatingStats } from '@/business/types/marketplace';
import { getFeatureRatingStats, setFeatureRating } from '@/business/services/marketplace/feature-catalog';

interface UseFeatureRatingState {
  rating: FeatureRating | null;
  stats: RatingStats | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

export function useFeatureRating(featureId: string, businessId: string) {
  const [state, setState] = useState<UseFeatureRatingState>({
    rating: null,
    stats: null,
    isLoading: true,
    error: null,
    isSaving: false,
  });

  /**
   * Load rating and stats
   */
  useEffect(() => {
    const loadRating = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const stats = await getFeatureRatingStats(featureId);
        setState((prev) => ({
          ...prev,
          stats,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load ratings',
          isLoading: false,
        }));
      }
    };

    loadRating();
  }, [featureId]);

  /**
   * Submit or update rating
   */
  const submitRating = useCallback(
    async (ratingValue: 1 | 2 | 3 | 4 | 5) => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const rating = await setFeatureRating(featureId, businessId, ratingValue);

        // Reload stats
        const stats = await getFeatureRatingStats(featureId);

        setState((prev) => ({
          ...prev,
          rating,
          stats,
          isSaving: false,
        }));

        return rating;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to save rating',
          isSaving: false,
        }));
        throw err;
      }
    },
    [featureId, businessId],
  );

  return useMemo(
    () => ({
      ...state,
      submitRating,
    }),
    [state, submitRating],
  );
}
