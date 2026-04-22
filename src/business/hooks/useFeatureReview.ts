/**
 * useFeatureReview Hook
 * Manage feature reviews for current user
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureReview } from '@/business/types/marketplace';
import { getFeatureReviews, submitFeatureReview } from '@/business/services/marketplace/feature-catalog';

interface UseFeatureReviewState {
  reviews: FeatureReview[];
  userReview: FeatureReview | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

export function useFeatureReview(featureId: string, businessId: string) {
  const [state, setState] = useState<UseFeatureReviewState>({
    reviews: [],
    userReview: null,
    isLoading: true,
    error: null,
    isSaving: false,
  });

  /**
   * Load reviews
   */
  useEffect(() => {
    const loadReviews = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const reviews = await getFeatureReviews(featureId);
        const userReview = reviews.find((r) => r.business_id === businessId) || null;

        setState((prev) => ({
          ...prev,
          reviews,
          userReview,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load reviews',
          isLoading: false,
        }));
      }
    };

    loadReviews();
  }, [featureId, businessId]);

  /**
   * Submit or update review
   */
  const submitReview = useCallback(
    async (reviewText: string, useCaseTag?: string | null, wouldRecommend?: boolean) => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const review = await submitFeatureReview(
          featureId,
          businessId,
          reviewText,
          useCaseTag || null,
          wouldRecommend !== false,
        );

        // Update state with new review
        setState((prev) => {
          const updatedReviews = prev.reviews.filter((r) => r.business_id !== businessId);
          return {
            ...prev,
            reviews: [review, ...updatedReviews],
            userReview: review,
            isSaving: false,
          };
        });

        return review;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to save review',
          isSaving: false,
        }));
        throw err;
      }
    },
    [featureId, businessId],
  );

  /**
   * Get other reviews (excluding user's review)
   */
  const otherReviews = useMemo(
    () => state.reviews.filter((r) => r.business_id !== businessId),
    [state.reviews, businessId],
  );

  return useMemo(
    () => ({
      ...state,
      otherReviews,
      submitReview,
      hasReviewed: state.userReview !== null,
    }),
    [state, otherReviews, submitReview],
  );
}
