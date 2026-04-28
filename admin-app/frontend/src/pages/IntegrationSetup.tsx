import React, { useState } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

interface IntegrationSetupProps {
  businessId: string
}

export default function IntegrationSetup({ businessId }: IntegrationSetupProps) {
  const [activeIntegration, setActiveIntegration] = useState<'slack' | 'email' | 'pagerduty' | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Slack form
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [slackMention, setSlackMention] = useState(false)

  // Email form
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubjectPrefix, setEmailSubjectPrefix] = useState('Business Alert')

  // PagerDuty form
  const [pagerDutyApiKey, setPagerDutyApiKey] = useState('')
  const [pagerDutyServiceId, setPagerDutyServiceId] = useState('')

  const saveIntegration = async (type: 'slack' | 'email' | 'pagerduty') => {
    setLoading(true)
    setMessage('')

    try {
      let config: Record<string, unknown> = {}

      if (type === 'slack') {
        if (!slackWebhook) {
          setMessage('Slack webhook URL is required')
          setLoading(false)
          return
        }
        config = {
          webhook_url: slackWebhook,
          channel: slackChannel || '#alerts',
          mention_on_alert: slackMention,
        }
      } else if (type === 'email') {
        if (!emailRecipients) {
          setMessage('Email recipients are required')
          setLoading(false)
          return
        }
        config = {
          recipients: emailRecipients.split(',').map((e) => e.trim()),
          subject_prefix: emailSubjectPrefix,
        }
      } else if (type === 'pagerduty') {
        if (!pagerDutyApiKey) {
          setMessage('PagerDuty API key is required')
          setLoading(false)
          return
        }
        config = {
          api_key: pagerDutyApiKey,
          service_id: pagerDutyServiceId || null,
        }
      }

      // Check if integration already exists
      const { data: existing } = await supabase
        .from('notification_integrations')
        .select('id')
        .eq('business_id', businessId)
        .eq('integration_type', type)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from('notification_integrations')
          .update({
            config,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        // Create new
        await supabase.from('notification_integrations').insert({
          business_id: businessId,
          integration_type: type,
          config,
          is_active: true,
        })
      }

      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} integration configured successfully!`)
      setActiveIntegration(null)

      // Reset forms
      setSlackWebhook('')
      setSlackChannel('')
      setSlackMention(false)
      setEmailRecipients('')
      setEmailSubjectPrefix('Business Alert')
      setPagerDutyApiKey('')
      setPagerDutyServiceId('')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Setup</h1>
        <p className="text-gray-600 mb-8">Connect your notification services</p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(['slack', 'email', 'pagerduty'] as const).map((intType) => (
            <button
              key={intType}
              onClick={() => setActiveIntegration(activeIntegration === intType ? null : intType)}
              className={`p-6 rounded-lg border-2 transition ${
                activeIntegration === intType
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">
                {intType === 'slack' && '💬'}
                {intType === 'email' && '📧'}
                {intType === 'pagerduty' && '🚨'}
              </div>
              <h3 className="font-semibold text-gray-900 capitalize">{intType}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {intType === 'slack' && 'Send alerts to Slack'}
                {intType === 'email' && 'Send alerts via Email'}
                {intType === 'pagerduty' && 'Create incidents in PagerDuty'}
              </p>
            </button>
          ))}
        </div>

        {activeIntegration === 'slack' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Slack</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    How to create a webhook
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel (optional)</label>
                <input
                  type="text"
                  placeholder="#alerts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="slackMention"
                  checked={slackMention}
                  onChange={(e) => setSlackMention(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="slackMention" className="ml-2 text-sm text-gray-700">
                  Mention team on critical alerts
                </label>
              </div>

              <button
                onClick={() => saveIntegration('slack')}
                disabled={loading || !slackWebhook}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Slack Integration'}
              </button>
            </div>
          </div>
        )}

        {activeIntegration === 'email' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Email Alerts</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients</label>
                <textarea
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">Comma-separated email addresses</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Prefix</label>
                <input
                  type="text"
                  placeholder="Business Alert"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={emailSubjectPrefix}
                  onChange={(e) => setEmailSubjectPrefix(e.target.value)}
                />
              </div>

              <button
                onClick={() => saveIntegration('email')}
                disabled={loading || !emailRecipients}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Email Integration'}
              </button>
            </div>
          </div>
        )}

        {activeIntegration === 'pagerduty' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure PagerDuty</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="Your PagerDuty API token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={pagerDutyApiKey}
                  onChange={(e) => setPagerDutyApiKey(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  <a
                    href="https://support.pagerduty.com/docs/generating-api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    How to get your API key
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service ID (optional)</label>
                <input
                  type="text"
                  placeholder="Your PagerDuty service ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={pagerDutyServiceId}
                  onChange={(e) => setPagerDutyServiceId(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">Leave empty to use Events API only</p>
              </div>

              <button
                onClick={() => saveIntegration('pagerduty')}
                disabled={loading || !pagerDutyApiKey}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save PagerDuty Integration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
