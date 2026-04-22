import { useEffect, useState, memo } from 'react'
import { useParams } from 'react-router-dom'

interface CampaignMetrics {
  sentCount: number
  deliveredCount: number
  bouncedCount: number
  openCount: number
  clickCount: number
  openRate: number
  clickRate: number
  conversionCount: number
  conversionRate: number
}

interface EmailClickData {
  url: string
  clicks: number
  percentage: number
}

const EmailAnalytics = memo(function EmailAnalytics() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null)
  const [topLinks, setTopLinks] = useState<EmailClickData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('all')

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!campaignId) return

      setLoading(true)
      try {
        const response = await fetch(
          `/api/campaigns/${campaignId}/analytics?timeframe=${timeframe}`
        )

        if (!response.ok) throw new Error('Failed to fetch analytics')

        const data = await response.json()
        setMetrics(data.metrics)
        setTopLinks(data.topLinks || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [campaignId, timeframe])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error || 'No analytics available'}
          </div>
        </div>
      </div>
    )
  }

  const mainMetrics = [
    {
      label: 'Sent',
      value: metrics.sentCount,
      color: 'blue',
    },
    {
      label: 'Delivered',
      value: metrics.deliveredCount,
      color: 'green',
    },
    {
      label: 'Bounced',
      value: metrics.bouncedCount,
      color: 'red',
    },
    {
      label: 'Opened',
      value: metrics.openCount,
      percentage: metrics.openRate,
      color: 'purple',
    },
    {
      label: 'Clicked',
      value: metrics.clickCount,
      percentage: metrics.clickRate,
      color: 'indigo',
    },
    {
      label: 'Converted',
      value: metrics.conversionCount,
      percentage: metrics.conversionRate,
      color: 'amber',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-gray-600 mt-2">Track opens, clicks, and conversions</p>
          </div>
          <div className="flex gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeframe === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {t === 'all' ? 'All Time' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {mainMetrics.map((metric) => {
            const colors = getColorClasses(metric.color)
            return (
              <div
                key={metric.label}
                className={`${colors.bg} border ${colors.border} rounded-lg p-6`}
              >
                <p className={`${colors.text} text-sm font-medium`}>{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className={`${colors.text} text-3xl font-bold`}>
                    {metric.value.toLocaleString()}
                  </p>
                  {metric.percentage !== undefined && (
                    <p className={`${colors.text} text-lg font-semibold`}>
                      {metric.percentage.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Conversion Funnel</h2>

          <div className="space-y-4">
            {[
              { label: 'Sent', value: metrics.sentCount, width: 100 },
              {
                label: 'Delivered',
                value: metrics.deliveredCount,
                width: (metrics.deliveredCount / metrics.sentCount) * 100,
              },
              {
                label: 'Opened',
                value: metrics.openCount,
                width: (metrics.openCount / metrics.sentCount) * 100,
              },
              {
                label: 'Clicked',
                value: metrics.clickCount,
                width: (metrics.clickCount / metrics.sentCount) * 100,
              },
              {
                label: 'Converted',
                value: metrics.conversionCount,
                width: (metrics.conversionCount / metrics.sentCount) * 100,
              },
            ].map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm text-gray-600">
                    {stage.value.toLocaleString()} ({stage.width.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(stage.width, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clicked Links */}
        {topLinks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Clicked Links</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Link</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Clicks</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {topLinks.map((link, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-blue-600 truncate">
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.url}
                        </a>
                      </td>
                      <td className="text-right px-4 py-3 font-medium text-gray-900">
                        {link.clicks}
                      </td>
                      <td className="text-right px-4 py-3 text-gray-600">
                        {link.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default EmailAnalytics
