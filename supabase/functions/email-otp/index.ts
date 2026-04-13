/**
 * Supabase Edge Function: email-otp
 *
 * Sends and verifies email OTPs independently of Supabase Auth's rate limits.
 *
 * Actions:
 *   { action: 'send_email', email, otp }  → Firebase flow: deliver pre-generated OTP via email (no Supabase storage)
 *   { action: 'send',   email }           → Legacy: generate OTP, store hash in Supabase, send email
 *   { action: 'verify', email, otp }      → Legacy: verify OTP against Supabase-stored hash
 *
 * Deploy:
 *   supabase functions deploy email-otp
 *
 * Required secrets (supabase secrets set ...):
 *   RESEND_API_KEY    — from resend.com (free: 3000 emails/month)
 *   RESEND_FROM       — verified sender, e.g. "Redeem Rocket <otp@yourdomain.com>"
 *                       Use "Redeem Rocket <onboarding@resend.dev>" while testing
 *
 * Automatically available (no secrets needed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — injected by Supabase runtime
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Config ────────────────────────────────────────────────────────────────────

const RESEND_KEY  = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Redeem Rocket <onboarding@resend.dev>';

// Supabase service-role client (bypasses RLS — safe inside Edge Function)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 3;
const OTP_TTL_MIN  = 10;

// ── Crypto helpers ────────────────────────────────────────────────────────────

function generateOtp(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String((arr[0] % 900_000) + 100_000);
}

async function hashOtp(otp: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(otp));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Email sender via Resend ───────────────────────────────────────────────────

async function sendEmail(to: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) {
    // No Resend key — log to edge function console for local dev / testing
    console.log(`[DEV] Email OTP for ${to}: ${otp}`);
    return { ok: true };
  }

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
          <div style="font-size:36px;margin-bottom:8px;">🚀</div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;">Redeem Rocket</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Your one-time verification code</p>
        </td></tr>
        <tr><td style="padding:0 40px 36px;">
          <div style="background:linear-gradient(135deg,#f5f0ff,#fdf2fb);border:2px solid #e0d4ff;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
            <div style="font-size:52px;font-weight:900;letter-spacing:14px;color:#7c3aed;font-family:monospace;">${otp}</div>
            <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">
              Valid for <strong>${OTP_TTL_MIN} minutes</strong> &nbsp;·&nbsp; Do not share this code
            </p>
          </div>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 16px;">
            If you did not request this code, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
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
      to:   [to],
      subject: `${otp} is your Redeem Rocket OTP`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[email-otp] Resend error:', body);
    return { ok: false, error: `Email delivery failed (${res.status})` };
  }

  return { ok: true };
}

// ── JSON response helper ──────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { action, email, otp: userOtp } = await req.json();
    const pregenOtp = userOtp; // alias: used as pre-generated OTP in send_email action

    if (!email || typeof email !== 'string') {
      return json({ ok: false, error: 'email is required' }, 400);
    }

    // ── SEND_EMAIL (Firebase OTP flow) ───────────────────────────────────────
    // Called when Firebase Firestore manages OTP state.
    // Accepts a pre-generated OTP and just delivers the email — no Supabase storage.
    if (action === 'send_email') {
      if (!pregenOtp || typeof pregenOtp !== 'string') {
        return json({ ok: false, error: 'otp is required for send_email action' }, 400);
      }
      const sent = await sendEmail(email, pregenOtp);
      if (!sent.ok) return json({ ok: false, error: sent.error ?? 'Email delivery failed.' });
      return json({ ok: true });
    }

    // ── SEND (legacy Supabase-only flow) ─────────────────────────────────────
    if (action === 'send') {
      const otp  = generateOtp();
      const hash = await hashOtp(otp);

      // Invalidate any previous unverified OTPs for this email
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('contact', email)
        .eq('contact_type', 'email')
        .eq('verified', false);

      // Insert fresh OTP record
      const { error: dbErr } = await supabase.from('otp_verifications').insert({
        contact:      email,
        contact_type: 'email',
        otp_hash:     hash,
        expires_at:   new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
      });

      if (dbErr) {
        console.error('[email-otp] DB insert error:', dbErr.message);
        return json({ ok: false, error: 'Failed to store OTP. Try again.' }, 500);
      }

      const sent = await sendEmail(email, otp);
      if (!sent.ok) return json({ ok: false, error: sent.error ?? 'Email delivery failed.' });

      return json({ ok: true });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!userOtp || typeof userOtp !== 'string') {
        return json({ ok: false, error: 'otp is required' }, 400);
      }

      const hash = await hashOtp(userOtp.trim());

      const { data: rows, error: fetchErr } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('contact', email)
        .eq('contact_type', 'email')
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr || !rows?.length) {
        return json({ ok: false, error: 'No OTP found. Please request a new one.' });
      }

      const row = rows[0];

      if (new Date(row.expires_at).getTime() < Date.now()) {
        return json({ ok: false, error: 'OTP has expired. Please request a new one.' });
      }

      const attempts = (row.attempts ?? 0) + 1;

      if (attempts > MAX_ATTEMPTS) {
        return json({ ok: false, error: 'Too many failed attempts. Please request a new OTP.', attemptsLeft: 0 });
      }

      if (row.otp_hash !== hash) {
        await supabase
          .from('otp_verifications')
          .update({ attempts })
          .eq('id', row.id);

        const left = Math.max(0, MAX_ATTEMPTS - attempts);
        return json({ ok: false, error: 'Incorrect OTP. Please try again.', attemptsLeft: left });
      }

      // Mark as verified
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', row.id);

      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown action' }, 400);

  } catch (err) {
    console.error('[email-otp] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});
