import React, { useState } from 'react'
import { AlertCircle, Code2, Play } from 'lucide-react'
import type { LeadConnector } from '../../../types/growth-platform'

interface DatabaseConnectorProps {
  connector?: LeadConnector
  onSave: (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

type DatabaseType = 'postgres' | 'mysql' | 'oracle' | 'mssql'

const QUERY_TEMPLATES: Record<DatabaseType, string> = {
  postgres: `SELECT
  first_name as name,
  email,
  phone,
  company,
  product as product_interest,
  deal_value
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days'
AND status = 'active'
LIMIT 100;`,
  mysql: `SELECT
  CONCAT(first_name, ' ', last_name) as name,
  email,
  phone,
  company,
  product as product_interest,
  deal_value
FROM leads
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
AND status = 'active'
LIMIT 100;`,
  oracle: `SELECT
  CONCAT(first_name, ' ', last_name) as name,
  email,
  phone,
  company,
  product as product_interest,
  deal_value
FROM leads
WHERE created_at > TRUNC(SYSDATE) - 7
AND status = 'active'
AND ROWNUM <= 100;`,
  mssql: `SELECT TOP 100
  first_name + ' ' + last_name as name,
  email,
  phone,
  company,
  product as product_interest,
  deal_value
FROM leads
WHERE created_at > DATEADD(day, -7, CAST(GETDATE() AS DATE))
AND status = 'active';`,
}

export default function DatabaseConnector({ connector, onSave, onCancel, loading = false }: DatabaseConnectorProps) {
  const [connectorName, setConnectorName] = useState(connector?.connector_name || '')
  const [databaseType, setDatabaseType] = useState<DatabaseType>(
    (connector?.database_type as DatabaseType) || 'postgres'
  )
  const [connectionString, setConnectionString] = useState(connector?.connection_string || '')
  const [queryTemplate, setQueryTemplate] = useState(
    connector?.query_template || QUERY_TEMPLATES[databaseType]
  )
  const [syncInterval, setSyncInterval] = useState('daily')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  const databaseTypes: DatabaseType[] = ['postgres', 'mysql', 'oracle', 'mssql']

  const connectionStringExamples: Record<DatabaseType, string> = {
    postgres: 'postgresql://user:password@host:5432/database',
    mysql: 'mysql://user:password@host:3306/database',
    oracle: 'oracle://user:password@host:1521/ORCL',
    mssql: 'mssql://user:password@host:1433/database',
  }

  const handleDatabaseTypeChange = (newType: DatabaseType) => {
    setDatabaseType(newType)
    setQueryTemplate(QUERY_TEMPLATES[newType])
  }

  const handleLoadTemplate = () => {
    setQueryTemplate(QUERY_TEMPLATES[databaseType])
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/connectors/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: connector?.id,
          database_type: databaseType,
          connection_string: connectionString,
          query: queryTemplate,
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
    await onSave({
      connector_name: connectorName,
      connector_type: 'webhook',
      database_type: databaseType,
      connection_string: connectionString,
      query_template: queryTemplate,
      webhook_url: syncInterval,
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
          placeholder="e.g., Legacy CRM Sync"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Database Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
        <div className="grid grid-cols-2 gap-2">
          {databaseTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleDatabaseTypeChange(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                databaseType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Connection String */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
        <input
          type="password"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder={connectionStringExamples[databaseType]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-2">Example: {connectionStringExamples[databaseType]}</p>
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Security:</strong> Connection strings with passwords are encrypted and stored securely. Never share them publicly.
          </p>
        </div>
      </div>

      {/* Query Template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">SQL Query Template</label>
          <button
            onClick={handleLoadTemplate}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Load Template
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Write a SELECT query to fetch leads. Map columns to lead fields using aliases (as name, as email, etc.)
        </p>
        <textarea
          value={queryTemplate}
          onChange={(e) => setQueryTemplate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={10}
        />
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <Code2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Required column aliases:</p>
              <ul className="space-y-0.5">
                <li>• <code className="bg-white px-1">as name</code> - Lead name (required)</li>
                <li>• <code className="bg-white px-1">as email</code> - Lead email</li>
                <li>• <code className="bg-white px-1">as phone</code> - Lead phone</li>
                <li>• <code className="bg-white px-1">as company</code> - Company name</li>
                <li>• <code className="bg-white px-1">as product_interest</code> - Product</li>
                <li>• <code className="bg-white px-1">as deal_value</code> - Deal amount</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Interval */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sync Schedule</label>
        <select
          value={syncInterval}
          onChange={(e) => setSyncInterval(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="hourly">Every Hour</option>
          <option value="daily">Daily at 2 AM</option>
          <option value="weekly">Weekly (Mondays at 2 AM)</option>
          <option value="manual">Manual Only</option>
        </select>
      </div>

      {/* Test Connection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Test Connection</label>
        <p className="text-xs text-gray-600 mb-3">Execute a test query to verify the connection and data mapping</p>
        <button
          onClick={handleTestConnection}
          disabled={testLoading || !connectionString || !queryTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          <Play size={18} />
          {testLoading ? 'Testing...' : 'Test Connection & Query'}
        </button>

        {testResponse && (
          <div className={`mt-4 p-4 rounded-lg ${testResponse.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            {testResponse.error ? (
              <div>
                <p className="font-medium text-red-900 text-sm mb-2">Connection Error</p>
                <pre className="text-xs font-mono overflow-auto max-h-40 text-red-700">{testResponse.error}</pre>
              </div>
            ) : (
              <div>
                <p className="font-medium text-green-900 text-sm mb-2">Success! Found {testResponse.count} records</p>
                {testResponse.sample && (
                  <div>
                    <p className="text-xs text-green-800 mb-2 font-medium">Sample Record:</p>
                    <pre className="text-xs font-mono overflow-auto max-h-40 bg-white p-2 rounded text-gray-700">
                      {JSON.stringify(testResponse.sample[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 text-sm">Security Considerations</h4>
            <ul className="text-xs text-yellow-800 mt-2 space-y-1">
              <li>• Use a read-only database user for syncing</li>
              <li>• Connection strings are encrypted in transit and at rest</li>
              <li>• IP whitelist the platform servers if possible</li>
              <li>• Rotate credentials periodically</li>
              <li>• Limit query scope with WHERE conditions</li>
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
          disabled={!connectorName || !connectionString || !queryTemplate || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Saving...' : 'Save Connector'}
        </button>
      </div>
    </div>
  )
}
