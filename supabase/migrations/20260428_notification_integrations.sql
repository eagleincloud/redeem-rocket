-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Notification Integrations - Slack, Email, PagerDuty
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. notification_integrations (stores API keys and config for 3rd party services)
CREATE TABLE IF NOT EXISTS notification_integrations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           text        NOT NULL,
  integration_type      text        NOT NULL CHECK (integration_type IN ('slack', 'email', 'pagerduty', 'webhook')),
  is_active             boolean     NOT NULL DEFAULT true,
  config                jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            text,
  last_tested_at        timestamptz,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_integrations_business_id
  ON notification_integrations (business_id);

CREATE INDEX IF NOT EXISTS idx_notif_integrations_type
  ON notification_integrations (integration_type);

CREATE INDEX IF NOT EXISTS idx_notif_integrations_active
  ON notification_integrations (is_active);

ALTER TABLE notification_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_manage_own_integrations"
  ON notification_integrations
  FOR ALL
  USING (auth.uid()::text = business_id OR EXISTS (
    SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()::text
  ));

-- ── 2. alert_thresholds (custom alert rules per business)
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           text        NOT NULL,
  metric_name           text        NOT NULL,
  threshold_value       numeric     NOT NULL,
  threshold_operator    text        NOT NULL CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=')),
  alert_channels        text[]      NOT NULL DEFAULT ARRAY['email'],
  severity_level        text        NOT NULL DEFAULT 'warning' CHECK (severity_level IN ('critical', 'warning', 'info')),
  is_enabled            boolean     NOT NULL DEFAULT true,
  notification_frequency text       NOT NULL DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily_digest', 'weekly_digest')),
  cooldown_minutes      integer     NOT NULL DEFAULT 60,
  last_triggered_at     timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            text,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_business_id
  ON alert_thresholds (business_id);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_metric
  ON alert_thresholds (metric_name);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_enabled
  ON alert_thresholds (is_enabled);

ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_manage_own_thresholds"
  ON alert_thresholds
  FOR ALL
  USING (auth.uid()::text = business_id OR EXISTS (
    SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()::text
  ));

