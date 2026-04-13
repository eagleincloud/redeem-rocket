// lead-follow-up-reminder
// Triggered hourly by pg_cron (or manually by POST).
// Finds due follow-ups, sends in-app + WhatsApp notifications, marks reminder_sent = true.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const msg91Key    = Deno.env.get('MSG91_API_KEY') ?? '';
  const waNumber    = Deno.env.get('MSG91_WA_NUMBER') ?? '';

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // ── 1. Find follow-ups due within the next 30 minutes that haven't had a reminder sent ──
    const now      = new Date();
    const horizon  = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

    const { data: followUps, error: fuErr } = await supabase
      .from('lead_follow_ups')
      .select(`
        id, lead_id, business_id, type, title, notes, due_at,
        leads!inner(id, name, phone, business_id)
      `)
      .lte('due_at', horizon.toISOString())
      .eq('completed', false)
      .eq('reminder_sent', false)
      .limit(50);

    if (fuErr) throw fuErr;
    if (!followUps || followUps.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No upcoming follow-ups found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let notified = 0;
    let failed   = 0;

    for (const fu of followUps) {
      const lead = (fu as Record<string, unknown>).leads as Record<string, unknown>;
      const businessId = String(fu.business_id);
      const leadName   = String(lead?.name ?? 'Lead');
      const leadPhone  = lead?.phone ? String(lead.phone) : null;

      // ── 2. Write in-app notification ─────────────────────────────────────────
      const { error: notifErr } = await supabase.from('in_app_notifications').insert({
        user_id:    businessId,
        user_type:  'business',
        event_type: 'lead_follow_up_reminder',
        title:      `Follow-up due: ${leadName}`,
        body:       `📋 ${fu.title} — due at ${new Date(fu.due_at as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        metadata:   { lead_id: fu.lead_id, follow_up_id: fu.id, follow_up_type: fu.type },
        is_read:    false,
      });

      if (notifErr) {
        console.warn(`In-app notif failed for follow-up ${fu.id}:`, notifErr.message);
      }

      // ── 3. Send WhatsApp reminder to business owner (if MSG91 configured) ────
      if (msg91Key && waNumber && leadPhone) {
        try {
          const message = `📋 Follow-up reminder!\n\nLead: *${leadName}*\nTask: ${fu.title}\nDue: ${new Date(fu.due_at as string).toLocaleString('en-IN')}\n\nOpen Redeem Rocket dashboard to action. — Redeem Rocket`;

          await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authkey: msg91Key,
            },
            body: JSON.stringify({
              integrated_number: waNumber,
              content_type: 'template',
              payload: {
                to: leadPhone.replace(/\D/g, '').replace(/^0/, '91'),
                type: 'text',
                text: { body: message },
              },
            }),
          });
        } catch (waErr) {
          console.warn(`WhatsApp failed for follow-up ${fu.id}:`, waErr);
        }
      }

      // ── 4. Mark reminder_sent = true ─────────────────────────────────────────
      const { error: markErr } = await supabase
        .from('lead_follow_ups')
        .update({ reminder_sent: true })
        .eq('id', fu.id);

      if (markErr) {
        console.warn(`Mark reminder_sent failed for ${fu.id}:`, markErr.message);
        failed++;
      } else {
        notified++;
      }
    }

    return new Response(JSON.stringify({ processed: followUps.length, notified, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('lead-follow-up-reminder error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
