# Feature Flag System - Integration Examples

Complete, production-ready code examples for implementing the feature flag system.

---

## Example 1: Chat Feature Component

### Component with Feature Gating

```typescript
// src/business/pages/ChatPage.tsx
import React, { useState } from 'react';
import { useFeatureFlag } from '@/business/hooks/useFeatureFlag';
import { UpgradePrompt, FeatureGate } from '@/business/components/FeatureGate';
import { useAuth } from '@/business/hooks/useAuth';

export const ChatPage: React.FC = () => {
  const { businessId, user } = useAuth();
  const canChat = useFeatureFlag('chat');
  const [messages, setMessages] = useState<any[]>([]);

  if (!canChat) {
    return (
      <div className="p-8">
        <UpgradePrompt
          feature="Chat"
          currentPlan="starter"
          requiredPlan="professional"
          onUpgrade={() => {
            // Navigate to billing page
            window.location.href = '/billing/upgrade';
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="flex-1 bg-blue-100 rounded-lg p-3">
              <p className="text-sm font-semibold">{msg.sender}</p>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const text = (e.target as HTMLInputElement).value;
              setMessages([...messages, { sender: user?.email, text }]);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Send
        </button>
      </div>
    </div>
  );
};
```

### Server-Side Route Protection

```typescript
// src/app/api/messages/send.ts
import { withFeatureGate, withRateLimit } from '@/app/middleware/feature-gate';

export const POST = withRateLimit(
  withFeatureGate(['chat'])(async (req, context) => {
    const { businessId } = context;
    const { message, recipientId } = await req.json();

    // Feature is already verified by middleware
    // If we reach here, chat is enabled

    try {
      // Send message
      const messageRecord = await supabase
        .from('messages')
        .insert({
          business_id: businessId,
          recipient_id: recipientId,
          text: message,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          message: messageRecord,
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        { status: 500 }
      );
    }
  }),
  100 // Max 100 messages per minute
);
```

---

## Example 2: E-Signature Feature with Dependencies

### Checking Dependencies Before Enable

```typescript
// src/app/api/admin/enable-esign.ts
import { enableWithDependencies } from '@/app/lib/feature-flag-utils';
import { supabase } from '@/app/lib/supabase';

export const POST = async (req: Request) => {
  const { businessId, userId } = await req.json();

  try {
    // This automatically enables document_storage if not already enabled
    const enabledFeatures = await enableWithDependencies(
      businessId,
      'esign',
      userId
    );

    // Log the operation
    console.log(`Enabled features for ${businessId}:`, enabledFeatures);

    // Update business subscription or plan
    await supabase
      .from('businesses')
      .update({
        plan_tier: 'professional',
        features: enabledFeatures,
      })
      .eq('id', businessId);

    return new Response(
      JSON.stringify({
        success: true,
        enabledFeatures,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error enabling e-signature:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to enable e-signature',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
```

### E-Signature Component

```typescript
// src/business/components/DocumentSigner.tsx
import React from 'react';
import { useFeatureFlag, useFeatureFlagDetails } from '@/business/hooks/useFeatureFlag';
import { ComingSoon, UpgradePrompt } from '@/business/components/FeatureGate';

export const DocumentSigner: React.FC<{ documentId: string }> = ({
  documentId,
}) => {
  const details = useFeatureFlagDetails('esign');

  if (details.loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (details.error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded text-red-700">
        Error checking feature availability: {details.error}
      </div>
    );
  }

  if (!details.enabled) {
    // Show coming soon if in rollout, otherwise upgrade prompt
    if (details.rolloutPercentage < 100) {
      return (
        <ComingSoon
          feature="E-Signature"
          rolloutPercentage={details.rolloutPercentage}
          onNotifyMe={() => {
            // Subscribe to notification
            fetch('/api/notifications/subscribe', {
              method: 'POST',
              body: JSON.stringify({ feature: 'esign' }),
            });
          }}
        />
      );
    }

    return (
      <UpgradePrompt
        feature="E-Signature"
        currentPlan="starter"
        requiredPlan="professional"
      />
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sign Document</h1>
      {/* E-signature UI */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p>Document signing interface would go here</p>
      </div>
    </div>
  );
};
```

---

## Example 3: Gradual Rollout of AI Manager

### Admin Route for Scheduling Rollout

