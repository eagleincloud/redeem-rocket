/**
 * Pipeline Engine Service Layer
 * Complete CRUD operations and business logic for pipeline management
 *
 * Location: src/app/api/pipeline.ts
 * Dependencies: Supabase client, Pipeline types
 */

import { supabase } from '../lib/supabase';
import {
  Pipeline,
  PipelineStage,
  PipelineEntity,
  EntityHistory,
  PipelineMetrics,
  StageMetrics,
  PipelineCustomField,
  PipelineWebhook,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreateStageRequest,
  UpdateStageRequest,
  CreateEntityRequest,
  UpdateEntityRequest,
  MoveEntityRequest,
  BulkMoveEntitiesRequest,
  EntityFilters,
  PaginationOptions,
  TimeRange,
} from '../business/types/pipeline';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

export class PipelineError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

function handleError(error: any, context: string): never {
  console.error(`[Pipeline API] ${context}:`, error);
  throw new PipelineError(
    error.message || `Error in ${context}`,
    'PIPELINE_ERROR',
    error.status || 500
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all pipelines for a business
 */
export async function getPipelines(businessId: string): Promise<Pipeline[]> {
  try {
    const { data, error } = await supabase
      .from('business_pipelines')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getPipelines');
  }
}

/**
 * Get a specific pipeline by ID
 */
export async function getPipeline(pipelineId: string): Promise<Pipeline> {
  try {
    const { data, error } = await supabase
      .from('business_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Pipeline not found');
    return data;
  } catch (error) {
    handleError(error, 'getPipeline');
  }
}

/**
 * Create a new pipeline
 */
export async function createPipeline(
  businessId: string,
  data: CreatePipelineRequest
): Promise<Pipeline> {
  try {
    // Validate input
    if (!data.name?.trim()) {
      throw new PipelineError('Pipeline name is required', 'INVALID_INPUT');
    }

    const { data: pipeline, error } = await supabase
      .from('business_pipelines')
      .insert([
        {
          business_id: businessId,
          name: data.name.trim(),
          description: data.description || '',
          icon: data.icon || 'target',
          color: data.color || '#3B82F6',
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!pipeline) throw new Error('Failed to create pipeline');

    return pipeline;
  } catch (error) {
    handleError(error, 'createPipeline');
  }
}

/**
 * Update a pipeline
 */
export async function updatePipeline(
  pipelineId: string,
  updates: UpdatePipelineRequest
): Promise<Pipeline> {
  try {
    const { data: pipeline, error } = await supabase
      .from('business_pipelines')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pipelineId)
      .select()
      .single();

    if (error) throw error;
    if (!pipeline) throw new Error('Pipeline not found');

    return pipeline;
  } catch (error) {
    handleError(error, 'updatePipeline');
  }
}

/**
 * Delete a pipeline (soft delete)
 */
export async function deletePipeline(pipelineId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('business_pipelines')
      .update({ status: 'deleted' })
      .eq('id', pipelineId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'deletePipeline');
  }
}

/**
 * Archive a pipeline
 */
export async function archivePipeline(pipelineId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('business_pipelines')
      .update({ status: 'archived' })
      .eq('id', pipelineId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'archivePipeline');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all stages for a pipeline
 */
export async function getStagesByPipeline(pipelineId: string): Promise<PipelineStage[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getStagesByPipeline');
  }
}

/**
 * Create a new stage
 */
export async function createStage(
  pipelineId: string,
  data: CreateStageRequest
): Promise<PipelineStage> {
  try {
    if (!data.name?.trim()) {
      throw new PipelineError('Stage name is required', 'INVALID_INPUT');
    }

    // Get next order index
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('order_index')
      .eq('pipeline_id', pipelineId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = ((stages?.[0]?.order_index) || 0) + 1;

    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .insert([
        {
          pipeline_id: pipelineId,
          name: data.name.trim(),
          order_index: nextIndex,
          color: data.color || '#E5E7EB',
          description: data.description || '',
          is_terminal: data.is_terminal || false,
          is_win_stage: data.is_win_stage || false,
          probability_weight: data.probability_weight || 0.5,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!stage) throw new Error('Failed to create stage');

    return stage;
  } catch (error) {
    handleError(error, 'createStage');
  }
}

/**
 * Update a stage
 */
export async function updateStage(
  stageId: string,
  updates: UpdateStageRequest
): Promise<PipelineStage> {
  try {
    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;
    if (!stage) throw new Error('Stage not found');

    return stage;
  } catch (error) {
    handleError(error, 'updateStage');
  }
}

/**
 * Delete a stage
 */
export async function deleteStage(stageId: string): Promise<void> {
  try {
    // Check if stage has entities
    const { count } = await supabase
      .from('pipeline_entities')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', stageId);

    if ((count || 0) > 0) {
      throw new PipelineError(
        'Cannot delete stage with entities. Move entities first.',
        'STAGE_NOT_EMPTY'
      );
    }

    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'deleteStage');
  }
}

/**
 * Reorder stages
 */
export async function reorderStages(
  pipelineId: string,
  stageIds: string[]
): Promise<void> {
  try {
    const updates = stageIds.map((stageId, index) => ({
      id: stageId,
      order_index: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('pipeline_stages')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) throw error;
    }
  } catch (error) {
    handleError(error, 'reorderStages');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get entities with optional filtering and pagination
 */
export async function getEntities(
  pipelineId: string,
  filters?: EntityFilters,
  pagination?: PaginationOptions
): Promise<PipelineEntity[]> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('pipeline_entities')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .is('deleted_at', null);

    // Apply filters
    if (filters?.stage_id) {
      query = query.eq('stage_id', filters.stage_id);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.value_min !== undefined) {
      query = query.gte('value', filters.value_min);
    }
    if (filters?.value_max !== undefined) {
      query = query.lte('value', filters.value_max);
    }
    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters?.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    // Apply pagination
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getEntities');
  }
}

/**
 * Get a specific entity
 */
export async function getEntity(entityId: string): Promise<PipelineEntity> {
  try {
    const { data, error } = await supabase
      .from('pipeline_entities')
      .select('*')
      .eq('id', entityId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Entity not found');

    return data;
  } catch (error) {
    handleError(error, 'getEntity');
  }
}

/**
 * Create a new entity in a pipeline stage
 */
export async function createEntity(
  pipelineId: string,
  stageId: string,
  data: CreateEntityRequest
): Promise<PipelineEntity> {
  try {
    if (!data.name?.trim()) {
      throw new PipelineError('Entity name is required', 'INVALID_INPUT');
    }

    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      throw new PipelineError('User not authenticated', 'AUTH_ERROR');
    }

    const { data: entity, error } = await supabase
      .from('pipeline_entities')
      .insert([
        {
          pipeline_id: pipelineId,
          stage_id: stageId,
          business_id: user.data.user.id,
          name: data.name.trim(),
          entity_type: data.entity_type,
          value: data.value || null,
          currency: data.currency || 'USD',
          priority: data.priority || 'medium',
          status: 'active',
          assigned_to: data.assigned_to || null,
          custom_fields: data.custom_fields || {},
          tags: data.tags || [],
          notes: data.notes || '',
          expected_close_date: data.expected_close_date || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!entity) throw new Error('Failed to create entity');

    return entity;
  } catch (error) {
    handleError(error, 'createEntity');
  }
}

/**
 * Update an entity
 */
export async function updateEntity(
  entityId: string,
  updates: UpdateEntityRequest
): Promise<PipelineEntity> {
  try {
    const { data: entity, error } = await supabase
      .from('pipeline_entities')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', entityId)
      .select()
      .single();

    if (error) throw error;
    if (!entity) throw new Error('Entity not found');

    return entity;
  } catch (error) {
    handleError(error, 'updateEntity');
  }
}

/**
 * Soft delete an entity
 */
export async function deleteEntity(entityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_entities')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'lost',
      })
      .eq('id', entityId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'deleteEntity');
  }
}

/**
 * Move an entity to a different stage
 */
export async function moveEntity(
  entityId: string,
  newStageId: string,
  reason?: string
): Promise<PipelineEntity> {
  try {
    const { data: entity, error } = await supabase
      .from('pipeline_entities')
      .update({
        stage_id: newStageId,
        entered_stage_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entityId)
      .select()
      .single();

    if (error) throw error;
    if (!entity) throw new Error('Entity not found');

    return entity;
  } catch (error) {
    handleError(error, 'moveEntity');
  }
}

/**
 * Bulk move entities to a new stage
 */
export async function bulkMoveEntities(
  entityIds: string[],
  newStageId: string,
  reason?: string
): Promise<PipelineEntity[]> {
  try {
    if (entityIds.length === 0) {
      return [];
    }

    const { data: entities, error } = await supabase
      .from('pipeline_entities')
      .update({
        stage_id: newStageId,
        entered_stage_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', entityIds)
      .select();

    if (error) throw error;
    return entities || [];
  } catch (error) {
    handleError(error, 'bulkMoveEntities');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY & AUDIT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get history for an entity
 */
export async function getEntityHistory(entityId: string): Promise<EntityHistory[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_history')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getEntityHistory');
  }
}

/**
 * Get pipeline history within time range
 */
export async function getPipelineHistory(
  pipelineId: string,
  timeRange?: TimeRange
): Promise<EntityHistory[]> {
  try {
    let query = supabase
      .from('pipeline_history')
      .select('*')
      .eq('pipeline_id', pipelineId);

    // Apply time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getPipelineHistory');
  }
}

/**
 * Get stage transition history
 */
export async function getStageTransitionHistory(
  pipelineId: string,
  timeRange?: TimeRange
): Promise<EntityHistory[]> {
  try {
    let query = supabase
      .from('pipeline_history')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('action', 'moved');

    // Apply time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getStageTransitionHistory');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// METRICS OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get stage metrics
 */
export async function getStageMetrics(stageId: string): Promise<StageMetrics> {
  try {
    const { data: entities } = await supabase
      .from('pipeline_entities')
      .select('value, status, entered_stage_at, updated_at')
      .eq('stage_id', stageId)
      .is('deleted_at', null);

    const items = entities || [];
    const totalValue = items.reduce((sum, e) => sum + (e.value || 0), 0);
    const avgValue = items.length > 0 ? totalValue / items.length : 0;
    const successCount = items.filter(e => e.status === 'won').length;
    const failureCount = items.filter(e => e.status === 'lost').length;

    // Calculate average time in stage
    const times = items.map(e => {
      const entered = new Date(e.entered_stage_at);
      const updated = new Date(e.updated_at);
      return (updated.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24);
    });
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;

    return {
      stage_id: stageId,
      entity_count: items.length,
      total_value: totalValue,
      avg_value: avgValue,
      avg_time_in_stage: Math.round(avgTime * 10) / 10,
      conversion_rate: items.length > 0 ? (successCount / items.length) * 100 : 0,
      success_count: successCount,
      failure_count: failureCount,
      last_calculated: new Date().toISOString(),
    };
  } catch (error) {
    handleError(error, 'getStageMetrics');
  }
}

/**
 * Get complete pipeline metrics
 */
export async function getPipelineMetrics(pipelineId: string): Promise<PipelineMetrics> {
  try {
    // Get all stages
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('order_index', { ascending: true });

    const allStages = stages || [];

    // Get metrics for each stage
    const stageMetricsMap: Record<string, StageMetrics> = {};
    let totalEntities = 0;
    let totalValue = 0;

    for (const stage of allStages) {
      const metrics = await getStageMetrics(stage.id);
      stageMetricsMap[stage.id] = metrics;
      totalEntities += metrics.entity_count;
      totalValue += metrics.total_value;
    }

    // Calculate conversion funnel
    const conversionFunnel = allStages.map((stage) => {
      const metrics = stageMetricsMap[stage.id];
      const percentage = totalEntities > 0 ? (metrics.entity_count / totalEntities) * 100 : 0;
      return {
        stage: stage.name,
        count: metrics.entity_count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Calculate weighted forecast
    let weightedForecast = 0;
    for (const stage of allStages) {
      const metrics = stageMetricsMap[stage.id];
      weightedForecast += metrics.total_value * stage.probability_weight;
    }

    // Determine pipeline health
    const avgConversion = totalEntities > 0
      ? (conversionFunnel.reduce((sum, s) => sum + s.percentage, 0) / conversionFunnel.length)
      : 0;

    let pipelineHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (avgConversion >= 40) pipelineHealth = 'excellent';
    else if (avgConversion >= 25) pipelineHealth = 'good';
    else if (avgConversion >= 10) pipelineHealth = 'fair';
    else pipelineHealth = 'poor';

    return {
      pipeline_id: pipelineId,
      total_entities: totalEntities,
      total_value: totalValue,
      stages: stageMetricsMap,
      conversion_funnel: conversionFunnel,
      weighted_forecast: Math.round(weightedForecast * 100) / 100,
      pipeline_health: pipelineHealth,
      last_calculated: new Date().toISOString(),
    };
  } catch (error) {
    handleError(error, 'getPipelineMetrics');
  }
}

/**
 * Recalculate and cache pipeline metrics
 */
export async function calculateMetrics(pipelineId: string): Promise<PipelineMetrics> {
  const metrics = await getPipelineMetrics(pipelineId);

  // Cache metrics in database
  try {
    const { error } = await supabase
      .from('pipeline_metrics')
      .insert([
        {
          pipeline_id: pipelineId,
          metric_type: 'overall',
          metric_value: metrics.total_value,
          calculated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      ]);

    if (error) console.warn('Failed to cache metrics:', error);
  } catch (cacheError) {
    console.warn('Metrics caching failed (non-critical):', cacheError);
  }

  return metrics;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM FIELDS OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get custom fields for a pipeline
 */
export async function getCustomFields(pipelineId: string): Promise<PipelineCustomField[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_custom_fields')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getCustomFields');
  }
}

/**
 * Create a custom field
 */
export async function createCustomField(
  pipelineId: string,
  field: Omit<PipelineCustomField, 'id' | 'created_at'>
): Promise<PipelineCustomField> {
  try {
    const { data, error } = await supabase
      .from('pipeline_custom_fields')
      .insert([
        {
          pipeline_id: pipelineId,
          field_name: field.field_name,
          field_type: field.field_type,
          required: field.required,
          options: field.options || null,
          order_index: field.order_index,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create custom field');

    return data;
  } catch (error) {
    handleError(error, 'createCustomField');
  }
}

/**
 * Update a custom field
 */
export async function updateCustomField(
  fieldId: string,
  updates: Partial<PipelineCustomField>
): Promise<PipelineCustomField> {
  try {
    const { data, error } = await supabase
      .from('pipeline_custom_fields')
      .update(updates)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Custom field not found');

    return data;
  } catch (error) {
    handleError(error, 'updateCustomField');
  }
}

/**
 * Delete a custom field
 */
export async function deleteCustomField(fieldId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_custom_fields')
      .delete()
      .eq('id', fieldId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'deleteCustomField');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get webhooks for a business
 */
export async function getWebhooks(businessId: string): Promise<PipelineWebhook[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_webhooks')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getWebhooks');
  }
}

/**
 * Create a webhook
 */
export async function createWebhook(
  pipelineId: string,
  businessId: string,
  url: string,
  events: string[]
): Promise<PipelineWebhook> {
  try {
    const { data, error } = await supabase
      .from('pipeline_webhooks')
      .insert([
        {
          pipeline_id: pipelineId,
          business_id: businessId,
          url,
          events,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create webhook');

    return data;
  } catch (error) {
    handleError(error, 'createWebhook');
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  } catch (error) {
    handleError(error, 'deleteWebhook');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export const PipelineAPI = {
  // Pipeline
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
  archivePipeline,

  // Stages
  getStagesByPipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,

  // Entities
  getEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  moveEntity,
  bulkMoveEntities,

  // History
  getEntityHistory,
  getPipelineHistory,
  getStageTransitionHistory,

  // Metrics
  getStageMetrics,
  getPipelineMetrics,
  calculateMetrics,

  // Custom Fields
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,

  // Webhooks
  getWebhooks,
  createWebhook,
  deleteWebhook,
};
