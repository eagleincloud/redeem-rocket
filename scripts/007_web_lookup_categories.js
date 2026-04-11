/**
 * 007_web_lookup_categories.js
 *
 * For businesses that still have business_type = 'other' or NULL after the SQL
 * keyword pass, this script uses the Nominatim / OpenStreetMap search API to
 * look up each business by name + location and determine a category from the
 * OSM type/category fields.
 *
 * Usage:
 *   node scripts/007_web_lookup_categories.js
 *
 * Requirements:
 *   npm install @supabase/supabase-js node-fetch
 *
 * Set env vars:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── OSM category → app type_key map ──────────────────────────────────────────
const OSM_TO_TYPE = {
  'restaurant': 'restaurant', 'fast_food': 'restaurant', 'food_court': 'restaurant',
  'cafe': 'restaurant', 'bar': 'restaurant', 'biergarten': 'restaurant',
  'ice_cream': 'restaurant', 'bakery': 'restaurant',
  'supermarket': 'grocery', 'convenience': 'grocery', 'greengrocer': 'grocery',
  'deli': 'grocery', 'butcher': 'grocery',
  'pharmacy': 'pharmacy', 'hospital': 'pharmacy', 'clinic': 'pharmacy',
  'doctors': 'pharmacy', 'dentist': 'pharmacy', 'veterinary': 'pharmacy',
  'hairdresser': 'salon', 'beauty': 'salon', 'massage': 'salon',
  'hotel': 'hotel', 'motel': 'hotel', 'hostel': 'hotel', 'guest_house': 'hotel',
  'bank': 'atm', 'atm': 'atm', 'bureau_de_change': 'atm',
  'electronics': 'electronics', 'computer': 'electronics', 'mobile_phone': 'electronics',
  'clothes': 'clothing', 'shoes': 'clothing', 'fashion_accessories': 'clothing',
  'fuel': 'petrol', 'petrol': 'petrol',
  'hardware': 'hardware', 'doityourself': 'hardware',
  'sports': 'gym', 'fitness_centre': 'gym',
  'car_repair': 'auto', 'motorcycle': 'auto', 'tyres': 'auto',
  'school': 'education', 'college': 'education', 'university': 'education',
  'tutoring': 'education', 'library': 'education',
  'jewelry': 'jewellery',
  'optician': 'optical',
  'travel_agency': 'travel',
  'furniture': 'furniture',
  'stationery': 'stationery', 'books': 'stationery', 'copy_shop': 'stationery',
};

// Rate-limit: Nominatim fair use policy = max 1 req/second
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function lookupBusinessCategory(name, lat, lng) {
  const q = encodeURIComponent(`${name}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&lat=${lat}&lon=${lng}&format=json&limit=3&addressdetails=0`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RedeemRocket/1.0 (business-category-lookup)' }
    });
    if (!res.ok) return null;
    const results = await res.json();
    for (const r of results) {
      const osmType = r.type || r.class;
      const mapped = OSM_TO_TYPE[osmType];
      if (mapped) return mapped;
      // Also check category field
      const osmCat = r.category;
      const mappedCat = OSM_TO_TYPE[osmCat];
      if (mappedCat) return mappedCat;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  // Fetch businesses with 'other' or null type
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, latitude, longitude, business_type')
    .or('business_type.is.null,business_type.eq.other')
    .limit(500);  // process in batches

  if (error) { console.error('Supabase error:', error); process.exit(1); }
  if (!businesses?.length) { console.log('✅ No uncategorized businesses found!'); return; }

  console.log(`🔍 Looking up ${businesses.length} uncategorized businesses via OSM…`);

  let updated = 0;
  let skipped = 0;

  for (const biz of businesses) {
    if (!biz.latitude || !biz.longitude) { skipped++; continue; }

    await delay(1100); // respect Nominatim rate limit (1 req/sec)
    const category = await lookupBusinessCategory(biz.name, biz.latitude, biz.longitude);

    if (category && category !== 'other') {
      const { error: upErr } = await supabase
        .from('businesses')
        .update({ business_type: category })
        .eq('id', biz.id);
      if (!upErr) {
        updated++;
        console.log(`  ✓ [${biz.id}] "${biz.name}" → ${category}`);
      }
    } else {
      skipped++;
      if (skipped % 50 === 0) console.log(`  … ${skipped} skipped so far`);
    }
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);

  // Summary
  const { data: summary } = await supabase
    .from('businesses')
    .select('business_type')
    .order('business_type');
  const counts = {};
  for (const b of summary || []) {
    counts[b.business_type || 'null'] = (counts[b.business_type || 'null'] || 0) + 1;
  }
  console.log('\n📊 Business type breakdown:');
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, cnt]) => {
    console.log(`  ${type}: ${cnt}`);
  });
}

main().catch(console.error);
