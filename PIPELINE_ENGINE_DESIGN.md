# Pipeline Engine Design Specification
**Version 1.0 | Status: Ready for Implementation | Phase 2A**

## Executive Summary

The Pipeline Engine is a production-grade funnel management system that enables businesses to organize, track, and manage sales pipelines with multiple customizable stages. Built on Supabase with React/TypeScript frontend, it provides real-time updates, comprehensive metrics, and audit trails for compliance.

## 1. System Architecture

### 1.1 Architecture Layers

```
┌─────────────────────────────────────────┐
│     React Frontend (Business App)       │
│  ┌─────────────────────────────────────┐│
│  │ Components (Kanban, Metrics, etc)   ││
│  │ + Hooks (usePipeline, useEntities)  ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────v──────────────────────────┐
│   API Service Layer (src/app/api/)      │
│  ┌─────────────────────────────────────┐│
│  │ CRUD Operations (Create, Read, etc) ││
│  │ Validation & Authorization          ││
│  │ History Tracking & Audit Trail      ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │ Supabase Client
┌──────────────v──────────────────────────┐
│    Supabase Backend                     │
│  ┌─────────────────────────────────────┐│
│  │ PostgreSQL Database                 ││
│  │ RLS Policies & Row Security         ││
│  │ Real-time Subscriptions             ││
│  │ Database Functions & Triggers       ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 1.2 Data Model

**Core Tables:**
- `business_pipelines` - Pipeline configurations
- `pipeline_stages` - Stage definitions within pipelines
- `pipeline_entities` - Items moving through pipelines
- `pipeline_history` - Audit trail of all state changes
- `pipeline_custom_fields` - User-defined fields per entity
- `pipeline_metrics` - Pre-calculated metrics (cached)
- `pipeline_webhooks` - Webhook configurations for integrations

## 2. Database Schema

### 2.1 Business Pipelines Table

```sql
CREATE TABLE business_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  icon varchar(50),
  color varchar(7) DEFAULT '#3B82F6',
  status varchar(20) DEFAULT 'active', -- active, archived, deleted
  created_by uuid NOT NULL REFERENCES biz_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Metadata
  total_entities integer DEFAULT 0,
  total_value numeric(15, 2) DEFAULT 0,
  conversion_rate numeric(5, 2) DEFAULT 0,
  
  UNIQUE(business_id, name)
);
```

### 2.2 Pipeline Stages Table

```sql
CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  order_index integer NOT NULL,
  color varchar(7) DEFAULT '#E5E7EB',
  description text,
  is_terminal boolean DEFAULT false, -- Final stage
  is_win_stage boolean DEFAULT false, -- Successful completion
  probability_weight numeric(3, 2) DEFAULT 0.5, -- Win probability
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(pipeline_id, order_index)
);
```

### 2.3 Pipeline Entities Table

```sql
CREATE TABLE pipeline_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  
  -- Core fields
  name varchar(255) NOT NULL,
  entity_type varchar(50) NOT NULL, -- lead, opportunity, deal, etc
  value numeric(15, 2),
  currency varchar(3) DEFAULT 'USD',
  priority varchar(20) DEFAULT 'medium', -- low, medium, high, critical
  status varchar(20) DEFAULT 'active',
  
  -- Relationships
  assigned_to uuid REFERENCES biz_users(id) ON DELETE SET NULL,
  related_to uuid REFERENCES pipeline_entities(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  entered_stage_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  expected_close_date date,
  closed_at timestamptz,
  
  -- Soft delete
  deleted_at timestamptz,
  
  -- Metadata
  custom_fields jsonb DEFAULT '{}',
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  
  INDEX idx_pipeline_stage ON (pipeline_id, stage_id),
  INDEX idx_assigned_to ON (assigned_to),
  INDEX idx_created_at ON (created_at DESC),
  INDEX idx_last_activity ON (last_activity_at DESC)
);
```

### 2.4 Pipeline History Table

```sql
CREATE TABLE pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES pipeline_entities(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  
  action varchar(50) NOT NULL, -- created, moved, updated, deleted, noted
  old_values jsonb,
  new_values jsonb,
  
  changed_by uuid NOT NULL REFERENCES biz_users(id),
  change_reason text,
  
  created_at timestamptz DEFAULT now(),
  
  INDEX idx_entity_history ON (entity_id, created_at DESC),
  INDEX idx_pipeline_history ON (pipeline_id, created_at DESC)
);
```

### 2.5 Pipeline Custom Fields Table

```sql
CREATE TABLE pipeline_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  
  field_name varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL, -- text, number, date, select, checkbox
  required boolean DEFAULT false,
  options jsonb, -- For select type
  
  order_index integer,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(pipeline_id, field_name)
);
```

### 2.6 Pipeline Metrics Table (Cache)

```sql
CREATE TABLE pipeline_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  
  metric_type varchar(50) NOT NULL, -- stage_count, stage_value, conversion_rate, avg_time, etc
  metric_value numeric(15, 2),
  
  calculated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '5 minutes',
  
  INDEX idx_pipeline_metrics ON (pipeline_id, metric_type),
  INDEX idx_stage_metrics ON (stage_id, metric_type)
);
```

### 2.7 Pipeline Webhooks Table

```sql
CREATE TABLE pipeline_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  
  url text NOT NULL,
  events text[] NOT NULL, -- ['entity.created', 'entity.moved', 'stage.completed']
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  last_triggered_at timestamptz,
  
  INDEX idx_active_webhooks ON (business_id, is_active)
);
```

## 3. TypeScript Types

### 3.1 Core Types

```typescript
// Pipeline Types
export interface Pipeline {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: 'active' | 'archived' | 'deleted';
  created_by: string;
  created_at: string;
  updated_at: string;
  total_entities: number;
  total_value: number;
  conversion_rate: number;
}

