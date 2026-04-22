# Pipeline Engine - Usage Guide

**Quick Start Guide for Using the Pipeline System**

## Table of Contents
1. [Basic Concepts](#basic-concepts)
2. [Getting Started](#getting-started)
3. [Creating Your First Pipeline](#creating-your-first-pipeline)
4. [Managing Stages](#managing-stages)
5. [Working with Entities](#working-with-entities)
6. [Using Hooks](#using-hooks)
7. [API Reference](#api-reference)
8. [Code Examples](#code-examples)
9. [Troubleshooting](#troubleshooting)

## Basic Concepts

### What is a Pipeline?
A pipeline is a sales funnel or workflow that moves opportunities/leads through defined stages until they reach completion (won/lost).

### Core Terms
- **Pipeline:** Container for a sales process (e.g., "Sales Pipeline", "Customer Onboarding")
- **Stage:** A step in the pipeline (e.g., "Lead", "Qualified", "Proposal", "Close")
- **Entity:** An item moving through the pipeline (a lead, deal, or opportunity)
- **Metrics:** Analytics about pipeline performance (conversion rates, velocity, value)
- **History:** Complete audit trail of all changes

## Getting Started

### 1. View All Pipelines
```typescript
import { getPipelines } from '@/app/api/pipeline';

const pipelines = await getPipelines(businessId);
```

### 2. View a Specific Pipeline
```typescript
import { getPipeline } from '@/app/api/pipeline';

const pipeline = await getPipeline(pipelineId);
```

### 3. Use the Hook
```typescript
import { usePipeline } from '@/business/hooks/usePipeline';

function MyComponent() {
  const { pipeline, loading, error } = usePipeline(pipelineId);
  
  return pipeline ? <h1>{pipeline.name}</h1> : <div>Loading...</div>;
}
```

## Creating Your First Pipeline

### Step 1: Create a Pipeline
```typescript
import { createPipeline } from '@/app/api/pipeline';

const newPipeline = await createPipeline(businessId, {
  name: 'Sales Pipeline',
  description: 'Main sales funnel',
  icon: 'target',
  color: '#3B82F6',
});
```

### Step 2: Create Stages
```typescript
import { createStage } from '@/app/api/pipeline';

const stages = [
  {
    name: 'Lead',
    color: '#3B82F6',
    probability_weight: 0.10,
  },
  {
    name: 'Qualified',
    color: '#8B5CF6',
    probability_weight: 0.25,
  },
  {
    name: 'Proposal',
    color: '#F59E0B',
    probability_weight: 0.50,
  },
  {
    name: 'Won',
    color: '#10B981',
    is_win_stage: true,
    is_terminal: true,
    probability_weight: 1.0,
  },
];

for (const stageData of stages) {
  const stage = await createStage(pipeline.id, stageData);
  // Process stage...
}
```

### Step 3: Add Entities to Pipeline
```typescript
import { createEntity } from '@/app/api/pipeline';

const newEntity = await createEntity(
  pipeline.id,
  firstStage.id,
  {
    name: 'Acme Corporation',
    entity_type: 'opportunity',
    value: 50000,
    priority: 'high',
    expected_close_date: '2026-05-30',
    tags: ['enterprise', 'urgent'],
    notes: 'Contact: John Smith, VP of Sales',
  }
);
```

## Managing Stages

### Update a Stage
```typescript
import { updateStage } from '@/app/api/pipeline';

const updated = await updateStage(stageId, {
  name: 'Qualified Leads',
  color: '#7C3AED',
});
```

### Reorder Stages
```typescript
import { reorderStages } from '@/app/api/pipeline';

const stageIds = [stage1.id, stage2.id, stage3.id, stage4.id];
await reorderStages(pipeline.id, stageIds);
```

### Delete a Stage
```typescript
import { deleteStage } from '@/app/api/pipeline';

// Entities must be moved first
try {
  await deleteStage(stageId);
} catch (error) {
  console.log('Cannot delete stage with entities');
}
```

## Working with Entities

### Create an Entity
```typescript
import { createEntity } from '@/app/api/pipeline';

const entity = await createEntity(pipelineId, stageId, {
  name: 'Deal Name',
  entity_type: 'deal', // 'lead', 'opportunity', 'deal', 'customer'
  value: 75000,
  priority: 'high', // 'low', 'medium', 'high', 'critical'
  assigned_to: userId,
  custom_fields: {
    industry: 'Technology',
    company_size: 'Enterprise',
  },
  tags: ['vip', 'tech'],
  notes: 'Internal notes here',
  expected_close_date: '2026-06-30',
});
```

### Update an Entity
```typescript
import { updateEntity } from '@/app/api/pipeline';

const updated = await updateEntity(entityId, {
  name: 'Updated Name',
  value: 100000,
  priority: 'critical',
  status: 'active', // 'active', 'won', 'lost', 'paused'
  notes: 'Updated notes',
});
```

### Move an Entity to Another Stage
```typescript
import { moveEntity } from '@/app/api/pipeline';

const updated = await moveEntity(
  entityId,
  newStageId,
  'Qualified by John Smith'
);
```

### Move Multiple Entities
```typescript
import { bulkMoveEntities } from '@/app/api/pipeline';

const entityIds = ['id1', 'id2', 'id3'];
const updated = await bulkMoveEntities(
  entityIds,
  newStageId,
  'Bulk qualified'
);
```

### Get Entity History
```typescript
import { getEntityHistory } from '@/app/api/pipeline';

const history = await getEntityHistory(entityId);

// history includes: action, old_values, new_values, changed_by, created_at
history.forEach(entry => {
  console.log(`${entry.action} by ${entry.changed_by}`);
  console.log('Changes:', entry.new_values);
});
```

### Fetch Entities with Filtering
```typescript
import { getEntities } from '@/app/api/pipeline';

const entities = await getEntities(
  pipelineId,
  {
    stage_id: stageId,        // Filter by stage
    assigned_to: userId,       // Filter by assignee
    priority: 'high',          // Filter by priority
    status: 'active',          // Filter by status
    entity_type: 'opportunity',// Filter by type
    search: 'acme',            // Search in name
    value_min: 50000,          // Filter by value range
    value_max: 100000,
  },
  { page: 1, limit: 50 }      // Pagination
);
```

## Using Hooks

### usePipeline Hook
```typescript
import { usePipeline } from '@/business/hooks/usePipeline';

function PipelineManager() {
  const {
    pipeline,
    loading,
    error,
    refetch,
    updateName,
    updateColor,
    updateDescription,
  } = usePipeline(pipelineId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{pipeline.name}</h1>
      <button onClick={() => updateName('New Name')}>
        Rename
      </button>
      <button onClick={() => refetch()}>
        Refresh
      </button>
    </div>
  );
}
```

### usePipelineEntities Hook
```typescript
import { usePipelineEntities } from '@/business/hooks/usePipeline';

function EntityList() {
  const {
    entities,
    loading,
    search,
    filterByStage,
    filterByAssignee,
    filterByPriority,
    clearFilters,
    pagination,
    setPage,
  } = usePipelineEntities(pipelineId);

  return (
    <div>
      <input
        onChange={(e) => search(e.target.value)}
        placeholder="Search entities..."
      />
      
      <select onChange={(e) => filterByPriority(e.target.value)}>
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      <button onClick={clearFilters}>Clear Filters</button>

      {entities.map(entity => (
        <div key={entity.id}>{entity.name}</div>
      ))}

      <div>
        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
      </div>
    </div>
  );
}
```

### usePipelineMetrics Hook
```typescript
import { usePipelineMetrics } from '@/business/hooks/usePipeline';

function MetricsDashboard() {
  const {
    metrics,
    loading,
    refresh,
  } = usePipelineMetrics(pipelineId);

  if (!metrics) return null;

  return (
    <div>
      <h2>Pipeline Metrics</h2>
      <div>Total Value: ${metrics.total_value.toLocaleString()}</div>
      <div>Total Entities: {metrics.total_entities}</div>
      <div>Forecast: ${metrics.weighted_forecast.toLocaleString()}</div>
      <div>Health: {metrics.pipeline_health}</div>
      
      <h3>Stages</h3>
      {Object.entries(metrics.stages).map(([stageId, stats]) => (
        <div key={stageId}>
          <h4>{stats.stage_id}</h4>
          <p>Count: {stats.entity_count}</p>
          <p>Value: ${stats.total_value}</p>
          <p>Conversion: {stats.conversion_rate}%</p>
          <p>Avg Time: {stats.avg_time_in_stage} days</p>
        </div>
      ))}

      <button onClick={refresh}>Refresh Metrics</button>
    </div>
  );
}
```

### useEntityMove Hook
```typescript
import { useEntityMove } from '@/business/hooks/usePipeline';

function EntityActions() {
  const { moveEntity, loading, error } = useEntityMove(entityId);

  const handleMove = async (newStageId) => {
    try {
      await moveEntity(newStageId, 'Qualified by user');
      console.log('Entity moved!');
    } catch (err) {
      console.error('Failed to move:', err);
    }
  };

  return (
    <button
      onClick={() => handleMove(newStageId)}
      disabled={loading}
    >
      Move to Next Stage
    </button>
  );
}
```

### usePipelineEdit Hook
```typescript
import { usePipelineEdit } from '@/business/hooks/usePipeline';

function PipelineEditor() {
  const {
    updateBasics,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    loading,
    errors,
  } = usePipelineEdit(pipelineId);

  return (
    <div>
      <button onClick={() => updateBasics('New Name', 'Description')}>
        Update Basics
      </button>

      <button onClick={() => addStage({ name: 'New Stage' })}>
        Add Stage
      </button>

      {errors.addStage && <div>{errors.addStage.message}</div>}
    </div>
  );
}
```

## API Reference

### Pipelines
| Function | Description |
|----------|-------------|
| `getPipelines(businessId)` | Get all pipelines for business |
| `getPipeline(id)` | Get single pipeline |
| `createPipeline(businessId, data)` | Create new pipeline |
| `updatePipeline(id, updates)` | Update pipeline |
| `deletePipeline(id)` | Soft delete pipeline |
| `archivePipeline(id)` | Archive pipeline |

### Stages
| Function | Description |
|----------|-------------|
| `getStagesByPipeline(pipelineId)` | Get all stages |
| `createStage(pipelineId, data)` | Create stage |
| `updateStage(id, updates)` | Update stage |
| `deleteStage(id)` | Delete stage |
| `reorderStages(pipelineId, ids)` | Reorder stages |

### Entities
| Function | Description |
|----------|-------------|
| `getEntities(pipelineId, filters, pagination)` | Get filtered entities |
| `getEntity(id)` | Get single entity |
| `createEntity(pipelineId, stageId, data)` | Create entity |
| `updateEntity(id, updates)` | Update entity |
| `deleteEntity(id)` | Soft delete entity |
| `moveEntity(id, stageId, reason)` | Move to stage |
| `bulkMoveEntities(ids, stageId, reason)` | Move multiple |

### History & Metrics
| Function | Description |
|----------|-------------|
| `getEntityHistory(id)` | Get change history |
| `getPipelineHistory(id, range)` | Get pipeline history |
| `getStageTransitionHistory(id, range)` | Get movement history |
| `getPipelineMetrics(id)` | Calculate metrics |
| `getStageMetrics(id)` | Get stage metrics |

## Code Examples

### Complete Pipeline Setup Example
```typescript
import {
  createPipeline,
  createStage,
  createEntity,
} from '@/app/api/pipeline';

async function setupSamplePipeline(businessId: string) {
  // Create pipeline
  const pipeline = await createPipeline(businessId, {
    name: 'Sales Pipeline 2026',
    icon: 'target',
    color: '#3B82F6',
  });

  // Create stages
  const leadStage = await createStage(pipeline.id, {
    name: 'Lead',
    probability_weight: 0.10,
  });

  const proposalStage = await createStage(pipeline.id, {
    name: 'Proposal',
    probability_weight: 0.50,
  });

  const wonStage = await createStage(pipeline.id, {
    name: 'Won',
    is_win_stage: true,
    is_terminal: true,
    probability_weight: 1.0,
  });

  // Create sample entities
  const entity1 = await createEntity(pipeline.id, leadStage.id, {
    name: 'TechCorp Inc',
    entity_type: 'lead',
    value: 100000,
    priority: 'high',
  });

  return pipeline;
}
```

### Dashboard Component Example
```typescript
import React from 'react';
import {
  usePipeline,
  usePipelineMetrics,
  usePipelineEntities,
} from '@/business/hooks/usePipeline';

function PipelineDashboard({ pipelineId }: { pipelineId: string }) {
  const { pipeline } = usePipeline(pipelineId);
  const { metrics } = usePipelineMetrics(pipelineId);
  const { entities } = usePipelineEntities(pipelineId);

  if (!pipeline || !metrics) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>{pipeline.name}</h1>

      <div className="metrics">
        <div className="metric">
          <h3>Total Value</h3>
          <p>${metrics.total_value.toLocaleString()}</p>
        </div>
        <div className="metric">
          <h3>Entities</h3>
          <p>{metrics.total_entities}</p>
        </div>
        <div className="metric">
          <h3>Pipeline Health</h3>
          <p>{metrics.pipeline_health}</p>
        </div>
        <div className="metric">
          <h3>Forecast</h3>
          <p>${metrics.weighted_forecast.toLocaleString()}</p>
        </div>
      </div>

      <div className="entities">
        <h2>Recent Entities</h2>
        {entities.slice(0, 10).map(entity => (
          <div key={entity.id} className="entity-item">
            <h4>{entity.name}</h4>
            <p>${entity.value?.toLocaleString() || 'N/A'}</p>
            <p>Priority: {entity.priority}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PipelineDashboard;
```

## Troubleshooting

### "Cannot delete stage with entities"
**Solution:** Move all entities from the stage to another stage before deleting.

### "Pipeline not found"
**Solution:** Verify the `pipelineId` is correct and the user has access to it.

### "Metrics are outdated"
**Solution:** Call `refresh()` from the `usePipelineMetrics` hook to recalculate.

### "Entities not updating in real-time"
**Solution:** Ensure `usePipelineSubscription` is being used, or manually call `refetch()`.

### "Permission denied" error
**Solution:** Verify user is authenticated and the business_id matches their business.

### "Custom fields not appearing"
**Solution:** Ensure custom field data is included in `custom_fields` object when creating/updating entities.

---

For more detailed information, see:
- `PIPELINE_ENGINE_DESIGN.md` - Technical specifications
- `PIPELINE_ENGINE_IMPLEMENTATION.md` - Implementation details
- Source code in `src/business/components/Pipeline/`
