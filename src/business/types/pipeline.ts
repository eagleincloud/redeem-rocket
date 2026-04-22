/**
 * Pipeline Engine Types
 * Complete type definitions for the sales/opportunity pipeline system
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & UNIONS
// ═══════════════════════════════════════════════════════════════════════════

export type PipelineStatus = 'active' | 'archived' | 'deleted';
export type PipelineHistoryAction = 'created' | 'moved' | 'updated' | 'deleted' | 'noted';
export type EntityType = 'lead' | 'opportunity' | 'deal' | 'customer';
export type EntityStatus = 'active' | 'won' | 'lost' | 'paused';
export type EntityPriority = 'low' | 'medium' | 'high' | 'critical';
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
export type PipelineHealth = 'excellent' | 'good' | 'fair' | 'poor';

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pipeline: Main container for a sales/opportunity funnel
 */
export interface Pipeline {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: PipelineStatus;
  created_by: string;
  created_at: string;
  updated_at: string;

  // Aggregated stats
  total_entities: number;
  total_value: number;
  conversion_rate: number;
}

/**
 * PipelineStage: Individual stage within a pipeline
 */
export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  order_index: number;
  color?: string;
  description?: string;
  is_terminal: boolean; // Is this the final stage?
  is_win_stage: boolean; // Does this stage represent success?
  probability_weight: number; // 0-1 probability multiplier for forecasting
  created_at: string;
  updated_at: string;
}

/**
 * PipelineEntity: Individual item moving through a pipeline
 * Can represent leads, opportunities, deals, or customers
 */
export interface PipelineEntity {
  id: string;
  pipeline_id: string;
  stage_id: string;
  business_id: string;

  // Core fields
  name: string;
  entity_type: EntityType;
  value?: number;
  currency: string;
  priority: EntityPriority;
  status: EntityStatus;

  // Relationships
  assigned_to?: string;
  related_to?: string;

  // Timeline
  created_at: string;
  updated_at: string;
  entered_stage_at: string;
  last_activity_at: string;
  expected_close_date?: string;
  closed_at?: string;
  deleted_at?: string;

  // Additional data
  custom_fields: Record<string, any>;
  tags: string[];
  notes?: string;
}

/**
 * EntityHistory: Audit trail entry for entity changes
 */
