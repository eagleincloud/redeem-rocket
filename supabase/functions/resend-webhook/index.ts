/**
 * supabase/functions/resend-webhook/index.ts
 *
 * Handles Resend API webhooks for email events:
 * - email.sent: Successfully sent
 * - email.delivered: Successfully delivered
 * - email.complained: Marked as spam/complaint
 * - email.bounced: Hard/soft bounce
 * - email.opened: Email was opened (tracking pixel)
 * - email.clicked: Email link was clicked (tracking)
 *
 * Setup:
 * 1. Go to Resend Dashboard → Webhooks
 * 2. Add webhook URL: https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/resend-webhook
 * 3. Select events: email.sent, email.delivered, email.complained, email.bounced, email.opened, email.clicked
 * 4. Copy webhook signing secret and set as Supabase secret: supabase secrets set RESEND_WEBHOOK_SECRET=...
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { json } from 'https://deno.land/std@0.195.0/http/mod.ts';
import { hmacSha256 } from 'https://deno.land/std@0.195.0/crypto/mod.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResendWebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string;
    subject?: string;
    reason?: string;
    timestamp?: string;
  };
}

interface EmailEventRecord {
  id?: string;
  email_id: string;
  recipient_email: string;
  event_type: string;
  event_reason?: string;
  event_time: string;
  created_at?: string;
  updated_at?: string;
}

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';

// ── Webhook Verification ───────────────────────────────────────────────────────

async function verifyWebhookSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) {
    console.warn('[resend-webhook] No webhook secret configured - skipping verification');
    return true; // Allow in development
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const secret = encoder.encode(RESEND_WEBHOOK_SECRET);

    const hashBuffer = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      data,
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const expectedSignature = `sha256=${hashHex}`;

    return signature === expectedSignature;
  } catch (err) {
    console.error('[resend-webhook] Signature verification error:', err);
    return false;
  }
}

// ── Event Processing ───────────────────────────────────────────────────────────

async function processEvent(event: ResendWebhookEvent, supabase: any): Promise<void> {
  const { type, data } = event;
  const emailId = data.email_id || '';
  const recipientEmail = data.to || '';

  if (!emailId || !recipientEmail) {
    console.warn('[resend-webhook] Skipping event - missing email_id or recipient');
    return;
  }

  let eventType = '';
  let eventReason = '';

  switch (type) {
    case 'email.sent':
      eventType = 'sent';
      break;
    case 'email.delivered':
      eventType = 'delivered';
      break;
    case 'email.opened':
      eventType = 'open';
      break;
    case 'email.clicked':
      eventType = 'click';
      break;
    case 'email.bounced':
      eventType = 'bounce';
      eventReason = data.reason || 'unknown';
      break;
    case 'email.complained':
      eventType = 'complaint';
      eventReason = data.reason || 'spam_report';
      break;
    default:
      console.log(`[resend-webhook] Unknown event type: ${type}`);
      return;
  }

  try {
    // Try to insert into email_tracking table
    const { error } = await supabase.from('email_tracking').insert({
      email_id: emailId,
      recipient_email: recipientEmail,
      event_type: eventType,
      event_reason: eventReason || null,
      event_time: new Date().toISOString(),
    });

    if (error) {
      console.error(`[resend-webhook] Failed to insert ${eventType} event:`, error);
      // If table doesn't exist, log but continue
      if (error.code === 'PGRST116') {
        console.warn('[resend-webhook] email_tracking table does not exist - create it first');
      }
    } else {
      console.log(`[resend-webhook] Recorded ${eventType} event for ${recipientEmail}`);
    }
  } catch (err) {
    console.error('[resend-webhook] Error processing event:', err);
  }
}

// ── Main Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only POST requests
  if (req.method !== 'POST') {
    return json({ ok: true }, 200);
  }

  try {
    const signature = req.headers.get('x-resend-signature') || '';
    const body = await req.text();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.warn('[resend-webhook] Invalid signature - rejecting webhook');
      return json({ error: 'Invalid signature' }, 401);
    }

    const event: ResendWebhookEvent = JSON.parse(body);

    console.log(`[resend-webhook] Received event: ${event.type} at ${event.created_at}`);

    // Initialize Supabase client
    const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : null;

    if (!supabase) {
      console.error('[resend-webhook] Supabase not configured');
      return json({ error: 'Supabase not configured' }, 500);
    }

    // Process the event
    await processEvent(event, supabase);

    return json({
      ok: true,
      eventType: event.type,
      message: `Processed ${event.type} event`,
    }, 200);
  } catch (error) {
    console.error('[resend-webhook] Unexpected error:', error);
    return json({
      ok: false,
      error: String(error),
    }, 500);
  }
});
