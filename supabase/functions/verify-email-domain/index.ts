import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { business_id, domain } = await req.json();

    if (!business_id || !domain) {
      return new Response(JSON.stringify({ ok: false, error: 'business_id and domain required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Try to add/verify domain via Resend API
    let dnsRecords: object[] = [];
    let verified = false;

    if (RESEND_KEY) {
      // Check if domain already exists in Resend
      const listRes = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${RESEND_KEY}` },
      });
      const listData = await listRes.json();
      const existing = (listData.data || []).find((d: any) => d.name === domain);

      if (existing) {
        // Get DNS records from existing domain
        const detailRes = await fetch(`https://api.resend.com/domains/${existing.id}`, {
          headers: { Authorization: `Bearer ${RESEND_KEY}` },
        });
        const detail = await detailRes.json();
        verified = detail.status === 'verified';
        dnsRecords = (detail.records || []).map((r: any) => ({
          type:   r.record_type || r.type,
          host:   r.name,
          value:  r.value,
          status: r.status || 'pending',
        }));
      } else {
        // Create domain in Resend
        const createRes = await fetch('https://api.resend.com/domains', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: domain }),
        });
        const created = await createRes.json();
        dnsRecords = (created.records || []).map((r: any) => ({
          type:   r.record_type || r.type,
          host:   r.name,
          value:  r.value,
          status: 'pending',
        }));
      }
    } else {
      // Return placeholder DNS records if Resend not configured
      dnsRecords = [
        { type: 'TXT',   host: `_resend.${domain}`,     value: 'resend-verify=placeholder',         status: 'pending' },
        { type: 'MX',    host: domain,                   value: 'feedback-smtp.us-east-1.amazonses.com', status: 'pending' },
        { type: 'TXT',   host: domain,                   value: 'v=spf1 include:amazonses.com ~all',  status: 'pending' },
        { type: 'CNAME', host: `mail._domainkey.${domain}`, value: 'placeholder.dkim.amazonses.com', status: 'pending' },
      ];
    }

    // Save to email_provider_configs
    await supabase
      .from('email_provider_configs')
      .upsert({
        business_id,
        custom_domain: domain,
        dns_records: dnsRecords,
        domain_verified: verified,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id' });

    return new Response(JSON.stringify({ ok: true, domain, verified, records: dnsRecords }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[verify-email-domain]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
