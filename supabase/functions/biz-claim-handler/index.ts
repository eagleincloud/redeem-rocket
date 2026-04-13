// Supabase Edge Function: biz-claim-handler
// Validates a claim token from a WhatsApp/SMS invite link and redirects the
// business owner to the pre-filled onboarding form in the Business Portal.
//
// Deploy: supabase functions deploy biz-claim-handler
// Secrets:
//   APP_BASE_URL            — e.g. https://your-app.com  (no trailing slash)
//   SUPABASE_URL            (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//
// Invoked via: GET /functions/v1/biz-claim-handler?token={claim_token}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function redirect(to: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: to },
  });
}

Deno.serve(async (req: Request) => {
  const url   = new URL(req.url);
  const token = url.searchParams.get('token');

  const base = APP_BASE_URL || 'http://localhost:5173';
  const loginUrl = `${base}/business.html#/login`;

  if (!token) return redirect(`${loginUrl}?err=missing_token`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return redirect(`${loginUrl}?err=server_error`);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: rec, error } = await supabase
    .from('scraped_businesses')
    .select('id, name, address, phone, category, website, photos_json, menu_json, business_hours, enrichment_status, claim_token')
    .eq('claim_token', token)
    .single();

  if (error || !rec) return redirect(`${loginUrl}?err=invalid_token`);
  if (rec.enrichment_status === 'claimed') return redirect(`${loginUrl}?err=already_claimed`);

  // Build the prefill payload — only include safe, non-sensitive fields
  const prefill = {
    scraped_id:     rec.id,
    claim_token:    rec.claim_token,
    name:           rec.name,
    category:       rec.category,
    address:        rec.address,
    phone:          rec.phone,
    website:        rec.website,
    photos_json:    rec.photos_json,
    menu_json:      rec.menu_json,
    business_hours: rec.business_hours,
  };

  // Base64-encode the JSON payload (safe for URL usage)
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(prefill))));

  // Redirect to the onboarding page — hash router handles the ?prefill= param
  return redirect(`${base}/business.html#/onboarding?prefill=${encoded}`);
});
