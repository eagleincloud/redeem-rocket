import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Activity, AlertCircle } from 'lucide-react'
import WebhookConnector from './LeadConnectors/WebhookConnector'
import IVRConnector from './LeadConnectors/IVRConnector'
import DatabaseConnector from './LeadConnectors/DatabaseConnector'
import SocialOAuthConnector from './LeadConnectors/SocialOAuthConnector'
import { useConnectors } from '../hooks/useConnectors'
import type { LeadConnector } from '../types'

type ConnectorType = 'webhook' | 'ivr' | 'database' | 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'

export function ConnectorsPage() {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type?: string; id?: string }>()
  const { connectors, loading, error, fetchConnectors, createConnector, updateConnector } = useConnectors()

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedConnector, setSelectedConnector] = useState<LeadConnector | undefined>()
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchConnectors()
  }, [fetchConnectors])

  useEffect(() => {
    if (type) {
      if (id) {
        // Edit mode
        const connector = connectors.find((c) => c.id === id)
        if (connector) {
          setSelectedConnector(connector)
          setMode('edit')
        }
      } else {
        // Create mode
        setSelectedConnector(undefined)
        setMode('create')
      }
    }
  }, [type, id, connectors])

  const handleSaveConnector = async (data: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => {
    setSaveLoading(true)
    try {
      if (mode === 'edit' && selectedConnector) {
        await updateConnector(selectedConnector.id, data)
      } else {
        await createConnector(data)
      }
      await fetchConnectors()
      setMode('list')
      setSelectedConnector(undefined)
      navigate('/app/connectors')
    } catch (err) {
      console.error('Failed to save connector:', err)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedConnector(undefined)
    navigate('/app/connectors')
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const getConnectorIcon = (connectorType: string) => {
    const icons: Record<string, string> = {
      webhook: '🪝',
      ivr: '☎️',
      database: '💾',
      twitter: '𝕏',
      linkedin: '💼',
      facebook: '📘',
      instagram: '📷',
      tiktok: '♪',
    }
    return icons[connectorType] || '🔌'
  }

  // Create/Edit View
  if (mode !== 'list' && type) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Connectors
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {mode === 'edit' ? `Edit ${selectedConnector?.connector_name}` : `Set up ${type === 'webhook' ? 'Webhook' : type === 'ivr' ? 'IVR' : type === 'database' ? 'Database' : 'Social'} Connector`}
            </h1>

            {type === 'webhook' && (
              <WebhookConnector
                connector={selectedConnector}
                onSave={handleSaveConnector}
                onCancel={handleCancel}
                loading={saveLoading}
              />
            )}

            {type === 'ivr' && (
              <IVRConnector
                connector={selectedConnector}
                onSave={handleSaveConnector}
                onCancel={handleCancel}
                loading={saveLoading}
              />
            )}

            {type === 'database' && (
              <DatabaseConnector
                connector={selectedConnector}
                onSave={handleSaveConnector}
                onCancel={handleCancel}
                loading={saveLoading}
              />
            )}

            {['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok'].includes(type) && (
              <SocialOAuthConnector
                platform={type as 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'}
                connector={selectedConnector}
                onSave={handleSaveConnector}
                onCancel={handleCancel}
                loading={saveLoading}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Lead Connectors</h1>
            <p className="text-gray-600 mt-2">Integrate leads from multiple sources into your pipeline</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/app/connectors/webhook')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Plus size={18} />
              Webhook
            </button>
            <button
              onClick={() => navigate('/app/connectors/ivr')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Plus size={18} />
              IVR
            </button>
            <button
              onClick={() => navigate('/app/connectors/database')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Plus size={18} />
              Database
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6 flex gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading connectors</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading connectors...</p>
          </div>
        ) : connectors.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-6 text-lg">No connectors set up yet</p>
            <p className="text-gray-600 mb-8">Start by connecting your first lead source</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Webhook',
                  desc: 'From Zapier, Make, or custom APIs',
                  icon: '🪝',
                  action: '/app/connectors/webhook',
                },
                {
                  title: 'IVR',
                  desc: 'Phone system integration',
                  icon: '☎️',
                  action: '/app/connectors/ivr',
                },
                {
                  title: 'Database',
                  desc: 'PostgreSQL, MySQL, Oracle, MSSQL',
                  icon: '💾',
                  action: '/app/connectors/database',
                },
                {
                  title: 'Social Media',
                  desc: 'Twitter, LinkedIn, Facebook, Instagram',
                  icon: '📱',
                  action: '/app/connectors/social',
                },
              ].map((option) => (
                <button
                  key={option.title}
                  onClick={() => navigate(option.action)}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 text-center transition"
                >
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{option.title}</h4>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Connector List */
          <div className="space-y-4">
            {connectors.map((connector) => (
              <div key={connector.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex gap-4">
                    <div className="text-4xl">{getConnectorIcon(connector.connector_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{connector.connector_name}</h3>
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {connector.connector_type === 'webhook' ? 'Webhook' : connector.connector_type === 'form_embed' ? 'Form' : connector.connector_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {connector.sync_count} syncs • Last sync: {formatDate(connector.last_sync_at)}
                      </p>
                      {connector.last_error && (
                        <p className="text-xs text-red-600 mt-1 flex gap-1">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          {connector.last_error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        // Sync manually
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Sync now"
                    >
                      <Activity size={18} />
                    </button>
                    <button
                      onClick={() => {
                        updateConnector(connector.id, { is_active: !connector.is_active })
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        connector.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {connector.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => navigate(`/app/connectors/${connector.connector_type}/${connector.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this connector?')) {
                          // Delete connector
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

        {/* Social Connectors Quick Links */}
        {connectors.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Connect Social Media Accounts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => navigate(`/app/connectors/${platform}`)}
                  className="px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
