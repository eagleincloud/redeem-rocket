# Notification Integrations System

A comprehensive alerting and notification system that enables businesses to receive real-time alerts through Slack, Email, and PagerDuty integrations with custom threshold-based triggering.

## Overview

The notification system provides:
- **Multi-channel delivery**: Slack, Email, PagerDuty, and custom webhooks
- **Smart threshold management**: Define custom alert rules per business
- **Alert queue system**: Reliable processing with retry logic
- **Alert history**: Complete audit trail of all sent alerts
- **Admin dashboard**: Full management UI for integrations and thresholds

## Database Schema

### notification_integrations
Stores configuration for 3rd-party notification services.

```sql
CREATE TABLE notification_integrations (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  integration_type text ('slack', 'email', 'pagerduty', 'webhook'),
  is_active boolean,
  config jsonb,  -- Integration-specific configuration
  created_at timestamptz,
  updated_at timestamptz,
  last_tested_at timestamptz
);
```

### alert_thresholds
Define custom alert rules that trigger based on metric values.

```sql
CREATE TABLE alert_thresholds (
  id uuid PRIMARY KEY,
  business_id text,
  metric_name text,
  threshold_value numeric,
  threshold_operator text ('>', '<', '>=', '<=', '='),
  alert_channels text[],  -- ['slack', 'email', 'pagerduty']
  severity_level text ('critical', 'warning', 'info'),
  is_enabled boolean,
  notification_frequency text ('immediate', 'daily_digest', 'weekly_digest'),
  cooldown_minutes integer,  -- Prevent duplicate alerts
  last_triggered_at timestamptz
);
```

### sent_alerts
Audit log of all alerts sent to track delivery status and history.

```sql
CREATE TABLE sent_alerts (
  id uuid PRIMARY KEY,
  business_id text,
  threshold_id uuid,
  metric_name text,
  metric_value numeric,
  threshold_value numeric,
  alert_message text,
  severity_level text,
  channels_sent jsonb,  -- {slack: {status, response_id}, email: {...}}
  delivery_status text ('pending', 'sent', 'failed', 'acknowledged'),
  error_message text,
  acknowledged_at timestamptz,
  created_at timestamptz
);
```

### alert_templates
Reusable message templates for different metrics and channels.

```sql
CREATE TABLE alert_templates (
  id uuid PRIMARY KEY,
  business_id text,
  template_name text,
  metric_name text,
  subject text,
  slack_message text,
  email_subject text,
  email_body_html text,
  pagerduty_title text,
  pagerduty_description text,
  is_system_template boolean,
  is_active boolean
);
```

### notification_queue
Work queue for processing alerts with retry logic.

```sql
CREATE TABLE notification_queue (
  id uuid PRIMARY KEY,
  business_id text,
  threshold_id uuid,
  alert_data jsonb,
  priority text ('critical', 'high', 'normal', 'low'),
  retry_count integer,
  max_retries integer,
  scheduled_for timestamptz,
  status text ('pending', 'processing', 'completed', 'failed'),
  processing_error text,
  created_at timestamptz
);
```

## Edge Functions

### send-slack-alert
Sends formatted alerts to Slack via webhook.

**Request:**
```json
{
  "businessId": "biz_123",
  "thresholdId": "threshold_uuid",
  "metricName": "revenue_daily",
  "metricValue": 450,
  "thresholdValue": 500,
  "thresholdOperator": "<",
  "severityLevel": "warning",
  "alertMessage": "Daily revenue below threshold",
  "channels": ["slack"]
}
```

**Config Structure (notification_integrations.config):**
```json
{
  "webhook_url": "https://hooks.slack.com/services/...",
  "channel": "#alerts",
  "mention_on_alert": true,
  "username": "Business Alert Bot",
  "icon_emoji": ":robot_face:"
}
```

### send-email-alert
Sends formatted HTML emails via Resend.

**Config Structure:**
```json
{
  "recipients": ["user@example.com", "admin@example.com"],
  "subject_prefix": "Business Alert",
  "html_template": null
}
```

