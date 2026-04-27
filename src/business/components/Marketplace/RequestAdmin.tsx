/**
 * RequestAdmin Component
 * Admin panel for managing feature requests with approval workflow
 */

import React, { memo, useEffect, useState, useCallback } from 'react';
import { CheckCircle, X, Clock, Loader, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/app/supabase';

type RequestStatus = 'submitted' | 'under_review' | 'planned' | 'in_development' | 'released' | 'rejected';

interface FeatureRequest {
  id: string;
  feature_name: string;
  description: string;
  business_id: string;
  status: RequestStatus;
  vote_count: number;
  use_case?: string;
  expected_impact?: string;
  created_at: string;
  updated_at: string;
}

interface RequestAdminProps {
  businessId?: string;
  isAdmin?: boolean;
}

const STATUS_CONFIG: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  submitted: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Submitted' },
  under_review: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Under Review' },
  planned: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Planned' },
  in_development: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'In Development' },
  released: { bg: 'bg-green-50', text: 'text-green-700', label: 'Released' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
};

const STATUS_ORDER: RequestStatus[] = [
  'submitted',
  'under_review',
  'planned',
  'in_development',
  'released',
  'rejected',
];

export const RequestAdmin = memo(function RequestAdmin({
  businessId = '',
  isAdmin = false,
}: RequestAdminProps) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('feature_requests')
          .select('*')
          .order('vote_count', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (!error && data) {
          setRequests(data as FeatureRequest[]);
        }
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [statusFilter]);

  const updateRequestStatus = useCallback(
    async (requestId: string, newStatus: RequestStatus) => {
      try {
        const { error } = await supabase
          .from('feature_requests')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (!error) {
          setRequests((prev) =>
            prev.map((req) =>
              req.id === requestId ? { ...req, status: newStatus } : req
            )
          );
        }
      } catch (err) {
        console.error('Failed to update request status:', err);
      }
    },
    []
  );

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-700" />
          <p className="text-sm text-yellow-700">You need admin permissions to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-0">
        <button
          onClick={() => setStatusFilter('all')}
          className={`whitespace-nowrap px-4 py-2 font-medium transition-colors ${
            statusFilter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Requests ({requests.length})
        </button>
        {STATUS_ORDER.map((status) => {
          const count = requests.filter((r) => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 font-medium transition-colors ${
                statusFilter === status
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {STATUS_CONFIG[status].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-gray-600">No feature requests in this status</p>
          </div>
        ) : (
          requests.map((request) => {
            const config = STATUS_CONFIG[request.status];
            const isExpanded = expandedId === request.id;

            return (
              <div key={request.id} className={`rounded-lg border border-gray-200 ${config.bg}`}>
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                  className="w-full p-4 text-left transition-colors hover:bg-opacity-75"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{request.feature_name}</h4>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-sm text-gray-700">{request.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-semibold text-gray-900">{request.vote_count}</div>
                        <div className="text-xs text-gray-600">votes</div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        } text-gray-400`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    {request.use_case && (
                      <div>
                        <h5 className="mb-1 font-medium text-gray-900">Use Case</h5>
                        <p className="text-sm text-gray-700">{request.use_case}</p>
                      </div>
                    )}

                    {request.expected_impact && (
                      <div>
                        <h5 className="mb-1 font-medium text-gray-900">Expected Impact</h5>
                        <p className="text-sm text-gray-700 capitalize">{request.expected_impact}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-600">
                      <p>
                        Submitted:{' '}
                        {new Date(request.created_at).toLocaleDateString()} at{' '}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Status Workflow */}
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="mb-3 font-medium text-gray-900">Change Status</h5>
                      <div className="grid gap-2 md:grid-cols-3">
                        {STATUS_ORDER.map((newStatus) => (
                          <button
                            key={newStatus}
                            onClick={() => updateRequestStatus(request.id, newStatus)}
                            disabled={newStatus === request.status}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                              newStatus === request.status
                                ? 'bg-white text-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {STATUS_CONFIG[newStatus].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
