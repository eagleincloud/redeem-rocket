import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../../hooks/useLeads'
import type { LeadIngestPayload } from '../../types/growth-platform'

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-ingest`

export default function LeadImport() {
  const navigate = useNavigate()
  const { importLeads, loading, error } = useLeads()
  const [tab, setTab] = useState<'csv' | 'webhook'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [importResult, setImportResult] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [webhookTest, setWebhookTest] = useState<any>(null)

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      const lines = csv.split('\n').filter((l) => l.trim())
      const preview = lines.slice(0, 6).map((line) => line.split(','))
      setCsvPreview(preview)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = async () => {
    if (!csvFile) return

    setImporting(true)
    try {
      const csv = await csvFile.text()
      const payload: LeadIngestPayload = {
        business_id: 'demo-business', // Would come from auth context
        source_type: 'csv',
        csv_data: csv,
      }

      const result = await importLeads(payload)
      setImportResult(result)
    } catch (err) {
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  const handleWebhookTest = async () => {
    try {
      const payload = {
        business_id: 'demo-business',
        source_type: 'webhook',
        leads: [
          {
            name: 'Test Lead',
            email: 'test@example.com',
            phone: '5551234567',
            company: 'Test Corp',
            source: 'webhook',
          },
        ],
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      setWebhookTest(result)
    } catch (err) {
      setWebhookTest({ success: false, error: err instanceof Error ? err.message : 'Test failed' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/leads')} className="text-blue-600 hover:text-blue-700">
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Import Leads</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setTab('csv')}
              className={`flex-1 py-4 px-6 font-medium border-b-2 transition ${
                tab === 'csv'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 Import CSV
            </button>
            <button
              onClick={() => setTab('webhook')}
              className={`flex-1 py-4 px-6 font-medium border-b-2 transition ${
                tab === 'webhook'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔗 Webhook Setup
            </button>
          </div>

          <div className="p-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

            {tab === 'csv' ? (
              // CSV Tab
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-gray-600 mb-4">Upload a CSV file with the following columns (optional except first row):</p>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                    <li>name (required if email/phone not present)</li>
                    <li>email</li>
                    <li>phone</li>
                    <li>company</li>
                    <li>product_interest</li>
                    <li>deal_value</li>
                    <li>source</li>
                  </ul>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to upload or drag and drop
                    </label>
                    {csvFile && <p className="text-gray-600 mt-2">Selected: {csvFile.name}</p>}
                  </div>
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview</h3>
                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {csvPreview[0]?.map((col, i) => (
                              <th key={i} className="px-4 py-2 text-left font-semibold text-gray-900">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(1).map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              {row.map((cell, j) => (
                                <td key={j} className="px-4 py-2 text-gray-700">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!importResult ? (
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvFile || importing}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {importing ? 'Importing...' : 'Import Leads'}
                  </button>
                ) : (
                  <div className={`p-4 rounded-lg border ${
                    importResult.success
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="font-semibold mb-2">
                      {importResult.success ? '✓ Import Successful' : '✗ Import Failed'}
                    </p>
                    <p>Imported: {importResult.imported}</p>
                    <p>Failed: {importResult.failed}</p>
                    {importResult.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {importResult.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/leads')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Imported Leads
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Webhook Tab
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhook URL</h3>
                  <p className="text-gray-600 mb-4">Use this URL to send leads from external systems:</p>

                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex items-center gap-4">
                    <code className="flex-1 break-all font-mono text-sm text-gray-900">{WEBHOOK_URL}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(WEBHOOK_URL)
                        alert('Copied to clipboard!')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Format</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="font-mono text-sm">{`POST ${WEBHOOK_URL}

Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_SUPABASE_ANON_KEY

Body:
{
  "business_id": "your-business-id",
  "source_type": "webhook",
  "leads": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "5551234567",
      "company": "Acme Corp",
      "source": "webhook"
    }
  ]
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrations</h3>
                  <p className="text-gray-600 mb-4">Popular platforms you can connect:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['Zapier', 'Make', 'Integromat', 'Custom API'].map((platform) => (
                      <div
                        key={platform}
                        className="p-4 border border-gray-300 rounded-lg text-center hover:border-blue-600 cursor-pointer transition"
                      >
                        <p className="font-medium text-gray-900">{platform}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Webhook</h3>
                  <button
                    onClick={handleWebhookTest}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Test Webhook
                  </button>

                  {webhookTest && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      webhookTest.success
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <p className="font-semibold">
                        {webhookTest.success ? '✓ Test Successful' : '✗ Test Failed'}
                      </p>
                      {webhookTest.message && <p className="mt-1">{webhookTest.message}</p>}
                      {webhookTest.error && <p className="mt-1">{webhookTest.error}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
