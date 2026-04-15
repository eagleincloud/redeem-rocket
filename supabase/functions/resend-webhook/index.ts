/**
 * supabase/functions/resend-webhook/index.ts
 * Handles Resend email event webhooks and records them in email_tracking.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';

// ── Signature verification (Resend uses svix-style headers) ──────────────────

async function verifySignature(body: string, svixId: string, svixTs: string, svixSig: string): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) {
    console.warn('[resend-webhook] No secret set — skipping verification');
    return true;
  }
  try {
    const secret = RESEND_WEBHOOK_SECRET.startsWith('whsec_')
      ? RESEND_WEBHOOK_SECRET.slice('whsec_'.length)
      : RESEND_WEBHOOK_SECRET;

    const secretBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
    const toSign = `${svixId}.${svixTs}.${body}`;
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

    // svix-signature may contain multiple sigs separated by spaces
    return svixSig.split(' ').some(s => s.startsWith('v1,') && s.slice(3) === computed);
  } catch (e) {
    console.error('[resend-webhook] Signature error:', e);
    return false;
  }
}

// ── Map Resend event types ────────────────────────────────────────────────────

function mapEventType(type: string): string {
  const map: Record<string, string> = {
    'email.sent':      'sent',
    'email.delivered': 'delivered',
    'email.opened':    'opened',
    'email.clicked':   'clicked',
    'email.bounced':   'bounced',
    'email.complained':'complaint',
  };
  return map[type] ?? type;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  try {
    const body      = await req.text();
    const svixId    = req.headers.get('svix-id') ?? '';
    const svixTs    = req.headers.get('svix-timestamp') ?? '';
    const svixSig   = req.headers.get('svix-signature') ?? '';

    const valid = await verifySignature(body, svixId, svixTs, svixSig);
    if (!valid) {
      console.warn('[resend-webhook] Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.log(`[resend-webhook] Event: ${type}`);

    const emailId        = data?.email_id ?? '';
    const recipientRaw   = data?.to ?? '';
    const recipientEmail = Array.isArray(recipientRaw) ? recipientRaw[0] : recipientRaw;
    const eventReason    = data?.reason ?? null;
    const eventType      = mapEventType(type);

    if (!recipientEmail) {
      console.warn('[resend-webhook] Missing recipient — skipping');
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error } = await supabase.from('email_tracking').insert({
      email_id:        emailId || null,
      recipient_email: recipientEmail,
      event_type:      eventType,
      event_reason:    eventReason,
      event_time:      new Date().toISOString(),
      campaign_id:     null,
    });

    if (error) {
      console.error('[resend-webhook] DB insert error:', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    console.log(`[resend-webhook] ✅ Recorded ${eventType} for ${recipientEmail}`);
    return new Response(JSON.stringify({ ok: true, eventType }), { status: 200 });

  } catch (err) {
    console.error('[resend-webhook] Unexpected error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
