# Integrating Alerts with Business Metrics

How to trigger alerts from your business application metrics.

## Architecture

```
Application Metric Event
        ↓
Database Update / API Call
        ↓
check_and_enqueue_alerts() Function
        ↓
notification_queue Table
        ↓
process-notification-queue Edge Function
        ↓
Channel-Specific Edge Functions (Slack/Email/PagerDuty)
        ↓
External Services & sent_alerts Audit Table
```

## Method 1: Direct Database RPC Call

When a metric is calculated or updated:

```typescript
async function checkMetricsAndAlert(businessId: string, metrics: Record<string, number>) {
  for (const [metricName, value] of Object.entries(metrics)) {
    // Call Supabase function to check thresholds
    const { data, error } = await supabase.rpc('check_and_enqueue_alerts', {
      p_business_id: businessId,
      p_metric_name: metricName,
      p_metric_value: value
    })

    if (error) {
      console.error(`Alert check failed for ${metricName}:`, error)
    } else {
      console.log(`Checked ${metricName}: ${data?.length || 0} alerts queued`)
    }
  }
}

// Usage after calculating daily revenue
const dailyRevenue = calculateDailyRevenue(businessId)
await checkMetricsAndAlert(businessId, {
  'revenue_daily': dailyRevenue
})
```

## Method 2: From Backend API

If metrics are calculated server-side:

```typescript
// backend/routes/metrics.ts
import { Router } from 'express'
import { supabase } from '../config/supabase'

const router = Router()

router.post('/metrics/daily-summary', async (req, res) => {
  const { businessId, metrics } = req.body

  // Store metrics
  await supabase.from('business_metrics').insert({
    business_id: businessId,
    metric_date: new Date().toISOString().split('T')[0],
    metrics: metrics,
    created_at: new Date().toISOString()
  })

  // Check for alert thresholds
  for (const [name, value] of Object.entries(metrics)) {
    const { data, error } = await supabase.rpc('check_and_enqueue_alerts', {
      p_business_id: businessId,
      p_metric_name: name,
      p_metric_value: Number(value)
    })

    if (!error && data?.length > 0) {
      // Alerts queued for processing
      console.log(`Queued ${data.length} alerts for ${name}`)
    }
  }

  res.json({ success: true, alerts_queued: data?.length || 0 })
})

export default router
```

## Method 3: Periodic Metric Calculation

Set up a scheduled job to calculate metrics and check alerts:

```typescript
// scripts/hourly-metrics.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function calculateAndAlertMetrics() {
  console.log('Starting hourly metrics calculation...')

  // Get all active businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('is_active', true)

  for (const business of businesses || []) {
    try {
      // Calculate metrics for this business
      const metrics = {
        revenue_daily: await calculateDailyRevenue(business.id),
        leads_daily: await calculateDailyLeads(business.id),
        error_rate: await calculateErrorRate(business.id),
        response_time: await calculateResponseTime(business.id)
      }

      // Check thresholds for each metric
      for (const [name, value] of Object.entries(metrics)) {
        await supabase.rpc('check_and_enqueue_alerts', {
          p_business_id: business.id,
          p_metric_name: name,
          p_metric_value: value
        })
      }

      console.log(`Processed metrics for ${business.id}`)
    } catch (error) {
      console.error(`Error processing metrics for ${business.id}:`, error)
    }
  }

  console.log('Hourly metrics calculation complete')
}

// Run function
calculateAndAlertMetrics().then(() => {
  console.log('Done')
  process.exit(0)
})
```

## Method 4: Real-time Triggers via Database Hooks

Create a trigger that automatically checks alerts when metrics change:

```sql
-- Create metrics table for tracking
CREATE TABLE business_metrics_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  calculated_at timestamptz DEFAULT now(),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_metrics_business_name 
  ON business_metrics_hourly (business_id, metric_name);

-- Create trigger to check alerts
CREATE OR REPLACE FUNCTION trigger_alert_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Call alert checking function
  PERFORM check_and_enqueue_alerts(
    NEW.business_id,
    NEW.metric_name,
    NEW.metric_value
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metric_alert_check
  AFTER INSERT OR UPDATE ON business_metrics_hourly
  FOR EACH ROW
  EXECUTE FUNCTION trigger_alert_check();
```

## Method 5: Client-side Alert Triggers

