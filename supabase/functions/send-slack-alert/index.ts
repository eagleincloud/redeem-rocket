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

interface SlackConfig {
  webhook_url?: string
  channel?: string
  mention_on_alert?: boolean
  username?: string
  icon_emoji?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function getSeverityEmoji(level: string): string {
  switch (level) {
    case 'critical':
      return '🔴'
    case 'warning':
      return '🟠'
    case 'info':
      return '🔵'
    default:
      return '⚪'
  }
}

function buildSlackMessage(payload: AlertPayload, config: SlackConfig): Record<string, unknown> {
  const emoji = getSeverityEmoji(payload.severityLevel)

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Alert: ${payload.metricName}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Severity:*\n${payload.severityLevel.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Metric:*\n${payload.metricName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Current Value:*\n${payload.metricValue}`,
        },
        {
          type: 'mrkdwn',
          text: `*Threshold:*\n${payload.thresholdValue} (${payload.thresholdOperator})`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${payload.alertMessage}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Alert triggered at ${new Date().toISOString()}_`,
        },
      ],
    },
  ]

  return {
    channel: config.channel,
    username: config.username || 'Business Alert Bot',
    icon_emoji: config.icon_emoji || ':robot_face:',
    blocks,
  }
}

async function sendSlackNotification(
  webhookUrl: string,
  message: Record<string, unknown>
): Promise<{ success: boolean; responseId?: string; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (response.ok) {
      const responseText = await response.text()
      return {
        success: true,
        responseId: `slack_${Date.now()}`,
      }
    } else {
      const errorText = await response.text()
      return {
        success: false,
        error: `Slack API returned ${response.status}: ${errorText}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to send to Slack: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: AlertPayload = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Slack integration config for this business
    const { data: integrations, error: intError } = await supabase
      .from('notification_integrations')
      .select('*')
      .eq('business_id', payload.businessId)
      .eq('integration_type', 'slack')
      .eq('is_active', true)
      .single()

    if (intError || !integrations) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active Slack integration found for this business',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const slackConfig = integrations.config as SlackConfig

    if (!slackConfig.webhook_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Slack webhook URL not configured',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build and send Slack message
    const slackMessage = buildSlackMessage(payload, slackConfig)
    const slackResult = await sendSlackNotification(slackConfig.webhook_url, slackMessage)

    // Record the alert in sent_alerts table
    if (slackResult.success) {
      await supabase.from('sent_alerts').insert({
        business_id: payload.businessId,
        threshold_id: payload.thresholdId,
        metric_name: payload.metricName,
        metric_value: payload.metricValue,
        threshold_value: payload.thresholdValue,
        alert_message: payload.alertMessage,
        severity_level: payload.severityLevel,
        channels_sent: {
          slack: {
            status: 'sent',
            response_id: slackResult.responseId,
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
          slack: {
            status: 'failed',
            error: slackResult.error,
          },
        },
        delivery_status: 'failed',
        error_message: slackResult.error,
      })
    }

    return new Response(
      JSON.stringify({
        success: slackResult.success,
        message: slackResult.success ? 'Alert sent to Slack' : `Failed to send to Slack: ${slackResult.error}`,
        responseId: slackResult.responseId,
      }),
      {
        status: slackResult.success ? 200 : 400,
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
