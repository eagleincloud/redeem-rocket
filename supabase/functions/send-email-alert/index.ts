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

interface EmailConfig {
  recipients?: string[]
  subject_prefix?: string
  html_template?: string
}

interface ResendPayload {
  from: string
  to: string | string[]
  subject: string
  html: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function buildEmailContent(
  payload: AlertPayload,
  config: EmailConfig
): { subject: string; html: string } {
  const severityColor = {
    critical: '#DC2626',
    warning: '#F97316',
    info: '#3B82F6',
  }

  const subjectPrefix = config.subject_prefix || 'Business Alert'
  const subject = `${subjectPrefix} - ${payload.metricName}: ${payload.severityLevel.toUpperCase()}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 20px; background-color: ${severityColor[payload.severityLevel]}; color: white; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
    .metric-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { font-weight: 600; color: #475569; }
    .metric-value { font-weight: 700; color: #1e293b; }
    .alert-message { padding: 16px; margin: 16px 0; background-color: #fff; border-left: 4px solid ${severityColor[payload.severityLevel]}; border-radius: 4px; }
    .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
    .severity-badge { display: inline-block; padding: 4px 12px; background-color: ${severityColor[payload.severityLevel]}; color: white; border-radius: 4px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>System Alert</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px;">
        <span class="severity-badge">${payload.severityLevel.toUpperCase()}</span>
      </p>
    </div>
    <div class="content">
      <div class="metric-row">
        <span class="metric-label">Metric:</span>
        <span class="metric-value">${payload.metricName}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Current Value:</span>
        <span class="metric-value">${payload.metricValue}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Threshold:</span>
        <span class="metric-value">${payload.thresholdValue} (${payload.thresholdOperator})</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Triggered:</span>
        <span class="metric-value">${new Date().toLocaleString()}</span>
      </div>

      <div class="alert-message">
        <p style="margin: 0; color: #1e293b; line-height: 1.6;">
          ${payload.alertMessage}
        </p>
      </div>

      <p style="margin-top: 20px; color: #64748b; font-size: 13px; line-height: 1.6;">
        This alert was automatically generated based on your configured threshold. Please review your dashboard for more details and take any necessary action.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Business OS Alert System | Do not reply to this email</p>
      <p style="margin: 8px 0 0 0;">${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
  `

  return { subject, html }
}

async function sendEmailViaResend(
  to: string | string[],
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY not configured',
    }
  }

  try {
    const payload: ResendPayload = {
      from: 'alerts@redeemrocket.in',
      to,
      subject,
      html,
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        messageId: data.id,
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: `Resend API error: ${errorData.message || response.statusText}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
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

    // Get email integration config
    const { data: integrations, error: intError } = await supabase
      .from('notification_integrations')
      .select('*')
      .eq('business_id', payload.businessId)
      .eq('integration_type', 'email')
      .eq('is_active', true)
      .single()

    if (intError || !integrations) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active email integration found',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailConfig = integrations.config as EmailConfig

    if (!emailConfig.recipients || emailConfig.recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No email recipients configured',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build email content
    const { subject, html } = buildEmailContent(payload, emailConfig)

    // Send email
    const emailResult = await sendEmailViaResend(emailConfig.recipients, subject, html)

    // Record in sent_alerts
    if (emailResult.success) {
      await supabase.from('sent_alerts').insert({
        business_id: payload.businessId,
        threshold_id: payload.thresholdId,
        metric_name: payload.metricName,
        metric_value: payload.metricValue,
        threshold_value: payload.thresholdValue,
        alert_message: payload.alertMessage,
        severity_level: payload.severityLevel,
        channels_sent: {
          email: {
            status: 'sent',
            message_id: emailResult.messageId,
            recipients: emailConfig.recipients,
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
          email: {
            status: 'failed',
            error: emailResult.error,
          },
        },
        delivery_status: 'failed',
        error_message: emailResult.error,
      })
    }

    return new Response(
      JSON.stringify({
        success: emailResult.success,
        message: emailResult.success
          ? `Alert email sent to ${emailConfig.recipients.join(', ')}`
          : `Failed to send email: ${emailResult.error}`,
        messageId: emailResult.messageId,
      }),
      {
        status: emailResult.success ? 200 : 400,
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