Features:
- Responsive HTML email templates
- Color-coded severity levels
- Metric comparison display
- Call-to-action buttons

### send-pagerduty-alert
Creates incidents or alerts in PagerDuty.

**Config Structure:**
```json
{
  "api_key": "your_api_key",
  "service_id": "service_uuid",
  "escalation_policy_id": "policy_uuid"
}
```

**Modes:**
1. **Incident Mode** (with service_id): Creates full incidents
2. **Event Mode**: Sends alerts via Events API

### process-notification-queue
Orchestrates alert delivery to multiple channels with retry logic.

- Fetches pending alerts from queue
- Routes to appropriate channel handlers
- Tracks delivery status
- Implements exponential backoff for retries
- Respects priority levels

## Admin UI Components

### AlertManagement.tsx
Main dashboard for managing alerts.

**Features:**
- View all integrations and their status
- List configured thresholds
- View alert history with filtering
- Toggle integrations on/off
- Edit/delete thresholds
- Acknowledge alerts

### IntegrationSetup.tsx
Configuration wizard for integrations.

**Supported Integrations:**
1. **Slack** - Webhook URL, channel, mention settings
2. **Email** - Recipients list, subject prefix
3. **PagerDuty** - API key, service ID, escalation policy

## Alert Triggering Flow

1. **Metric Check** - Application detects metric change
2. **Threshold Evaluation** - `check_and_enqueue_alerts()` function evaluates thresholds
3. **Queue Insertion** - Alert added to notification_queue with priority
4. **Queue Processing** - Scheduled job processes pending alerts
5. **Channel Routing** - Alert sent to configured channels
6. **Delivery Tracking** - Status recorded in sent_alerts table
7. **Acknowledgment** - Operator can acknowledge alert completion

## Usage Examples

### Setup Slack Integration

```typescript
await supabase.from('notification_integrations').insert({
  business_id: 'biz_123',
  integration_type: 'slack',
  config: {
    webhook_url: 'https://hooks.slack.com/services/...',
    channel: '#alerts',
    mention_on_alert: true
  }
})
```

### Create Alert Threshold

```typescript
await supabase.from('alert_thresholds').insert({
  business_id: 'biz_123',
  metric_name: 'revenue_daily',
  threshold_value: 500,
  threshold_operator: '<',
  alert_channels: ['slack', 'email'],
  severity_level: 'warning',
  cooldown_minutes: 60
})
```

### Trigger Alert Check

```typescript
const { data } = await supabase.rpc('check_and_enqueue_alerts', {
  p_business_id: 'biz_123',
  p_metric_name: 'revenue_daily',
  p_metric_value: 450
})
```

### Process Queue

```typescript
const response = await fetch(
  '/functions/v1/process-notification-queue',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)
```

## Environment Variables

Required for edge functions:
```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_ANON_KEY=eyJxxx...
RESEND_API_KEY=re_xxxxx  # For email alerts
```

## Default Alert Templates

System comes with pre-configured templates:
- Low Revenue Daily
- High Error Rate
- Low Inventory
- Failed Payments
- High Response Time

Templates support variable substitution:
- `{{metric_name}}`
- `{{metric_value}}`
- `{{threshold_value}}`
- `{{threshold_operator}}`
- `{{product_name}}`
- `{{timeframe}}`

## Security

- Row-level security (RLS) on all tables
- Businesses can only manage their own integrations
- API keys stored encrypted in config JSONB
- Service role required for queue processing
- All alert events audited with timestamps

## Monitoring

Track alert effectiveness:
- View delivery success rate per channel
- Monitor alert frequency per threshold
- Identify unacknowledged critical alerts
- Analyze response times per severity level

## Scaling Considerations

- Queue-based processing allows async handling
- Retry logic with exponential backoff
- Priority-based alert processing
- Cooldown periods prevent alert storms
- Batch digest options for non-critical alerts
