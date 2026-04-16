import { useState } from 'react'
import * as featureService from '../../lib/supabase/features'
import type { FeatureRequest } from '../../types'

interface FeatureRequestEditorProps {
  request: FeatureRequest
  onClose: () => void
  onUpdate: (updated: FeatureRequest) => void
}

export function FeatureRequestEditor({ request, onClose, onUpdate }: FeatureRequestEditorProps) {
  const [status, setStatus] = useState(request.status)
  const [testingStatus, setTestingStatus] = useState<'passed' | 'failed' | 'in_progress'>(
    request.admin_testing_status as any || 'in_progress'
  )
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '')
  const [rolloutPercentage, setRolloutPercentage] = useState(request.rollout_percentage || 100)
  const [makeAvailableToAll, setMakeAvailableToAll] = useState(request.make_available_to_all_businesses)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await featureService.updateFeatureRequestStatus(
        request.id,
        newStatus,
        adminNotes
      )
      setStatus(newStatus as any)
      onUpdate(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAfterTesting = async () => {
    setLoading(true)
    setError(null)
    try {
      const updated = await featureService.updateFeatureRequestAdminApproval(
        request.id,
        testingStatus,
        adminNotes
      )
      setStatus(updated.status as any)
      onUpdate(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update approval')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setLoading(true)
    setError(null)
    try {
      const { request: updated } = await featureService.deployFeatureRequest(
        request.id,
        rolloutPercentage
      )
      setStatus(updated.status as any)
      onUpdate(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy feature')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl overflow-y-auto z-40 border-l border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Feature Request Details</h2>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Request Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Feature Name</p>
            <p className="text-lg font-bold text-gray-900">{request.feature_name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Description</p>
            <p className="text-sm text-gray-700 mt-1">{request.description}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Business Types</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {request.business_type_relevance.map((type) => (
                <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Requested By</p>
            <p className="text-sm text-gray-700 font-mono">{request.requester_id}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Submitted</p>
            <p className="text-sm text-gray-700">{new Date(request.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Workflow Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Workflow</h3>

          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">Current Status</p>
            <p className="text-base font-bold text-gray-900 capitalize">{status.replace(/_/g, ' ')}</p>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this request..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            />
          </div>

          {/* Status Actions */}
          <div className="space-y-2">
            {status === 'submitted' && (
              <button
                onClick={() => handleStatusUpdate('in_review')}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
              >
                Move to In Review
              </button>
            )}

            {status === 'in_review' && (
              <button
                onClick={() => handleStatusUpdate('ai_development')}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                Start AI Development
              </button>
            )}

            {status === 'ai_development' && (
              <button
                onClick={() => handleStatusUpdate('admin_testing')}
                disabled={loading}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                Move to Admin Testing
              </button>
            )}

            {status === 'admin_testing' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Testing Status</label>
                  <select
                    value={testingStatus}
                    onChange={(e) => setTestingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={loading}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="passed">Passed Testing ✓</option>
                    <option value="failed">Failed Testing ✗</option>
                  </select>
                </div>

                <button
                  onClick={handleApproveAfterTesting}
                  disabled={loading || testingStatus !== 'passed'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {testingStatus === 'passed' ? 'Approve & Ready to Deploy' : 'Complete Testing First'}
                </button>

                {testingStatus === 'failed' && (
                  <button
                    onClick={() => handleStatusUpdate('in_review')}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject & Send Back to Review
                  </button>
                )}
              </div>
            )}

            {status === 'approved' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Rollout Percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={rolloutPercentage}
                    onChange={(e) => setRolloutPercentage(parseInt(e.target.value))}
                    className="flex-1"
                    disabled={loading}
                  />
                  <span className="text-sm font-bold text-gray-900 w-12">{rolloutPercentage}%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Start with 10-50% and increase if stable</p>

                <button
                  onClick={handleDeploy}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 mt-3"
                >
                  Deploy to Production
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Make Available to All Businesses */}
        {(status === 'approved' || status === 'deployed') && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={makeAvailableToAll}
                onChange={(e) => setMakeAvailableToAll(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Make available to all businesses</span>
            </label>
            <p className="text-xs text-gray-600 ml-7">
              If enabled, this feature will be offered to all customers, not just the requester.
            </p>
          </div>
        )}

        {/* Generated Code Preview */}
        {request.ai_generated_code && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h4 className="font-bold text-gray-900">AI Generated Code</h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto max-h-40">
              <pre>{request.ai_generated_code.components?.slice(0, 200)}...</pre>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-bold hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}