export interface EntityHistory {
  id: string;
  entity_id: string;
  pipeline_id: string;
  action: PipelineHistoryAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

/**
 * StageMetrics: Calculated metrics for a single stage
 */
export interface StageMetrics {
  stage_id: string;
  entity_count: number;
  total_value: number;
  avg_value: number;
  avg_time_in_stage: number; // days
  conversion_rate: number; // percentage
  success_count: number;
  failure_count: number;
  last_calculated: string;
}

/**
 * PipelineMetrics: Aggregated metrics for entire pipeline
 */
export interface PipelineMetrics {
  pipeline_id: string;
  total_entities: number;
  total_value: number;
  stages: Record<string, StageMetrics>;
  conversion_funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  weighted_forecast: number; // Value-weighted probability
  pipeline_health: PipelineHealth;
  last_calculated: string;
}

/**
 * PipelineCustomField: User-defined field for entities
 */
export interface PipelineCustomField {
  id: string;
  pipeline_id: string;
  field_name: string;
  field_type: CustomFieldType;
  required: boolean;
  options?: string[]; // For select type
  order_index: number;
  created_at: string;
}

/**
 * PipelineWebhook: Integration webhook configuration
 */
export interface PipelineWebhook {
  id: string;
  pipeline_id: string;
  business_id: string;
  url: string;
  events: string[]; // ['entity.created', 'entity.moved', etc]
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  failure_count: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create Pipeline Request
 */
export interface CreatePipelineRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Update Pipeline Request
 */
export interface UpdatePipelineRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: PipelineStatus;
}

/**
 * Create Stage Request
 */
export interface CreateStageRequest {
  name: string;
  color?: string;
  description?: string;
  is_terminal?: boolean;
  is_win_stage?: boolean;
  probability_weight?: number;
}

/**
 * Update Stage Request
 */
export interface UpdateStageRequest {
  name?: string;
  color?: string;
  description?: string;
  is_terminal?: boolean;
  is_win_stage?: boolean;
  probability_weight?: number;
}

/**
 * Reorder Stages Request
 */
export interface ReorderStagesRequest {
  stage_ids: string[];
}

/**
 * Create Entity Request
 */
export interface CreateEntityRequest {
  name: string;
  entity_type: EntityType;
  value?: number;
  currency?: string;
  priority?: EntityPriority;
  assigned_to?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  expected_close_date?: string;
}

/**
 * Update Entity Request
 */
export interface UpdateEntityRequest {
  name?: string;
  entity_type?: EntityType;
  value?: number;
  currency?: string;
  priority?: EntityPriority;
  status?: EntityStatus;
  assigned_to?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  expected_close_date?: string;
}

/**
 * Move Entity Request
 */
export interface MoveEntityRequest {
  new_stage_id: string;
  change_reason?: string;
}

/**
 * Bulk Move Entities Request
 */
export interface BulkMoveEntitiesRequest {
  entity_ids: string[];
  new_stage_id: string;
  change_reason?: string;
}

/**
 * Entity Filters
 */
export interface EntityFilters {
  stage_id?: string;
  assigned_to?: string;
  priority?: EntityPriority;
  status?: EntityStatus;
  entity_type?: EntityType;
  search?: string;
  tags?: string[];
  value_min?: number;
  value_max?: number;
  created_after?: string;
  created_before?: string;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK RETURN TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * usePipeline Hook Return Type
 */
export interface UsePipelineReturn {
  pipeline: Pipeline | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateColor: (color: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
}

/**
 * usePipelineEntities Hook Return Type
 */
export interface UsePipelineEntitiesReturn {
  entities: PipelineEntity[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    total: number;
    limit: number;
  };
  setPage: (page: number) => void;
  search: (query: string) => void;
  filterByStage: (stageId: string) => void;
  filterByAssignee: (userId: string) => void;
  filterByPriority: (priority: EntityPriority) => void;
  clearFilters: () => void;
}

/**
 * usePipelineMetrics Hook Return Type
 */
export interface UsePipelineMetricsReturn {
  metrics: PipelineMetrics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * useEntityMove Hook Return Type
 */
export interface UseEntityMoveReturn {
  moveEntity: (newStageId: string, reason?: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * usePipelineEdit Hook Return Type
 */
export interface UsePipelineEditReturn {
  updateBasics: (name: string, description: string) => Promise<void>;
  addStage: (stage: CreateStageRequest) => Promise<PipelineStage>;
  updateStage: (stageId: string, updates: UpdateStageRequest) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;
  reorderStages: (stageIds: string[]) => Promise<void>;
  loading: boolean;
  errors: Record<string, Error | null>;
}

/**
 * usePipelineSubscription Hook Return Type
 */
export interface UsePipelineSubscriptionReturn {
  subscribe: (callback: (change: RealtimeChange) => void) => () => void;
  isConnected: boolean;
}

/**
 * Realtime Change Event
 */
export interface RealtimeChange {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PROP TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PipelineBoard Props
 */
export interface PipelineBoardProps {
  pipelineId: string;
  onEntityClick?: (entityId: string) => void;
  onStageClick?: (stageId: string) => void;
}

/**
 * StageColumn Props
 */
export interface StageColumnProps {
  stage: PipelineStage;
  entities: PipelineEntity[];
  metrics: StageMetrics;
  onEntityMove?: (entityId: string, newStageId: string) => Promise<void>;
  onAddEntity?: (stageId: string) => void;
  onStageSettings?: (stageId: string) => void;
}

/**
 * EntityCard Props
 */
export interface EntityCardProps {
  entity: PipelineEntity;
  onClick?: () => void;
  onMove?: (newStageId: string) => Promise<void>;
}

/**
 * EntityDetail Props
 */
export interface EntityDetailProps {
  entityId: string;
  onClose?: () => void;
  onUpdate?: (updates: UpdateEntityRequest) => Promise<void>;
}

/**
 * PipelineMetrics Props
 */
export interface PipelineMetricsProps {
  metrics: PipelineMetrics;
  loading?: boolean;
}

/**
 * PipelineSettings Props
 */
export interface PipelineSettingsProps {
  pipelineId: string;
  onSave?: () => void;
  onArchive?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Kanban Drag-Drop Data
 */
export interface KanbanDragData {
  entityId: string;
  sourceStageId: string;
  sourceIndex: number;
}

/**
 * Column Position
 */
export interface ColumnPosition {
  stageId: string;
  order: number;
}

/**
 * Filter State
 */
export interface FilterState {
  stage?: string;
  assignee?: string;
  priority?: EntityPriority;
  status?: EntityStatus;
  search?: string;
}

/**
 * Sort Options
 */
export type SortBy = 'name' | 'value' | 'date' | 'priority' | 'last_activity';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  by: SortBy;
  order: SortOrder;
}
