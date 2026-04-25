# Layer 4 & 5 Implementation Guide

## Overview

This document describes the implementation of **Layer 4 (Configurable System)** and **Layer 5 (Actionable Dashboard)** for the B2B SaaS platform.

- **Layer 4**: Enables platform customization without code - custom fields, pipeline stages, dashboard widgets, and role-based permissions
- **Layer 5**: Provides intelligent business insights and actionable recommendations powered by data analysis

---

## Layer 4: Configurable System

### Database Schema

The configurable system is built on 10 database tables:

1. **custom_fields** - Custom field definitions (text, number, date, dropdown, etc.)
2. **pipeline_stages_config** - Pipeline stage configurations with rules and workflows
3. **role_permissions** - Role definitions with feature-based permissions
4. **permission_matrix** - Granular feature/action/role permission matrix
5. **page_configurations** - Dashboard widget and page layout configurations
6. **field_constraints** - Validation rules for custom fields
7. **configuration_versions** - Versioned snapshots of configurations for rollback
8. **audit_log** - Complete audit trail of all configuration changes
9. **notification_settings** - Notification and alert configurations
10. **field_value_mappings** - Rules for mapping field values across entities

**Location**: `/supabase/migrations/20260425_configurable_system.sql`

All tables include:
- Row-level security (RLS) policies enforcing business isolation
- Comprehensive audit logging
- Support for rollback and version control
- Timestamps and user tracking

### Frontend Components

#### 1. CustomFieldBuilder.tsx
**Location**: `/src/business/components/Configurable/CustomFieldBuilder.tsx`

Allows users to create and edit custom fields without code:
- Supported field types: text, number, date, dropdown, multiselect, checkbox, email, phone, URL, rich text
- Features:
  - Auto-generate field slugs from names
  - Color-coded options for dropdowns
  - Validation rules (min/max length, regex patterns)
  - Help text and placeholder text
  - Required/optional field toggle

**Usage**:
```tsx
<CustomFieldBuilder
  businessId={businessId}
  userId={userId}
  field={existingField}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

#### 2. PipelineStageEditor.tsx
**Location**: `/src/business/components/Configurable/PipelineStageEditor.tsx`

Configure pipeline stages:
- Rename stages
- Change colors
- Set auto-archive and warning timelines
- Mark terminal (final) stages
- Define required fields to advance
- Drag-and-drop reordering

**Usage**:
```tsx
<PipelineStageEditor
  businessId={businessId}
  pipelineId={pipelineId}
  stages={stages}
  onSave={handleSave}
/>
```

#### 3. PermissionManager.tsx
**Location**: `/src/business/components/Configurable/PermissionManager.tsx`

Role-based access control:
- Select role and configure permissions
- Feature-based permissions matrix (view, edit, delete, create)
- Supports: Leads, Pipelines, Customers, Emails, Automation, Reports, Settings
- Instant permission updates

#### 4. SettingsPanel.tsx
**Location**: `/src/business/components/Configurable/SettingsPanel.tsx`

Master settings interface:
- Unified tab-based navigation
- Integrates all configuration components
- Can be used as a modal or side panel

**Usage**:
```tsx
<SettingsPanel
  businessId={businessId}
  pipelineId={pipelineId}
  userId={userId}
  onClose={handleClose}
