import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../services/supabase'
import EmailCampaignManager from '../services/email-campaign-manager'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  sentCount: number
  openCount: number
  clickCount: number
  createdAt: string
}

export function useEmailCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async (filters?: { status?: string }) => {
    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data: business } = await supabase
        .from('biz_users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single()

      if (!business) throw new Error('Business not found')

      const campaignData = await EmailCampaignManager.listCampaigns(
        business.id,
        filters
      )

      setCampaigns(
        campaignData.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          status: c.status,
          sentCount: c.sent_count || 0,
          openCount: c.open_count || 0,
          clickCount: c.click_count || 0,
          createdAt: c.created_at,
        }))
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCampaign = useCallback(
    async (data: {
      name: string
      subject: string
      body: string
      replyTo: string
      fromName: string
    }) => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: business } = await supabase
          .from('biz_users')
          .select('id')
          .eq('auth_user_id', user.user.id)
          .single()

        if (!business) throw new Error('Business not found')

        const campaign = await EmailCampaignManager.createCampaign(
          business.id,
          data
        )

        await fetchCampaigns()
        return campaign
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create campaign')
      }
    },
    [fetchCampaigns]
  )

  const deleteCampaign = useCallback(async (campaignId: string) => {
    try {
      await EmailCampaignManager.deleteCampaign(campaignId)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete campaign')
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    deleteCampaign,
  }
}

export default useEmailCampaigns
