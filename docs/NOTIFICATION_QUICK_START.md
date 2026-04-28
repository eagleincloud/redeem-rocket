# Notification Integrations - Quick Start Guide

## Installation & Setup

### 1. Apply Database Migration

The migration `20260428_notification_integrations.sql` creates all necessary tables:
- `notification_integrations` - Store integration configs
- `alert_thresholds` - Define alert rules
- `sent_alerts` - Audit trail
- `alert_templates` - Message templates
- `notification_queue` - Processing queue

```bash
# The migration will be applied automatically during deployment
# Or manually in Supabase Studio
```

### 2. Deploy Edge Functions

Deploy the four edge functions:
```bash
supabase functions deploy send-slack-alert
supabase functions deploy send-email-alert
supabase functions deploy send-pagerduty-alert
supabase functions deploy process-notification-queue
```

### 3. Set Environment Variables

In Supabase project settings, set:
```
RESEND_API_KEY=re_xxxxx  # For email alerts
```

## Quick Configuration

### Add Slack Integration

1. Go to Admin Dashboard > Integration Setup
2. Click "Slack" integration card
3. Get your webhook URL from Slack (Slack App > Incoming Webhooks)
4. Enter webhook URL and desired channel
5. Click "Save Slack Integration"

### Add Email Integration

1. Go to Admin Dashboard > Integration Setup
2. Click "Email" integration card
3. Enter comma-separated email addresses for alerts
4. Set subject prefix (optional)
5. Click "Save Email Integration"

### Add PagerDuty Integration

1. Go to Admin Dashboard > Integration Setup
2. Click "PagerDuty" integration card
3. Get API key from PagerDuty account settings
4. Enter service ID (optional - for incident creation)
5. Click "Save PagerDuty Integration"

## Creating Alert Rules

### Via Admin Dashboard

1. Go to Admin Dashboard > Alert Management > Thresholds
2. Click "Create New Threshold"
3. Select metric to monitor
4. Set threshold value and operator
5. Choose severity level (critical/warning/info)
6. Select notification channels
7. Set cooldown period (minutes between alerts)
8. Click "Create"

### Via Supabase

```typescript
const { data } = await supabase
  .from('alert_thresholds')
  .insert({
    business_id: 'biz_123',
    metric_name: 'revenue_daily',
    threshold_value: 500,
    threshold_operator: '<',
    alert_channels: ['slack', 'email'],
    severity_level: 'warning',
    cooldown_minutes: 60,
    is_enabled: true
  })
```

## Testing Alerts

### Test Slack Alert

```typescript
const response = await fetch(
  'https://your-domain.com/functions/v1/send-slack-alert',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessId: 'biz_123',
      thresholdId: 'threshold_uuid',
      metricName: 'revenue_daily',
      metricValue: 450,
      thresholdValue: 500,
      thresholdOperator: '<',
      severityLevel: 'warning',
      alertMessage: 'Daily revenue is below threshold',
      channels: ['slack']
    })
  }
)
```

### Trigger Threshold Check

```typescript
const { data } = await supabase.rpc('check_and_enqueue_alerts', {
  p_business_id: 'biz_123',
  p_metric_name: 'revenue_daily',
  p_metric_value: 450
})
// Returns array of triggered alerts
```

### Process Queue

```typescript
const response = await fetch(
  'https://your-domain.com/functions/v1/process-notification-queue',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)
const result = await response.json()
console.log(`Processed ${result.processed} alerts`)
```

## Monitoring

### View Alert History

1. Go to Admin Dashboard > Alert Management > History
2. See all sent alerts with delivery status
3. Filter by business, severity, or date range
4. Acknowledge critical alerts

### Check Integration Status

1. Go to Admin Dashboard > Alert Management > Integrations
2. See all configured integrations
3. View creation date and last test date
4. Enable/disable integrations as needed

### Database Queries

```sql
-- Recent alerts
SELECT * FROM sent_alerts 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed deliveries
SELECT * FROM sent_alerts 
WHERE delivery_status = 'failed' 
ORDER BY created_at DESC;

-- Active thresholds
SELECT * FROM alert_thresholds 
WHERE is_enabled = true;

-- Queue status
SELECT status, COUNT(*) as count 
FROM notification_queue 
GROUP BY status;
```

## Metric Name Convention

Suggested metric names for consistency:
- `revenue_daily` - Daily revenue
- `revenue_weekly` - Weekly revenue
- `leads_daily` - Daily new leads
- `leads_weekly` - Weekly new leads
- `inventory_low` - Low inventory alert
- `failed_payments` - Payment failures
- `error_rate` - System error percentage
- `response_time` - API response time (ms)
- `storage_usage` - Storage usage percentage
- `concurrent_users` - Active user count

## Notification Templates

System provides pre-configured templates for:
- Low Revenue Daily
- High Error Rate
- Low Inventory
- Failed Payments
- High Response Time

To create custom templates:

```typescript
const { data } = await supabase
  .from('alert_templates')
  .insert({
    business_id: 'biz_123',
    template_name: 'Custom Alert',
    metric_name: 'custom_metric',
    slack_message: 'Alert: {{metric_name}} is {{metric_value}}',
    email_subject: 'Alert: {{metric_name}}',
    email_body_html: '<p>{{metric_name}} reached {{metric_value}}</p>',
    pagerduty_title: 'Alert: {{metric_name}}',
    is_system_template: false,
    is_active: true
  })
```

## Cooldown & Throttling

- **Cooldown Period**: Time between alerts for the same threshold
  - Default: 60 minutes
  - Prevents alert spam for the same issue
  - Resets after each alert trigger

- **Notification Frequency**: When to send alerts
  - `immediate`: Send immediately
  - `daily_digest`: Aggregate into daily email
  - `weekly_digest`: Aggregate into weekly email

## Priority Levels

Alert priority in queue:
- `critical`: Processed first, short retry window
- `high`: Processed second
- `normal`: Processed third
- `low`: Processed last, longer retry window

## Troubleshooting

### Alert Not Triggering

1. Check if threshold is enabled: `is_enabled = true`
2. Verify metric name matches threshold config
3. Check cooldown period hasn't muted alerts
4. Review queue status in `notification_queue` table
5. Check edge function logs in Supabase

### Email Not Arriving

1. Verify RESEND_API_KEY is set correctly
2. Check email recipients in integration config
3. Review sent_alerts table for delivery_status
4. Check SPAM folder
5. Verify domain is whitelisted in Resend

### Slack Message Not Appearing

1. Verify webhook URL is correct and active
2. Check Slack app has message posting permissions
3. Verify channel name is correct (starts with #)
4. Review error_message in sent_alerts table
5. Test webhook directly in curl

### PagerDuty Not Creating Incidents

1. Verify API key has proper permissions
2. Confirm service_id exists and is active
3. Check API rate limits
4. Review error_message in sent_alerts table
5. Test API endpoint directly

## Performance Considerations

- Queue processing: Run every 5-10 minutes via scheduled job
- Batch process up to 10 alerts per run
- Implement exponential backoff for retries
- Max 3 retries per alert before failure
- Archive old alerts (>90 days) to maintain performance

## Security Best Practices

- Store API keys in environment variables, not in code
- Use HTTPS for all webhook communications
- Implement IP whitelisting if available
- Rotate API keys periodically
- Audit access to alert configurations
- Use service role key only for edge functions
- All tables protected by RLS policies
