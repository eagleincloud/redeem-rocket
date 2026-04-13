// Supabase Edge Function: msg91-otp
// Proxies MSG91 OTP API calls server-side to avoid browser CORS restrictions.
// Deploy: supabase functions deploy msg91-otp
// Secrets: supabase secrets set MSG91_API_KEY=... MSG91_OTP_TEMPLATE_ID=...

const MSG91_KEY = Deno.env.get('MSG91_API_KEY') ?? '';
const MSG91_TPL = Deno.env.get('MSG91_OTP_TEMPLATE_ID') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { action, mobile, otp } = await req.json();

    let msg91Res: Response;

    if (action === 'send') {
      msg91Res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: { authkey: MSG91_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: MSG91_TPL, mobile }),
      });
    } else if (action === 'verify') {
      msg91Res = await fetch(
        `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}`,
        { headers: { authkey: MSG91_KEY } },
      );
    } else if (action === 'retry') {
      msg91Res = await fetch('https://control.msg91.com/api/v5/otp/retry', {
        method: 'POST',
        headers: { authkey: MSG91_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, retrytype: 'text' }),
      });
    } else {
      return new Response(
        JSON.stringify({ type: 'error', message: 'Unknown action' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const data = await msg91Res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ type: 'error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
