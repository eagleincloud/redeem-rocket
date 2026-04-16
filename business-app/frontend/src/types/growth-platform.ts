// Growth Platform Types - Complete TypeScript interfaces for all tables and operations

// ============ LEADS ============
export interface Lead {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  source_url?: string
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deal_value?: number
  product_interest?: string
  source: 'manual' | 'csv' | 'scrape' | 'campaign' | 'referral' | 'walk_in' | 'website'
  scraped_biz_id?: string
  proposal_sent_at?: string
  proposal_url?: string
  won_at?: string
  lost_at?: string
  lost_reason?: string
  closed_value?: number
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface LeadFilter {
  search?: string
  stage?: Lead['stage']
  priority?: Lead['priority']
  source?: Lead['source']
  minValue?: number
  maxValue?: number
  startDate?: string
  endDate?: string
}

// ============ EMAIL SEQUENCES ============
export interface EmailSequence {
  id: string
  business_id: string
  campaign_id?: string
  sequence_name: string
  trigger_type: 'signup' | 'purchase' | 'manual' | 'abandoned_cart'
  step_number: number
  step_delay_days: number
  email_subject: string
  email_body?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailSequenceStep extends Omit<EmailSequence, 'id'> {
  step_number: number
}

export interface Campaign {
  id?: string
  name: string
  trigger_type: EmailSequence['trigger_type']
  description?: string
  steps: EmailSequenceStep[]
}

// ============ EMAIL PROVIDERS ============
export interface EmailProviderConfig {
  id: string
  business_id: string
  provider_type: 'smtp' | 'ses' | 'resend'
  provider_name: string
  is_verified: boolean
  is_primary: boolean
  config_data: Record<string, any>
  verified_domain?: string
  dkim_record?: string
  spf_record?: string
  created_at: string
  updated_at: string
}

export interface EmailProviderSetup {
  provider_type: EmailProviderConfig['provider_type']
  provider_name: string
  config_data: {
    resend_api_key?: string
    smtp_host?: string
    smtp_port?: number
    smtp_user?: string
    smtp_pass?: string
    aws_access_key?: string
    aws_secret?: string
    aws_region?: string
  }
}

// ============ AUTOMATION RULES ============
export interface Condition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number
}

export interface AutomationAction {
  send_email?: {
    subject: string
    body: string
  }
  add_tag?: {
    tag: string
  }
  update_field?: {
    field: string
    value: string
  }
  create_task?: {
    title: string
    description?: string
  }
  webhook?: {
    url: string
    method: 'GET' | 'POST' | 'PUT'
    payload?: Record<string, any>
  }
}

export interface AutomationRule {
  id: string
  business_id: string
  rule_name: string
  trigger_type: 'lead_added' | 'email_opened' | 'email_clicked' | 'lead_qualified' | 'inactivity_30d'
  trigger_conditions?: Record<string, any>
  action_type: 'send_email' | 'add_tag' | 'update_field' | 'create_task' | 'webhook'
  action_config: AutomationAction
  is_active: boolean
  run_count: number
  last_run_at?: string
  created_at: string
  updated_at: string
}

// ============ SOCIAL MEDIA ============
export interface SocialAccount {
  id: string
  business_id: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok'
  account_name: string
  account_id: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  is_connected: boolean
  followers_count?: number
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  business_id: string
  social_account_id: string
  platform: SocialAccount['platform']
  post_content: string
  post_type: 'text' | 'image' | 'video' | 'carousel'
  media_urls?: string[]
  scheduled_at?: string
  published_at?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  likes_count?: number
  shares_count?: number
  comments_count?: number
  created_at: string
  updated_at: string
}

// ============ LEAD CONNECTORS ============
export interface LeadConnector {
  id: string
  business_id: string
  connector_name: string
  connector_type: 'csv_upload' | 'webhook' | 'form_embed' | 'api_key' | 'zapier'
  source_name?: string
  webhook_url?: string
  api_key?: string
  form_embed_code?: string
  field_mapping?: Record<string, string>
  is_active: boolean
  last_sync_at?: string
  sync_count: number
  auth_token?: string
  auth_secret?: string
  connection_string?: string
  database_type?: 'postgres' | 'mysql' | 'oracle' | 'mssql'
  query_template?: string
  last_error?: string
  error_count: number
  created_at: string
  updated_at: string
}

// ============ ADVANCED LEAD SOURCES ============
export interface IVRLead {
  id: string
  business_id: string
  connector_id?: string
  phone_number: string
  call_duration?: number
  ivr_response?: string
  lead_intent?: 'inquiry' | 'complaint' | 'support' | 'sales'
  ivr_metadata?: Record<string, any>
  processed?: boolean
  created_at: string
}

export interface WebPortalSubmission {
  id: string
  business_id: string
  connector_id?: string
  form_name?: string
  form_data: Record<string, any>
  submission_url?: string
  submitter_ip?: string
  submitted_at?: string
  processed?: boolean
  created_at: string
}

export interface ScrapedLead {
  id: string
  business_id: string
  connector_id?: string
  source_url?: string
  scrape_metadata?: Record<string, any>
  scrape_quality: 'high' | 'medium' | 'low'
  scrape_date?: string
  processed?: boolean
  created_at: string
}

// ============ STATISTICS ============
export interface GrowthStats {
  totalLeads: number
  newLeads: number
  qualifiedLeads: number
  wonLeads: number
  lostLeads: number
  totalEmailsSent: number
  emailOpenRate: number
  emailClickRate: number
  activeRules: number
  automationTriggered: number
  connectedSocialAccounts: number
  socialPostsPublished: number
}

// ============ EDGE FUNCTION PAYLOADS ============
export interface LeadIngestPayload {
  business_id: string
  source_type: 'webhook' | 'csv' | 'form_embed' | 'api' | 'zapier'
  leads?: Array<{
    name?: string
    email?: string
    phone?: string
    company?: string
    product_interest?: string
    deal_value?: number
    source?: string
  }>
  csv_data?: string
  connector_id?: string
}

export interface EmailSequencePayload {
  business_id: string
  trigger_type: EmailSequence['trigger_type']
}

export interface VerifyEmailProviderPayload {
  business_id: string
  provider_config_id: string
  test_email: string
  provider_type: EmailProviderConfig['provider_type']
  config: EmailProviderConfig['config_data']
}

export interface ExecuteAutomationPayload {
  business_id: string
  trigger_type: AutomationRule['trigger_type']
  trigger_data: {
    id: string
    [key: string]: any
  }
}

export interface PublishSocialPostPayload {
  business_id: string
  post_id: string
  social_account_id: string
  platform: SocialPost['platform']
  post_content: string
  media_urls?: string[]
}

export interface AdvancedLeadIngestPayload {
  business_id: string
  connector_id: string
  source_type: 'ivr' | 'web_portal' | 'database' | 'scrape' | string
  phone_number?: string
  call_duration?: number
  ivr_response?: string
  lead_intent?: string
  form_name?: string
  form_data?: Record<string, any>
  submission_url?: string
  submitter_ip?: string
  database_type?: string
  connection_string?: string
  query?: string
  source_url?: string
  scrape_metadata?: Record<string, any>
  scrape_quality?: string
}

// ============ API RESPONSES ============
export interface EdgeFunctionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  [key: string]: any
}

export interface LeadIngestResponse extends EdgeFunctionResponse {
  imported: number
  failed: number
  errors: string[]
}

export interface AutomationExecutionResponse extends EdgeFunctionResponse {
  applied: number
  failed: number
  details: string[]
}
