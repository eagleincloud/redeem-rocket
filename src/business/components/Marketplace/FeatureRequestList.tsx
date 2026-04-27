/**
 * FeatureRequestList Component
 * Displays all feature requests with status and voting
 */

import React, { memo, useEffect, useState } from 'react';
import { TrendingUp, ChevronDown, Loader } from 'lucide-react';
import { supabase } from '@/app/supabase';

interface FeatureRequest {
  id: string;
  feature_name: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'rejected' | 'planned';
  vote_count: number;
  use_case?: string;
  expected_impact?: string;
  created_at: string;
  completed_at?: string;
}

interface FeatureRequestListProps {
  businessId: string;
  limit?: number;
  showOnlyUserRequests?: boolean;
}

const STATUS_CONFIG = {
  open: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'In Progress' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
  planned: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Planned' },
};

export const FeatureRequestList = memo(function FeatureRequestList({
  businessId,
  limit = 10,
  showOnlyUserRequests = false,
}: FeatureRequestListProps) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        let query = supabase.from('feature_requests').select('*');

        if (showOnlyUserRequests) {
          query = query.eq('business_id', businessId);
        }

        const { data, error } = await query
          .order(sortBy === 'votes' ? 'vote_count' : 'created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          setRequests(data as FeatureRequest[]);
        }
      } catch (err) {
        console.error('Failed to load feature requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [businessId, limit, sortBy, showOnlyUserRequests]);

  const upvoteRequest = async (requestId: string, currentVotes: number) => {
    try {
      // Add current user to voter_ids if not already present
      const { error } = await supabase
        .from('feature_requests')
        .update({
          vote_count: currentVotes + 1,
        })
        .eq('id', requestId);

      if (!error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, vote_count: r.vote_count + 1 } : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to upvote request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <TrendingUp className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <p className="text-gray-600">No feature requests yet. Be the first to request a feature!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Feature Requests</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('votes')}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              sortBy === 'votes'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Requests
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              sortBy === 'newest'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const statusConfig = STATUS_CONFIG[request.status];
          return (
            <div
              key={request.id}
              className={`rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 ${statusConfig.bg}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{request.feature_name}</h4>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-700">{request.description}</p>
                  {request.use_case && (
                    <p className="text-xs text-gray-600">
                      <strong>Use case:</strong> {request.use_case}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => upvoteRequest(request.id, request.vote_count)}
                    className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                    {request.vote_count}
                  </button>
                  <span className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
