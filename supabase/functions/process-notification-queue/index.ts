import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface QueuedAlert {
  id: string
  business_id: string
  threshold_id: string
  alert_data: Record<string, unknown>
  priority: string
  status: string
  retry_count: number
  max_retries: number
}

async function sendToChannel(
  channel: string,
  payload: Record<string, unknown>,
  businessId: string
): Promise<boolean> {
  const functionsUrl = Deno.env.get('SUPABASE_URL') || ''
  const functionName = `send-${channel}-alert`

  try {
    const response = await fetch(
      `${functionsUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          ...payload,
          businessId,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error(`Failed to send to ${channel}:`, error)
    return false
  }
}

async function processQueuedAlert(
  supabase: ReturnType<typeof createClient>,
  alert: QueuedAlert
): Promise<void> {
  const channels = (alert.alert_data.channels as string[]) || ['email']

  let successCount = 0

  // Send to each configured channel
  for (const channel of channels) {
    const sent = await sendToChannel(channel, alert.alert_data, alert.business_id)
    if (sent) {
      successCount++
    }
  }

  // Update queue status
  if (successCount === channels.length) {
    await supabase
      .from('notification_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', alert.id)
  } else if (alert.retry_count < alert.max_retries) {
    // Retry later
    await supabase
      .from('notification_queue')
      .update({
        retry_count: alert.retry_count + 1,
        scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        processing_error: `${successCount}/${channels.length} channels succeeded`,
      })
      .eq('id', alert.id)
  } else {
    // Max retries exceeded
    await supabase
      .from('notification_queue')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString(),
        processing_error: 'Max retries exceeded',
      })
      .eq('id', alert.id)
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending notifications
    const { data: queuedAlerts, error: queryError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10)

    if (queryError) {
      throw new Error(`Failed to fetch queue: ${queryError.message}`)
    }

    if (!queuedAlerts || queuedAlerts.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No pending alerts to process',
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Process each alert
    const results = []
    for (const alert of queuedAlerts) {
      try {
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', alert.id)

        await processQueuedAlert(supabase, alert as QueuedAlert)
        results.push({ id: alert.id, status: 'success' })
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error)
        results.push({
          id: alert.id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Queue processing completed',
        processed: results.length,
        results,
      }),
      {
        status: 200,
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
