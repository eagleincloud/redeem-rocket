/**
 * Supabase Edge Function: fcm-send
 *
 * Sends Firebase Cloud Messaging push notifications server-side.
 * Uses the FCM HTTP v1 API with a Google service-account JWT.
 *
 * Deploy:
 *   supabase functions deploy fcm-send
 *
 * Required secret (supabase secrets set ...):
 *   FIREBASE_SERVICE_ACCOUNT_JSON  — full JSON string of the service account key file
 *                                    (Firebase Console → Project Settings → Service accounts
 *                                     → Generate new private key → paste entire JSON content)
 *
 * Request body:
 *   { token, title, body, data?, imageUrl? }   — send to one device
 *   { topic, title, body, data?, imageUrl? }   — send to a topic
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** Convert PEM private key string to a CryptoKey for RS256 signing */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binary = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Create a signed JWT for Google OAuth2 token exchange */
async function createGoogleJwt(
  clientEmail: string,
  privateKey: string,
  scope: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    scope,
    iat: now,
    exp: now + 3600,
  })));

  const signingInput = `${header}.${payload}`;
  const key          = await importPrivateKey(privateKey);
  const sig          = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(new Uint8Array(sig))}`;
}

/** Exchange a Google JWT for a short-lived OAuth2 access token */
async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const jwt = await createGoogleJwt(
    clientEmail,
    privateKey,
    'https://www.googleapis.com/auth/firebase.messaging',
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      return json({ ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON secret not set.' }, 500);
    }

    const sa = JSON.parse(saJson) as {
      client_email: string;
      private_key:  string;
      project_id:   string;
    };

    const {
      token,
      topic,
      title  = 'Redeem Rocket',
      body   = '',
      data,
      imageUrl,
    } = await req.json() as {
      token?:    string;
      topic?:    string;
      title?:    string;
      body?:     string;
      data?:     Record<string, string>;
      imageUrl?: string;
    };

    if (!token && !topic) {
      return json({ ok: false, error: 'Provide either token or topic' }, 400);
    }

    const accessToken = await getGoogleAccessToken(sa.client_email, sa.private_key);

    // ── Build FCM message ────────────────────────────────────────────────────
    const message: Record<string, unknown> = {
      notification: {
        title,
        body,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
      webpush: {
        notification: {
          title,
          body,
          icon:  '/logo.png',
          badge: '/logo.png',
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcm_options: {
          link: data?.url ?? '/',
        },
      },
      ...(data ? { data } : {}),
    };

    // Target: device token or topic
    if (token) {
      (message as Record<string, unknown>).token = token;
    } else {
      (message as Record<string, unknown>).topic = topic;
    }

    // ── Send via FCM HTTP v1 ─────────────────────────────────────────────────
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!fcmRes.ok) {
      const err = await fcmRes.text();
      console.error('[fcm-send] FCM error:', err);
      return json({ ok: false, error: `FCM send failed: ${err}` });
    }

    const result = await fcmRes.json();
    return json({ ok: true, messageId: result.name });

  } catch (err) {
    console.error('[fcm-send] Unexpected error:', err);
    return json({ ok: false, error: String(err) }, 500);
  }
});
