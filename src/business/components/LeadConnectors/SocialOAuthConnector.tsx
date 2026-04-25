import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import type { LeadConnector } from '../../../types/growth-platform'

interface SocialOAuthConnectorProps {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
  connector?: LeadConnector
  onSave: (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface PlatformConfig {
  name: string
  icon: string
  description: string
  oauthUrl: string
  scopes: string[]
  dataPoints: string[]
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'Twitter / X',
    icon: '𝕏',
    description: 'Sync mentions, followers, and conversation data for lead generation',
    oauthUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'users.read', 'follows.read', 'follows.manage'],
    dataPoints: ['Mentions & replies', 'Engagement metrics', 'Follower data', 'Direct messages'],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    description: 'Connect with decision-makers and B2B leads from LinkedIn',
    oauthUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['r_liteprofile', 'r_emailaddress', 'r_basicprofile', 'w_member_social'],
    dataPoints: ['Profile data', 'Connection requests', 'Company data', 'Job postings'],
  },
  facebook: {
    name: 'Facebook',
    icon: 'f',
    description: 'Capture leads from Facebook pages and ads',
    oauthUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['pages_manage_metadata', 'instagram_basic', 'leads_retrieval'],
    dataPoints: ['Form submissions', 'Page followers', 'Ad campaign data', 'Messaging'],
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    description: 'Collect leads from Instagram DMs and form stickers',
    oauthUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: ['instagram_basic', 'instagram_graph_user_media', 'instagram_manage_messages'],
    dataPoints: ['Direct messages', 'Story interactions', 'Comment engagement', 'Profile data'],
  },
  tiktok: {
    name: 'TikTok',
    icon: '♪',
    description: 'Leverage TikTok engagement and comment data for lead gen',
    oauthUrl: 'https://www.tiktok.com/v1/oauth/authorize',
    scopes: ['user.info.basic', 'video.list', 'comment.list'],
    dataPoints: ['Video analytics', 'Comment data', 'Follower metrics', 'Engagement rates'],
  },
}

export default function SocialOAuthConnector({
  platform,
  connector,
  onSave,
  onCancel,
  loading = false,
}: SocialOAuthConnectorProps) {
  const config = PLATFORM_CONFIGS[platform]
  const [connectorName, setConnectorName] = useState(connector?.connector_name || `${config.name} Connector`)
  const [isConnected, setIsConnected] = useState(connector?.is_active || false)
  const [accessToken, setAccessToken] = useState(connector?.auth_token || '')
  const [refreshToken, setRefreshToken] = useState(connector?.auth_secret || '')
  const [tokenExpires, setTokenExpires] = useState(connector?.webhook_url || '')
  const [syncData, setSyncData] = useState({
    autoSync: true,
    syncInterval: 'daily' as 'hourly' | 'daily' | 'weekly',
    extractMentions: true,
    extractComments: true,
    extractFollowers: true,
    extractMessages: true,
  })
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  const handleOAuthConnect = async () => {
    // Simulate OAuth flow
    // In production, this would redirect to the OAuth provider
    setTestLoading(true)
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          redirectUrl: `${window.location.origin}/app/connectors/oauth-callback`,
        }),
      })
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (err) {
      setTestResponse({ error: err instanceof Error ? err.message : 'OAuth failed' })
    } finally {
      setTestLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/connectors/test-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: connector?.id,
          platform,
          access_token: accessToken,
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
      connector_type: 'api_key',
      auth_token: accessToken,
      auth_secret: refreshToken,
      webhook_url: tokenExpires,
      field_mapping: syncData,
      is_active: isConnected,
    })
  }

  return (
    <div className="space-y-6">
      {/* Platform Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{config.icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{config.name}</h3>
            <p className="text-gray-600 mt-1">{config.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.dataPoints.map((point) => (
                <span key={point} className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connector Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Connector Name</label>
        <input
          type="text"
          value={connectorName}
          onChange={(e) => setConnectorName(e.target.value)}
          placeholder={config.name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* OAuth Connection Status */}
      {isConnected ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-medium text-green-900">Connected</span>
          </div>
          <p className="text-sm text-green-800 mb-4">Your {config.name} account is successfully connected.</p>
          <button
            onClick={() => setIsConnected(false)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Disconnect Account
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
          <p className="text-sm text-gray-700 mb-4">Click below to authorize access to your {config.name} account.</p>
          <button
            onClick={handleOAuthConnect}
            disabled={testLoading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink size={18} />
            Connect {config.name} Account
          </button>
        </div>
      )}

      {/* Manual Token Entry (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-3 font-medium">Development Mode: Manual Token Entry</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste access token"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Refresh Token</label>
              <input
                type="password"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Paste refresh token"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Token Expires At</label>
              <input
                type="datetime-local"
                value={tokenExpires}
                onChange={(e) => setTokenExpires(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sync Configuration */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Sync Configuration</h4>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={syncData.autoSync}
            onChange={(e) => setSyncData({ ...syncData, autoSync: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Automatically sync data</span>
        </label>

        {syncData.autoSync && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sync Interval</label>
            <select
              value={syncData.syncInterval}
              onChange={(e) => setSyncData({ ...syncData, syncInterval: e.target.value as typeof syncData.syncInterval })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={syncData.extractMentions}
              onChange={(e) => setSyncData({ ...syncData, extractMentions: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Extract mentions & tags</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={syncData.extractComments}
              onChange={(e) => setSyncData({ ...syncData, extractComments: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Extract comments & responses</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={syncData.extractFollowers}
              onChange={(e) => setSyncData({ ...syncData, extractFollowers: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Extract follower data</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={syncData.extractMessages}
              onChange={(e) => setSyncData({ ...syncData, extractMessages: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Extract direct messages</span>
          </label>
        </div>
      </div>

      {/* Test Connection */}
      {isConnected && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Test Connection</label>
          <button
            onClick={handleTestConnection}
            disabled={testLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            {testLoading ? 'Testing...' : 'Test API Access'}
          </button>

          {testResponse && (
            <div className={`mt-4 p-4 rounded-lg ${testResponse.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <pre className="text-xs font-mono overflow-auto max-h-40">{JSON.stringify(testResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm">Permissions Required</h4>
            <ul className="text-xs text-blue-800 mt-2 space-y-1">
              {config.scopes.map((scope) => (
                <li key={scope}>• {scope}</li>
              ))}
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
          disabled={!connectorName || !isConnected || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Saving...' : 'Save Connector'}
        </button>
      </div>
    </div>
  )
}
