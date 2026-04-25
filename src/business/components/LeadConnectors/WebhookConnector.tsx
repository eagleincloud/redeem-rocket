import React, { useState, useEffect } from 'react'
import { Copy, Check, AlertCircle, Plus, Trash2 } from 'lucide-react'
import type { LeadConnector } from '../../../types/growth-platform'

interface WebhookConnectorProps {
  connector?: LeadConnector
  onSave: (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FieldMapping {
  webhookField: string
  leadField: 'name' | 'email' | 'phone' | 'company' | 'product_interest' | 'deal_value'
}

export default function WebhookConnector({ connector, onSave, onCancel, loading = false }: WebhookConnectorProps) {
  const [connectorName, setConnectorName] = useState(connector?.connector_name || '')
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(
    connector?.field_mapping
      ? Object.entries(connector.field_mapping).map(([webhookField, leadField]) => ({
          webhookField,
          leadField: leadField as FieldMapping['leadField'],
        }))
      : []
  )
  const [newMapping, setNewMapping] = useState<Partial<FieldMapping>>({})
  const [copied, setCopied] = useState(false)
  const [testPayload, setTestPayload] = useState('')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  const webhookUrl = connector?.webhook_url || `${window.location.origin}/api/webhooks/connector/${connector?.id || 'new'}`

  const leadFields: FieldMapping['leadField'][] = ['name', 'email', 'phone', 'company', 'product_interest', 'deal_value']

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddMapping = () => {
    if (newMapping.webhookField && newMapping.leadField) {
      setFieldMappings([...fieldMappings, { webhookField: newMapping.webhookField, leadField: newMapping.leadField }])
      setNewMapping({})
    }
  }

  const handleRemoveMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index))
  }

  const handleTestWebhook = async () => {
    setTestLoading(true)
    try {
      const payload = testPayload ? JSON.parse(testPayload) : generateSamplePayload()
      const response = await fetch('/api/connectors/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: connector?.id,
          payload,
        }),
      })
      const result = await response.json()
      setTestResponse(result)
    } catch (err) {
      setTestResponse({ error: err instanceof Error ? err.message : 'Test failed' })
    } finally {
      setTestLoading(false)
    }
  }

  const generateSamplePayload = () => {
    const mapping: Record<string, any> = {}
    fieldMappings.forEach(({ webhookField }) => {
      mapping[webhookField] = `sample_${webhookField}`
    })
    return mapping
  }

  const handleSave = async () => {
    const fieldMappingObj: Record<string, string> = {}
    fieldMappings.forEach(({ webhookField, leadField }) => {
      fieldMappingObj[webhookField] = leadField
    })

    await onSave({
      connector_name: connectorName,
      connector_type: 'webhook',
      field_mapping: fieldMappingObj,
      webhook_url: webhookUrl,
      is_active: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Connector Name</label>
        <input
          type="text"
          value={connectorName}
          onChange={(e) => setConnectorName(e.target.value)}
          placeholder="e.g., Zapier Integration"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Give this connector a descriptive name</p>
      </div>

      {/* Webhook URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700 truncate flex items-center">
            {webhookUrl}
          </div>
          <button
            onClick={handleCopyWebhookUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Use this URL in Zapier, Make, or other webhook services. Send POST requests with your lead data.
        </p>
      </div>

      {/* Field Mapping */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Field Mapping</label>
        <p className="text-xs text-gray-600 mb-4">
          Map incoming webhook fields to your lead properties. If a field isn't mapped, it will be ignored.
        </p>

        {fieldMappings.length > 0 && (
          <div className="space-y-2 mb-4">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-mono text-gray-700">{mapping.webhookField}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-sm font-medium text-blue-600">{mapping.leadField}</span>
                </div>
                <button
                  onClick={() => handleRemoveMapping(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Mapping */}
        <div className="border border-gray-300 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Webhook Field</label>
              <input
                type="text"
                value={newMapping.webhookField || ''}
                onChange={(e) => setNewMapping({ ...newMapping, webhookField: e.target.value })}
                placeholder="e.g., full_name, email_address"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Field</label>
              <select
                value={newMapping.leadField || ''}
                onChange={(e) => setNewMapping({ ...newMapping, leadField: e.target.value as FieldMapping['leadField'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select field...</option>
                {leadFields.map((field) => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAddMapping}
            disabled={!newMapping.webhookField || !newMapping.leadField}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Mapping
          </button>
        </div>
      </div>

      {/* Test Webhook */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Test Webhook</label>
        <p className="text-xs text-gray-600 mb-3">Send a test request to verify your webhook configuration</p>
        <textarea
          value={testPayload}
          onChange={(e) => setTestPayload(e.target.value)}
          placeholder={`Paste a sample JSON payload, or leave empty to auto-generate:\n\n${JSON.stringify(generateSamplePayload(), null, 2)}`}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
        />
        <button
          onClick={handleTestWebhook}
          disabled={testLoading}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
        >
          {testLoading ? 'Testing...' : 'Test Webhook'}
        </button>

        {testResponse && (
          <div className={`mt-4 p-4 rounded-lg ${testResponse.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <pre className="text-xs font-mono overflow-auto max-h-40">{JSON.stringify(testResponse, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Example Payloads */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2 mb-2">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm">Example Webhook Payload</h4>
            <p className="text-xs text-blue-800 mt-1">Send POST requests with this structure:</p>
            <pre className="bg-white p-2 rounded text-xs font-mono mt-2 overflow-auto max-h-32 text-gray-700">
              {JSON.stringify(
                {
                  leads: [
                    {
                      full_name: 'John Doe',
                      email_address: 'john@example.com',
                      phone_number: '5551234567',
                      company_name: 'ACME Corp',
                      product: 'Enterprise Plan',
                      deal_size: 50000,
                    },
                  ],
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!connectorName || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Saving...' : 'Save Connector'}
        </button>
      </div>
    </div>
  )
}
