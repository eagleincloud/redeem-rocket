# Feature Flag System - Complete Implementation Guide

## Overview

The Feature Flag System enables Redeem Rocket to control feature availability per business, link features to subscription plans, implement gradual rollouts, and track adoption metrics.

**Key Capabilities:**
- Per-business feature enablement
- Plan-based feature mapping
- Gradual rollout (10% → 25% → 50% → 100%)
- Real-time availability checks
- Comprehensive analytics and audit logging
- Feature dependencies and conflict management

---

## Architecture

### Database Schema

#### 1. `feature_definitions` - Master Feature Registry
```sql
CREATE TABLE feature_definitions (
  id UUID PRIMARY KEY,
  feature_name TEXT UNIQUE,
  description TEXT,
  category TEXT,
  is_public BOOLEAN,
  min_plan_tier TEXT,
  dependencies JSONB,
  conflicts JSONB,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Purpose:** Define all available features globally, including name, description, minimum plan requirement, and dependencies.

**Example:**
```json
{
  "feature_name": "chat",
  "description": "Real-time messaging system",
  "category": "messaging",
  "min_plan_tier": "professional",
  "dependencies": [],
  "status": "active"
}
```

#### 2. `business_features` - Per-Business Feature Status
```sql
CREATE TABLE business_features (
  id UUID PRIMARY KEY,
  business_id TEXT,
  feature_name TEXT,
  is_enabled BOOLEAN,
  plan_tier TEXT,
  rollout_percentage INTEGER,
  segment_ids JSONB,
  config_overrides JSONB,
  enabled_by UUID,
  enabled_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(business_id, feature_name)
);
```

**Purpose:** Track which features are enabled for each business and rollout percentage.

**Key Fields:**
- `rollout_percentage`: 0-100% for gradual rollout
- `is_enabled`: Feature toggle (true/false)
- `config_overrides`: JSON for feature-specific settings

#### 3. `feature_rollout` - Gradual Rollout Tracking
```sql
CREATE TABLE feature_rollout (
  id UUID PRIMARY KEY,
  business_id TEXT,
  feature_name TEXT,
  target_percentage INTEGER,
  current_percentage INTEGER,
  scheduled_for TIMESTAMPTZ,
  status TEXT,
  auto_rollback_on_error BOOLEAN,
  error_threshold NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Purpose:** Track scheduled rollouts and rollback policies.

**Statuses:** `pending`, `in_progress`, `completed`, `rolled_back`, `paused`

#### 4. `feature_dependencies` - Explicit Dependencies
```sql
CREATE TABLE feature_dependencies (
  id UUID PRIMARY KEY,
  feature_name TEXT,
  depends_on TEXT,
  dependency_type TEXT,
  reason TEXT
);
```

**Purpose:** Define feature dependencies and conflicts.

**Dependency Types:**
- `required`: Feature cannot function without this
- `optional`: Works better with this feature
- `conflicts`: Cannot be enabled together

#### 5. `feature_audit_log` - Complete Audit Trail
```sql
CREATE TABLE feature_audit_log (
  id UUID PRIMARY KEY,
  business_id TEXT,
  feature_name TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ
);
```

**Actions:** `enabled`, `disabled`, `updated`, `rollout_started`, `rollback`, `config_changed`

#### 6. `feature_analytics` - Usage & Adoption Metrics
```sql
CREATE TABLE feature_analytics (
  id UUID PRIMARY KEY,
  business_id TEXT,
  feature_name TEXT,
  usage_count BIGINT,
  unique_users INTEGER,
  activation_rate NUMERIC,
  daily_active_users INTEGER,
  avg_session_duration_seconds INTEGER,
  feature_retention_rate NUMERIC,
  associated_revenue NUMERIC,
  customer_satisfaction_score NUMERIC,
  churn_impact_percentage NUMERIC,
  error_count INTEGER,
  error_rate NUMERIC,
  period_date DATE,
  period_type TEXT,
  created_at TIMESTAMPTZ
);
```

**Purpose:** Track feature adoption and impact metrics.

#### 7. `feature_usage_events` - Event Stream
```sql
CREATE TABLE feature_usage_events (
  id UUID PRIMARY KEY,
  business_id TEXT,
  user_id UUID,
  feature_name TEXT,
  event_type TEXT,
  event_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMPTZ
);
```

**Purpose:** Raw event stream for analytics aggregation.

---

## Core Features

### Feature Definitions (Seeded)

```
chat
├─ Category: messaging
├─ Min Plan: professional
├─ Dependencies: []
└─ Status: active

esign
├─ Category: document
├─ Min Plan: professional
├─ Dependencies: [document_storage]
└─ Status: active

advanced_analytics
├─ Category: analytics
├─ Min Plan: professional
├─ Dependencies: [pipeline_system]
└─ Status: active

ai_manager
├─ Category: automation
├─ Min Plan: enterprise
├─ Dependencies: [pipeline_system]
└─ Status: beta

mobile_optimization
├─ Category: mobile
├─ Min Plan: professional
├─ Dependencies: []
└─ Status: active
```

### Plan Tier Mapping

| Plan | Monthly Price | Features |
|------|---------------|----------|
| **Starter** | $29 | Document storage, Pipeline system |
| **Professional** | $99 | + Chat, E-Signature, Analytics, Mobile |
| **Enterprise** | Custom | + AI Manager, 2FA, SSO, API, Webhooks |

---

## API Endpoints

### 1. Check Feature Availability

**GET** `/api/features/:feature_name`

```bash
curl -H "X-Business-ID: business123" \
  https://api.redeemrocket.com/api/features/chat
```

**Response (200):**
```json
{
  "feature_name": "chat",
  "description": "Real-time messaging system",
  "category": "messaging",
  "is_enabled": true,
  "rollout_percentage": 100,
  "plan_tier": "professional",
  "dependencies": [],
  "min_plan_tier": "professional"
}
```

**Response (402 - Feature Not Available):**
```json
{
  "error": "Feature 'chat' is not enabled for this business",
  "feature": "chat",
  "status": "feature_not_available"
}
```

### 2. List All Features

**GET** `/api/features?businessId=business123`

**Response:**
```json
{
  "features": {
    "chat": { "is_enabled": true, ... },
    "esign": { "is_enabled": true, ... },
    "advanced_analytics": { "is_enabled": false, ... }
  }
}
```

### 3. Check Multiple Features

**GET** `/api/features?businessId=business123&features=chat,esign,ai_manager`

### 4. Enable Feature (Admin Only)

**POST** `/api/admin/features/:feature_name/enable`

**Request:**
```json
{
  "businessId": "business123",
  "userId": "user456",
  "reason": "Upgraded to Professional plan"
}
```

**Response:**
```json
{
  "success": true,
  "feature": {
    "business_id": "business123",
    "feature_name": "chat",
    "is_enabled": true,
    "enabled_by": "user456",
    "enabled_at": "2026-05-04T10:30:00Z"
  }
}
```

### 5. Disable Feature (Admin Only)

**POST** `/api/admin/features/:feature_name/disable`

**Request:**
```json
{
  "businessId": "business123",
  "userId": "user456",
  "reason": "Downgraded to Starter plan"
}
```

### 6. Update Rollout Percentage (Admin Only)

**POST** `/api/admin/features/:feature_name/rollout`

**Request:**
```json
{
  "businessId": "business123",
  "userId": "user456",
  "rolloutPercentage": 50,
  "scheduledFor": "2026-05-05T00:00:00Z",
  "reason": "Gradual rollout to 50%"
}
```

### 7. Get Feature Analytics (Admin Only)

**GET** `/api/admin/features/usage?businessId=business123&userId=admin456`

**Response:**
```json
{
  "period": "last_30_days",
  "analytics": [
    {
      "feature_name": "chat",
      "total_usage": 2850,
      "total_users": 42,
      "avg_activation_rate": 65.5,
      "daily_active_users": 28,
      "feature_retention_rate": 78.2
    }
  ]
}
```

---

## React Hook Implementation

### Basic Usage - `useFeatureFlag()`

Check if a feature is enabled (returns boolean):

```typescript
import { useFeatureFlag } from '@/business/hooks/useFeatureFlag';

export const ChatComponent: React.FC = () => {
  const canChat = useFeatureFlag('chat');

  if (!canChat) {
    return <UpgradePrompt feature="Chat" />;
  }

  return <ChatInterface />;
};
```

### Detailed Info - `useFeatureFlagDetails()`

Get full feature information:

```typescript
import { useFeatureFlagDetails } from '@/business/hooks/useFeatureFlag';

export const FeatureStatus: React.FC = () => {
  const details = useFeatureFlagDetails('chat');

  return (
    <div>
      <p>Enabled: {details.enabled ? 'Yes' : 'No'}</p>
      <p>Rollout: {details.rolloutPercentage}%</p>
      <p>Plan Tier: {details.planTier}</p>
      {details.loading && <p>Loading...</p>}
      {details.error && <p>Error: {details.error}</p>}
    </div>
  );
};
```

### Batch Check - `useFeatureFlags()`

Check multiple features at once:

```typescript
import { useFeatureFlags } from '@/business/hooks/useFeatureFlag';

export const Dashboard: React.FC = () => {
  const flags = useFeatureFlags(['chat', 'esign', 'advanced_analytics']);

  return (
    <>
      {flags.chat && <ChatWidget />}
      {flags.esign && <ESignatureWidget />}
      {flags.advanced_analytics && <AnalyticsWidget />}
    </>
  );
};
```

### Manual Refresh

Invalidate cache and re-fetch:

```typescript
import { useFeatureFlagRefresh } from '@/business/hooks/useFeatureFlag';

export const SettingsPage: React.FC = () => {
  const refresh = useFeatureFlagRefresh();

  const handleUpgrade = async () => {
    await fetch('/api/upgrade', { method: 'POST' });
    await refresh(); // Re-fetch all feature flags
  };

  return <button onClick={handleUpgrade}>Upgrade Plan</button>;
};
```

---

## UI Components

### FeatureGate - Conditional Rendering

```typescript
import { FeatureGate } from '@/business/components/FeatureGate';

export const App: React.FC = () => {
  return (
    <FeatureGate
      name="chat"
      fallback={<UpgradePrompt feature="Chat" />}
    >
      <ChatInterface />
    </FeatureGate>
  );
};
```

### DisabledFeatureButton - Graceful Degradation

```typescript
import { DisabledFeatureButton } from '@/business/components/FeatureGate';

export const Toolbar: React.FC = () => {
  return (
    <DisabledFeatureButton
      feature="chat"
      onClick={() => openChat()}
      tooltip="Upgrade to Professional to use Chat"
    >
      Open Chat
    </DisabledFeatureButton>
  );
};
```

### UpgradePrompt - Subscription CTA

```typescript
import { UpgradePrompt } from '@/business/components/FeatureGate';

<UpgradePrompt
  feature="E-Signature"
  currentPlan="starter"
  requiredPlan="professional"
  onUpgrade={() => navigateTo('/upgrade')}
/>
```

### ComingSoon - Gradual Rollout

```typescript
import { ComingSoon } from '@/business/components/FeatureGate';

<ComingSoon
  feature="AI Manager"
  rolloutPercentage={25}
  onNotifyMe={() => subscribeToNotification('ai_manager')}
/>
```

---

## Server-Side Middleware

### Feature Gate Middleware

Protect API routes with feature gating:

```typescript
import { withFeatureGate } from '@/app/middleware/feature-gate';

export const POST = withFeatureGate(['chat'])(async (req, context) => {
  // Only called if 'chat' feature is enabled
  const { businessId } = context;

  return new Response(JSON.stringify({
    message: 'Chat message sent',
    businessId
  }));
});
```

### With Logging

Log all feature access attempts:

```typescript
import { withFeatureLogging } from '@/app/middleware/feature-gate';

export const POST = withFeatureLogging(async (req) => {
  // Feature access is logged automatically
  return new Response(JSON.stringify({ success: true }));
});
```

### Check Feature Status

```typescript
import { checkFeatureEnabled } from '@/app/middleware/feature-gate';

const isEnabled = await checkFeatureEnabled(businessId, 'chat');
if (!isEnabled) {
  return new Response(
    JSON.stringify({ error: 'Feature not enabled' }),
    { status: 402 }
  );
}
```

---

## Admin Dashboard

### Component Usage

```typescript
import { FeatureFlagsAdmin } from '@/admin/components/FeatureFlagsAdmin';

export const AdminPage: React.FC = () => {
  return <FeatureFlagsAdmin businessId={businessId} />;
};
```

### Features

- **Toggle Features**: Enable/disable per business
- **Rollout Control**: Adjust percentage (0-100%)
- **Analytics**: View usage metrics and adoption rates
- **Audit Trail**: See who changed what and when
- **Bulk Actions**: Export analytics, view history, schedule rollouts

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Feature Flags Dashboard                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Chat                                           ✓      │
│ Real-time messaging system                          │
│ Category: messaging | Professional | Active         │
│                                                      │
│ Enabled: [Toggle]  Rollout: [||||||||] 100%        │
│                                                      │
│ Usage: 2,850 | Users: 42 | Activation: 65.5% |    │
│ Retention: 78.2%                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ E-Signature                                          │
│ Electronic signature capabilities                    │
│ [Similar layout...]                                  │
└─────────────────────────────────────────────────────┘
```

---

## Gradual Rollout Strategy

### Rollout Phases

```
Phase 1: Beta Testing (10%)
├─ Selected businesses
├─ Close monitoring
└─ Collect feedback

Phase 2: Early Adopters (25%)
├─ Expanded group
├─ Monitor error rates
└─ Gather metrics

Phase 3: Mainstream (50%)
├─ Wider availability
├─ Performance testing
└─ Customer feedback

Phase 4: General Availability (100%)
├─ All eligible businesses
├─ Full support
└─ Analytics review
```

### Rollback Procedure

If error rate exceeds threshold:

```typescript
// Automatic rollback if 5% of requests error
{
  "auto_rollback_on_error": true,
  "error_threshold": 5.0,  // percentage
  "rollback_at": "2026-05-04T15:30:00Z"
}
```

---

## Feature Dependencies

### Example: E-Signature

E-signature requires document storage:

```typescript
// On enable attempt:
if (enableFeature('esign')) {
  // Check dependencies
  const hasDocumentStorage = await checkFeatureEnabled(
    businessId,
    'document_storage'
  );

  if (!hasDocumentStorage) {
    // Auto-enable dependency
    await enableFeature('document_storage');
  }
}
```

### Conflict Detection

Some features cannot be enabled together:

```json
{
  "feature_name": "lite_analytics",
  "conflicts": ["advanced_analytics"]
}
```

---

## Analytics & Metrics

### Tracked Metrics

Per feature, per business, per day:

- **Usage Metrics**
  - Total usage count
  - Unique users
  - Daily active users
  - Feature retention rate

- **Engagement Metrics**
  - Average session duration
  - Feature activation rate
  - Churn impact (did users leave after using this?)

- **Business Impact**
  - Associated revenue
  - Customer satisfaction score (1-5)
  - Churn percentage impact

- **Quality Metrics**
  - Error count
  - Error rate (%)
  - Performance issues

### Analytics Query Examples

```sql
-- Feature adoption over time
SELECT
  feature_name,
  period_date,
  activation_rate,
  unique_users
FROM feature_analytics
WHERE business_id = 'business123'
ORDER BY period_date DESC
LIMIT 30;

-- Top performing features
SELECT
  feature_name,
  SUM(usage_count) as total_usage,
  AVG(activation_rate) as avg_activation,
  AVG(feature_retention_rate) as avg_retention
FROM feature_analytics
WHERE period_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY feature_name
ORDER BY total_usage DESC;

-- Feature revenue impact
SELECT
  feature_name,
  SUM(associated_revenue) as total_revenue,
  AVG(churn_impact_percentage) as churn_impact
FROM feature_analytics
WHERE business_id = 'business123'
GROUP BY feature_name;
```

---

## Implementation Checklist

- [x] Database schema with all tables
- [x] Feature definitions seeded
- [x] React hooks (useFeatureFlag, useFeatureFlags, useFeatureFlagDetails)
- [x] API endpoints (check, enable, disable, rollout, analytics)
- [x] Server middleware (feature gating, logging, rate limiting)
- [x] UI components (FeatureGate, UpgradePrompt, ComingSoon, DisabledButton)
- [x] Admin dashboard (FeatureFlagsAdmin)
- [x] TypeScript types (features.ts)
- [ ] Migration script execution
- [ ] Supabase RLS policies verification
- [ ] Analytics aggregation job (daily batch)
- [ ] Monitoring and alerting setup
- [ ] Documentation and team training

---

## Security Considerations

### Server-Side Verification

Always check feature availability on server:

```typescript
// ✓ GOOD - Server verifies
const isEnabled = await checkFeatureEnabled(businessId, 'chat');
if (!isEnabled) return new Response({ error: 'Feature not enabled' }, 402);
```

```typescript
// ✗ BAD - Client-side only
if (localStorage.getItem('features.chat')) {
  // Don't do this!
}
```

### Rate Limiting

Feature-gated endpoints have rate limiting:

```typescript
import { withRateLimit } from '@/app/middleware/feature-gate';

export const POST = withRateLimit(handler, 100, 60000); // 100/min
```

### Audit Logging

All feature changes are logged:

```sql
INSERT INTO feature_audit_log (
  business_id, feature_name, action,
  old_values, new_values, performed_by, reason
) VALUES (...);
```

---

## Migration & Deployment

### 1. Run Migration

```bash
npm run migrate -- 20260504_feature_flags_system.sql
```

### 2. Seed Feature Definitions

Migration includes seed data for core features.

### 3. Initialize Business Features

For existing businesses, seed with their current plan tier:

```sql
INSERT INTO business_features (
  business_id, feature_name, is_enabled, plan_tier
)
SELECT
  b.id,
  f.feature_name,
  f.min_plan_tier = b.plan_tier,
  b.plan_tier
FROM businesses b
CROSS JOIN feature_definitions f;
```

### 4. Deploy Code

```bash
npm run build
npm run deploy
```

### 5. Monitor

- Watch feature flag checks in logs
- Monitor error rates on feature-gated endpoints
- Verify analytics collection

---

## Troubleshooting

### Feature Not Appearing

1. Check `feature_definitions` table has the feature
2. Verify `is_public = true` for the feature
3. Check feature `status = 'active'`

### Feature Showing as Disabled Despite Enablement

1. Check `business_features` table for override
2. Verify `is_enabled = true`
3. Check rollout percentage and hash calculation
4. Verify plan tier requirements

### Analytics Not Collecting

1. Check `feature_usage_events` table for inserts
2. Verify event logging middleware is active
3. Check daily aggregation job is running

### Performance Issues

1. Add index on `(business_id, feature_name)` to `business_features`
2. Add index on `(feature_name)` to `feature_definitions`
3. Implement caching layer for frequently checked features
4. Archive old analytics data

---

## Future Enhancements

- **A/B Testing**: Split users into test/control groups
- **Feature Experiments**: Track performance of different feature variants
- **Custom Metrics**: Allow businesses to define custom metrics
- **Feature Flags UI**: Self-serve feature management for admins
- **Webhooks**: Notify integrations when features change
- **Feature Scheduling**: Schedule enablement at specific dates/times
- **Regional Rollouts**: Different rollout percentages by geography

---

## Support & Questions

For issues or questions about the feature flag system, please refer to:
- Database schema documentation
- API endpoint specifications
- React hooks documentation
- Admin dashboard guide
