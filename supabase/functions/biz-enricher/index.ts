// Supabase Edge Function: biz-enricher
// Enriches raw scraped_businesses records with Google Places API data
// and uses Claude Haiku to parse menu/service items from business websites.
//
// Deploy: supabase functions deploy biz-enricher
// Secrets:
//   GOOGLE_PLACES_API_KEY
//   ANTHROPIC_API_KEY
//   SUPABASE_URL         (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//
// Invoke: POST /functions/v1/biz-enricher
// Body (optional): { "batch": 50 }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_KEY  = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Call Google Places findPlaceFromText for a business name + address. */
async function fetchGooglePlaces(name: string, address: string) {
  if (!GOOGLE_KEY) return null;
  const input = encodeURIComponent(`${name} ${address}`);
  const fields = [
    'place_id','name','formatted_phone_number','website',
    'opening_hours','photos','rating','user_ratings_total','types',
  ].join(',');
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${input}&inputtype=textquery&fields=${fields}&key=${GOOGLE_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data?.candidates?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Fetch website homepage and return plain text (max 8000 chars). */
async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RedeemRocket-Bot/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Strip HTML tags, collapse whitespace
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
  } catch {
    return '';
  }
}

/** Use Claude Haiku to extract menu/service items from website text. */
async function extractMenuWithClaude(text: string): Promise<{ item: string; price?: string; category?: string }[]> {
  if (!ANTHROPIC_KEY || !text) return [];
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content:
            `Extract menu/service items from this business website text as a JSON array.\n` +
            `Each item: { "item": string, "price": string|null, "category": string|null }\n` +
            `Return only the JSON array, no explanation. Return [] if no items found.\n\n` +
            `Website text:\n${text}`,
        }],
      }),
    });
    const data = await res.json();
    const raw = data?.content?.[0]?.text ?? '[]';
    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/** Map Google Places types to a human-readable category. */
function googleTypesToCategory(types: string[]): string | null {
  const map: Record<string, string> = {
    restaurant: 'Restaurant', food: 'Food', cafe: 'Cafe',
    bar: 'Bar', bakery: 'Bakery',
    clothing_store: 'Fashion', shoe_store: 'Fashion',
    electronics_store: 'Electronics', phone: 'Electronics',
    pharmacy: 'Pharmacy', drugstore: 'Pharmacy',
    grocery_or_supermarket: 'Grocery', supermarket: 'Grocery',
    beauty_salon: 'Beauty', hair_care: 'Beauty', spa: 'Spa',
    jewelry_store: 'Jewellery', gym: 'Fitness',
    hospital: 'Healthcare', doctor: 'Healthcare',
  };
  for (const t of types ?? []) {
    if (map[t]) return map[t];
  }
  return null;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json({ error: 'Supabase env vars not set' }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let batchSize = 50;
  try {
    const body = await req.json();
    if (typeof body?.batch === 'number') batchSize = Math.min(body.batch, 100);
  } catch { /* no body — use default */ }

  // Fetch raw records to enrich
  const { data: records, error: fetchErr } = await supabase
    .from('scraped_businesses')
    .select('id, name, address, phone, lat, lng')
    .eq('enrichment_status', 'raw')
    .limit(batchSize);

  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!records || records.length === 0) return json({ enriched: 0, skipped: 0, message: 'No raw records to enrich' });

  let enriched = 0;
  let skipped = 0;

  for (const rec of records) {
    try {
      const place = await fetchGooglePlaces(rec.name ?? '', rec.address ?? '');

      // Build photos array (Google Places photo references → static map URLs as fallback)
      const photos_json = place?.photos
        ? place.photos.slice(0, 5).map((p: { photo_reference: string }) => ({
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_KEY}`,
            caption: rec.name,
          }))
        : null;

      // Build hours array
      const business_hours = place?.opening_hours?.periods
        ? place.opening_hours.periods.map((p: { open: { day: number; time: string }; close?: { time: string } }) => ({
            day: p.open.day,
            open: p.open.time,
            close: p.close?.time ?? '2359',
            closed: false,
          }))
        : null;

      const category = place?.types ? googleTypesToCategory(place.types) : null;
      const website  = place?.website ?? null;
      const rating   = place?.rating ?? null;
      const review_count = place?.user_ratings_total ?? null;
      const phone    = place?.formatted_phone_number ?? rec.phone ?? null;

      // Enrich menu from website
      let menu_json = null;
      if (website) {
        const text = await fetchWebsiteText(website);
        const items = await extractMenuWithClaude(text);
        if (items.length > 0) menu_json = items;
      }

      await supabase
        .from('scraped_businesses')
        .update({
          website,
          category,
          rating,
          review_count,
          photos_json,
          menu_json,
          business_hours,
          phone: phone ?? rec.phone,
          enrichment_status: 'enriched',
          enriched_at: new Date().toISOString(),
        })
        .eq('id', rec.id);

      enriched++;
    } catch (err) {
      console.error(`Failed to enrich ${rec.id}:`, err);
      skipped++;
    }
  }

  return json({ enriched, skipped, total: records.length });
});
