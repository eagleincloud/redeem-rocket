import { useState, useEffect } from 'react'
import { useFeatureRequests } from '../hooks/useFeatures'
import { FeatureRequestEditor } from './FeatureRequestEditor'
import type { FeatureRequest, FeatureRequestStatus } from '../types'

export function FeatureRequestQueue() {
  const { requests, loading, error, fetchAllRequests } = useFeatureRequests()
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<FeatureRequestStatus | null>(null)

  useEffect(() => {
    fetchAllRequests(statusFilter || undefined)
  }, [statusFilter, fetchAllRequests])

  const filteredRequests = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests

  const getStatusColor = (status: FeatureRequestStatus) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'ai_development':
        return 'bg-purple-100 text-purple-800'
      case 'admin_testing':
        return 'bg-orange-100 text-orange-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'deployed':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressStep = (status: FeatureRequestStatus): number => {
    const steps: Record<FeatureRequestStatus, number> = {
      submitted: 1,
      in_review: 2,
      ai_development: 3,
      admin_testing: 4,
      approved: 5,
      deployed: 6,
    }
    return steps[status] || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">📋 Feature Request Queue</h1>
          <p className="text-gray-600 mt-2">Review and process customer feature requests</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          {[
            { status: null as FeatureRequestStatus | null, label: 'Total', count: requests.length, color: 'bg-gray-100' },
            { status: 'submitted' as FeatureRequestStatus, label: 'Submitted', count: requests.filter((r: FeatureRequest) => r.status === 'submitted').length, color: 'bg-blue-100' },
            { status: 'in_review' as FeatureRequestStatus, label: 'In Review', count: requests.filter((r: FeatureRequest) => r.status === 'in_review').length, color: 'bg-yellow-100' },
            { status: 'ai_development' as FeatureRequestStatus, label: 'AI Dev', count: requests.filter((r: FeatureRequest) => r.status === 'ai_development').length, color: 'bg-purple-100' },
            { status: 'admin_testing' as FeatureRequestStatus, label: 'Testing', count: requests.filter((r: FeatureRequest) => r.status === 'admin_testing').length, color: 'bg-orange-100' },
            { status: 'approved' as FeatureRequestStatus, label: 'Approved', count: requests.filter((r: FeatureRequest) => r.status === 'approved').length, color: 'bg-green-100' },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(stat.status)}
              className={`p-4 rounded-lg font-medium transition ${
                statusFilter === stat.status
                  ? 'ring-2 ring-blue-600 ' + stat.color
                  : stat.color + ' hover:shadow-md'
              }`}
            >
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-sm text-gray-700">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-900 font-medium">No requests found</p>
                <p className="text-blue-800 text-sm mt-1">Check a different status filter</p>
              </div>
            ) : (
              filteredRequests.map((request: FeatureRequest) => (
                <FeatureRequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedRequest?.id === request.id}
                  onSelect={() => setSelectedRequest(request)}
                  getStatusColor={getStatusColor}
                  getProgressStep={getProgressStep}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedRequest && (
        <FeatureRequestEditor
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(updated) => setSelectedRequest(updated)}
        />
      )}
    </div>
  )
}

function FeatureRequestCard({
  request,
  isSelected,
  onSelect,
  getStatusColor,
  getProgressStep,
}: {
  request: FeatureRequest
  isSelected: boolean
  onSelect: () => void
  getStatusColor: (status: FeatureRequestStatus) => string
  getProgressStep: (status: FeatureRequestStatus) => number
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition
        ${isSelected ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{request.feature_name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-4 ${getStatusColor(request.status)}`}>
          {request.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex gap-1 h-1.5">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`flex-1 rounded-full ${
                step <= getProgressStep(request.status) ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Step {getProgressStep(request.status)} of 6: {getProgressStep(request.status) === 6 ? '✅ Complete' : 'In Progress'}
        </p>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-gray-600">Requested by</p>
          <p className="font-medium text-gray-900">{request.requester_id.slice(0, 8)}...</p>
        </div>
        <div>
          <p className="text-gray-600">Submitted</p>
          <p className="font-medium text-gray-900">{new Date(request.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Business Types</p>
          <p className="font-medium text-gray-900">{request.business_type_relevance.join(', ')}</p>
        </div>
      </div>

      {/* Testing Status */}
      {request.status === 'admin_testing' && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm font-medium text-orange-900">Testing Status: {request.admin_testing_status || 'Not started'}</p>
        </div>
      )}

      {/* Admin Notes Preview */}
      {request.admin_notes && (
        <div className="text-sm">
          <p className="text-gray-600 font-medium mb-1">Admin Notes:</p>
          <p className="text-gray-700 line-clamp-2">{request.admin_notes}</p>
        </div>
      )}
    </div>
  )
}
