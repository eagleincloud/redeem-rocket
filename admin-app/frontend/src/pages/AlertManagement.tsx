import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

interface AlertIntegration {
  id: string
  business_id: string
  integration_type: string
  is_active: boolean
  config: Record<string, unknown>
  created_at: string
}

interface AlertThreshold {
  id: string
  business_id: string
  metric_name: string
  threshold_value: number
  threshold_operator: string
  alert_channels: string[]
  severity_level: string
  is_enabled: boolean
  notification_frequency: string
  cooldown_minutes: number
}

interface SentAlert {
  id: string
  business_id: string
  metric_name: string
  metric_value: number
  threshold_value: number
  alert_message: string
  severity_level: string
  delivery_status: string
  created_at: string
}

export default function AlertManagement() {
  const [integrations, setIntegrations] = useState<AlertIntegration[]>([])
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([])
  const [sentAlerts, setSentAlerts] = useState<SentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'integrations' | 'thresholds' | 'history'>('integrations')
  const [businessFilter, setBusinessFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [businessFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load integrations
      let query = supabase.from('notification_integrations').select('*')
      if (businessFilter) {
        query = query.eq('business_id', businessFilter)
      }
      const { data: intData } = await query

      // Load thresholds
      let thresholdQuery = supabase.from('alert_thresholds').select('*')
      if (businessFilter) {
        thresholdQuery = thresholdQuery.eq('business_id', businessFilter)
      }
      const { data: thresholdData } = await thresholdQuery

      // Load recent alerts
      let alertQuery = supabase.from('sent_alerts').select('*').order('created_at', { ascending: false }).limit(50)
      if (businessFilter) {
        alertQuery = alertQuery.eq('business_id', businessFilter)
      }
      const { data: alertData } = await alertQuery

      setIntegrations(intData || [])
      setThresholds(thresholdData || [])
      setSentAlerts(alertData || [])
    } catch (error) {
      console.error('Error loading alert data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleIntegration = async (integration: AlertIntegration) => {
    try {
      await supabase
        .from('notification_integrations')
        .update({ is_active: !integration.is_active })
        .eq('id', integration.id)

      loadData()
    } catch (error) {
      console.error('Error toggling integration:', error)
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      try {
        await supabase.from('notification_integrations').delete().eq('id', integrationId)
        loadData()
      } catch (error) {
        console.error('Error deleting integration:', error)
      }
    }
  }

  const toggleThreshold = async (threshold: AlertThreshold) => {
    try {
      await supabase
        .from('alert_thresholds')
        .update({ is_enabled: !threshold.is_enabled })
        .eq('id', threshold.id)

      loadData()
    } catch (error) {
      console.error('Error toggling threshold:', error)
    }
  }

  const deleteThreshold = async (thresholdId: string) => {
    if (confirm('Are you sure you want to delete this threshold?')) {
      try {
        await supabase.from('alert_thresholds').delete().eq('id', thresholdId)
        loadData()
      } catch (error) {
        console.error('Error deleting threshold:', error)
      }
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await supabase
        .from('sent_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)

      loadData()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-orange-600 bg-orange-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
          <p className="text-gray-600 mt-2">Manage notification integrations, alert thresholds, and alert history</p>
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Filter by Business ID"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
          />
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            {(['integrations', 'thresholds', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && activeTab === 'integrations' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Notification Integrations</h2>
            {integrations.length === 0 ? (
              <p className="text-gray-600">No integrations configured</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((int) => (
                  <div key={int.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold capitalize">{int.integration_type}</h3>
                        <p className="text-sm text-gray-600">{int.business_id}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          int.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {int.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <p>Created: {new Date(int.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleIntegration(int)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {int.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteIntegration(int.id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'thresholds' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Alert Thresholds</h2>
            {thresholds.length === 0 ? (
              <p className="text-gray-600">No thresholds configured</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Metric</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threshold</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Channels</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {thresholds.map((threshold) => (
                      <tr key={threshold.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{threshold.metric_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {threshold.threshold_value} ({threshold.threshold_operator})
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getSeverityColor(threshold.severity_level)}`}>
                            {threshold.severity_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {threshold.alert_channels.join(', ')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              threshold.is_enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {threshold.is_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => toggleThreshold(threshold)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            {threshold.is_enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteThreshold(threshold.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Alert History</h2>
            {sentAlerts.length === 0 ? (
              <p className="text-gray-600">No alerts sent yet</p>
            ) : (
              <div className="space-y-3">
                {sentAlerts.map((alert) => (
                  <div key={alert.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{alert.metric_name}</h3>
                        <p className="text-sm text-gray-600">{alert.alert_message}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity_level)}`}>
                          {alert.severity_level.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.delivery_status)}`}>
                          {alert.delivery_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3 grid grid-cols-3 gap-4">
                      <p>Current: {alert.metric_value}</p>
                      <p>Threshold: {alert.threshold_value}</p>
                      <p>Sent: {new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                    {alert.delivery_status === 'sent' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
