/**
 * Lead Management Service
 * Core CRUD operations and lead lifecycle management
 */

import { supabase } from '@/app/lib/supabase';
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadSearchResponse,
  LeadStatsResponse,
  FilterOptions,
  PaginationOptions,
  LeadSourceBreakdown,
  ValidationResult,
  ValidationError,
  LeadMergeSuggestion,
  LeadMergeRequest,
  BulkUpdateLeadsRequest,
  BulkOperationRequest,
  BulkOperationResponse,
  BulkOperationError,
} from '@/types/leads';
import { ConversionRisk, LeadStage, LeadSource } from '@/types/leads';

/**
 * Create a new lead
 */
export async function createLead(
  businessId: string,
  data: CreateLeadRequest
): Promise<Lead | null> {
  if (!supabase) return null;

  const validation = validateLeadData(data);
  if (!validation.valid) {
    console.error('Lead validation failed:', validation.errors);
    return null;
  }

  const leadData = {
    business_id: businessId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    company: data.company || null,
    product_interest: data.product_interest || null,
    source: data.source || LeadSource.Manual,
    stage: data.stage || LeadStage.New,
    priority: data.priority || 'medium',
    deal_value: data.deal_value || null,
    currency: data.currency || 'USD',
    notes: data.notes || null,
    tags: data.tags || [],
    custom_fields: data.custom_fields || {},
    assigned_to: data.assigned_to || null,
    lead_score: 0,
    engagement_count: 0,
    conversion_risk: ConversionRisk.Medium,
  };

  const { data: result, error } = await supabase
    .from('leads')
    .insert([leadData])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }

  return result as Lead;
}

/**
 * Get a single lead by ID
 */
export async function getLead(leadId: string): Promise<Lead | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }

  return data as Lead;
}

/**
 * Get all leads for a business with optional filtering and pagination
 */
export async function getLeads(
  businessId: string,
  filters?: FilterOptions,
  pagination?: PaginationOptions
): Promise<LeadSearchResponse | null> {
  if (!supabase) return null;

  const limit = pagination?.limit || 20;
  const page = pagination?.page || 1;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId);

  // Apply filters
  if (filters) {
    if (filters.stage) {
      const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
      query = query.in('stage', stages);
    }

    if (filters.source) {
      const sources = Array.isArray(filters.source) ? filters.source : [filters.source];
      query = query.in('source', sources);
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      query = query.in('priority', priorities);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
      );
    }

    if (filters.min_deal_value) {
      query = query.gte('deal_value', filters.min_deal_value);
    }

    if (filters.max_deal_value) {
      query = query.lte('deal_value', filters.max_deal_value);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.conversion_risk) {
      query = query.eq('conversion_risk', filters.conversion_risk);
    }

    if (filters.tags && filters.tags.length > 0) {
      // This is a simplified approach; adjust based on your JSONB structure
      for (const tag of filters.tags) {
        query = query.contains('tags', [tag]);
      }
    }
  }

  // Apply sorting
  const sortBy = pagination?.sort_by || 'created_at';
  const sortOrder = pagination?.sort_order || 'desc';
  query = query.order(sortBy as any, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    return null;
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return {
    leads: (data || []) as Lead[],
    total: count || 0,
    page,
    limit,
    total_pages: totalPages,
  };
}

/**
 * Update a lead
 */
export async function updateLead(
  leadId: string,
  updates: UpdateLeadRequest
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead:', error);
    return false;
  }

  return true;
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Error deleting lead:', error);
    return false;
  }

  return true;
}

/**
 * Get lead statistics for a business
 */
