# Feature Flag System - Quick Start Guide

## 5-Minute Setup

### Step 1: Run Migration

```bash
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2

# Run the feature flags migration
node run-migration.js supabase/migrations/20260504_feature_flags_system.sql
```

This creates all tables and seeds core features.

### Step 2: Test Feature Check

```typescript
// src/app/api/test-features.ts
import { checkFeatureEnabled } from '@/app/middleware/feature-gate';

export const GET = async (req: Request) => {
  const businessId = 'test-business-123';
  const isEnabled = await checkFeatureEnabled(businessId, 'chat');
  
  return new Response(JSON.stringify({
    feature: 'chat',
    enabled: isEnabled
  }));
};
```

### Step 3: Use in React Component

```typescript
// src/business/pages/ChatPage.tsx
import { useFeatureFlag } from '@/business/hooks/useFeatureFlag';
import { UpgradePrompt } from '@/business/components/FeatureGate';

export const ChatPage: React.FC = () => {
  const canChat = useFeatureFlag('chat');

  if (!canChat) {
    return <UpgradePrompt feature="Chat" currentPlan="starter" requiredPlan="professional" />;
  }

  return <ChatInterface />;
};
```

---

## Common Usage Patterns

### Pattern 1: Simple Feature Toggle

```typescript
const ChatWidget = () => {
  const canChat = useFeatureFlag('chat');
  return canChat ? <Chat /> : null;
};
```

### Pattern 2: Hide/Show UI with Tooltip

```typescript
import { DisabledFeatureButton } from '@/business/components/FeatureGate';

const Toolbar = () => {
  return (
    <DisabledFeatureButton
      feature="esign"
      onClick={() => openESign()}
    >
      Sign Document
    </DisabledFeatureButton>
  );
};
```

### Pattern 3: Upgrade Prompt

```typescript
import { FeatureGate, UpgradePrompt } from '@/business/components/FeatureGate';

const Dashboard = () => {
  return (
    <FeatureGate
      name="advanced_analytics"
      fallback={
        <UpgradePrompt
          feature="Advanced Analytics"
          currentPlan="starter"
          requiredPlan="professional"
          onUpgrade={() => navigateTo('/billing')}
        />
      }
    >
      <AnalyticsPanel />
    </FeatureGate>
  );
};
```

### Pattern 4: Batch Feature Check

```typescript
const Dashboard = () => {
  const features = useFeatureFlags(['chat', 'esign', 'advanced_analytics']);

  return (
    <div className="grid gap-4">
      {features.chat && <ChatWidget />}
      {features.esign && <ESignWidget />}
      {features.advanced_analytics && <AnalyticsWidget />}
    </div>
  );
};
```

### Pattern 5: Server-Side Protection

```typescript
import { withFeatureGate } from '@/app/middleware/feature-gate';

export const POST = withFeatureGate(['chat'])(async (req, context) => {
  const { businessId } = context;
  
  // Only executed if 'chat' feature is enabled
  // Returns 402 (Payment Required) if not enabled

  const message = await req.json();
  // Process chat message...
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

## Enable Feature for Business

### Via Admin Dashboard

```typescript
import { FeatureFlagsAdmin } from '@/admin/components/FeatureFlagsAdmin';

export const AdminFeaturePage = () => {
  return <FeatureFlagsAdmin businessId={adminBusinessId} />;
};
```

Then:
1. Find the feature (e.g., "chat")
2. Click the toggle to enable
3. Adjust rollout percentage if needed
4. Changes are instant

### Via API

```bash
curl -X POST https://api.redeemrocket.com/api/admin/features/chat/enable \
  -H "Content-Type: application/json" \
  -H "X-Business-ID: business123" \
  -d '{
    "businessId": "business123",
    "userId": "admin456",
    "reason": "Upgraded to Professional"
  }'
```

### Via Database

```sql
INSERT INTO business_features (
  business_id, feature_name, is_enabled
) VALUES (
  'business123', 'chat', true
) ON CONFLICT (business_id, feature_name) DO UPDATE SET
  is_enabled = true;
```

---

## Gradual Rollout (A/B Testing)

### Start at 10%

```typescript
// Enable for 10% of users
await fetch('/api/admin/features/ai_manager/rollout', {
  method: 'POST',
  body: JSON.stringify({
    businessId: 'business123',
    rolloutPercentage: 10
  })
});
```

### Monitor

```typescript
// Check analytics
const analytics = await fetch(
  '/api/admin/features/usage?businessId=business123'
);
```

### Expand to 50%

```typescript
// After confirming no issues, roll out to 50%
await fetch('/api/admin/features/ai_manager/rollout', {
  method: 'POST',
  body: JSON.stringify({
    rolloutPercentage: 50
  })
});
```

### Full Rollout

```typescript
// Finally, 100% rollout
await fetch('/api/admin/features/ai_manager/rollout', {
  method: 'POST',
  body: JSON.stringify({
    rolloutPercentage: 100
  })
});
```

---

## Real-World Examples

### Example 1: Chat Feature for Professional Plan

**Setup:**
```sql
-- Feature definition (already seeded)
INSERT INTO feature_definitions (
  feature_name, min_plan_tier, category
) VALUES ('chat', 'professional', 'messaging');
```

**Enable for Business:**
```typescript
// When business upgrades to Professional
await fetch('/api/admin/features/chat/enable', {
  method: 'POST',
  body: JSON.stringify({
    businessId: business.id,
    reason: 'Upgraded to Professional plan'
  })
});
```

**Use in Component:**
```typescript
const ChatButton = () => {
  const canChat = useFeatureFlag('chat');
  
  if (!canChat) {
    return (
      <UpgradePrompt
        feature="Chat"
        currentPlan="starter"
        requiredPlan="professional"
      />
    );
  }
  
  return <button onClick={() => openChat()}>Chat with Team</button>;
};
```

### Example 2: Gradual Rollout of AI Manager (Beta)

**Phase 1: Beta with 10% of Enterprise users**
```typescript
// Step 1: Enable for business
await fetch('/api/admin/features/ai_manager/enable', {
  method: 'POST',
  body: JSON.stringify({
    businessId: 'enterprise-customer-1',
    reason: 'Beta testing AI Manager'
  })
});

