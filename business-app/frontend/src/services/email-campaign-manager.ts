import { supabase } from './supabase'
import type { Campaign } from '../types/growth-platform'

interface CampaignData {
  name: string
  subject: string
  body: string
  replyTo: string
  fromName: string
  sendAt?: string
  templateId?: string
  segmentId?: string
  status?: 'draft' | 'scheduled' | 'sending' | 'sent'
}

interface CampaignMetrics {
  sentCount: number
  deliveredCount: number
  bouncedCount: number
  openCount: number
  clickCount: number
  openRate: number
  clickRate: number
  conversionCount: number
}

export class EmailCampaignManager {
  static async createCampaign(businessId: string, data: CampaignData) {
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        business_id: businessId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        reply_to: data.replyTo,
        from_name: data.fromName,
        send_at: data.sendAt ? new Date(data.sendAt).toISOString() : null,
        template_id: data.templateId,
        segment_id: data.segmentId,
        status: data.status || 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return campaign
  }

  static async updateCampaign(
    campaignId: string,
    data: Partial<CampaignData>
  ) {
    const updateData: Record<string, any> = {}

    if (data.name) updateData.name = data.name
    if (data.subject) updateData.subject = data.subject
    if (data.body) updateData.body = data.body
    if (data.replyTo) updateData.reply_to = data.replyTo
    if (data.fromName) updateData.from_name = data.fromName
    if (data.sendAt) updateData.send_at = new Date(data.sendAt).toISOString()
    if (data.templateId) updateData.template_id = data.templateId
    if (data.segmentId) updateData.segment_id = data.segmentId
    if (data.status) updateData.status = data.status

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return campaign
  }

  static async getCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) throw error
    return data
  }

  static async listCampaigns(
    businessId: string,
    filters?: {
      status?: string
      limit?: number
      offset?: number
    }
  ) {
    let query = supabase
      .from('email_campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async deleteCampaign(campaignId: string) {
    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error
  }

  static async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const { data, error } = await supabase
      .rpc('calculate_campaign_metrics', { campaign_id: campaignId })

    if (error) throw error

    return {
      sentCount: data?.sent_count || 0,
      deliveredCount: data?.delivered_count || 0,
      bouncedCount: data?.bounced_count || 0,
      openCount: data?.open_count || 0,
      clickCount: data?.click_count || 0,
      openRate: data?.open_rate || 0,
      clickRate: data?.click_rate || 0,
      conversionCount: data?.conversion_count || 0,
      conversionRate:
        data?.sent_count > 0
          ? (data.conversion_count / data.sent_count) * 100
          : 0,
    }
  }

  static async sendCampaign(
    campaignId: string,
    { sendImmediately = true, sendAt } = {}
  ) {
    const updateData: Record<string, any> = {
      status: sendImmediately ? 'sending' : 'scheduled',
    }

    if (!sendImmediately && sendAt) {
      updateData.send_at = new Date(sendAt).toISOString()
    }

    if (sendImmediately) {
      updateData.started_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async pauseCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async resumeCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async archiveCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ status: 'archived' })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export default EmailCampaignManager
