/**
 * VotingSystem Component
 * Handles feature voting with vote tracking and real-time updates
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import { ThumbsUp, Loader } from 'lucide-react';
import { supabase } from '@/app/supabase';

interface VotingSystemProps {
  featureId: string;
  businessId: string;
  votesCount?: number;
  onVoteChange?: (newCount: number) => void;
}

export const VotingSystem = memo(function VotingSystem({
  featureId,
  businessId,
  votesCount = 0,
  onVoteChange,
}: VotingSystemProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(votesCount);

  // Check if user has already voted
  useEffect(() => {
    const checkVote = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_votes')
          .select('id', { count: 'exact', head: true })
          .eq('feature_id', featureId)
          .eq('business_id', businessId);

        if (!error) {
          setHasVoted((data?.length ?? 0) > 0);
        }
      } catch (err) {
        console.error('Failed to check vote status:', err);
      }
    };

    checkVote();
  }, [featureId, businessId]);

  const toggleVote = useCallback(async () => {
    setLoading(true);
    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('feature_votes')
          .delete()
          .eq('feature_id', featureId)
          .eq('business_id', businessId);

        if (!error) {
          setHasVoted(false);
          const newCount = Math.max(0, count - 1);
          setCount(newCount);
          onVoteChange?.(newCount);
        }
      } else {
        // Add vote
        const { error } = await supabase
          .from('feature_votes')
          .insert([
            {
              feature_id: featureId,
              business_id: businessId,
            },
          ]);

        if (!error) {
          setHasVoted(true);
          const newCount = count + 1;
          setCount(newCount);
          onVoteChange?.(newCount);
        }
      }
    } catch (err) {
      console.error('Failed to toggle vote:', err);
    } finally {
      setLoading(false);
    }
  }, [featureId, businessId, hasVoted, count, onVoteChange]);

  return (
    <button
      onClick={toggleVote}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50 ${
        hasVoted
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title={hasVoted ? 'Remove vote' : 'Vote for this feature'}
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
      )}
      <span>{count}</span>
    </button>
  );
});
