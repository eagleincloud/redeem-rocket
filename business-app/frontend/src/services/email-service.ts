import { supabase } from './supabase'

/**
 * Email Template Engine - Parse variables and render HTML
 */
export class EmailTemplateEngine {
  static parseVariables(template: string, variables: Record<string, string>): string {
    let result = template

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      result = result.replace(regex, value || '')
    })

    return result
  }

  static extractVariables(template: string): string[] {
    const matches = template.match(/{(\w+)}/g) || []
    return [...new Set(matches.map((m) => m.slice(1, -1)))]
  }

  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template || template.trim().length === 0) {
      errors.push('Template cannot be empty')
    }

    if (template.length > 10000) {
      errors.push('Template is too long (max 10000 characters)')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Email Tracking - Track opens, clicks, and conversions
 */
export class EmailTracking {
  static async trackOpen(
    campaignId: string,
    recipientEmail: string,
    clientName?: string
  ) {
    const { error } = await supabase.rpc('track_email_open', {
      p_campaign_id: campaignId,
      p_recipient_email: recipientEmail,
      p_client_name: clientName,
    })

    if (error) throw error
  }

  static async trackClick(
    campaignId: string,
    recipientEmail: string,
    linkUrl: string,
    linkIndex: number = 0
  ) {
    const { error } = await supabase.rpc('track_email_click', {
      p_campaign_id: campaignId,
      p_recipient_email: recipientEmail,
      p_link_url: linkUrl,
      p_link_index: linkIndex,
    })

    if (error) throw error
  }

  static async getTrackingData(campaignId: string) {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('campaign_id', campaignId)

    if (error) throw error
    return data || []
  }

  static async getRecipientTracking(campaignId: string, email: string) {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('recipient_email', email)
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Email Segmentation - Filter recipients by criteria
 */
export class EmailSegmentation {
  static async createSegment(
    businessId: string,
    name: string,
    criteria: Record<string, any>
  ) {
    const { data, error } = await supabase
      .from('email_segments')
      .insert({
        business_id: businessId,
        name,
        criteria,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateSegment(
    segmentId: string,
    name?: string,
    criteria?: Record<string, any>
  ) {
    const updateData: Record<string, any> = {}

    if (name) updateData.name = name
    if (criteria) updateData.criteria = criteria

    const { data, error } = await supabase
      .from('email_segments')
      .update(updateData)
      .eq('id', segmentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getSegments(businessId: string) {
    const { data, error } = await supabase
      .from('email_segments')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  static async countSegmentRecipients(segmentId: string): Promise<number> {
    const { data, error } = await supabase.rpc('count_segment_recipients', {
      segment_id: segmentId,
    })

    if (error) throw error
    return data || 0
  }

  static async deleteSegment(segmentId: string) {
    const { error } = await supabase
      .from('email_segments')
      .delete()
      .eq('id', segmentId)

    if (error) throw error
  }
}

/**
 * Email Provider Configuration
 */
export class EmailProvider {
  static async getProviders(businessId: string) {
    const { data, error } = await supabase
      .from('email_provider_config')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  static async getPrimaryProvider(businessId: string) {
    const { data, error } = await supabase
      .from('email_provider_config')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_primary', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  static async createProvider(
    businessId: string,
    providerType: string,
    configJson: Record<string, any>,
    isPrimary: boolean = false
  ) {
    const { data, error } = await supabase
      .from('email_provider_config')
      .insert({
        business_id: businessId,
        provider_type: providerType,
        config_json: configJson,
        is_primary: isPrimary,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateProvider(
    providerId: string,
    updates: Record<string, any>
  ) {
    const { data, error } = await supabase
      .from('email_provider_config')
      .update(updates)
      .eq('id', providerId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async verifyProvider(providerId: string) {
    const { data, error } = await supabase
      .from('email_provider_config')
      .update({ is_verified: true })
      .eq('id', providerId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async setPrimaryProvider(businessId: string, providerId: string) {
    // Unset all others
    await supabase
      .from('email_provider_config')
      .update({ is_primary: false })
      .eq('business_id', businessId)

    // Set this one as primary
    const { data, error } = await supabase
      .from('email_provider_config')
      .update({ is_primary: true })
      .eq('id', providerId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteProvider(providerId: string) {
    const { error } = await supabase
      .from('email_provider_config')
      .delete()
      .eq('id', providerId)

    if (error) throw error
  }
}

/**
 * Email Unsubscribe Management
 */
export class EmailUnsubscribe {
  static async addUnsubscribe(
    businessId: string,
    email: string,
    reason?: string,
    source?: string
  ) {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .insert({
        business_id: businessId,
        email,
        reason,
        source,
      })
      .select()
      .single()

    if (error && error.code !== '23505') throw error
    return data
  }

  static async isUnsubscribed(businessId: string, email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single()

    return !error && data !== null
  }

  static async getUnsubscribes(businessId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('*')
      .eq('business_id', businessId)
      .order('unsubscribed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

/**
 * Email Bounce Management
 */
export class EmailBounce {
  static async recordBounce(
    businessId: string,
    email: string,
    bounceType: 'permanent' | 'temporary' | 'complaint',
    reason?: string
  ) {
    const { data, error } = await supabase
      .from('email_bounces')
      .insert({
        business_id: businessId,
        email,
        bounce_type: bounceType,
        bounce_reason: reason,
      })
      .select()
      .single()

    if (error && error.code !== '23505') throw error
    return data
  }

  static async isBounced(businessId: string, email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_bounces')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single()

    return !error && data !== null
  }

  static async getBounces(businessId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('email_bounces')
      .select('*')
      .eq('business_id', businessId)
      .order('bounced_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

export default {
  EmailTemplateEngine,
  EmailTracking,
  EmailSegmentation,
  EmailProvider,
  EmailUnsubscribe,
  EmailBounce,
}