export async function getLeadStats(businessId: string): Promise<LeadStatsResponse | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_lead_stats', {
    p_business_id: businessId,
  });

  if (error) {
    console.error('Error fetching lead stats:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const stats = data[0];
  const conversionRate =
    stats.total_leads > 0 ? (stats.won_leads / stats.total_leads) * 100 : 0;

  return {
    total_leads: stats.total_leads || 0,
    new_leads: stats.new_leads || 0,
    contacted_leads: stats.contacted_leads || 0,
    qualified_leads: stats.qualified_leads || 0,
    won_leads: stats.won_leads || 0,
    lost_leads: stats.lost_leads || 0,
    avg_deal_value: stats.avg_deal_value || 0,
    total_revenue: stats.total_revenue || 0,
    conversion_rate: conversionRate,
  };
}

/**
 * Get lead source breakdown
 */
export async function getSourceBreakdown(
  businessId: string
): Promise<LeadSourceBreakdown[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_lead_source_breakdown', {
    p_business_id: businessId,
  });

  if (error) {
    console.error('Error fetching source breakdown:', error);
    return null;
  }

  return (data || []) as LeadSourceBreakdown[];
}

/**
 * Bulk update leads
 */
export async function bulkUpdateLeads(
  request: BulkUpdateLeadsRequest
): Promise<boolean> {
  if (!supabase || !request.lead_ids.length) return false;

  const { error } = await supabase
    .from('leads')
    .update(request.updates)
    .in('id', request.lead_ids);

  if (error) {
    console.error('Error bulk updating leads:', error);
    return false;
  }

  return true;
}

/**
 * Perform bulk operations on leads
 */
export async function bulkOperateLeads(
  request: BulkOperationRequest
): Promise<BulkOperationResponse | null> {
  if (!supabase || !request.lead_ids.length) return null;

  const errors: BulkOperationError[] = [];
  let successCount = 0;
  let failedCount = 0;

  switch (request.operation) {
    case 'delete':
      {
        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', request.lead_ids);

        if (error) {
          failedCount = request.lead_ids.length;
          errors.push({
            lead_id: 'all',
            error: error.message,
          });
        } else {
          successCount = request.lead_ids.length;
        }
      }
      break;

    case 'change_stage':
      {
        const stage = request.operation_data?.stage;
        if (!stage) {
          errors.push({ lead_id: 'all', error: 'Stage not provided' });
          failedCount = request.lead_ids.length;
          break;
        }

        const { error } = await supabase
          .from('leads')
          .update({ stage })
          .in('id', request.lead_ids);

        if (error) {
          failedCount = request.lead_ids.length;
          errors.push({
            lead_id: 'all',
            error: error.message,
          });
        } else {
          successCount = request.lead_ids.length;
        }
      }
      break;

    case 'add_tags':
      {
        const tags = request.operation_data?.tags || [];
        // Fetch leads, add tags, and update
        for (const leadId of request.lead_ids) {
          try {
            const lead = await getLead(leadId);
            if (lead) {
              const newTags = Array.from(new Set([...lead.tags, ...tags]));
              await updateLead(leadId, { tags: newTags });
              successCount++;
            } else {
              failedCount++;
              errors.push({ lead_id: leadId, error: 'Lead not found' });
            }
          } catch (err: any) {
            failedCount++;
            errors.push({
              lead_id: leadId,
              error: err.message,
            });
          }
        }
      }
      break;

    case 'remove_tags':
      {
        const tags = request.operation_data?.tags || [];
        for (const leadId of request.lead_ids) {
          try {
            const lead = await getLead(leadId);
            if (lead) {
              const newTags = lead.tags.filter((t) => !tags.includes(t));
              await updateLead(leadId, { tags: newTags });
              successCount++;
            } else {
              failedCount++;
              errors.push({ lead_id: leadId, error: 'Lead not found' });
            }
          } catch (err: any) {
            failedCount++;
            errors.push({
              lead_id: leadId,
              error: err.message,
            });
          }
        }
      }
      break;

    case 'assign':
      {
        const assignedTo = request.operation_data?.assigned_to;
        if (!assignedTo) {
          errors.push({ lead_id: 'all', error: 'User ID not provided' });
          failedCount = request.lead_ids.length;
          break;
        }

        const { error } = await supabase
          .from('leads')
          .update({ assigned_to: assignedTo })
          .in('id', request.lead_ids);

        if (error) {
          failedCount = request.lead_ids.length;
          errors.push({
            lead_id: 'all',
            error: error.message,
          });
        } else {
          successCount = request.lead_ids.length;
        }
      }
      break;

    case 'update_score':
      {
        const scoreUpdate = request.operation_data?.lead_score || 0;

        const { error } = await supabase
          .from('leads')
          .update({ lead_score: scoreUpdate })
          .in('id', request.lead_ids);

        if (error) {
          failedCount = request.lead_ids.length;
          errors.push({
            lead_id: 'all',
            error: error.message,
          });
        } else {
          successCount = request.lead_ids.length;
        }
      }
      break;
  }

  return {
    operation_id: `op_${Date.now()}`,
    status: failedCount === 0 ? 'success' : failedCount === request.lead_ids.length ? 'failed' : 'partial',
    total_leads: request.lead_ids.length,
    successful: successCount,
    failed: failedCount,
    errors,
  };
}

