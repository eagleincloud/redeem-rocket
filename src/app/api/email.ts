/**
 * Email Campaigns and Provider Configuration API Service Layer
 * REST endpoints for campaign management, provider setup, email tracking
 * Provides 25+ functions for email automation and delivery
 */

import { supabase } from '@/app/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailCampaign {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'archived';
  send_at?: string;
  started_at?: string;
  completed_at?: string;
  template_id?: string;
  segment_id?: string;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  bounced_count: number;
  open_count: number;
  click_count: number;
  conversion_count: number;
  unsubscribe_count: number;
  complaint_count: number;
  content_json?: Record<string, any>;
  variables?: Record<string, any>;
  reply_to?: string;
  from_name?: string;
  is_test: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailSequence {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: 'signup' | 'purchase' | 'manual' | 'abandoned_cart' | 'inactivity' | 'tag_added' | 'custom';
  trigger_config: Record<string, any>;
  steps: EmailStep[];
  step_count: number;
  total_sends: number;
  total_opens: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface EmailStep {
  id?: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
  template_variables?: Record<string, string>;
  created_at?: string;
}

export interface EmailTemplate {
  id: string;
  business_id: string;
  name: string;
  category?: string;
  description?: string;
  subject_template: string;
  body_html: string;
  body_text?: string;
  variables: Record<string, any>;
  is_default: boolean;
  thumbnail_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface EmailTracking {
  id: string;
  campaign_id: string;
  recipient_email: string;
  recipient_id?: string;
  sent_at?: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'soft_bounce' | 'hard_bounce' | 'blocked' | 'spam_complaint' | 'unsubscribed';
  delivery_error?: string;
  opened: boolean;
  opened_at?: string;
  open_count: number;
  open_client_name?: string;
  open_ip_address?: string;
  open_user_agent?: string;
  clicked: boolean;
  click_count: number;
  links_clicked: Array<{ url: string; clicked_at: string; link_index: number }>;
  converted: boolean;
  converted_at?: string;
  conversion_value?: number;
  conversion_metadata?: Record<string, any>;
  message_id?: string;
  email_json?: Record<string, any>;
  custom_variables?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailProviderConfig {
  id: string;
  business_id: string;
  provider_type: 'resend' | 'smtp' | 'aws_ses' | 'sendgrid' | 'mailchimp' | 'brevo';
  provider_name?: string;
  config_json: Record<string, any>;
  is_verified: boolean;
  is_active: boolean;
  is_primary: boolean;
  verified_domain?: string;
  dkim_record?: string;
  spf_record?: string;
  dmarc_record?: string;
  daily_limit?: number;
  monthly_limit?: number;
  emails_sent_today: number;
  emails_sent_this_month: number;
  last_send_at?: string;
  last_error?: string;
  error_count: number;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface EmailSegment {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  criteria: Record<string, any>;
  recipient_count: number;
  last_counted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  sent_count: number;
  delivered_count: number;
  bounced_count: number;
  open_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
  conversion_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email campaigns for a business
 */
export async function getCampaigns(
  businessId: string,
  options?: { status?: string; limit?: number; offset?: number }
): Promise<{ campaigns: EmailCampaign[]; total: number }> {
  try {
    let query = supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      campaigns: (data || []) as EmailCampaign[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Get a single email campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<EmailCampaign> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
}

/**
 * Create a new email campaign
 */
export async function createCampaign(
  businessId: string,
  campaignData: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailCampaign> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        business_id: businessId,
        ...campaignData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

/**
 * Update an email campaign
 */
export async function updateCampaign(
  campaignId: string,
  changes: Partial<EmailCampaign>
): Promise<EmailCampaign> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update(changes)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

/**
 * Delete an email campaign
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get campaign analytics and metrics
 */
export async function getCampaignAnalytics(
  campaignId: string,
  dateRange?: { startDate: string; endDate: string }
): Promise<CampaignAnalytics> {
  try {
    let query = supabase
      .from('email_tracking')
      .select('*')
      .eq('campaign_id', campaignId);

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const records = data || [];
    const deliveredCount = records.filter(r => r.delivery_status === 'delivered').length;
    const bouncedCount = records.filter(r =>
      ['bounced', 'hard_bounce', 'soft_bounce'].includes(r.delivery_status)
    ).length;
    const openCount = records.filter(r => r.opened).length;
    const clickCount = records.filter(r => r.clicked).length;
    const conversionCount = records.filter(r => r.converted).length;

    return {
      sent_count: records.length,
      delivered_count: deliveredCount,
      bounced_count: bouncedCount,
      open_count: openCount,
      click_count: clickCount,
      open_rate: records.length > 0 ? (openCount / records.length) * 100 : 0,
      click_rate: records.length > 0 ? (clickCount / records.length) * 100 : 0,
      conversion_count: conversionCount,
    };
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SEQUENCES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email sequences for a business
 */
export async function getSequences(
  businessId: string,
  options?: { active?: boolean; limit?: number; offset?: number }
): Promise<{ sequences: EmailSequence[]; total: number }> {
  try {
    let query = supabase
      .from('email_sequences')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (options?.active !== undefined) {
      query = query.eq('is_active', options.active);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      sequences: (data || []) as EmailSequence[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching sequences:', error);
    throw error;
  }
}

/**
 * Get a single email sequence
 */
export async function getSequence(sequenceId: string): Promise<EmailSequence> {
  try {
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (error) throw error;
    return data as EmailSequence;
  } catch (error) {
    console.error('Error fetching sequence:', error);
    throw error;
  }
}

/**
 * Create a new email sequence
 */
export async function createSequence(
  businessId: string,
  sequenceData: Omit<EmailSequence, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailSequence> {
  try {
    const { data, error } = await supabase
      .from('email_sequences')
      .insert({
        business_id: businessId,
        ...sequenceData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailSequence;
  } catch (error) {
    console.error('Error creating sequence:', error);
    throw error;
  }
}

/**
 * Update an email sequence
 */
export async function updateSequence(
  sequenceId: string,
  changes: Partial<EmailSequence>
): Promise<EmailSequence> {
  try {
    const { data, error } = await supabase
      .from('email_sequences')
      .update(changes)
      .eq('id', sequenceId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailSequence;
  } catch (error) {
    console.error('Error updating sequence:', error);
    throw error;
  }
}

/**
 * Add a step to an email sequence
 */
export async function addSequenceStep(
  sequenceId: string,
  stepData: EmailStep
): Promise<EmailSequence> {
  try {
    const sequence = await getSequence(sequenceId);
    const updatedSteps = [...(sequence.steps || []), stepData];

    return await updateSequence(sequenceId, {
      steps: updatedSteps,
      step_count: updatedSteps.length,
    });
  } catch (error) {
    console.error('Error adding sequence step:', error);
    throw error;
  }
}

/**
 * Remove a step from an email sequence
 */
export async function removeSequenceStep(
  sequenceId: string,
  stepNumber: number
): Promise<EmailSequence> {
  try {
    const sequence = await getSequence(sequenceId);
    const updatedSteps = (sequence.steps || []).filter(s => s.step_number !== stepNumber);

    return await updateSequence(sequenceId, {
      steps: updatedSteps,
      step_count: updatedSteps.length,
    });
  } catch (error) {
    console.error('Error removing sequence step:', error);
    throw error;
  }
}

/**
 * Update a step in an email sequence
 */
export async function updateSequenceStep(
  sequenceId: string,
  stepNumber: number,
  stepData: Partial<EmailStep>
): Promise<EmailSequence> {
  try {
    const sequence = await getSequence(sequenceId);
    const updatedSteps = (sequence.steps || []).map(s =>
      s.step_number === stepNumber ? { ...s, ...stepData } : s
    );

    return await updateSequence(sequenceId, { steps: updatedSteps });
  } catch (error) {
    console.error('Error updating sequence step:', error);
    throw error;
  }
}

/**
 * Delete an email sequence
 */
export async function deleteSequence(sequenceId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', sequenceId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting sequence:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email templates for a business
 */
export async function getTemplates(
  businessId: string,
  options?: { category?: string; limit?: number; offset?: number }
): Promise<{ templates: EmailTemplate[]; total: number }> {
  try {
    let query = supabase
      .from('email_templates')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      templates: (data || []) as EmailTemplate[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get a single email template
 */
export async function getTemplate(templateId: string): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

/**
 * Create a new email template
 */
export async function createTemplate(
  businessId: string,
  templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        business_id: businessId,
        ...templateData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Update an email template
 */
export async function updateTemplate(
  templateId: string,
  changes: Partial<EmailTemplate>
): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .update(changes)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Delete an email template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PROVIDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email providers for a business
 */
export async function getEmailProviders(
  businessId: string,
  options?: { active?: boolean; primary?: boolean }
): Promise<EmailProviderConfig[]> {
  try {
    let query = supabase
      .from('email_provider_config')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (options?.active !== undefined) {
      query = query.eq('is_active', options.active);
    }

    if (options?.primary !== undefined) {
      query = query.eq('is_primary', options.primary);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as EmailProviderConfig[];
  } catch (error) {
    console.error('Error fetching email providers:', error);
    throw error;
  }
}

/**
 * Get a single email provider config
 */
export async function getEmailProvider(providerId: string): Promise<EmailProviderConfig> {
  try {
    const { data, error } = await supabase
      .from('email_provider_config')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) throw error;
    return data as EmailProviderConfig;
  } catch (error) {
    console.error('Error fetching email provider:', error);
    throw error;
  }
}

/**
 * Setup/create a new email provider
 */
export async function setupEmailProvider(
  businessId: string,
  providerData: Omit<EmailProviderConfig, 'id' | 'created_at' | 'updated_at' | 'emails_sent_today' | 'emails_sent_this_month' | 'error_count' | 'consecutive_failures'>
): Promise<EmailProviderConfig> {
  try {
    const { data, error } = await supabase
      .from('email_provider_config')
      .insert({
        business_id: businessId,
        emails_sent_today: 0,
        emails_sent_this_month: 0,
        error_count: 0,
        consecutive_failures: 0,
        ...providerData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailProviderConfig;
  } catch (error) {
    console.error('Error setting up email provider:', error);
    throw error;
  }
}

/**
 * Update an email provider config
 */
export async function updateEmailProvider(
  providerId: string,
  changes: Partial<EmailProviderConfig>
): Promise<EmailProviderConfig> {
  try {
    const { data, error } = await supabase
      .from('email_provider_config')
      .update(changes)
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailProviderConfig;
  } catch (error) {
    console.error('Error updating email provider:', error);
    throw error;
  }
}

/**
 * Delete an email provider
 */
export async function deleteEmailProvider(providerId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_provider_config')
      .delete()
      .eq('id', providerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting email provider:', error);
    throw error;
  }
}

/**
 * Verify an email provider and send test email
 */
export async function verifyEmailProvider(
  providerId: string,
  testEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const provider = await getEmailProvider(providerId);

    if (!provider.config_json || !provider.provider_type) {
      throw new Error('Invalid provider configuration');
    }

    const response = await fetch('/api/email/verify-provider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider_id: providerId,
        provider_type: provider.provider_type,
        config: provider.config_json,
        test_email: testEmail,
      }),
    });

    if (!response.ok) {
      throw new Error('Provider verification failed');
    }

    const result = await response.json();

    if (result.success) {
      await updateEmailProvider(providerId, {
        is_verified: true,
        is_active: true,
      });
    }

    return result;
  } catch (error) {
    console.error('Error verifying email provider:', error);
    throw error;
  }
}

/**
 * Set a provider as primary for a business
 */
export async function setPrimaryEmailProvider(
  businessId: string,
  providerId: string
): Promise<void> {
  try {
    const currentPrimary = await supabase
      .from('email_provider_config')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_primary', true);

    if (currentPrimary.data && currentPrimary.data.length > 0) {
      await updateEmailProvider(currentPrimary.data[0].id, {
        is_primary: false,
      });
    }

    await updateEmailProvider(providerId, {
      is_primary: true,
      is_active: true,
    });
  } catch (error) {
    console.error('Error setting primary email provider:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRACKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tracking data for a campaign
 */
export async function getCampaignTracking(
  campaignId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ tracking: EmailTracking[]; total: number }> {
  try {
    let query = supabase
      .from('email_tracking')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      tracking: (data || []) as EmailTracking[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching campaign tracking:', error);
    throw error;
  }
}

/**
 * Track an email open
 */
export async function trackEmailOpen(
  campaignId: string,
  recipientEmail: string,
  metadata?: { clientName?: string; ipAddress?: string; userAgent?: string }
): Promise<void> {
  try {
    const response = await fetch('/api/email/track-open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        ...metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track email open');
    }
  } catch (error) {
    console.error('Error tracking email open:', error);
    throw error;
  }
}

/**
 * Track an email click
 */
export async function trackEmailClick(
  campaignId: string,
  recipientEmail: string,
  linkUrl: string,
  linkIndex?: number
): Promise<void> {
  try {
    const response = await fetch('/api/email/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        link_url: linkUrl,
        link_index: linkIndex || 0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track email click');
    }
  } catch (error) {
    console.error('Error tracking email click:', error);
    throw error;
  }
}

/**
 * Track email delivery status
 */
export async function updateEmailDeliveryStatus(
  campaignId: string,
  recipientEmail: string,
  deliveryStatus: 'delivered' | 'bounced' | 'soft_bounce' | 'hard_bounce' | 'blocked' | 'spam_complaint',
  error?: string
): Promise<void> {
  try {
    const { error: updateError } = await supabase
      .from('email_tracking')
      .update({
        delivery_status: deliveryStatus,
        delivery_error: error,
        sent_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('recipient_email', recipientEmail);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating email delivery status:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all email segments for a business
 */
export async function getEmailSegments(
  businessId: string,
  options?: { active?: boolean; limit?: number; offset?: number }
): Promise<{ segments: EmailSegment[]; total: number }> {
  try {
    let query = supabase
      .from('email_segments')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (options?.active !== undefined) {
      query = query.eq('is_active', options.active);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      segments: (data || []) as EmailSegment[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching email segments:', error);
    throw error;
  }
}

/**
 * Create a new email segment
 */
export async function createEmailSegment(
  businessId: string,
  segmentData: Omit<EmailSegment, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailSegment> {
  try {
    const { data, error } = await supabase
      .from('email_segments')
      .insert({
        business_id: businessId,
        ...segmentData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailSegment;
  } catch (error) {
    console.error('Error creating email segment:', error);
    throw error;
  }
}

/**
 * Update an email segment
 */
export async function updateEmailSegment(
  segmentId: string,
  changes: Partial<EmailSegment>
): Promise<EmailSegment> {
  try {
    const { data, error } = await supabase
      .from('email_segments')
      .update(changes)
      .eq('id', segmentId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailSegment;
  } catch (error) {
    console.error('Error updating email segment:', error);
    throw error;
  }
}

/**
 * Delete an email segment
 */
export async function deleteEmailSegment(segmentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_segments')
      .delete()
      .eq('id', segmentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting email segment:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UNSUBSCRIBES AND BOUNCES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get unsubscribed emails for a business
 */
export async function getUnsubscribes(
  businessId: string,
  options?: { type?: string; limit?: number; offset?: number }
): Promise<Array<any>> {
  try {
    let query = supabase
      .from('email_unsubscribes')
      .select('*')
      .eq('business_id', businessId)
      .order('unsubscribed_at', { ascending: false });

    if (options?.type) {
      query = query.eq('unsubscribe_type', options.type);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching unsubscribes:', error);
    throw error;
  }
}

/**
 * Add an email to unsubscribe list
 */
export async function addUnsubscribe(
  businessId: string,
  email: string,
  type: 'all' | 'marketing' | 'transactional' | 'digest' = 'all'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_unsubscribes')
      .insert({
        business_id: businessId,
        email,
        unsubscribe_type: type,
        unsubscribed_at: new Date().toISOString(),
      });

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = unique constraint
  } catch (error) {
    console.error('Error adding unsubscribe:', error);
    throw error;
  }
}

/**
 * Remove an email from unsubscribe list
 */
export async function removeUnsubscribe(
  businessId: string,
  email: string,
  type: 'all' | 'marketing' | 'transactional' | 'digest' = 'all'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_unsubscribes')
      .delete()
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('unsubscribe_type', type);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing unsubscribe:', error);
    throw error;
  }
}

/**
 * Check if an email is unsubscribed
 */
export async function isEmailUnsubscribed(
  businessId: string,
  email: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('email_unsubscribes')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('unsubscribe_type', 'all')
      .single();

    if (error && error.code === 'PGRST116') return false; // Not found
    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    return false;
  }
}

/**
 * Get bounced emails for a business
 */
export async function getBouncedEmails(
  businessId: string,
  options?: { type?: 'permanent' | 'temporary' | 'complaint' | 'transient'; limit?: number; offset?: number }
): Promise<Array<any>> {
  try {
    let query = supabase
      .from('email_bounces')
      .select('*')
      .eq('business_id', businessId)
      .order('bounced_at', { ascending: false });

    if (options?.type) {
      query = query.eq('bounce_type', options.type);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bounced emails:', error);
    throw error;
  }
}

/**
 * Send a test email to verify provider and content
 */
export async function sendTestEmail(
  providerId: string,
  testEmail: string,
  campaignId?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const response = await fetch('/api/email/send-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider_id: providerId,
        test_email: testEmail,
        campaign_id: campaignId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send test email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}