// Step 2: Set 10% rollout
await fetch('/api/admin/features/ai_manager/rollout', {
  method: 'POST',
  body: JSON.stringify({
    businessId: 'enterprise-customer-1',
    rolloutPercentage: 10
  })
});
```

**Phase 2: Expand to 25%**
```typescript
await fetch('/api/admin/features/ai_manager/rollout', {
  method: 'POST',
  body: JSON.stringify({
    rolloutPercentage: 25
  })
});
```

**Component:**
```typescript
const PipelineBoard = () => {
  const { enabled, rolloutPercentage } = useFeatureFlagDetails('ai_manager');

  if (!enabled) {
    return <ComingSoon feature="AI Manager" />;
  }

  if (rolloutPercentage < 100) {
    return <ComingSoon feature="AI Manager" rolloutPercentage={rolloutPercentage} />;
  }

  return <AIPoweredPipelineBoard />;
};
```

### Example 3: Feature with Dependencies

**E-Signature requires Document Storage:**

```typescript
// When enabling e-signature, auto-enable document_storage
const enableESign = async (businessId: string) => {
  // Check if document_storage is enabled
  const hasStorage = await checkFeatureEnabled(businessId, 'document_storage');
  
  if (!hasStorage) {
    // Auto-enable dependency
    await fetch('/api/admin/features/document_storage/enable', {
      method: 'POST',
      body: JSON.stringify({
        businessId,
        reason: 'Required by e-signature feature'
      })
    });
  }

  // Now enable e-signature
  await fetch('/api/admin/features/esign/enable', {
    method: 'POST',
    body: JSON.stringify({ businessId })
  });
};
```

---

## Admin Commands

### List All Features for Business

```typescript
const response = await fetch(
  '/api/features?businessId=business123'
);
const { features } = await response.json();

Object.entries(features).forEach(([name, details]) => {
  console.log(`${name}: ${details.is_enabled ? '✓' : '✗'} (${details.rollout_percentage}%)`);
});
```

### Get Audit Log

```sql
SELECT 
  action, 
  performed_by, 
  reason, 
  created_at 
FROM feature_audit_log
WHERE business_id = 'business123' 
  AND feature_name = 'chat'
ORDER BY created_at DESC
LIMIT 20;
```

### View Analytics

```sql
SELECT
  feature_name,
  usage_count,
  unique_users,
  activation_rate,
  daily_active_users,
  period_date
FROM feature_analytics
WHERE business_id = 'business123'
  AND period_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY period_date DESC;
```

---

## Troubleshooting

### "Feature not found" Error

**Check:**
1. Feature name exists in `feature_definitions`
2. Feature status is `active`
3. Check spelling (case-sensitive)

```sql
SELECT * FROM feature_definitions WHERE feature_name = 'chat';
```

### Feature Shows as Disabled Despite Being Enabled

**Check:**
1. Business feature override exists
2. Rollout percentage check
3. Plan tier requirements

```sql
SELECT * FROM business_features 
WHERE business_id = 'business123' 
  AND feature_name = 'chat';
```

### Hook Returns Wrong Value

**Check:**
1. Business ID is set correctly (via useAuth hook)
2. Cache TTL hasn't expired (5 minutes)
3. API endpoint is responding

```typescript
// Force refresh
const refresh = useFeatureFlagRefresh();
await refresh();
```

### Performance Issues

1. **Add caching layer:**
   ```typescript
   const cache = new Map<string, { value: boolean; expires: number }>();
   ```

2. **Use batch endpoint:**
   ```typescript
   const flags = useFeatureFlags(['chat', 'esign', 'analytics']);
   ```

3. **Implement server-side caching:**
   ```typescript
   // Cache feature checks for 1 minute
   const cacheKey = `features:${businessId}`;
   ```

---

## Monitoring

### Health Check

```typescript
export const GET = async () => {
  try {
    // Test feature check
    const isEnabled = await checkFeatureEnabled('test-business', 'chat');
    
    // Test analytics write
    const eventId = await logFeatureAccess(
      'test-business',
      'chat',
      'test-user',
      'accessed'
    );

    return new Response(JSON.stringify({
      status: 'healthy',
      featureCheck: isEnabled,
      analyticsWrite: eventId
    }));
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), { status: 500 });
  }
};
```

### Alerts to Set Up

1. **Feature Enable Rate**: Alert if more than 5 features enabled in 1 hour
2. **Error Rate**: Alert if feature-gated endpoint error rate > 5%
3. **Analytics Gap**: Alert if no events recorded for 1 hour
4. **Rollout Failures**: Alert if rollout status = 'rolled_back'

---

## Next Steps

1. **Test locally** with example businesses
2. **Deploy migration** to production
3. **Seed feature data** for existing businesses
4. **Monitor** analytics collection
5. **Integrate with billing** to auto-enable features on plan upgrade
6. **Set up analytics job** to aggregate daily metrics
7. **Train team** on admin dashboard
8. **Create runbooks** for common operations

---

## Need Help?

See `FEATURE_FLAGS_IMPLEMENTATION.md` for:
- Complete API documentation
- Database schema details
- Advanced usage patterns
- Security considerations
- Deployment guide
