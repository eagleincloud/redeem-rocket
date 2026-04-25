// Growth Platform Types - Complete TypeScript interfaces

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
  source: 'manual' | 'csv' | 'scrape' | 'campaign' | 'referral' | 'walk_in' | 'website' | 'webhook' | 'ivr' | 'database'
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

// ============ LEAD CONNECTORS ============
export interface LeadConnector {
  id: string
  business_id: string
  connector_name: string
  connector_type: 'csv_upload' | 'webhook' | 'form_embed' | 'api_key' | 'zapier' | 'ivr' | 'database' | 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
  source_name?: string
  webhook_url?: string
  api_key?: string
  form_embed_code?: string
  field_mapping?: Record<string, any>
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

// ============ IVR LEADS ============
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

// ============ DATABASE SYNC LOGS ============
export interface DatabaseSyncLog {
  id: string
  business_id: string
  connector_id: string
  database_type: string
  query_executed: string
  records_fetched: number
  records_imported: number
  records_failed: number
  sync_duration_ms: number
  sync_status: 'success' | 'partial' | 'failed'
  sync_error?: string
  created_at: string
}

// ============ WEB PORTAL SUBMISSIONS ============
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

// ============ SCRAPED LEADS ============
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

// ============ SOCIAL ACCOUNTS ============
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

// ============ CONNECTOR ACTIVITY LOGS ============
export interface ConnectorActivityLog {
  id: string
  business_id: string
  connector_id: string
  action: string
  status: 'success' | 'error' | 'pending'
  metadata?: Record<string, any>
  created_at: string
}

// ============ EDGE FUNCTION PAYLOADS ============
export interface ConnectorTestPayload {
  operation: 'test-webhook' | 'test-ivr' | 'test-database' | 'test-social'
  connector_type: string
  connector_id?: string
  [key: string]: any
}

// ============ API RESPONSES ============
export interface ConnectorTestResponse {
  success: boolean
  error?: string
  message?: string
  [key: string]: any
}
