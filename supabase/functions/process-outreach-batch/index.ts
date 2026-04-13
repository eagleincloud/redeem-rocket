/**
 * process-outreach-batch
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggered by pg_cron every 1 minute.
 * Picks the next pending outreach_batch whose scheduled_at <= now(),
 * sends messages via the appropriate channel (email / whatsapp / sms),
 * and updates recipient + campaign counters.
 *
 * Deploy: supabase functions deploy process-outreach-batch
 *
 * pg_cron setup (run once in SQL editor):
 *   SELECT cron.schedule(
 *     'process-outreach-batch',
 *     '* * * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://<ref>.supabase.co/functions/v1/process-outreach-batch',
 *       headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb,
 *       body := '{}'::jsonb
 *     )$$
 *   );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MSG91_KEY     = Deno.env.get('MSG91_API_KEY') ?? '';
const RESEND_KEY    = Deno.env.get('RESEND_API_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

serve(async () => {
  try {
    // 1. Claim the next pending batch (atomic UPDATE + RETURNING)
    const now = new Date().toISOString();
    const { data: batch, error: bErr } = await supabase
      .from('outreach_batches')
      .update({ status: 'running', started_at: now })
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .select()
      .single();

    if (bErr || !batch) {
      return new Response(JSON.stringify({ ok: true, message: 'No pending batches' }), { status: 200 });
    }

    // 2. Load campaign + sender
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('*, sender_identities(*)')
      .eq('id', batch.campaign_id)
      .single();

    if (!campaign) throw new Error('Campaign not found');

    // 3. Load recipients for this batch
    const { data: recipients } = await supabase
      .from('outreach_recipients')
      .select('*')
      .eq('campaign_id', batch.campaign_id)
      .eq('batch_number', batch.batch_number)
      .eq('status', 'queued');

    if (!recipients || recipients.length === 0) {
      await supabase.from('outreach_batches').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', batch.id);
      return new Response(JSON.stringify({ ok: true, message: 'Batch empty — marked complete' }), { status: 200 });
    }

    // 4. Load unsubscribes for this business
    const { data: unsubs } = await supabase
      .from('outreach_unsubscribes')
      .select('email, phone, channel')
      .eq('business_id', campaign.business_id);

    const unsubEmails = new Set((unsubs ?? []).filter((u: { channel: string }) => u.channel === 'email' || u.channel === 'all').map((u: { email: string }) => u.email?.toLowerCase()).filter(Boolean));
    const unsubPhones = new Set((unsubs ?? []).filter((u: { channel: string }) => u.channel !== 'email').map((u: { phone: string }) => u.phone).filter(Boolean));

    // 5. Send messages
    const results: { id: string; status: string; error?: string }[] = [];

    for (const rcpt of recipients) {
      // Skip unsubscribed
      if (rcpt.email && unsubEmails.has(rcpt.email.toLowerCase())) {
        results.push({ id: rcpt.id, status: 'skipped' });
        continue;
      }
      if (rcpt.phone && unsubPhones.has(rcpt.phone)) {
        results.push({ id: rcpt.id, status: 'skipped' });
        continue;
      }

      // Substitute variables in body
      const body = (campaign.body ?? '')
        .replace(/\{name\}/g, rcpt.name ?? 'there')
        .replace(/\{company\}/g, rcpt.name ?? '')
        .replace(/\{phone\}/g, rcpt.phone ?? '')
        .replace(/\{email\}/g, rcpt.email ?? '')
        .replace(/\{business\}/g, campaign.business_id ?? '');

      try {
        let ok = false;

        if (campaign.channel === 'email' || campaign.channel === 'multi') {
          ok = await sendEmail(rcpt.email, rcpt.name, campaign.subject ?? 'Message from us', body, campaign);
        } else if (campaign.channel === 'whatsapp') {
          ok = await sendWhatsApp(rcpt.phone, body, campaign.sender_identities?.wa_number);
        } else if (campaign.channel === 'sms') {
          ok = await sendSMS(rcpt.phone, body, campaign.sender_identities?.sms_sender_id);
        }

        results.push({ id: rcpt.id, status: ok ? 'sent' : 'failed' });
      } catch (e) {
        results.push({ id: rcpt.id, status: 'failed', error: String(e) });
      }
    }

    // 6. Bulk-update recipient statuses
    const sentNow   = new Date().toISOString();
    const sentIds   = results.filter(r => r.status === 'sent').map(r => r.id);
    const failedIds = results.filter(r => r.status === 'failed').map(r => r.id);
    const skippedIds = results.filter(r => r.status === 'skipped').map(r => r.id);

    if (sentIds.length)    await supabase.from('outreach_recipients').update({ status: 'sent', sent_at: sentNow }).in('id', sentIds);
    if (failedIds.length)  await supabase.from('outreach_recipients').update({ status: 'failed' }).in('id', failedIds);
    if (skippedIds.length) await supabase.from('outreach_recipients').update({ status: 'skipped' }).in('id', skippedIds);

    // 7. Update batch
    await supabase.from('outreach_batches').update({
      status:       'completed',
      sent_count:   sentIds.length,
      failed_count: failedIds.length,
      completed_at: sentNow,
    }).eq('id', batch.id);

    // 8. Update campaign counters
    await supabase.rpc('increment_campaign_counters', {
      p_campaign_id: campaign.id,
      p_sent:        sentIds.length,
      p_failed:      failedIds.length,
    }).catch(() => {
      // Fallback: manual increment
      supabase.from('outreach_campaigns').update({
        sent_count:  campaign.sent_count + sentIds.length,
        failed_count: campaign.failed_count + failedIds.length,
      }).eq('id', campaign.id);
    });

    // 9. Check if all batches done → mark campaign completed
    const { count: pendingBatches } = await supabase
      .from('outreach_batches')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .neq('status', 'completed');

    if ((pendingBatches ?? 0) === 0) {
      await supabase.from('outreach_campaigns').update({
        status: 'completed', completed_at: sentNow,
      }).eq('id', campaign.id);
    }

    return new Response(JSON.stringify({
      ok: true, batchId: batch.id,
      sent: sentIds.length, failed: failedIds.length, skipped: skippedIds.length,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[process-outreach-batch]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});

// ── Channel senders ───────────────────────────────────────────────────────────

async function sendEmail(
  to: string | undefined, name: string | undefined,
  subject: string, body: string, campaign: Record<string, unknown>,
): Promise<boolean> {
  if (!to) return false;
  const sender = (campaign.sender_identities as Record<string, unknown>) ?? {};
  const fromEmail = (sender.from_email as string) ?? 'noreply@redeemrocket.in';
  const fromName  = (sender.display_name as string) ?? 'Redeem Rocket';

  // Try Resend API first (simplest for bulk)
  if (RESEND_KEY) {
    const unsubUrl = `${SUPABASE_URL}/functions/v1/outreach-unsubscribe?biz=${campaign.business_id}&email=${encodeURIComponent(to)}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [to],
        subject,
        text:    body,
        html:    `<div style="font-family:sans-serif">${body.replace(/\n/g, '<br>')}<br><br><a href="${unsubUrl}" style="color:#aaa;font-size:11px">Unsubscribe</a></div>`,
      }),
    });
    return res.ok;
  }
  return false;
}

async function sendWhatsApp(phone: string | undefined, body: string, waNumber?: string): Promise<boolean> {
  if (!phone || !MSG91_KEY) return false;
  // Use sender identity's wa_number first, fall back to env var
  const number = waNumber ?? Deno.env.get('MSG91_WA_NUMBER') ?? '';
  if (!number) {
    console.warn('[sendWhatsApp] No WhatsApp number configured on sender identity');
    return false;
  }
  const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
    method: 'POST',
    headers: { Authkey: MSG91_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      integrated_number: number,
      content_type: 'text',
      payload: { to: phone.replace(/\D/g, ''), type: 'text', text: { body } },
    }),
  });
  return res.ok;
}

async function sendSMS(phone: string | undefined, body: string, senderId?: string): Promise<boolean> {
  if (!phone || !MSG91_KEY) return false;
  const normalised = phone.replace(/\D/g, '');
  const res = await fetch(`https://api.msg91.com/api/v5/flow/`, {
    method: 'POST',
    headers: { Authkey: MSG91_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: senderId ?? Deno.env.get('MSG91_SENDER_ID') ?? 'NOTIFY',
      short_url: 0,
      mobiles: normalised,
      message: body,
      route: '4',
    }),
  });
  return res.ok;
}
