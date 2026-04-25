import React, { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2, Phone } from 'lucide-react'
import type { LeadConnector } from '../../types'

interface IVRConnectorProps {
  connector?: LeadConnector
  onSave: (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface IntentMapping {
  ivrOption: string
  intent: 'inquiry' | 'complaint' | 'support' | 'sales'
  autoCreateLead: boolean
}

export default function IVRConnector({ connector, onSave, onCancel, loading = false }: IVRConnectorProps) {
  const [connectorName, setConnectorName] = useState(connector?.connector_name || '')
  const [ivrPhoneNumber, setIvrPhoneNumber] = useState('')
  const [ivrProvider, setIvrProvider] = useState<'twilio' | 'bandwidthcom' | 'vonage' | 'custom'>('twilio')
  const [authToken, setAuthToken] = useState(connector?.auth_token || '')
  const [authSecret, setAuthSecret] = useState(connector?.auth_secret || '')
  const [intentMappings, setIntentMappings] = useState<IntentMapping[]>(
    connector?.field_mapping
      ? Object.entries(connector.field_mapping).map(([ivrOption, intent]) => {
          const [intentVal, autoCreate] = intent.split('|')
          return {
            ivrOption,
            intent: intentVal as IntentMapping['intent'],
            autoCreateLead: autoCreate === 'true',
          }
        })
      : []
  )
  const [newMapping, setNewMapping] = useState<Partial<IntentMapping>>({ autoCreateLead: true })
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  const intents: IntentMapping['intent'][] = ['inquiry', 'complaint', 'support', 'sales']

  const handleAddIntentMapping = () => {
    if (newMapping.ivrOption && newMapping.intent !== undefined) {
      setIntentMappings([
        ...intentMappings,
        {
          ivrOption: newMapping.ivrOption,
          intent: newMapping.intent as IntentMapping['intent'],
          autoCreateLead: newMapping.autoCreateLead || false,
        },
      ])
      setNewMapping({ autoCreateLead: true })
    }
  }

  const handleRemoveIntentMapping = (index: number) => {
    setIntentMappings(intentMappings.filter((_, i) => i !== index))
  }

  const handleTestIVR = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/connectors/test-ivr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: connector?.id,
          provider: ivrProvider,
          phone_number: ivrPhoneNumber,
          auth_token: authToken,
          auth_secret: authSecret,
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

  const handleSave = async () => {
    const fieldMappingObj: Record<string, string> = {}
    intentMappings.forEach(({ ivrOption, intent, autoCreateLead }) => {
      fieldMappingObj[ivrOption] = `${intent}|${autoCreateLead}`
    })

    await onSave({
      connector_name: connectorName,
      connector_type: 'webhook',
      field_mapping: fieldMappingObj,
      auth_token: authToken,
      auth_secret: authSecret,
      webhook_url: ivrPhoneNumber,
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
          placeholder="e.g., Main Office IVR"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* IVR Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">IVR Provider</label>
        <select
          value={ivrProvider}
          onChange={(e) => setIvrProvider(e.target.value as typeof ivrProvider)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="twilio">Twilio</option>
          <option value="bandwidthcom">Bandwidth</option>
          <option value="vonage">Vonage (Nexmo)</option>
          <option value="custom">Custom IVR API</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Select your IVR platform</p>
      </div>

      {/* IVR Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">IVR Phone Number</label>
        <input
          type="tel"
          value={ivrPhoneNumber}
          onChange={(e) => setIvrPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">The public-facing phone number for your IVR</p>
      </div>

      {/* Authentication */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Auth Token / Account SID</label>
          <input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Enter auth token"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Auth Secret / API Key</label>
          <input
            type="password"
            value={authSecret}
            onChange={(e) => setAuthSecret(e.target.value)}
            placeholder="Enter auth secret"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Intent Mapping */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Intent Mapping</label>
        <p className="text-xs text-gray-600 mb-4">Map IVR menu options to lead intents and configure auto-lead creation</p>

        {intentMappings.length > 0 && (
          <div className="space-y-2 mb-4">
            {intentMappings.map((mapping, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-700">Option: {mapping.ivrOption}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium text-blue-600">{mapping.intent}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {mapping.autoCreateLead ? '✓ Auto-creates lead' : '○ Manual review'}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveIntentMapping(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Intent Mapping */}
        <div className="border border-gray-300 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">IVR Option (e.g., "1" or "Press 1")</label>
              <input
                type="text"
                value={newMapping.ivrOption || ''}
                onChange={(e) => setNewMapping({ ...newMapping, ivrOption: e.target.value })}
                placeholder="1, 2, 3, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Intent</label>
              <select
                value={newMapping.intent || ''}
                onChange={(e) => setNewMapping({ ...newMapping, intent: e.target.value as IntentMapping['intent'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select intent...</option>
                {intents.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent.charAt(0).toUpperCase() + intent.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newMapping.autoCreateLead || false}
              onChange={(e) => setNewMapping({ ...newMapping, autoCreateLead: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Automatically create lead from this intent</span>
          </label>
          <button
            onClick={handleAddIntentMapping}
            disabled={!newMapping.ivrOption || !newMapping.intent}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Intent Mapping
          </button>
        </div>
      </div>

      {/* Test IVR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Test IVR Connection</label>
        <p className="text-xs text-gray-600 mb-3">Verify your IVR provider credentials and connection</p>
        <button
          onClick={handleTestIVR}
          disabled={testLoading || !authToken || !authSecret}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          <Phone size={18} />
          {testLoading ? 'Testing...' : 'Test IVR Connection'}
        </button>

        {testResponse && (
          <div className={`mt-4 p-4 rounded-lg ${testResponse.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <pre className="text-xs font-mono overflow-auto max-h-40">{JSON.stringify(testResponse, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm">How IVR Integration Works</h4>
            <ul className="text-xs text-blue-800 mt-2 space-y-1">
              <li>1. Calls to your IVR number are routed based on menu selections</li>
              <li>2. Each menu option (1, 2, 3, etc.) is mapped to a lead intent</li>
              <li>3. IVR metadata (duration, responses) is captured and stored</li>
              <li>4. Leads are automatically created based on intent mappings</li>
              <li>5. Sales team reviews and qualifies leads in the dashboard</li>
            </ul>
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
          disabled={!connectorName || !ivrPhoneNumber || !authToken || !authSecret || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Saving...' : 'Save Connector'}
        </button>
      </div>
    </div>
  )
}