```typescript
// src/app/api/admin/schedule-ai-rollout.ts
import { scheduleRollout } from '@/app/lib/feature-flag-utils';

export const POST = async (req: Request) => {
  const { businessId, userId } = await req.json();

  try {
    // Schedule a 4-week gradual rollout
    const now = new Date();

    const phases = [
      {
        percentage: 10,
        scheduledFor: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      },
      {
        percentage: 25,
        scheduledFor: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      },
      {
        percentage: 50,
        scheduledFor: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      },
      {
        percentage: 100,
        scheduledFor: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
      },
    ];

    const rollouts = await scheduleRollout(
      businessId,
      'ai_manager',
      phases,
      userId
    );

    return new Response(
      JSON.stringify({
        success: true,
        rollouts,
        message: 'AI Manager rollout scheduled for 4 weeks',
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error scheduling rollout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to schedule rollout' }),
      { status: 500 }
    );
  }
};
```

### Processing Scheduled Rollouts (Cron Job)

```typescript
// src/jobs/process-feature-rollouts.ts
import { processScheduledRollouts } from '@/app/lib/feature-flag-utils';

/**
 * This runs daily via Vercel Cron or similar scheduler
 * POST /api/cron/process-feature-rollouts
 */
export const POST = async (req: Request) => {
  // Verify cron secret
  const cronSecret = req.headers.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const processed = await processScheduledRollouts();

    console.log(`Processed ${processed} scheduled rollouts`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        timestamp: new Date().toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing rollouts:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process rollouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
```

### Cron Job Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-feature-rollouts",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Display Component

```typescript
// src/business/components/AIManagerWidget.tsx
import React from 'react';
import { useFeatureFlagDetails } from '@/business/hooks/useFeatureFlag';
import { ComingSoon } from '@/business/components/FeatureGate';

export const AIManagerWidget: React.FC = () => {
  const details = useFeatureFlagDetails('ai_manager');

  if (details.loading) {
    return <div className="p-4 text-center">Loading AI Manager...</div>;
  }

  if (!details.enabled) {
    return (
      <ComingSoon
        feature="AI Manager"
        rolloutPercentage={details.rolloutPercentage}
        onNotifyMe={() => {
          fetch('/api/waitlist/join', {
            method: 'POST',
            body: JSON.stringify({ feature: 'ai_manager' }),
          });
        }}
      />
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-purple-900 mb-2">
        AI Pipeline Manager (Beta)
      </h3>
      <p className="text-purple-700 mb-4">
        Powered by Claude AI - automatically categorize and prioritize leads
      </p>
      <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
        Try AI Manager
      </button>
    </div>
  );
};
```

---

## Example 4: Analytics & Admin Dashboard Integration

### Fetch and Display Analytics

```typescript
// src/admin/hooks/useFeatureAnalytics.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface AnalyticsData {
  feature_name: string;
  usage_count: number;
  unique_users: number;
  activation_rate: number;
  daily_active_users: number;
  feature_retention_rate: number;
  associated_revenue: number;
}

export function useFeatureAnalytics(businessId: string) {
  const [analytics, setAnalytics] = useState<Record<string, AnalyticsData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/admin/features/usage?businessId=${businessId}`,
          {
            headers: {
              'X-Business-ID': businessId,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();

        // Group by feature
        const byFeature: Record<string, AnalyticsData> = {};
        data.analytics?.forEach((record: AnalyticsData) => {
          byFeature[record.feature_name] = record;
        });

        setAnalytics(byFeature);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [businessId]);

  return { analytics, loading, error };
}
```

### Analytics Dashboard

```typescript
// src/admin/pages/AnalyticsDashboard.tsx
import React from 'react';
import { useFeatureAnalytics } from '@/admin/hooks/useFeatureAnalytics';
import { useAuth } from '@/app/hooks/useAuth';

