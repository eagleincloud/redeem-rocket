import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MSG91_KEY    = Deno.env.get('MSG91_API_KEY') ?? '';
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY') ?? '';
const MSG91_WA_NUM = Deno.env.get('MSG91_WA_NUMBER') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { channel, to_phone, to_email, to_name, subject, body, htmlBody } = await req.json();

    if (!body) return new Response(JSON.stringify({ ok: false, error: 'body required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    let ok = false;
    let error = '';

    if (channel === 'whatsapp') {
      if (!to_phone) throw new Error('phone required for whatsapp');
      if (!MSG91_KEY) throw new Error('MSG91 not configured');

      // Look up sender identity for wa_number
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: senderRow } = await supabase
        .from('sender_identities')
        .select('wa_number')
        .eq('channel', 'whatsapp')
        .eq('is_default', true)
        .single();

      const waNum = senderRow?.wa_number || MSG91_WA_NUM;
      if (!waNum) throw new Error('No WhatsApp sender number configured. Add a WhatsApp sender identity first.');

      const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
        method: 'POST',
        headers: { Authkey: MSG91_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrated_number: waNum,
          content_type: 'text',
          payload: {
            to:   to_phone.replace(/\D/g, ''),
            type: 'text',
            text: { body },
          },
        }),
      });
      const txt = await res.text();
      ok = res.ok;
      if (!ok) error = txt;

    } else if (channel === 'sms') {
      if (!to_phone) throw new Error('phone required for sms');
      if (!MSG91_KEY) throw new Error('MSG91 not configured');

      const normalised = to_phone.replace(/\D/g, '');
      const res = await fetch('https://api.msg91.com/api/sendhttp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          authkey:  MSG91_KEY,
          mobiles:  normalised,
          message:  body,
          sender:   'NOTIFY',
          route:    '4',
          country:  '91',
          unicode:  '1',
        }),
      });
      const txt = await res.text();
      ok = res.ok && !txt.includes('ERROR');
      if (!ok) error = txt;

    } else if (channel === 'email') {
      if (!to_email) throw new Error('email required');
      if (!RESEND_KEY) throw new Error('Resend not configured');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Redeem Rocket <noreply@redeemrocket.in>',
          to:   [to_email],
          subject: subject || 'Message from us',
          text: body,
          html: htmlBody || `<div style="font-family:sans-serif;color:#111;">${body.replace(/\n/g, '<br>')}</div>`,
        }),
      });
      const json = await res.json();
      ok = res.ok && !!json.id;
      if (!ok) error = JSON.stringify(json);
    }

    return new Response(JSON.stringify({ ok, error: ok ? undefined : error }), {
      status: ok ? 200 : 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-direct-message]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