From React components in business app:

```typescript
// business-app/frontend/src/hooks/useMetricAlerts.ts
import { useCallback } from 'react'
import { supabase } from '../config/supabase'

export function useMetricAlerts(businessId: string) {
  const checkMetric = useCallback(
    async (metricName: string, metricValue: number) => {
      const { data, error } = await supabase.rpc('check_and_enqueue_alerts', {
        p_business_id: businessId,
        p_metric_name: metricName,
        p_metric_value: metricValue
      })

      if (error) {
        console.error('Alert check failed:', error)
        return false
      }

      if (data && data.length > 0) {
        console.log(`${data.length} alerts triggered for ${metricName}`)
      }

      return true
    },
    [businessId]
  )

  return { checkMetric }
}

// Usage in component
function DashboardPage() {
  const { businessId } = useAuth()
  const { checkMetric } = useMetricAlerts(businessId)

  const handleRevenueUpdate = async (revenue: number) => {
    await checkMetric('revenue_daily', revenue)
  }

  return (
    <div>
      {/* Dashboard content */}
    </div>
  )
}
```

## Processing the Queue

Schedule queue processing to run periodically:

```typescript
// scripts/process-alerts.ts
import fetch from 'node-fetch'

const SUPABASE_URL = process.env.SUPABASE_URL!
const ANON_KEY = process.env.SUPABASE_ANON_KEY!

async function processAlertQueue() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/process-notification-queue`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const result = await response.json()
  console.log(`Alert queue processed: ${result.processed} alerts`)
  return result
}

// Run every 5 minutes via cron or GitHub Actions
setInterval(processAlertQueue, 5 * 60 * 1000)
```

## GitHub Actions Scheduled Job

Schedule alert processing as CI/CD job:

```yaml
# .github/workflows/process-alerts.yml
name: Process Alert Queue

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  process-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Process notification queue
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SUPABASE_URL }}/functions/v1/process-notification-queue"
```

## Example: Revenue Alert Integration

Complete example integrating revenue metrics with alerts:

```typescript
// business-app/frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from '../hooks/useAuth'

export function Dashboard() {
  const { businessId } = useAuth()
  const [dailyRevenue, setDailyRevenue] = useState<number>(0)

  useEffect(() => {
    async function loadAndCheckRevenue() {
      // Calculate daily revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('amount')
        .eq('business_id', businessId)
        .gte('created_at', new Date().toISOString().split('T')[0])

      const revenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0
      setDailyRevenue(revenue)

      // Check if thresholds are breached
      const { data: alertsTriggered } = await supabase.rpc(
        'check_and_enqueue_alerts',
        {
          p_business_id: businessId,
          p_metric_name: 'revenue_daily',
          p_metric_value: revenue
        }
      )

      if (alertsTriggered && alertsTriggered.length > 0) {
        // Show notification to user
        console.log(`${alertsTriggered.length} alerts triggered!`)
        // Maybe show a toast notification
      }
    }

    // Load every 5 minutes
    loadAndCheckRevenue()
    const interval = setInterval(loadAndCheckRevenue, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [businessId])

  return (
    <div className="p-6">
      <h1>Daily Revenue: ${dailyRevenue.toFixed(2)}</h1>
      {/* Additional dashboard content */}
    </div>
  )
}
```

## Best Practices

1. **Batch metric checks**: Group multiple metrics in one call
2. **Use appropriate intervals**: Don't check too frequently (use cooldown)
3. **Handle errors gracefully**: Alerts shouldn't break the application
4. **Log alert activity**: Track when checks are performed
5. **Monitor the queue**: Use dashboard to see pending alerts
6. **Test thresholds**: Set test thresholds before going live
7. **Use correct metric names**: Keep consistent naming conventions
8. **Set reasonable cooldowns**: Prevent alert fatigue with appropriate delays

## Debugging

Monitor alert flow:

```sql
-- Check queued alerts
SELECT id, business_id, status, created_at 
FROM notification_queue 
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Check recent deliveries
SELECT business_id, metric_name, delivery_status, created_at 
FROM sent_alerts 
ORDER BY created_at DESC 
LIMIT 20;

-- Check threshold activity
SELECT metric_name, last_triggered_at 
FROM alert_thresholds 
WHERE is_enabled = true;
```