/>
```

### API Functions

**Location**: `/src/app/api/configurable-system.ts`

#### Custom Field Management
```typescript
createCustomField(businessId, fieldData, userId)
updateCustomField(businessId, fieldId, userId, updates)
deleteCustomField(businessId, fieldId)
getCustomFields(businessId, entityTypes?)
```

#### Pipeline Configuration
```typescript
updatePipelineStages(businessId, pipelineId, stages)
getPipelineStages(businessId, pipelineId)
```

#### Role & Permission Management
```typescript
updateRole(businessId, roleId, roleData, userId)
getRoles(businessId)
updatePermission(roleId, businessId, feature, action, isAllowed)
checkUserPermission(userId, businessId, feature, action)
```

#### Page Configuration
```typescript
updatePageConfiguration(businessId, pageConfig, userId)
getPageConfiguration(businessId, pageSlug)
```

#### Audit Trail
```typescript
logConfigurationChange(businessId, changeType, entityType, ...)
getAuditLog(businessId, entityType?, limit)
```

### Database Functions

Supabase SQL functions handle complex operations:

1. **validate_custom_field()** - Validates field name, slug, type, and options
2. **check_user_permission()** - Checks if user has permission for action
3. **log_config_change()** - Logs configuration changes with undo capability
4. **get_next_version_number()** - Gets next configuration version
5. **get_field_constraints()** - Returns validation rules for field

---

## Layer 5: Actionable Dashboard

### Database Schema

Layer 5 adds 3 core tables for insights and recommendations:

1. **dashboard_metrics** - Calculated KPIs and trends
   - Metric types: conversion_rate, avg_deal_size, pipeline_value, sales_velocity, win_loss_rate, etc.
   - Tracks current, previous, and target values
   - Period-based data (daily, weekly, monthly)

2. **dashboard_insights** - AI-generated and detected insights
   - Types: bottleneck, performance, forecast, anomaly, trend, health, recommendation
   - Impact score and confidence levels
   - User interaction tracking (dismissed, action taken)
   - Supports AI model attribution

3. **dashboard_recommendations** - Actionable recommendations
   - Action types: follow_up_call, send_email, reassign_lead, re_qualify, etc.
   - Priority levels: low, medium, high, critical
   - Effort estimation and expected impact
   - Implementation tracking with feedback

**Location**: `/supabase/migrations/20260425_actionable_dashboard.sql`

### Frontend Components

#### 1. ActionableDashboard.tsx
**Location**: `/src/business/components/Dashboard/ActionableDashboard.tsx`

Main insights dashboard:
- Displays monthly revenue goal progress with visual progress bar
- Shows active insights sorted by impact score
- Lists recommended actions with priority levels
- Inline insight dismissal and recommendation acceptance
- Real-time data loading with error handling

**Features**:
- Color-coded insight types (🚫 bottleneck, 📊 performance, 🔮 forecast)
- Impact and confidence visualizations
- Action buttons for accepting recommendations
- Goal progress tracking with daily pace calculation

**Usage**:
```tsx
<ActionableDashboard
  businessId={businessId}
  pipelineId={pipelineId}
  userId={userId}
/>
```

### API Functions

**Location**: `/src/app/api/insights.ts`

#### Metric Calculations
```typescript
calculatePipelineMetrics(businessId, pipelineId)
  // Returns: total leads, pipeline value, conversion rate, average deal size,
  //          sales velocity, stage metrics, forecasted revenue
```

#### Insight Generation
```typescript
detectBottlenecks(businessId, pipelineId)
  // Returns: stuck leads, high drop-off stages

getPerformanceInsights(businessId)
  // Returns: below-average conversion, low deal size trends

getGoalProgress(businessId)
  // Returns: monthly goal, current progress, days remaining, daily pace needed
```

#### Recommendations
```typescript
generateRecommendations(businessId)
  // Returns: actionable recommendations based on bottlenecks and performance

storeInsight(insight)
dismissInsight(insightId, businessId, userId)
getActiveInsights(businessId, limit)
getRecommendations(businessId, status?, limit)
updateRecommendationStatus(recommendationId, businessId, status, userId, feedback?)
```

### Insight Types

1. **Bottleneck** - Identifies stuck leads or high drop-off stages
   - Example: "5 leads stuck in Negotiation for 10+ days"
   - Recommendations: Follow-up calls, reassignment, workflow adjustment

2. **Performance** - Compares metrics to industry benchmarks
   - Example: "Conversion rate 15%, industry avg 25%"
   - Recommendations: Review qualification, adjust campaign

3. **Forecast** - Projects future performance
   - Example: "$50K forecasted revenue this month"
   - Recommendations: Prepare fulfillment, identify risks

4. **Anomaly** - Detects unusual patterns
   - Example: "Response rate dropped 30% week-over-week"
   - Recommendations: Check team workload, review process changes

5. **Trend** - Identifies positive/negative patterns
   - Example: "Deal size trending up 5% monthly"
   - Recommendations: Scale similar campaigns, optimize pricing

6. **Health** - Overall system health checks
   - Example: "Team response rate at 92% (target: 95%)"
   - Recommendations: Workload rebalancing, training

---

## Integration Points

### Routing

Add these routes to your application:

```typescript
// Layer 4 Configuration Pages
'/app/settings/custom-fields'
'/app/settings/pipelines'
'/app/settings/permissions'
'/app/settings/configuration'