/**
 * Find potential duplicate leads
 */
export async function findDuplicates(
  businessId: string,
  similarityThreshold: number = 0.8
): Promise<LeadMergeSuggestion[] | null> {
  if (!supabase) return null;

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, email, phone, name, company')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching leads for duplicate detection:', error);
    return null;
  }

  const suggestions: LeadMergeSuggestion[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < (leads?.length || 0); i++) {
    const lead1 = leads![i];
    for (let j = i + 1; j < (leads?.length || 0); j++) {
      const lead2 = leads![j];
      const pairKey = [lead1.id, lead2.id].sort().join(':');

      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const matchingFields: string[] = [];
      let matches = 0;

      // Check email
      if (lead1.email && lead2.email && lead1.email === lead2.email) {
        matchingFields.push('email');
        matches++;
      }

      // Check phone
      if (lead1.phone && lead2.phone && lead1.phone === lead2.phone) {
        matchingFields.push('phone');
        matches++;
      }

      // Check company
      if (lead1.company && lead2.company && lead1.company === lead2.company) {
        matchingFields.push('company');
        matches++;
      }

      // Check name similarity
      if (lead1.name && lead2.name) {
        const nameSimilarity = getStringSimilarity(lead1.name, lead2.name);
        if (nameSimilarity > 0.7) {
          matchingFields.push('name');
          matches++;
        }
      }

      const similarity = matches / 4;

      if (similarity >= similarityThreshold) {
        suggestions.push({
          lead_id_1: lead1.id,
          lead_id_2: lead2.id,
          similarity_score: similarity,
          matching_fields: matchingFields,
          suggested_action: similarity > 0.95 ? 'merge' : 'review',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Merge two leads
 */
export async function mergeLeads(request: LeadMergeRequest): Promise<boolean> {
  if (!supabase) return false;

  const primary = await getLead(request.primary_lead_id);
  const secondary = await getLead(request.secondary_lead_id);

  if (!primary || !secondary) return false;

  // Build merged lead data
  const mergedData: any = {};

  for (const [field, preference] of Object.entries(request.field_preferences)) {
    if (preference === 'primary') {
      mergedData[field] = (primary as any)[field];
    } else if (preference === 'secondary') {
      mergedData[field] = (secondary as any)[field];
    } else if (preference === 'combine' && field === 'tags') {
      mergedData.tags = Array.from(
        new Set([...primary.tags, ...secondary.tags])
      );
    } else if (preference === 'combine' && field === 'notes') {
      const primaryNotes = primary.notes || '';
      const secondaryNotes = secondary.notes || '';
      mergedData.notes =
        primaryNotes && secondaryNotes
          ? `${primaryNotes}\n---\n${secondaryNotes}`
          : primaryNotes || secondaryNotes;
    }
  }

  // Update primary lead
  await updateLead(request.primary_lead_id, mergedData);

  // Delete secondary lead
  await deleteLead(request.secondary_lead_id);

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate lead data
 */
function validateLeadData(data: CreateLeadRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name || data.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Lead name is required',
    });
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      value: data.email,
    });
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone format',
      value: data.phone,
    });
  }

  // Deal value validation
  if (data.deal_value && data.deal_value < 0) {
    errors.push({
      field: 'deal_value',
      message: 'Deal value cannot be negative',
      value: data.deal_value,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone format (basic)
 */
function isValidPhone(phone: string): boolean {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function getStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate edit distance between two strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}
