/**
 * Supabase Edge Function: send-campaign-email
 *
 * Sends bulk campaign emails via Resend with optional tracking
 *
 * Request body:
 *   {
 *     recipients: Array<{ email: string; name?: string; properties?: Record<string, string> }>,
 *     subject: string,
 *     htmlContent: string,
 *     content: string (fallback text),
 *     campaignId?: string,
 *     businessId: string,
 *     replyTo?: string,
 *     trackOpens?: boolean,
 *     trackClicks?: boolean,
 *   }
 *
 * Deploy:
 *   supabase functions deploy send-campaign-email
 *
 * Required secrets:
 *   RESEND_API_KEY    — from resend.com
 *   RESEND_FROM       — verified sender (e.g., "App <noreply@yourdomain.com>")
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Redeem Rocket <noreply@redeemrocket.in>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface Recipient {
  email: string;
  name?: string;
  properties?: Record<string, string>;
}

interface EmailPayload {
  recipients: Recipient[];
  subject: string;
  htmlContent: string;
  content: string;
  campaignId?: string;
  businessId: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

async function sendViaResend(
  recipients: Recipient[],
  subject: string,
  htmlContent: string,
  content: string,
  replyTo?: string,
): Promise<{
  batchId?: string;
  accepted: string[];
  rejected: string[];
  errors: Array<{ email: string; error: string }>;
}> {
  if (!RESEND_KEY) {
    console.log(`[DEV] Would send campaign email to ${recipients.length} recipients (RESEND_API_KEY not set)`);
    return {
      accepted: recipients.map(r => r.email),
      rejected: [],
      errors: [],
    };
  }

  const accepted: string[] = [];
  const rejected: string[] = [];
  const errors: Array<{ email: string; error: string }> = [];
  let batchId: string | undefined;

  // Send to all recipients
  for (const recipient of recipients) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [recipient.email],
          replyTo: replyTo || RESEND_FROM,
          subject,
          html: htmlContent,
          text: content,
          tags: [
            { name: 'campaign_email', value: 'true' },
            ...(recipient.properties
              ? Object.entries(recipient.properties).map(([k, v]) => ({
                  name: k,
                  value: v,
                }))
              : []),
          ],
        }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        rejected.push(recipient.email);
        errors.push({
          email: recipient.email,
          error: String(data?.message || 'Failed to send'),
        });
      } else {
        accepted.push(recipient.email);
        if (!batchId && data?.id) {
          batchId = String(data.id);
        }
      }
    } catch (err) {
      rejected.push(recipient.email);
      errors.push({
        email: recipient.email,
        error: String(err),
      });
    }
  }

  return { batchId, accepted, rejected, errors };
}

async function trackCampaignEmails(
  campaignId: string,
  accepted: string[],
  businessId: string,
) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const records = accepted.map(email => ({
    campaign_id: campaignId,
    recipient_email: email,
    business_id: businessId,
    status: 'sent',
    sent_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('outreach_email_tracking')
    .insert(records);

  if (error) {
    console.error('[send-campaign-email] Tracking error:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const body: EmailPayload = await req.json();

    const { recipients, subject, htmlContent, content, campaignId, businessId, replyTo, trackOpens, trackClicks } = body;

    if (!recipients || recipients.length === 0) {
      return json({ ok: false, error: 'recipients required' }, 400);
    }

    if (!subject) {
      return json({ ok: false, error: 'subject required' }, 400);
    }

    if (!businessId) {
      return json({ ok: false, error: 'businessId required' }, 400);
    }

    console.log(`[send-campaign-email] Sending to ${recipients.length} recipients`);

    const result = await sendViaResend(recipients, subject, htmlContent, content, replyTo);

    // Track sent emails if campaignId provided
    if (campaignId && result.accepted.length > 0) {
      await trackCampaignEmails(campaignId, result.accepted, businessId);
    }

    return json({
      ok: result.rejected.length === 0,
      batchId: result.batchId,
      successCount: result.accepted.length,
      failedCount: result.rejected.length,
      accepted: result.accepted,
      rejected: result.rejected,
      errors: result.errors,
    });
  } catch (err) {
    console.error('[send-campaign-email]', err);
    return json(
      { ok: false, error: String(err) },
      500,
    );
  }
});
