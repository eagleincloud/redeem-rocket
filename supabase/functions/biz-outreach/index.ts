// Supabase Edge Function: biz-outreach
// Sends WhatsApp (or SMS fallback) claim invitations to enriched scraped businesses.
// Generates a unique claim_token per business and includes a one-click claim URL.
//
// Deploy: supabase functions deploy biz-outreach
// Secrets:
//   MSG91_API_KEY
//   MSG91_WA_NUMBER         — Connected WhatsApp Business number (with country code, e.g. 919876543210)
//   APP_BASE_URL            — e.g. https://your-app.com  (no trailing slash)
//   SUPABASE_URL            (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//
// Invoke: POST /functions/v1/biz-outreach
// Body (optional): { "batch": 20, "channel": "whatsapp" | "sms" }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MSG91_KEY    = Deno.env.get('MSG91_API_KEY') ?? '';
const MSG91_WA_NUM = Deno.env.get('MSG91_WA_NUMBER') ?? '';
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Normalize phone to 10-digit Indian number string. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return null;
}

/** Send WhatsApp message via MSG91 Outbound API. */
async function sendWhatsApp(to: string, bizName: string, claimUrl: string): Promise<boolean> {
  if (!MSG91_KEY || !MSG91_WA_NUM) return false;
  const message =
    `Hi! Your business *${bizName}* is listed on Redeem Rocket 🚀\n` +
    `Customers near you are already discovering your profile!\n\n` +
    `Claim your FREE listing to:\n` +
    `✅ Add your own offers & discounts\n` +
    `✅ Get notified when customers visit\n` +
    `✅ Accept orders directly\n\n` +
    `👉 Claim here (free): ${claimUrl}\n\n` +
    `— Redeem Rocket Team`;

  try {
    const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method: 'POST',
      headers: {
        authkey: MSG91_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integrated_number: MSG91_WA_NUM,
        content_type: 'text',
        payload: {
          to: `91${to}`,
          type: 'text',
          text: { body: message },
        },
      }),
    });
    const data = await res.json();
    return data?.type === 'success' || res.status === 200;
  } catch {
    return false;
  }
}

/** Fallback: Send SMS via MSG91. */
async function sendSms(to: string, bizName: string, claimUrl: string): Promise<boolean> {
  if (!MSG91_KEY) return false;
  const message =
    `Your business ${bizName} is listed on Redeem Rocket! ` +
    `Claim your free profile to add offers: ${claimUrl}`;

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: MSG91_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: 'RDMRKT',
        short_url: '0',
        mobiles: `91${to}`,
        message,
      }),
    });
    const data = await res.json();
    return data?.type === 'success' || res.status === 200;
  } catch {
    return false;
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json({ error: 'Supabase env vars not set' }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let batchSize = 20;
  let preferredChannel: 'whatsapp' | 'sms' = 'whatsapp';
  try {
    const body = await req.json();
    if (typeof body?.batch === 'number') batchSize = Math.min(body.batch, 50);
    if (body?.channel === 'sms') preferredChannel = 'sms';
  } catch { /* use defaults */ }

  // Fetch enriched records that haven't been contacted yet
  const { data: records, error: fetchErr } = await supabase
    .from('scraped_businesses')
    .select('id, name, address, phone, category')
    .eq('enrichment_status', 'enriched')
    .is('outreach_sent_at', null)
    .not('phone', 'is', null)
    .limit(batchSize);

  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!records || records.length === 0) {
    return json({ sent: 0, failed: 0, message: 'No enriched records awaiting outreach' });
  }

  let sent = 0;
  let failed = 0;

  for (const rec of records) {
    const phone = normalizePhone(rec.phone ?? '');
    if (!phone) { failed++; continue; }

    // Generate unique claim token
    const claimToken = crypto.randomUUID();

    // Build claim URL pointing to the claim handler edge function
    const supabaseProjectUrl = SUPABASE_URL.replace('/rest/v1', '').replace('https://', '');
    const fnBase = `https://${supabaseProjectUrl}/functions/v1`;
    const claimUrl = APP_BASE_URL
      ? `${APP_BASE_URL}/business.html#/onboarding?claim=${claimToken}`
      : `${fnBase}/biz-claim-handler?token=${claimToken}`;

    // Store the token first (before sending, so it's valid when clicked)
    const { error: tokenErr } = await supabase
      .from('scraped_businesses')
      .update({ claim_token: claimToken })
      .eq('id', rec.id);

    if (tokenErr) { failed++; continue; }

    // Try WhatsApp, fall back to SMS
    let success = false;
    let usedChannel = preferredChannel;

    if (preferredChannel === 'whatsapp') {
      success = await sendWhatsApp(phone, rec.name ?? 'Your Business', claimUrl);
      if (!success) {
        usedChannel = 'sms';
        success = await sendSms(phone, rec.name ?? 'Your Business', claimUrl);
      }
    } else {
      success = await sendSms(phone, rec.name ?? 'Your Business', claimUrl);
    }

    const messageBody =
      `Hi! Your business *${rec.name}* is listed on Redeem Rocket 🚀 ` +
      `Claim your free listing: ${claimUrl}`;

    // Log the outreach attempt
    await supabase.from('onboarding_outreach_log').insert({
      scraped_biz_id: rec.id,
      channel: usedChannel,
      message_body: messageBody,
      status: success ? 'sent' : 'failed',
    });

    if (success) {
      await supabase
        .from('scraped_businesses')
        .update({
          outreach_sent_at: new Date().toISOString(),
          outreach_channel: usedChannel,
          enrichment_status: 'outreach_sent',
        })
        .eq('id', rec.id);
      sent++;
    } else {
      failed++;
    }
  }

  return json({ sent, failed, total: records.length });
});
