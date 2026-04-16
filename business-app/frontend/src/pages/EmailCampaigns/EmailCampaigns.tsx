import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailSequences } from '../../hooks/useEmailSequences'
import type { EmailSequence } from '../../types/growth-platform'

export default function EmailCampaigns() {
  const navigate = useNavigate()
  const { sequences, loading, error, fetchSequences, deleteSequence } = useEmailSequences()
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  const campaigns = Array.from(
    new Map(
      sequences.map((seq) => [
        seq.campaign_id || seq.id,
        {
          id: seq.campaign_id || seq.id,
          name: seq.sequence_name,
          triggerType: seq.trigger_type,
          steps: sequences.filter((s) => (s.campaign_id || s.id) === (seq.campaign_id || seq.id)).length,
          isActive: seq.is_active,
          created: seq.created_at,
        },
      ])
    ).values()
  )

  const filtered = filterStatus === 'all' ? campaigns : campaigns.filter((c) => c.isActive === (filterStatus === 'active'))

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.isActive).length,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="text-gray-600 mt-2">Create and manage email sequences</p>
          </div>
          <button
            onClick={() => navigate('/email-campaigns/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Campaigns', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.total - stats.active },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading campaigns...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No campaigns found</p>
            <button
              onClick={() => navigate('/email-campaigns/new')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Trigger: <span className="font-medium">{campaign.triggerType}</span> • {campaign.steps} steps
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Created {new Date(campaign.created).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        campaign.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => navigate(`/email-campaigns/${campaign.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this campaign?')) {
                          await deleteSequence(campaign.id)
                          await fetchSequences()
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
