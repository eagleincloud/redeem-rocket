/**
 * Supabase Edge Function: send-verification-email
 *
 * Sends email verification links for app_users and biz_users
 *
 * Request body:
 *   {
 *     email: string,      — recipient email
 *     token: string,      — verification token from database
 *     userType: 'app' | 'biz'  — which table the user belongs to
 *   }
 *
 * Deploy:
 *   supabase functions deploy send-verification-email
 *
 * Required secrets (supabase secrets set ...):
 *   RESEND_API_KEY    — from resend.com (free: 3000 emails/month)
 *   RESEND_FROM       — verified sender, e.g. "Redeem Rocket <noreply@yourdomain.com>"
 *   VERIFICATION_URL  — base URL for verification link, e.g. https://app.example.com/verify-email
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Config ────────────────────────────────────────────────────────────────────

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Redeem Rocket <onboarding@resend.dev>';
const VERIFICATION_URL = Deno.env.get('VERIFICATION_URL') ?? 'https://app.example.com/verify-email';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── JSON response helper ──────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Email sender ──────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) {
    console.log(`[DEV] Verification email for ${to}: ${VERIFICATION_URL}?token=${token}`);
    return { ok: true };
  }

  const verificationLink = `${VERIFICATION_URL}?token=${token}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f0ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
        <tr><td style="height:5px;background:linear-gradient(90deg,#7c3aed,#a855f7,#db2777,#f97316);"></td></tr>
        <tr><td align="center" style="padding:36px 40px 20px;">
          <div style="font-size:36px;margin-bottom:8px;">✉️</div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;">Verify Your Email</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Complete your account setup</p>
        </td></tr>
        <tr><td style="padding:0 40px 36px;">
          <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">
            Thank you for signing up! Please verify your email address to complete your account setup and get started.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#db2777 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:14px;box-shadow:0 4px 20px rgba(124,58,237,0.40);transition:all 0.2s;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;text-align:center;margin:24px 0 0;">
            Or copy this link in your browser:
          </p>
          <p style="font-size:12px;color:#7c3aed;text-align:center;margin:8px 0;word-break:break-all;font-family:monospace;">
            ${verificationLink}
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
            This link expires in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.
          </p>
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:20px 0 0;">
            Sent by <strong>Redeem Rocket</strong> · Do not reply
          </p>
        </td></tr>
        <tr><td style="height:4px;background:linear-gradient(90deg,#f97316,#db2777,#7c3aed);"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: 'Verify your Redeem Rocket email address',
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[send-verification-email] Resend error:', body);
    return { ok: false, error: `Email delivery failed (${res.status})` };
  }

  return { ok: true };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { email, token, userType } = await req.json();

    if (!email || typeof email !== 'string') {
      return json({ ok: false, error: 'email is required' }, 400);
    }

    if (!token || typeof token !== 'string') {
      return json({ ok: false, error: 'token is required' }, 400);
    }

    if (!userType || !['app', 'biz'].includes(userType)) {
      return json({ ok: false, error: 'userType must be "app" or "biz"' }, 400);
    }

    const sent = await sendEmail(email, token);
    if (!sent.ok) {
      return json({ ok: false, error: sent.error ?? 'Email delivery failed.' });
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[send-verification-email] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});
