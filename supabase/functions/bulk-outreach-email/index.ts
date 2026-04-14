/**
 * Supabase Edge Function: bulk-outreach-email
 *
 * Sends bulk outreach emails via Resend with rate limiting and batching
 * Ideal for large-scale campaigns with throttling to avoid rate limits
 *
 * Request body:
 *   {
 *     recipients: Array<{ email: string; name?: string }>,
 *     subject: string,
 *     htmlContent: string,
 *     content: string (text fallback),
 *     campaignName: string,
 *     businessId: string,
 *     resendApiKey?: string (from VITE_RESEND_API_KEY),
 *     batchSize?: number (default: 50),
 *     delayMs?: number (default: 500 ms between batches),
 *   }
 *
 * Deploy:
 *   supabase functions deploy bulk-outreach-email
 *
 * No secrets required - API key passed in request body
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Try to get from Deno env (if set as secret), fallback to empty
const RESEND_KEY_ENV = Deno.env.get('RESEND_API_KEY') ?? '';
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

interface OutreachPayload {
  recipients: Recipient[];
  subject: string;
  htmlContent: string;
  content: string;
  campaignName: string;
  businessId: string;
  resendApiKey?: string;
  batchSize?: number;
  delayMs?: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendBatchViaResend(
  batch: Recipient[],
  subject: string,
  htmlContent: string,
  content: string,
  resendApiKey: string,
): Promise<{ accepted: string[]; rejected: string[] }> {
  const RESEND_KEY = resendApiKey || RESEND_KEY_ENV;

  if (!RESEND_KEY) {
    console.log(`[DEV] Would send batch of ${batch.length} emails (no API key provided)`);
    return {
      accepted: batch.map(r => r.email),
      rejected: [],
    };
  }

  const accepted: string[] = [];
  const rejected: string[] = [];

  for (const recipient of batch) {
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
          subject,
          html: htmlContent,
          text: content,
        }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (response.ok && data?.id) {
        accepted.push(recipient.email);
      } else {
        rejected.push(recipient.email);
      }
    } catch {
      rejected.push(recipient.email);
    }
  }

  return { accepted, rejected };
}

async function filterSuppressedEmails(
  recipients: Recipient[],
  supabase: ReturnType<typeof createClient> | null,
): Promise<{ active: Recipient[]; suppressed: string[] }> {
  // If no Supabase client or table doesn't exist, skip filtering
  if (!supabase) {
    return { active: recipients, suppressed: [] };
  }

  try {
    const emails = recipients.map(r => r.email.toLowerCase());

    const { data: suppressedEmails, error } = await supabase
      .from('email_suppressions')
      .select('email')
      .in('email', emails);

    if (error) {
      // Table might not exist yet - skip filtering
      console.log('[bulk-outreach-email] Suppression table not available, skipping filter');
      return { active: recipients, suppressed: [] };
    }

    if (!suppressedEmails || suppressedEmails.length === 0) {
      return { active: recipients, suppressed: [] };
    }

    const suppressedSet = new Set(suppressedEmails.map(s => s.email));
    const active = recipients.filter(r => !suppressedSet.has(r.email.toLowerCase()));
    const suppressed = recipients
      .filter(r => suppressedSet.has(r.email.toLowerCase()))
      .map(r => r.email);

    if (suppressed.length > 0) {
      console.log(
        `[bulk-outreach-email] Filtered out ${suppressed.length} suppressed emails`,
      );
    }

    return { active, suppressed };
  } catch (err) {
    console.log('[bulk-outreach-email] Suppression filter skipped (table may not exist yet)');
    return { active: recipients, suppressed: [] };
  }
}

async function createOutreachCampaign(
  campaignName: string,
  businessId: string,
  totalRecipients: number,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert({
        campaign_name: campaignName,
        business_id: businessId,
        status: 'running',
        total_recipients: totalRecipients,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[bulk-outreach-email] Campaign creation error:', error);
      return null;
    }

    return data?.id;
  } catch {
    return null;
  }
}

async function trackOutreachEmails(
  campaignId: string,
  accepted: string[],
  businessId: string,
  supabase: ReturnType<typeof createClient>,
) {
  if (!campaignId) return;

  try {
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
      console.warn('[bulk-outreach-email] Tracking insert error (table may not have expected columns):', error);
      // Continue even if insert fails
    } else {
      // Update campaign sent count
      await supabase
        .from('outreach_campaigns')
        .update({ sent_count: accepted.length })
        .eq('id', campaignId);
    }
  } catch (trackErr) {
    console.warn('[bulk-outreach-email] Tracking error (continuing):', String(trackErr));
    // Continue even if tracking fails - emails were already sent
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const body: OutreachPayload = await req.json();

    const {
      recipients,
      subject,
      htmlContent,
      content,
      campaignName,
      businessId,
      resendApiKey,
      batchSize = 50,
      delayMs = 500,
    } = body;

    if (!recipients || recipients.length === 0) {
      return json({ ok: false, error: 'recipients required' }, 400);
    }

    if (!subject || !htmlContent || !campaignName || !businessId) {
      return json({
        ok: false,
        error: 'subject, htmlContent, campaignName, and businessId required',
      }, 400);
    }

    console.log(
      `[bulk-outreach-email] Starting bulk send: ${recipients.length} recipients in batches of ${batchSize}`,
    );

    // Initialize database
    const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : null;

    // Filter out suppressed emails (optional - skip if table doesn't exist)
    let activeRecipients = recipients;
    let suppressedCount = 0;
    if (supabase) {
      try {
        const { active, suppressed } = await filterSuppressedEmails(recipients, supabase);
        activeRecipients = active;
        suppressedCount = suppressed.length;

        if (suppressedCount > 0) {
          console.log(
            `[bulk-outreach-email] Suppressed emails filtered: ${suppressedCount}/${recipients.length}`,
          );
        }
      } catch (filterErr) {
        console.log('[bulk-outreach-email] Suppression filter error (skipping):', String(filterErr));
        // Continue with all recipients if filtering fails
        activeRecipients = recipients;
        suppressedCount = 0;
      }
    }

    // Create campaign record
    let campaignId: string | null = null;
    if (supabase) {
      campaignId = await createOutreachCampaign(
        campaignName,
        businessId,
        activeRecipients.length,
        supabase,
      );
    }

    let totalAccepted = 0;
    let totalRejected = 0;
    const allAccepted: string[] = [];

    // Process in batches with delays
    for (let i = 0; i < activeRecipients.length; i += batchSize) {
      const batch = activeRecipients.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(activeRecipients.length / batchSize);

      console.log(`[bulk-outreach-email] Processing batch ${batchNum}/${totalBatches}`);

      const result = await sendBatchViaResend(batch, subject, htmlContent, content, resendApiKey);

      totalAccepted += result.accepted.length;
      totalRejected += result.rejected.length;
      allAccepted.push(...result.accepted);

      // Wait before next batch (except for last batch)
      if (i + batchSize < activeRecipients.length) {
        await sleep(delayMs);
      }
    }

    // Track all sent emails (optional - skip if table doesn't exist or has missing columns)
    if (campaignId && supabase && allAccepted.length > 0) {
      try {
        await trackOutreachEmails(campaignId, allAccepted, businessId, supabase);
      } catch (trackErr) {
        console.log('[bulk-outreach-email] Tracking skipped:', String(trackErr));
        // Continue even if tracking fails - emails were already sent
      }
    }

    console.log(
      `[bulk-outreach-email] Completed: ${totalAccepted} accepted, ${totalRejected} rejected${suppressedCount > 0 ? `, ${suppressedCount} suppressed` : ''}`,
    );

    return json({
      ok: totalRejected === 0,
      campaignId,
      successCount: totalAccepted,
      failedCount: totalRejected,
      suppressedCount,
      accepted: allAccepted,
      message: `Sent to ${totalAccepted} recipients ${totalRejected > 0 ? `(${totalRejected} failed)` : ''}${suppressedCount > 0 ? ` (${suppressedCount} suppressed)` : ''}`,
    });
  } catch (err) {
    console.error('[bulk-outreach-email]', err);
    return json(
      { ok: false, error: String(err) },
      500,
    );
  }
});
