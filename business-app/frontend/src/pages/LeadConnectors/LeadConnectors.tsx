import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnectors } from '../../hooks/useConnectors'

export default function LeadConnectors() {
  const navigate = useNavigate()
  const { connectors, loading, error, fetchConnectors, deleteConnector, updateConnector } = useConnectors()

  useEffect(() => {
    fetchConnectors()
  }, [fetchConnectors])

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Lead Connectors</h1>
            <p className="text-gray-600 mt-2">Integrate leads from multiple sources</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/lead-connectors/webhook')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Webhook
            </button>
            <button
              onClick={() => navigate('/lead-connectors/ivr')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + IVR
            </button>
            <button
              onClick={() => navigate('/lead-connectors/database')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Database
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

        {loading ? (
          <p className="text-center text-gray-500">Loading connectors...</p>
        ) : connectors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-6">No connectors set up yet</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  title: 'Webhook',
                  desc: 'Receive leads via HTTP webhooks',
                  action: '/lead-connectors/webhook',
                },
                {
                  title: 'IVR',
                  desc: 'Capture leads from phone calls',
                  action: '/lead-connectors/ivr',
                },
                {
                  title: 'Database',
                  desc: 'Sync from external databases',
                  action: '/lead-connectors/database',
                },
              ].map((option) => (
                <button
                  key={option.title}
                  onClick={() => navigate(option.action)}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 text-center transition"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">{option.title}</h4>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {connectors.map((connector) => (
              <div key={connector.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{connector.connector_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <span className="font-medium">{connector.connector_type}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {connector.sync_count} syncs • Last sync: {formatDate(connector.last_sync_at)}
                    </p>
                    {connector.last_error && (
                      <p className="text-xs text-red-600 mt-2">Error: {connector.last_error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateConnector(connector.id, { is_active: !connector.is_active })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        connector.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {connector.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => navigate(`/lead-connectors/${connector.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this connector?')) {
                          await deleteConnector(connector.id)
                          await fetchConnectors()
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
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