// Stage Types
export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  order_index: number;
  color?: string;
  description?: string;
  is_terminal: boolean;
  is_win_stage: boolean;
  probability_weight: number;
  created_at: string;
  updated_at: string;
}

// Entity Types
export interface PipelineEntity {
  id: string;
  pipeline_id: string;
  stage_id: string;
  business_id: string;
  name: string;
  entity_type: 'lead' | 'opportunity' | 'deal' | 'customer';
  value?: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'won' | 'lost' | 'paused';
  assigned_to?: string;
  related_to?: string;
  created_at: string;
  updated_at: string;
  entered_stage_at: string;
  last_activity_at: string;
  expected_close_date?: string;
  closed_at?: string;
  deleted_at?: string;
  custom_fields: Record<string, any>;
  tags: string[];
  notes?: string;
}

// History Types
export interface EntityHistory {
  id: string;
  entity_id: string;
  pipeline_id: string;
  action: 'created' | 'moved' | 'updated' | 'deleted' | 'noted';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

// Metrics Types
export interface StageMetrics {
  stage_id: string;
  entity_count: number;
  total_value: number;
  avg_value: number;
  avg_time_in_stage: number; // days
  conversion_rate: number;
  last_calculated: string;
}

export interface PipelineMetrics {
  pipeline_id: string;
  total_entities: number;
  total_value: number;
  stages: Record<string, StageMetrics>;
  conversion_funnel: Array<{ stage: string; count: number; percentage: number }>;
  weighted_forecast: number;
  pipeline_health: 'excellent' | 'good' | 'fair' | 'poor';
  last_calculated: string;
}

// Custom Field Types
export interface PipelineCustomField {
  id: string;
  pipeline_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  order_index: number;
  created_at: string;
}

// API Request/Response Types
export interface CreatePipelineRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateStageRequest {
  name: string;
  color?: string;
  description?: string;
  is_terminal?: boolean;
  is_win_stage?: boolean;
  probability_weight?: number;
}

export interface CreateEntityRequest {
  name: string;
  entity_type: 'lead' | 'opportunity' | 'deal' | 'customer';
  value?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  expected_close_date?: string;
}

export interface MoveEntityRequest {
  new_stage_id: string;
  change_reason?: string;
}

export interface BulkMoveEntitiesRequest {
  entity_ids: string[];
  new_stage_id: string;
  change_reason?: string;
}
```

## 4. API Service Layer

### 4.1 Base Service Structure

```typescript
// Location: src/app/api/pipeline.ts

// ─── PIPELINE CRUD ───────────────────────
export async function getPipelines(businessId: string): Promise<Pipeline[]>
export async function getPipeline(pipelineId: string): Promise<Pipeline>
export async function createPipeline(businessId: string, data: CreatePipelineRequest): Promise<Pipeline>
export async function updatePipeline(pipelineId: string, updates: Partial<Pipeline>): Promise<Pipeline>
export async function deletePipeline(pipelineId: string): Promise<void>
export async function archivePipeline(pipelineId: string): Promise<void>

// ─── STAGE CRUD ──────────────────────────
export async function createStage(pipelineId: string, data: CreateStageRequest): Promise<PipelineStage>
export async function updateStage(stageId: string, updates: Partial<PipelineStage>): Promise<PipelineStage>
export async function deleteStage(stageId: string): Promise<void>
export async function reorderStages(pipelineId: string, stageIds: string[]): Promise<void>
export async function getStagesByPipeline(pipelineId: string): Promise<PipelineStage[]>

// ─── ENTITY CRUD ─────────────────────────
export async function getEntities(pipelineId: string, filters?: EntityFilters): Promise<PipelineEntity[]>
export async function getEntity(entityId: string): Promise<PipelineEntity>
export async function createEntity(pipelineId: string, stageId: string, data: CreateEntityRequest): Promise<PipelineEntity>
export async function updateEntity(entityId: string, updates: Partial<PipelineEntity>): Promise<PipelineEntity>
export async function deleteEntity(entityId: string): Promise<void>
export async function moveEntity(entityId: string, newStageId: string, reason?: string): Promise<PipelineEntity>
export async function bulkMoveEntities(entityIds: string[], newStageId: string, reason?: string): Promise<PipelineEntity[]>

// ─── HISTORY & AUDIT ─────────────────────
export async function getEntityHistory(entityId: string): Promise<EntityHistory[]>
export async function getPipelineHistory(pipelineId: string, timeRange?: TimeRange): Promise<EntityHistory[]>
export async function getStageTransitionHistory(pipelineId: string, timeRange?: TimeRange): Promise<EntityHistory[]>

// ─── METRICS ─────────────────────────────
export async function getPipelineMetrics(pipelineId: string): Promise<PipelineMetrics>
export async function getStageMetrics(stageId: string): Promise<StageMetrics>
export async function calculateMetrics(pipelineId: string): Promise<PipelineMetrics>

// ─── CUSTOM FIELDS ───────────────────────
export async function getCustomFields(pipelineId: string): Promise<PipelineCustomField[]>
export async function createCustomField(pipelineId: string, field: PipelineCustomField): Promise<PipelineCustomField>
export async function updateCustomField(fieldId: string, updates: Partial<PipelineCustomField>): Promise<PipelineCustomField>
export async function deleteCustomField(fieldId: string): Promise<void>
```

### 4.2 Implementation Details

**Error Handling:**
- Validate all inputs before DB operations
- Return structured error responses with codes
- Log all errors for debugging
- Provide user-friendly error messages

**Performance:**
- Use Supabase connections pooling
- Implement result pagination (50 items default)
- Cache frequently accessed metrics (5 min TTL)
- Batch queries where possible
- Use database indexes effectively

**Data Integrity:**
- All operations are transactional
- RLS policies enforced at DB level
- Soft deletes maintain referential integrity
- History tracked for audit trail

## 5. Frontend Components

### 5.1 Component Hierarchy

```
PipelineBoard (Main Container)
├── PipelineHeader
│   ├── PipelineTitleBar
│   ├── PipelineActions
│   └── PipelineFilters
├── PipelineKanban (Drag-drop container)
│   ├── StageColumn (Multiple)
│   │   ├── StageHeader
│   │   │   ├── StageName
│   │   │   └── StageMetrics
│   │   ├── DropZone
│   │   └── EntityCard (Multiple)
│   │       ├── EntityBasicInfo
│   │       ├── EntityValue
│   │       └── EntityActions
│   └── EmptyState (if needed)
├── EntityDetailModal
│   ├── EntityInfo
│   ├── HistoryTimeline
│   ├── NotesList
│   ├── AssignmentSection
│   └── QuickActions
├── PipelineMetrics (Dashboard)
│   ├── ConversionFunnel
│   ├── StageVelocity
│   ├── ValueDistribution
│   └── SuccessRate
└── PipelineSettings
    ├── PipelineBasicSettings
    ├── StageManager
    ├── CustomFieldManager
    └── ArchiveOption
```

### 5.2 Component Specifications

**PipelineBoard.tsx**
- Main kanban board component
- Renders all stages as columns
- Handles entity drag-and-drop
- Real-time updates via subscriptions
- Responsive design (mobile/tablet/desktop)
- Search and filter capabilities
- Performance: virtualize for 100+ entities

**StageColumn.tsx**
- Individual stage column
- Shows stage name, count, metrics
- Drag-drop drop zone
- Add entity button
- Context menu (edit, duplicate, delete)
- Stage color indicator

**EntityCard.tsx**
- Entity in pipeline display
- Shows name, value, priority, date
- Entity type badge
- Quick actions (move, edit, delete)
- Drag handle
- Click to open details

**EntityDetail.tsx**
- Full entity view in modal
- All entity fields (editable)
- Edit form with validation
- History timeline (grouped by day)
- Notes section (add, edit, delete)
- Stage transition history
- Associated automations
- Delete with confirmation

**PipelineMetrics.tsx**
- Pipeline statistics dashboard
- Conversion funnel chart
- Stage velocity (avg days per stage)
- Entity count distribution
- Value distribution (pie/bar)
- Success/fail rates
- Pipeline health indicator
- Weighted forecast (for sales)

**PipelineSettings.tsx**
- Customize pipeline configuration
- Edit pipeline name, description, icon, color
- Manage stages: add, edit, delete, reorder (drag-drop)
- Stage color picker
- Custom field management: create, edit, delete
- Soft delete/archive option

## 6. Custom Hooks

### 6.1 Hook Specifications

```typescript
// usePipeline: Get and manage a specific pipeline
export function usePipeline(pipelineId: string) {
  return {
    pipeline: Pipeline | null,
    loading: boolean,
    error: Error | null,
    refetch: () => Promise<void>,
    updateName: (name: string) => Promise<void>,
    updateColor: (color: string) => Promise<void>,
    // ... more methods
  }
}

// usePipelineEntities: Get entities with advanced filtering
export function usePipelineEntities(pipelineId: string, filters?: EntityFilters) {
  return {
    entities: PipelineEntity[],
    loading: boolean,
    error: Error | null,
    pagination: { page: number; total: number },
    setPage: (page: number) => void,
    search: (query: string) => void,
    filterByStage: (stageId: string) => void,
    filterByAssignee: (userId: string) => void,
    // ... more methods
  }
}

// usePipelineMetrics: Get metrics with caching
export function usePipelineMetrics(pipelineId: string) {
  return {
    metrics: PipelineMetrics | null,
    loading: boolean,
    error: Error | null,
    refresh: () => Promise<void>,
    // Cached: 5 min TTL
  }
}

// useEntityMove: Handle entity movement with history
export function useEntityMove(entityId: string) {
  return {
    moveEntity: (newStageId: string, reason?: string) => Promise<void>,
    loading: boolean,
    error: Error | null,
  }
}

// usePipelineEdit: Handle pipeline editing
export function usePipelineEdit(pipelineId: string) {
  return {
    updateBasics: (name: string, description: string) => Promise<void>,
    addStage: (stage: CreateStageRequest) => Promise<PipelineStage>,
    updateStage: (stageId: string, updates: Partial<PipelineStage>) => Promise<void>,
    deleteStage: (stageId: string) => Promise<void>,
    reorderStages: (stageIds: string[]) => Promise<void>,
    loading: boolean,
    errors: Record<string, Error | null>,
  }
}

// usePipelineSubscription: Real-time updates via Supabase
export function usePipelineSubscription(pipelineId: string) {
  return {
    subscribe: (callback: (change: RealtimeChange) => void) => () => void,
    // Auto-cleanup on unmount
  }
}
```

## 7. Routing

### 7.1 Route Configuration

```typescript
// New routes to add to src/business/routes.tsx

{
  path: '/business/pipelines',
  element: <PipelineBoard />,
  errorElement: <ErrorElement />,
},
{
  path: '/business/pipelines/:id',
  element: <PipelineBoard />,
  errorElement: <ErrorElement />,
},
{
  path: '/business/pipelines/:id/settings',
  element: <PipelineSettings />,
  errorElement: <ErrorElement />,
},
{
  path: '/business/entities/:id',
  element: <EntityDetail />,
  errorElement: <ErrorElement />,
},
```

### 7.2 Navigation

- Add "Pipelines" to sidebar navigation
- Add icon for pipelines feature
- Active/inactive based on feature flag
- Breadcrumb navigation support

## 8. RLS Policies

### 8.1 Policy Strategy

All tables have RLS enabled. Key policies:

**SELECT:** Users can view own business pipelines and entities
**INSERT:** Users can create in own business only
**UPDATE:** Users can update own business data only
**DELETE:** Users can soft-delete own business data

Admin users (via RBAC context) have broader access.

## 9. Real-time Features

### 9.1 Supabase Subscriptions

Subscribe to:
- Entity movements (instant update across team)
- Stage updates
- Entity creation/deletion
- History changes (for audit)

Use `usePipelineSubscription` hook for automatic management.

## 10. Performance Targets

- Initial load: < 2s for 100 entities
- Entity move: < 500ms with UI feedback
- Metrics calculation: < 1s (cached)
- Search/filter: < 300ms response
- No memory leaks on component unmount

## 11. Testing Strategy

### 11.1 Test Coverage Target: >80%

**Unit Tests:**
- All service layer functions
- All utility functions
- All hooks (in isolation)

**Component Tests:**
- Rendering with different data states
- User interactions (drag-drop, clicks)
- Error states
- Empty states
- Loading states

**Integration Tests:**
- Full user workflows (create pipeline → add entities → move)
- Real-time updates
- History tracking
- Metrics calculation

**E2E Tests (if time permits):**
- Complete pipeline lifecycle
- Team collaboration scenarios
- Bulk operations

## 12. Security Considerations

- All data operations validate business_id
- RLS policies prevent data leakage
- Activity logs for audit trail
- Soft deletes prevent data loss
- Input validation on all API endpoints
- CSRF protection for POST/PUT/DELETE

## 13. Deployment Checklist

- [ ] All migrations applied successfully
- [ ] Database indexes created
- [ ] RLS policies verified
- [ ] Service layer tested
- [ ] Components rendered correctly
- [ ] Routes configured
- [ ] Hooks functioning
- [ ] Tests passing (>80% coverage)
- [ ] Documentation complete
- [ ] No console errors/warnings
- [ ] Responsive design tested
- [ ] Real-time subscriptions working
- [ ] Performance benchmarks met
- [ ] Accessibility checked (a11y)

## 14. Future Enhancements (Phase 2B+)

- Automation Engine integration
- Advanced reporting and analytics
- Integration connectors (Salesforce, HubSpot, Stripe)
- AI-powered insights and recommendations
- Pipeline forecasting ML model
- Custom workflow automation
- Bulk import/export
- Advanced permissions and team collaboration
- Activity feed and notifications
- Mobile app support

---

**Document Version:** 1.0
**Last Updated:** 2026-04-22
**Next Review:** After Phase 2A completion
