import { useState, useCallback, useEffect } from 'react'
import { EmailTracking } from '../services/email-service'
import EmailCampaignManager from '../services/email-campaign-manager'

interface AnalyticsMetrics {
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

interface TopLink {
  url: string
  clicks: number
  percentage: number
}

export function useEmailAnalytics(campaignId: string) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [topLinks, setTopLinks] = useState<TopLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      // Get metrics from database function
      const campaignMetrics = await EmailCampaignManager.getCampaignMetrics(
        campaignId
      )

      setMetrics(campaignMetrics)

      // Get tracking data for top links
      const trackingData = await EmailTracking.getTrackingData(campaignId)

      // Aggregate clicks by URL
      const linkClicks: Record<string, number> = {}

      trackingData.forEach((record) => {
        if (record.links_clicked) {
          record.links_clicked.forEach((link: any) => {
            linkClicks[link.url] = (linkClicks[link.url] || 0) + 1
          })
        }
      })

      // Convert to array and sort
      const totalClicks = Object.values(linkClicks).reduce(
        (sum, clicks) => sum + clicks,
        0
      )
      const topLinksArray: TopLink[] = Object.entries(linkClicks)
        .map(([url, clicks]) => ({
          url,
          clicks,
          percentage: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)

      setTopLinks(topLinksArray)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchAnalytics()

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  return {
    metrics,
    topLinks,
    loading,
    error,
    refetch: fetchAnalytics,
  }
}

export default useEmailAnalytics
