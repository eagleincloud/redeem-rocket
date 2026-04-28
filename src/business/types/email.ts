/**
 * Email Module Type Definitions
 * Complete type system for email campaigns, providers, and tracking
 */

// Campaign Types
export interface EmailCampaign {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  subject: string;
  body: string;
  status: CampaignStatus;
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

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'archived';

// Email Sequence Types
export interface EmailSequence {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  steps: EmailStep[];
  step_count: number;
  total_sends: number;
  total_opens: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export type TriggerType = 'signup' | 'purchase' | 'manual' | 'abandoned_cart' | 'inactivity' | 'tag_added' | 'custom';

export interface EmailStep {
  id?: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
  template_variables?: Record<string, string>;
  created_at?: string;
}

// Email Template Types
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

// Email Tracking Types
export interface EmailTracking {
  id: string;
  campaign_id: string;
  recipient_email: string;
  recipient_id?: string;
  sent_at?: string;
  delivery_status: DeliveryStatus;
  delivery_error?: string;
  opened: boolean;
  opened_at?: string;
  open_count: number;
  open_client_name?: string;
  open_ip_address?: string;
  open_user_agent?: string;
  clicked: boolean;
  click_count: number;
  links_clicked: LinkClick[];
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

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'soft_bounce' | 'hard_bounce' | 'blocked' | 'spam_complaint' | 'unsubscribed';

export interface LinkClick {
  url: string;
  clicked_at: string;
  link_index: number;
}

// Email Provider Types
export interface EmailProviderConfig {
  id: string;
  business_id: string;
  provider_type: ProviderType;
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

export type ProviderType = 'resend' | 'smtp' | 'aws_ses' | 'sendgrid' | 'mailchimp' | 'brevo';

export interface ResendConfig {
  api_key: string;
  domain: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  use_tls?: boolean;
}

export interface AWSSESConfig {
  access_key_id: string;
  secret_access_key: string;
  region: string;
  from_email: string;
}

export interface SendGridConfig {
  api_key: string;
  from_email: string;
  from_name?: string;
}

export interface MailchimpConfig {
  api_key: string;
  server_prefix: string;
}

export interface BrevoConfig {
  api_key: string;
  from_email: string;
  from_name?: string;
}

// Email Segment Types
export interface EmailSegment {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
  recipient_count: number;
  last_counted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentCriteria {
  field: string;
  operator: SegmentOperator;
  value: any;
}

export type SegmentOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between';

// Campaign Analytics Types
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

export interface CampaignMetrics {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  delivery_rate_percent: number;
  open_rate_percent: number;
  click_rate_percent: number;
  conversion_rate_percent: number;
  bounce_rate_percent: number;
  avg_opens_per_recipient: number;
  avg_clicks_per_recipient: number;
}

// Unsubscribe and Bounce Types
export interface EmailUnsubscribe {
  id: string;
  business_id: string;
  email: string;
  reason?: string;
  unsubscribe_type: 'all' | 'marketing' | 'transactional' | 'digest';
  unsubscribed_at: string;
  source?: 'link' | 'api' | 'manual' | 'bounce';
  source_campaign_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailBounce {
  id: string;
  business_id: string;
  email: string;
  bounce_type: 'permanent' | 'temporary' | 'complaint' | 'transient';
  bounce_reason?: string;
  bounced_at: string;
  campaign_id?: string;
  message_id?: string;
  raw_response?: string;
  suppression_list_added: boolean;
  created_at: string;
  updated_at: string;
}

// A/B Testing Types
export interface EmailABTest {
  id: string;
  business_id: string;
  campaign_id: string;
  name: string;
  test_type: 'subject' | 'content' | 'send_time' | 'from_name' | 'sender_email';
  variant_a_id?: string;
  variant_b_id?: string;
  split_percentage: number;
  winner?: 'A' | 'B';
  is_complete: boolean;
  completed_at?: string;
  confidence_level?: number;
  created_at: string;
  updated_at: string;
}

// Request/Response Types
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  subject: string;
  body: string;
  from_name?: string;
  reply_to?: string;
  segment_id?: string;
  template_id?: string;
  is_test?: boolean;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  status?: CampaignStatus;
  from_name?: string;
  reply_to?: string;
}

export interface CreateSequenceRequest {
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_config?: Record<string, any>;
  steps: EmailStep[];
  is_active?: boolean;
}

export interface SendEmailRequest {
  campaign_id: string;
  recipient_emails: string[];
  provider_id?: string;
}

export interface VerifyProviderRequest {
  provider_id: string;
  test_email: string;
}

export interface SendTestEmailRequest {
  provider_id: string;
  test_email: string;
  campaign_id?: string;
}

// API Response Types
export interface EmailAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CampaignListResponse {
  campaigns: EmailCampaign[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface SequenceListResponse {
  sequences: EmailSequence[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface ProviderListResponse {
  providers: EmailProviderConfig[];
  total: number;
}

export interface TrackingListResponse {
  tracking: EmailTracking[];
  total: number;
  page?: number;
  page_size?: number;
}

// Enum helpers
export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'draft',
  'scheduled',
  'sending',
  'sent',
  'paused',
  'archived',
];

export const TRIGGER_TYPES: TriggerType[] = [
  'signup',
  'purchase',
  'manual',
  'abandoned_cart',
  'inactivity',
  'tag_added',
  'custom',
];

export const PROVIDER_TYPES: ProviderType[] = [
  'resend',
  'smtp',
  'aws_ses',
  'sendgrid',
  'mailchimp',
  'brevo',
];

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  'pending',
  'sent',
  'delivered',
  'bounced',
  'soft_bounce',
  'hard_bounce',
  'blocked',
  'spam_complaint',
  'unsubscribed',
];

export const BOUNCE_TYPES = ['permanent', 'temporary', 'complaint', 'transient'] as const;

export const UNSUBSCRIBE_TYPES = ['all', 'marketing', 'transactional', 'digest'] as const;
