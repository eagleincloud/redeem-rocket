import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get('business_id');
    const apiKey     = req.headers.get('x-api-key') || url.searchParams.get('api_key');

    if (!businessId) {
      return new Response(JSON.stringify({ ok: false, error: 'business_id required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Validate API key if provided
    if (apiKey) {
      const { data: connector } = await supabase
        .from('lead_connectors')
        .select('id, is_active')
        .eq('business_id', businessId)
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single();

      if (!connector) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid API key' }), {
          status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));

    const lead = {
      business_id: businessId,
      name:        body.name    || body.full_name || 'Unknown',
      email:       body.email   || null,
      phone:       body.phone   || body.mobile   || null,
      company:     body.company || body.organization || null,
      notes:       body.notes   || body.message  || null,
      source:      body.source  || 'webhook',
      stage:       'new',
      priority:    'medium',
      created_at:  new Date().toISOString(),
    };

    const { data, error } = await supabase.from('leads').insert(lead).select().single();

    if (error) throw error;

    // Increment connector import count
    if (apiKey) {
      await supabase.rpc('increment', { table_name: 'lead_connectors', column_name: 'leads_imported', row_id: businessId })
        .catch(() => null);
    }

    return new Response(JSON.stringify({ ok: true, lead_id: data.id }), {
      status: 201, headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[lead-ingest]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
