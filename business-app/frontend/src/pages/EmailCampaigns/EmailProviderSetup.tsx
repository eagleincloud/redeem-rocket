import { useState, useEffect, memo } from 'react'

interface EmailProvider {
  id: string
  providerType: string
  providerName: string
  isVerified: boolean
  isPrimary: boolean
  verifiedDomain?: string
}

const EmailProviderSetup = memo(function EmailProviderSetup() {
  const [providers, setProviders] = useState<EmailProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'resend' | 'smtp' | 'aws_ses' | null>(
    null
  )
  const [config, setConfig] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/email-providers')
        if (!response.ok) throw new Error('Failed to fetch providers')
        const data = await response.json()
        setProviders(data)
      } catch (err) {
        console.error('Failed to load providers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const handleSetupProvider = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProvider) {
      alert('Please select a provider')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/email-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType: selectedProvider,
          config,
        }),
      })

      if (!response.ok) throw new Error('Failed to setup provider')

      const created = await response.json()
      setProviders((prev) => [...prev, created])
      setShowSetup(false)
      setSelectedProvider(null)
      setConfig({})
      alert('Provider configured successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to setup provider')
    } finally {
      setTesting(false)
    }
  }

  const handleTestProvider = async (providerId: string) => {
    setTesting(true)
    try {
      const response = await fetch(`/api/email-providers/${providerId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      })

      if (!response.ok) throw new Error('Test email failed')

      alert('Test email sent successfully!')
      setTestEmail('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send test email')
    } finally {
      setTesting(false)
    }
  }

  const handleSetPrimary = async (providerId: string) => {
    try {
      const response = await fetch(`/api/email-providers/${providerId}/set-primary`, {
        method: 'PUT',
      })

      if (!response.ok) throw new Error('Failed to set primary provider')

      setProviders((prev) =>
        prev.map((p) => ({
          ...p,
          isPrimary: p.id === providerId,
        }))
      )
      alert('Primary provider updated!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update provider')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading providers...</p>
      </div>
    )
  }

  const providerConfigs: Record<string, { label: string; fields: string[] }> = {
    resend: {
      label: 'Resend',
      fields: ['apiKey'],
    },
    smtp: {
      label: 'SMTP',
      fields: ['host', 'port', 'user', 'password'],
    },
    aws_ses: {
      label: 'AWS SES',
      fields: ['accessKey', 'secretKey', 'region'],
    },
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Email Providers</h2>
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showSetup ? 'Cancel' : '+ Add Provider'}
        </button>
      </div>

      {showSetup && (
        <form onSubmit={handleSetupProvider} className="mb-6 pb-6 border-b space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
            <select
              value={selectedProvider || ''}
              onChange={(e) =>
                setSelectedProvider(e.target.value as 'resend' | 'smtp' | 'aws_ses')
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a provider</option>
              <option value="resend">Resend</option>
              <option value="smtp">SMTP</option>
              <option value="aws_ses">AWS SES</option>
            </select>
          </div>

          {selectedProvider &&
            providerConfigs[selectedProvider]?.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field}
                </label>
                <input
                  type={field.includes('password') || field.includes('key') ? 'password' : 'text'}
                  value={config[field] || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  placeholder={`Enter ${field}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

          <button
            type="submit"
            disabled={testing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {testing ? 'Configuring...' : 'Configure Provider'}
          </button>
        </form>
      )}

      {providers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No email providers configured</p>
          <button
            onClick={() => setShowSetup(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first provider
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{provider.providerName}</h3>
                  <p className="text-sm text-gray-600">{provider.providerType}</p>
                </div>
                <div className="flex gap-2">
                  {provider.isVerified && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Verified
                    </span>
                  )}
                  {provider.isPrimary && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-600">Test Email</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleTestProvider(provider.id)}
                      disabled={testing || !testEmail}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 disabled:bg-gray-100"
                    >
                      {testing ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>

                {!provider.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(provider.id)}
                    className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default EmailProviderSetup
