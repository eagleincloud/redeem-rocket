/**
 * Leads Module Type Definitions
 * Comprehensive types for the lead management system
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum LeadStage {
  New = 'new',
  Contacted = 'contacted',
  Qualified = 'qualified',
  Proposal = 'proposal',
  Negotiation = 'negotiation',
  Won = 'won',
  Lost = 'lost',
  Nurture = 'nurture',
}

export enum LeadPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum LeadSource {
  Manual = 'manual',
  CSV = 'csv',
  Scrape = 'scrape',
  Campaign = 'campaign',
  Referral = 'referral',
  WalkIn = 'walk_in',
  Website = 'website',
  Email = 'email',
  API = 'api',
  Phone = 'phone',
  IVR = 'ivr',
  Import = 'import',
}

export enum ConversionRisk {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum ActivityType {
  Note = 'note',
  Call = 'call',
  Email = 'email',
  SMS = 'sms',
  WhatsApp = 'whatsapp',
  Meeting = 'meeting',
  StageChange = 'stage_change',
  TagAdded = 'tag_added',
  BulkAction = 'bulk_action',
  Import = 'import',
  ScoringUpdate = 'scoring_update',
}

export enum ImportStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Partial = 'partial',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  product_interest?: string;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  deal_value?: number;
  currency?: string;
  notes?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  metadata?: Record<string, any>;
  assigned_to?: string;
  lead_score: number;
  engagement_count: number;
  last_contacted?: string;
  next_followup?: string;
  source_url?: string;
  conversion_risk: ConversionRisk;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  business_id: string;
  activity_type: ActivityType;
  description?: string;
  performed_by?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LeadImport {
  id: string;
  business_id: string;
  file_name: string;
  import_date: string;
  record_count: number;
  success_count: number;
  failed_count: number;
  import_status: ImportStatus;
  file_url?: string;
  column_mapping: Record<string, string>;
  error_log: ImportError[];
  imported_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface LeadSegment {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  filter_rules: SegmentRule[];
  lead_count: number;
  created_at: string;
  updated_at: string;
}

export interface LeadAnalytics {
  id: string;
  business_id: string;
  date: string;
  leads_created: number;
  leads_contacted: number;
  leads_qualified: number;
  conversion_count: number;
  conversion_rate: number;
  avg_deal_value: number;
  avg_lead_score: number;
  total_revenue: number;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  product_interest?: string;
  source: LeadSource;
  stage?: LeadStage;
  priority?: LeadPriority;
  deal_value?: number;
  currency?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  assigned_to?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  product_interest?: string;
  stage?: LeadStage;
  priority?: LeadPriority;
  deal_value?: number;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  assigned_to?: string;
  next_followup?: string;
  conversion_risk?: ConversionRisk;
}

export interface BulkUpdateLeadsRequest {
  lead_ids: string[];
  updates: UpdateLeadRequest;
}

export interface LeadImportRequest {
  file: File;
  column_mapping: Record<string, string>;
  duplicate_handling?: 'skip' | 'update' | 'merge';
}

export interface LeadImportResponse {
  import_id: string;
  status: ImportStatus;
  record_count: number;
  success_count: number;
  failed_count: number;
  error_log: ImportError[];
}

export interface CreateActivityRequest {
  activity_type: ActivityType;
  description?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, any>;
}

export interface LeadStatsResponse {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  qualified_leads: number;
  won_leads: number;
  lost_leads: number;
  avg_deal_value: number;
  total_revenue: number;
  conversion_rate: number;
}

export interface LeadSourceBreakdown {
  source: LeadSource;
  count: number;
  conversion_rate: number;
}

export interface FilterOptions {
  stage?: LeadStage | LeadStage[];
  source?: LeadSource | LeadSource[];
  priority?: LeadPriority | LeadPriority[];
  search?: string;
  date_from?: string;
  date_to?: string;
  min_deal_value?: number;
  max_deal_value?: number;
  tags?: string[];
  assigned_to?: string;
  conversion_risk?: ConversionRisk;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort_by?: keyof Lead;
  sort_order?: 'asc' | 'desc';
}

export interface LeadSearchResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING & SEGMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScoringCriteria {
  engagement_weight: number;
  stage_weight: number;
  priority_weight: number;
  deal_value_weight: number;
  recency_weight: number;
}

export interface ScoringResult {
  lead_id: string;
  score: number;
  stage_score: number;
  engagement_score: number;
  priority_score: number;
  deal_value_score: number;
  recency_score: number;
  timestamp: string;
}

export interface SegmentRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  filter_rules: SegmentRule[];
}

export interface SegmentLeadsResponse {
  segment: LeadSegment;
  leads: Lead[];
  total_count: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION & ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ImportError {
  row_number: number;
  field: string;
  value: any;
  error: string;
}

export interface LeadMergeSuggestion {
  lead_id_1: string;
  lead_id_2: string;
  similarity_score: number;
  matching_fields: string[];
  suggested_action: 'merge' | 'review' | 'ignore';
}

export interface LeadMergeRequest {
  primary_lead_id: string;
  secondary_lead_id: string;
  field_preferences: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface BulkOperationRequest {
  lead_ids: string[];
  operation: 'delete' | 'change_stage' | 'add_tags' | 'remove_tags' | 'assign' | 'update_score';
  operation_data?: Record<string, any>;
}

export interface BulkOperationResponse {
  operation_id: string;
  status: 'success' | 'partial' | 'failed';
  total_leads: number;
  successful: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  lead_id: string;
  error: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT/ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeadExportRequest {
  format: 'csv' | 'json' | 'xlsx';
  filters?: FilterOptions;
  fields?: (keyof Lead)[];
}

export interface LeadExportResponse {
  export_id: string;
  file_url: string;
  format: string;
  record_count: number;
  created_at: string;
  expires_at: string;
}

export interface ConversionFunnel {
  stage: LeadStage;
  count: number;
  conversion_from_previous: number;
}

export interface LeadTimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  title: string;
  description?: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface LeadDetailResponse {
  lead: Lead;
  activities: LeadActivity[];
  timeline: LeadTimelineEvent[];
  related_leads: Lead[];
  scoring_details: ScoringResult;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timestamp: string;
}