export const AnalyticsDashboard: React.FC = () => {
  const { businessId } = useAuth();
  const { analytics, loading, error } = useFeatureAnalytics(businessId);

  if (loading) return <div className="p-8">Loading analytics...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Feature Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(analytics).map(([feature, data]) => (
          <div
            key={feature}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {feature}
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Usage Count</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.usage_count.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.unique_users}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Activation Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${data.activation_rate}%` }}
                    />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {data.activation_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Daily Active Users</p>
                <p className="text-xl font-semibold text-gray-900">
                  {data.daily_active_users}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Retention Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {data.feature_retention_rate?.toFixed(1)}% or N/A
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Associated Revenue</p>
                <p className="text-xl font-semibold text-green-600">
                  ${data.associated_revenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Example 5: Billing Integration

### Enable Features on Plan Upgrade

```typescript
// src/app/api/billing/upgrade.ts
import { enableFeaturesForPlan } from '@/app/lib/feature-flag-utils';
import { supabase } from '@/app/lib/supabase';

export const POST = async (req: Request) => {
  const { businessId, newPlanTier, userId } = await req.json();

  try {
    // Validate plan tier
    if (!['starter', 'professional', 'enterprise'].includes(newPlanTier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan tier' }),
        { status: 400 }
      );
    }

    // Update database
    const { data: business, error: updateError } = await supabase
      .from('businesses')
      .update({
        plan_tier: newPlanTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Enable features for new plan
    await enableFeaturesForPlan(businessId, newPlanTier);

    // Send confirmation email
    await fetch('/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: business.email,
        template: 'upgrade_confirmation',
        data: {
          businessName: business.name,
          newPlan: newPlanTier,
        },
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Upgraded to ${newPlanTier} plan`,
        business,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error upgrading plan:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upgrade plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
};
```

---

## Example 6: Export Analytics as CSV

```typescript
// src/app/api/admin/export-analytics.ts
import { exportAnalyticsAsCSV } from '@/app/lib/feature-flag-utils';

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (!businessId || !startDate || !endDate) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    const csv = await exportAnalyticsAsCSV(
      businessId,
      new Date(startDate),
      new Date(endDate)
    );

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="feature-analytics-${businessId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return new Response('Failed to export analytics', { status: 500 });
  }
};
```

---

## Example 7: Feature Conflicts

### Prevent Conflicting Features

```typescript
// src/app/api/admin/features/validate-conflicts.ts
import { supabase } from '@/app/lib/supabase';

export const POST = async (req: Request) => {
  const { businessId, featureToEnable } = await req.json();

  try {
    // Get feature conflicts
    const { data: feature } = await supabase
      .from('feature_definitions')
      .select('conflicts')
      .eq('feature_name', featureToEnable)
      .single();

    if (!feature?.conflicts || feature.conflicts.length === 0) {
      return new Response(
        JSON.stringify({
          hasConflicts: false,
          conflicts: [],
        }),
        { status: 200 }
      );
    }

    // Check if any conflicting features are enabled
    const { data: enabledFeatures } = await supabase
      .from('business_features')
      .select('feature_name')
      .eq('business_id', businessId)
      .eq('is_enabled', true)
      .in('feature_name', feature.conflicts);

    return new Response(
      JSON.stringify({
        hasConflicts: (enabledFeatures || []).length > 0,
        conflicts: enabledFeatures?.map((f) => f.feature_name) || [],
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return new Response('Failed to check conflicts', { status: 500 });
  }
};
```

---

## Testing Examples

### Unit Test: Feature Check

```typescript
// src/app/lib/__tests__/feature-flag-utils.test.ts
import { testRolloutEligibility } from '@/app/lib/feature-flag-utils';

describe('Rollout Eligibility', () => {
  it('should consistently return same result for same business/feature', () => {
    const result1 = testRolloutEligibility('business-123', 'chat', 50);
    const result2 = testRolloutEligibility('business-123', 'chat', 50);

    expect(result1).toBe(result2);
  });

  it('should distribute fairly across 100 businesses at 50%', () => {
    const eligible = Array.from({ length: 100 }, (_, i) => 
      testRolloutEligibility(`business-${i}`, 'chat', 50)
    ).filter(Boolean).length;

    // Should be approximately 50
    expect(eligible).toBeGreaterThan(40);
    expect(eligible).toBeLessThan(60);
  });

  it('should include all at 100%', () => {
    const allEligible = Array.from({ length: 100 }, (_, i) =>
      testRolloutEligibility(`business-${i}`, 'chat', 100)
    ).every(Boolean);

    expect(allEligible).toBe(true);
  });

  it('should exclude all at 0%', () => {
    const noneEligible = Array.from({ length: 100 }, (_, i) =>
      testRolloutEligibility(`business-${i}`, 'chat', 0)
    ).some(Boolean);

    expect(noneEligible).toBe(false);
  });
});
```

---

These examples provide production-ready code for the most common feature flag use cases.