-- ── 3. sent_alerts (audit log of alerts sent)
CREATE TABLE IF NOT EXISTS sent_alerts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           text        NOT NULL,
  threshold_id          uuid        NOT NULL,
  metric_name           text        NOT NULL,
  metric_value          numeric,
  threshold_value       numeric,
  alert_message         text        NOT NULL,
  severity_level        text        NOT NULL,
  channels_sent         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  delivery_status       text        NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'acknowledged')),
  error_message         text,
  acknowledged_at       timestamptz,
  acknowledged_by       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (threshold_id) REFERENCES alert_thresholds(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sent_alerts_business_id
  ON sent_alerts (business_id);

CREATE INDEX IF NOT EXISTS idx_sent_alerts_threshold_id
  ON sent_alerts (threshold_id);

CREATE INDEX IF NOT EXISTS idx_sent_alerts_created_at
  ON sent_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sent_alerts_delivery_status
  ON sent_alerts (delivery_status);

ALTER TABLE sent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_view_own_alerts"
  ON sent_alerts
  FOR SELECT
  USING (auth.uid()::text = business_id OR EXISTS (
    SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()::text
  ));

-- ── 4. alert_templates (reusable message templates for alerts)
CREATE TABLE IF NOT EXISTS alert_templates (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           text,
  template_name         text        NOT NULL,
  metric_name           text        NOT NULL,
  subject               text,
  slack_message         text,
  email_subject         text,
  email_body_html       text,
  pagerduty_title       text,
  pagerduty_description text,
  is_system_template    boolean     NOT NULL DEFAULT false,
  is_active             boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_templates_business_id
  ON alert_templates (business_id);

CREATE INDEX IF NOT EXISTS idx_alert_templates_metric
  ON alert_templates (metric_name);

ALTER TABLE alert_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_alert_templates"
  ON alert_templates
  FOR SELECT
  USING (is_system_template = true OR business_id IS NULL OR auth.uid()::text = business_id OR EXISTS (
    SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()::text
  ));

CREATE POLICY "manage_own_templates"
  ON alert_templates
  FOR INSERT WITH CHECK (business_id IS NOT NULL AND auth.uid()::text = business_id);

CREATE POLICY "update_own_templates"
  ON alert_templates
  FOR UPDATE USING (business_id IS NOT NULL AND auth.uid()::text = business_id);

-- ── 5. notification_queue (for processing alerts in background)
CREATE TABLE IF NOT EXISTS notification_queue (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           text        NOT NULL,
  threshold_id          uuid        NOT NULL,
  alert_data            jsonb       NOT NULL,
  priority              text        NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  retry_count           integer     NOT NULL DEFAULT 0,
  max_retries           integer     NOT NULL DEFAULT 3,
  scheduled_for         timestamptz,
  processed_at          timestamptz,
  processing_error      text,
  status                text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (threshold_id) REFERENCES alert_thresholds(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_queue_business_id
  ON notification_queue (business_id);

CREATE INDEX IF NOT EXISTS idx_notif_queue_status
  ON notification_queue (status);

CREATE INDEX IF NOT EXISTS idx_notif_queue_priority
  ON notification_queue (priority);

CREATE INDEX IF NOT EXISTS idx_notif_queue_scheduled_for
  ON notification_queue (scheduled_for) WHERE status = 'pending';

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_manage_queue"
  ON notification_queue
  FOR ALL
  USING (true);

-- ── 6. Function: detect and enqueue alerts based on metrics
CREATE OR REPLACE FUNCTION check_and_enqueue_alerts(
  p_business_id TEXT,
  p_metric_name TEXT,
  p_metric_value NUMERIC
)
RETURNS TABLE (alert_id UUID, threshold_id UUID) AS $$
DECLARE
  v_threshold alert_thresholds;
  v_alert_id UUID;
BEGIN
  FOR v_threshold IN
    SELECT * FROM alert_thresholds
    WHERE business_id = p_business_id
      AND metric_name = p_metric_name
      AND is_enabled = true
      AND (last_triggered_at IS NULL OR
           NOW() > last_triggered_at + (cooldown_minutes || ' minutes')::INTERVAL)
  LOOP
    IF (v_threshold.threshold_operator = '>' AND p_metric_value > v_threshold.threshold_value) OR
       (v_threshold.threshold_operator = '<' AND p_metric_value < v_threshold.threshold_value) OR
       (v_threshold.threshold_operator = '>=' AND p_metric_value >= v_threshold.threshold_value) OR
       (v_threshold.threshold_operator = '<=' AND p_metric_value <= v_threshold.threshold_value) OR
       (v_threshold.threshold_operator = '=' AND p_metric_value = v_threshold.threshold_value)
    THEN
      INSERT INTO notification_queue (
        business_id, threshold_id, alert_data, priority, scheduled_for
      ) VALUES (
        p_business_id,
        v_threshold.id,
        jsonb_build_object(
          'metric_name', p_metric_name,
          'metric_value', p_metric_value,
          'threshold_value', v_threshold.threshold_value,
          'threshold_operator', v_threshold.threshold_operator,
          'severity_level', v_threshold.severity_level,
          'channels', v_threshold.alert_channels
        ),
        v_threshold.severity_level,
        CASE WHEN v_threshold.notification_frequency = 'immediate' THEN NOW()
             ELSE NOW() + INTERVAL '5 minutes' END
      ) RETURNING id INTO v_alert_id;

      UPDATE alert_thresholds SET last_triggered_at = NOW() WHERE id = v_threshold.id;

      alert_id := v_alert_id;
      threshold_id := v_threshold.id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Insert default system alert templates
INSERT INTO alert_templates (
  template_name, metric_name, subject,
  slack_message, email_subject, email_body_html,
  pagerduty_title, pagerduty_description,
  is_system_template, is_active
) VALUES
(
  'Low Revenue Daily',
  'revenue_daily',
  'Alert: Daily Revenue Below Threshold',
  '⚠️ Alert: Daily revenue has dropped below ${{threshold_value}}. Current: ${{metric_value}}',
  'Daily Revenue Alert',
  '<p>Daily revenue has fallen below your threshold of ${{threshold_value}}.</p><p>Current revenue: ${{metric_value}}</p>',
  'Revenue Alert: Daily Revenue Low',
  'Daily revenue is ${{metric_value}}, below the threshold of ${{threshold_value}}',
  true,
  true
),
(
  'High Error Rate',
  'error_rate',
  'Alert: Error Rate Exceeds Threshold',
  '🚨 Alert: Error rate is {{metric_value}}%, exceeding threshold of {{threshold_value}}%',
  'System Error Rate Alert',
  '<p>Error rate has exceeded your threshold.</p><p>Current: {{metric_value}}%</p><p>Threshold: {{threshold_value}}%</p>',
  'Critical: Error Rate High',
  'Error rate is {{metric_value}}%, above threshold of {{threshold_value}}%',
  true,
  true
),
(
  'Low Inventory',
  'inventory_low',
  'Alert: Inventory Level Critical',
  '📦 Alert: Inventory {{product_name}} is at {{metric_value}} units (threshold: {{threshold_value}})',
  'Low Inventory Alert',
  '<p>Inventory level is critically low.</p><p>Product: {{product_name}}</p><p>Current: {{metric_value}} units</p><p>Threshold: {{threshold_value}} units</p>',
  'Inventory Alert: Stock Low',
  'Inventory for {{product_name}} is {{metric_value}} units, below {{threshold_value}}',
  true,
  true
),
(
  'Failed Payments',
  'failed_payments',
  'Alert: Payment Failures Detected',
  '💳 Alert: {{metric_value}} payment failures detected in the last {{timeframe}}',
  'Payment Failure Alert',
  '<p>Multiple payment failures have been detected.</p><p>Count: {{metric_value}} failures</p><p>Period: {{timeframe}}</p>',
  'Payment Alert: Failures Detected',
  '{{metric_value}} payment failures detected - immediate action may be required',
  true,
  true
),
(
  'High Response Time',
  'response_time',
  'Alert: API Response Time Degraded',
  '⏱️ Alert: API response time is {{metric_value}}ms (threshold: {{threshold_value}}ms)',
  'Response Time Alert',
  '<p>API response time has degraded.</p><p>Current: {{metric_value}}ms</p><p>Threshold: {{threshold_value}}ms</p>',
  'Performance Alert: Response Time High',
  'API response time {{metric_value}}ms exceeds threshold of {{threshold_value}}ms',
  true,
  true
);

CREATE INDEX IF NOT EXISTS idx_alert_templates_system
  ON alert_templates (is_system_template, is_active);
