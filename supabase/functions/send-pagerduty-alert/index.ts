import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface AlertPayload {
  businessId: string
  thresholdId: string
  metricName: string
  metricValue: number
  thresholdValue: number
  thresholdOperator: string
  severityLevel: 'critical' | 'warning' | 'info'
  alertMessage: string
  channels: string[]
}

interface PagerDutyConfig {
  api_key?: string
  service_id?: string
  escalation_policy_id?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function mapSeverityToPagerDuty(level: string): string {
  switch (level) {
    case 'critical':
      return 'critical'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'warning'
  }
}

async function createPagerDutyIncident(
  apiKey: string,
  serviceId: string,
  payload: AlertPayload
): Promise<{ success: boolean; incidentId?: string; incidentUrl?: string; error?: string }> {
  try {
    const incidentPayload = {
      incidents: [
        {
          type: 'incident',
          title: `Alert: ${payload.metricName} - ${payload.severityLevel.toUpperCase()}`,
          service: {
            id: serviceId,
            type: 'service_reference',
          },
          urgency: payload.severityLevel === 'critical' ? 'high' : 'low',
          body: {
            type: 'incident_body',
            details: `Metric: ${payload.metricName}\nCurrent Value: ${payload.metricValue}\nThreshold: ${payload.thresholdValue} (${payload.thresholdOperator})\n\n${payload.alertMessage}`,
          },
        },
      ],
    }

    const response = await fetch('https://api.pagerduty.com/incidents', {
      method: 'POST',
      headers: {
        Authorization: `Token token=${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.pagerduty+json;version=2',
      },
      body: JSON.stringify(incidentPayload),
    })

    if (response.ok) {
      const data = await response.json()
      const incident = data.incidents[0]
      return {
        success: true,
        incidentId: incident.id,
        incidentUrl: incident.html_url,
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: `PagerDuty API error: ${errorData.error?.message || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create PagerDuty incident: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

async function createPagerDutyAlert(
  apiKey: string,
  payload: AlertPayload
): Promise<{ success: boolean; alertId?: string; error?: string }> {
  try {
    const alertPayload = {
      routing_key: apiKey,
      event_action: 'trigger',
      dedup_key: `alert_${payload.thresholdId}_${Date.now()}`,
      payload: {
        summary: `Alert: ${payload.metricName} - ${payload.severityLevel.toUpperCase()}`,
        severity: mapSeverityToPagerDuty(payload.severityLevel),
        source: 'Business OS Alert System',
        component: payload.metricName,
        custom_details: {
          metric_name: payload.metricName,
          current_value: payload.metricValue,
          threshold_value: payload.thresholdValue,
          threshold_operator: payload.thresholdOperator,
          alert_message: payload.alertMessage,
          timestamp: new Date().toISOString(),
        },
      },
      links: [
        {
          href: 'https://redeemrocket.in/admin/alerts',
          text: 'View in Dashboard',
        },
      ],
    }

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertPayload),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        alertId: data.dedup_key,
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: `PagerDuty Events API error: ${errorData.error?.message || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to send to PagerDuty: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: AlertPayload = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get PagerDuty integration config
    const { data: integrations, error: intError } = await supabase
      .from('notification_integrations')
      .select('*')
      .eq('business_id', payload.businessId)
      .eq('integration_type', 'pagerduty')
      .eq('is_active', true)
      .single()

    if (intError || !integrations) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active PagerDuty integration found',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const pagerDutyConfig = integrations.config as PagerDutyConfig

    if (!pagerDutyConfig.api_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PagerDuty API key not configured',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send to PagerDuty
    let pdResult
    if (pagerDutyConfig.service_id) {
      // Create incident if service_id is configured
      pdResult = await createPagerDutyIncident(
        pagerDutyConfig.api_key,
        pagerDutyConfig.service_id,
        payload
      )
    } else {
      // Otherwise send as alert event
      pdResult = await createPagerDutyAlert(pagerDutyConfig.api_key, payload)
    }

    // Record in sent_alerts
    if (pdResult.success) {
      await supabase.from('sent_alerts').insert({
        business_id: payload.businessId,
        threshold_id: payload.thresholdId,
        metric_name: payload.metricName,
        metric_value: payload.metricValue,
        threshold_value: payload.thresholdValue,
        alert_message: payload.alertMessage,
        severity_level: payload.severityLevel,
        channels_sent: {
          pagerduty: {
            status: 'sent',
            incident_id: pdResult.incidentId,
            incident_url: pdResult.incidentUrl,
          },
        },
        delivery_status: 'sent',
      })
    } else {
      await supabase.from('sent_alerts').insert({
        business_id: payload.businessId,
        threshold_id: payload.thresholdId,
        metric_name: payload.metricName,
        metric_value: payload.metricValue,
        threshold_value: payload.thresholdValue,
        alert_message: payload.alertMessage,
        severity_level: payload.severityLevel,
        channels_sent: {
          pagerduty: {
            status: 'failed',
            error: pdResult.error,
          },
        },
        delivery_status: 'failed',
        error_message: pdResult.error,
      })
    }

    return new Response(
      JSON.stringify({
        success: pdResult.success,
        message: pdResult.success
          ? 'Alert created in PagerDuty'
          : `Failed to send to PagerDuty: ${pdResult.error}`,
        incidentId: pdResult.incidentId,
        incidentUrl: pdResult.incidentUrl,
      }),
      {
        status: pdResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
