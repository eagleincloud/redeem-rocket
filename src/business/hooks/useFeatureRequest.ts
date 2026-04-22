/**
 * useFeatureRequest Hook
 * Manage feature requests and voting
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureRequest, FeatureRequestWithVotedStatus } from '@/business/types/marketplace';
import {
  submitFeatureRequest,
  getFeatureRequests,
  voteOnFeatureRequest,
} from '@/business/services/marketplace/feature-catalog';

interface UseFeatureRequestState {
  requests: FeatureRequestWithVotedStatus[];
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

export function useFeatureRequest(businessId: string, status?: string) {
  const [state, setState] = useState<UseFeatureRequestState>({
    requests: [],
    isLoading: true,
    error: null,
    isSubmitting: false,
  });

  /**
   * Load feature requests
   */
  useEffect(() => {
    const loadRequests = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const requests = await getFeatureRequests(status);

        // Mark which requests the user has voted on
        const withVotedStatus = requests.map((req) => ({
          ...req,
          hasVoted: (req.voter_ids || []).includes(businessId),
        }));

        setState((prev) => ({
          ...prev,
          requests: withVotedStatus,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load requests',
          isLoading: false,
        }));
      }
    };

    loadRequests();
  }, [status, businessId]);

  /**
   * Submit a new feature request
   */
  const submitRequest = useCallback(
    async (featureName: string, description: string, useCase?: string, expectedImpact?: string) => {
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const request = await submitFeatureRequest(
          businessId,
          featureName,
          description,
          useCase,
          expectedImpact,
        );

        const requestWithStatus: FeatureRequestWithVotedStatus = {
          ...request,
          hasVoted: true,
          voteCount: 1,
        };

        setState((prev) => ({
          ...prev,
          requests: [requestWithStatus, ...prev.requests],
          isSubmitting: false,
        }));

        return request;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to submit request',
          isSubmitting: false,
        }));
        throw err;
      }
    },
    [businessId],
  );

  /**
   * Vote on a feature request
   */
  const vote = useCallback(
    async (requestId: string) => {
      try {
        const updated = await voteOnFeatureRequest(requestId, businessId);

        setState((prev) => ({
          ...prev,
          requests: prev.requests.map((req) => {
            if (req.id === requestId) {
              return {
                ...updated,
                hasVoted: (updated.voter_ids || []).includes(businessId),
              };
            }
            return req;
          }),
        }));

        return updated;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to vote',
        }));
        throw err;
      }
    },
    [businessId],
  );

  /**
   * Get requests sorted by votes
   */
  const trendingRequests = useMemo(
    () => [...state.requests].sort((a, b) => b.vote_count - a.vote_count),
    [state.requests],
  );

  return useMemo(
    () => ({
      ...state,
      submitRequest,
      vote,
      trendingRequests,
    }),
    [state, submitRequest, vote, trendingRequests],
  );
}