// Layer 5 Dashboard
'/app/dashboard/insights'
'/app/dashboard/actionable'
```

### Component Integration

#### Add to Main Dashboard
```tsx
import ActionableDashboard from '@/business/components/Dashboard/ActionableDashboard';

// In your dashboard page:
<ActionableDashboard
  businessId={currentBusiness.id}
  pipelineId={currentPipeline?.id}
  userId={userId}
/>
```

#### Add Settings Panel
```tsx
import SettingsPanel from '@/business/components/Configurable/SettingsPanel';

// Show in modal or sidebar:
<SettingsPanel
  businessId={businessId}
  pipelineId={pipelineId}
  userId={userId}
  onClose={handleClose}
/>
```

### Permissions Integration

Check permissions before showing features:

```typescript
// Check user permission
const canEdit = await checkUserPermission(
  userId,
  businessId,
  'leads',
  'edit'
);

if (canEdit) {
  // Show edit button
}
```

---

## Key Calculations

### Conversion Rate
```
Stage Conversion = (Leads moved to next stage / Leads in stage) × 100
Overall Conversion = (Closed deals / Total leads) × 100
```

### Average Deal Size
```
Avg Deal Size = Total Pipeline Value / Total Leads
```

### Sales Velocity
```
Sales Velocity = Total Revenue / Days in Period
```

### Goal Progress
```
Progress % = (Current Revenue / Monthly Goal) × 100
Daily Pace Needed = (Monthly Goal - Current Revenue) / Days Remaining
```

---

## Development Notes

### Type Safety
All API functions are fully typed with TypeScript interfaces. Check `/src/app/api/configurable-system.ts` and `/src/app/api/insights.ts` for type definitions.

### Error Handling
- All API calls include try-catch with user-friendly error messages
- Validation happens both client-side and database-side
- Audit logs track all failures for debugging

### Performance
- Uses Supabase indexes on frequently queried columns
- Pagination support for large data sets
- Caching recommended for metrics calculations

### Security
- Row-level security (RLS) policies enforce business isolation
- All user actions require authentication
- Audit trail tracks who made what changes when
- Rate limiting on API endpoints

---

## Testing

### Unit Tests
Run tests with:
```bash
npm run test
```

### Integration Tests
Test full workflows:
1. Create custom field
2. Update pipeline stages
3. Configure permissions
4. Generate insights
5. Accept recommendations

### Manual Testing Checklist

**Layer 4:**
- [ ] Create custom field with all types
- [ ] Edit and delete custom fields
- [ ] Rename and reorder pipeline stages
- [ ] Configure role permissions
- [ ] Verify audit log entries

**Layer 5:**
- [ ] Calculate pipeline metrics
- [ ] Detect bottlenecks
- [ ] Generate recommendations
- [ ] Dismiss insights
- [ ] Accept recommendations
- [ ] View goal progress

---

## Next Steps

1. **Integrate Routes** - Add configuration and insights pages to your router
2. **Add Navigation** - Update main nav to include Settings and Insights
3. **Configure Database** - Run migrations to create tables
4. **Test Workflows** - Follow the testing checklist
5. **Deploy** - Push to staging/production

---

## Support & Documentation

For detailed component documentation, see:
- `CustomFieldBuilder.tsx` - Custom field creation
- `PipelineStageEditor.tsx` - Stage management
- `ActionableDashboard.tsx` - Insights display
- API files for function signatures and examples
