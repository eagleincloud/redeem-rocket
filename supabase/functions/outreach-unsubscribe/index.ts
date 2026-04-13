/**
 * outreach-unsubscribe
 * ─────────────────────────────────────────────────────────────────────────────
 * Called when a recipient clicks the unsubscribe link in an email/sms/whatsapp.
 * URL format: /functions/v1/outreach-unsubscribe?biz=<business_id>&email=<email>&channel=email
 *
 * Deploy: supabase functions deploy outreach-unsubscribe
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const HTML_OK = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#faf7f3">
  <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="font-size:48px;margin-bottom:16px">✅</div>
    <h2 style="color:#18100a;margin:0 0 8px">Unsubscribed</h2>
    <p style="color:#9a7860;font-size:14px">You have been successfully removed from this mailing list. You won't receive future messages from this sender.</p>
  </div>
</body>
</html>`;

const HTML_ERR = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Error</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#faf7f3">
  <div style="max-width:400px;margin:0 auto">
    <div style="font-size:48px;margin-bottom:16px">❌</div>
    <h2 style="color:#18100a">Invalid link</h2>
    <p style="color:#9a7860;font-size:14px">This unsubscribe link is invalid or expired.</p>
  </div>
</body>
</html>`;

serve(async (req) => {
  const url     = new URL(req.url);
  const bizId   = url.searchParams.get('biz');
  const email   = url.searchParams.get('email');
  const phone   = url.searchParams.get('phone');
  const channel = (url.searchParams.get('channel') ?? 'all') as 'email' | 'whatsapp' | 'sms' | 'all';

  if (!bizId || (!email && !phone)) {
    return new Response(HTML_ERR, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  try {
    // Insert unsubscribe record
    await supabase.from('outreach_unsubscribes').upsert({
      business_id: bizId,
      email:       email ?? null,
      phone:       phone ?? null,
      channel,
      reason:      'user_unsubscribed',
    });

    // Mark the recipient record as unsubscribed
    let q = supabase
      .from('outreach_recipients')
      .update({ status: 'unsubscribed' })
      .eq('business_id', bizId);
    if (email) q = q.eq('email', email);
    if (phone) q = q.eq('phone', phone);
    await q;

    // Decrement campaign unsubscribed count (best effort)
    console.log(`[unsubscribe] biz=${bizId} email=${email} phone=${phone} channel=${channel}`);

    return new Response(HTML_OK, { status: 200, headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('[unsubscribe]', err);
    return new Response(HTML_ERR, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
});
