/**
 * useFeatureVoting Hook
 * Manages feature voting with caching and real-time updates
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';

interface UseFeatureVotingState {
  votes: Record<string, number>;
  userVotes: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export function useFeatureVoting(businessId: string) {
  const [state, setState] = useState<UseFeatureVotingState>({
    votes: {},
    userVotes: new Set(),
    isLoading: false,
    error: null,
  });

  // Load all votes and user's votes on mount
  useEffect(() => {
    const loadVotes = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Get all votes count
        const { data: votesData, error: votesError } = await supabase
          .from('feature_votes')
          .select('feature_id')
          .order('feature_id');

        // Get user's votes
        const { data: userVotesData, error: userVotesError } = await supabase
          .from('feature_votes')
          .select('feature_id')
          .eq('business_id', businessId);

        if (votesError || userVotesError) {
          throw new Error('Failed to load votes');
        }

        // Count votes by feature
        const voteCounts: Record<string, number> = {};
        votesData?.forEach((vote: any) => {
          voteCounts[vote.feature_id] = (voteCounts[vote.feature_id] || 0) + 1;
        });

        // Build user votes set
        const userVotesSet = new Set(userVotesData?.map((v: any) => v.feature_id) || []);

        setState((prev) => ({
          ...prev,
          votes: voteCounts,
          userVotes: userVotesSet,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load votes',
          isLoading: false,
        }));
      }
    };

    loadVotes();
  }, [businessId]);

  // Toggle vote for a feature
  const toggleVote = useCallback(
    async (featureId: string) => {
      const hasVoted = state.userVotes.has(featureId);

      try {
        if (hasVoted) {
          // Remove vote
          const { error } = await supabase
            .from('feature_votes')
            .delete()
            .eq('feature_id', featureId)
            .eq('business_id', businessId);

          if (error) throw error;

          setState((prev) => ({
            ...prev,
            votes: {
              ...prev.votes,
              [featureId]: Math.max(0, (prev.votes[featureId] || 0) - 1),
            },
            userVotes: new Set([...prev.userVotes].filter((id) => id !== featureId)),
          }));
        } else {
          // Add vote
          const { error } = await supabase.from('feature_votes').insert([
            {
              feature_id: featureId,
              business_id: businessId,
            },
          ]);

          if (error) throw error;

          setState((prev) => ({
            ...prev,
            votes: {
              ...prev.votes,
              [featureId]: (prev.votes[featureId] || 0) + 1,
            },
            userVotes: new Set([...prev.userVotes, featureId]),
          }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to update vote',
        }));
      }
    },
    [businessId, state.userVotes]
  );

  // Get vote count for a feature
  const getVoteCount = useCallback(
    (featureId: string) => {
      return state.votes[featureId] || 0;
    },
    [state.votes]
  );

  // Check if user has voted
  const hasVoted = useCallback(
    (featureId: string) => {
      return state.userVotes.has(featureId);
    },
    [state.userVotes]
  );

  return useMemo(
    () => ({
      ...state,
      toggleVote,
      getVoteCount,
      hasVoted,
    }),
    [state, toggleVote, getVoteCount, hasVoted]
  );
}
