/**
 * Infer business_type from name, category, and subcategory using rule-based detection
 * (same logic as src/app/utils/businessType.ts — keep in sync). Updates Supabase public.businesses.
 *
 * Types: restaurant, grocery, pharmacy, salon, hotel, atm, other
 *
 * Usage:
 *   1. Ensure public.businesses has business_type column (run scripts/supabase-add-business-type.sql)
 *   2. Set in .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
 *   3. node scripts/infer-business-type.js
 *
 * Options:
 *   DRY_RUN=1       - only log what would be updated, do not write
 *   BATCH=50        - update batch size within each page (default 100)
 *   PAGE_SIZE=1000  - businesses to fetch per iteration (default 1000)
 *   LIMIT=5000      - max total rows to process (default: no limit, process all)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';
const BATCH = Math.max(1, parseInt(process.env.BATCH || '100', 10));
const PAGE_SIZE = Math.max(1, parseInt(process.env.PAGE_SIZE || '1000', 10));
const LIMIT = process.env.LIMIT ? Math.max(1, parseInt(process.env.LIMIT, 10)) : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

/** Rule-based type detection — same logic as src/app/utils/businessType.ts */
function getBusinessTypeKey(text) {
  const c = (text || '').toLowerCase();
  if (/\b(restaurant|resto|dining|food|eat|grill|pizza|burger|bistro|cafe|coffee|tea)\b/.test(c)) return 'restaurant';
  if (/\b(grocery|store|shop|retail|mall|supermarket|mart)\b/.test(c)) return 'grocery';
  if (/\b(pharmacy|pharma|chemist|drugstore)\b/.test(c)) return 'pharmacy';
  if (/\b(salon|barber|beauty|spa)\b/.test(c)) return 'salon';
  if (/\b(hotel|motel|inn|stay|lodging)\b/.test(c)) return 'hotel';
  if (/\b(atm|bank)\b/.test(c)) return 'atm';
  return 'other';
}

async function main() {
  console.log('Fetching businesses in pages of', PAGE_SIZE, '(id, name, category, subcategory, business_type)...');
  console.log('DRY_RUN=', DRY_RUN, LIMIT ? 'LIMIT=' + LIMIT : 'no limit');

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const effectiveLimit = LIMIT != null ? Math.min(PAGE_SIZE, LIMIT - totalProcessed) : PAGE_SIZE;
    if (LIMIT != null && effectiveLimit <= 0) break;

    const { data: rows, error } = await supabase
      .from('businesses')
      .select('id, name, category, subcategory, business_type')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      process.exit(1);
    }

    let count = rows?.length ?? 0;
    if (count === 0) break;
    if (LIMIT != null && totalProcessed + count > LIMIT) {
      rows.splice(LIMIT - totalProcessed);
      count = rows.length;
    }

    for (let i = 0; i < count; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      for (const row of chunk) {
        const combined = [row.name, row.category, row.subcategory].filter(Boolean).join(' ');
        const type = getBusinessTypeKey(combined);
        if (type !== (row.business_type || '')) {
          if (!DRY_RUN) {
            const { error: upErr } = await supabase
              .from('businesses')
              .update({ business_type: type })
              .eq('id', row.id);
            if (upErr) {
              console.error('Update error for', row.id, upErr);
              totalFailed++;
              continue;
            }
          }
          totalUpdated++;
          if (totalUpdated <= 20) console.log('  ', row.name, '→', type, '(from name/category/subcategory)');
        }
      }
    }

    totalProcessed += count;
    console.log('Page', page + 1, '— processed', totalProcessed, 'businesses so far (updated:', totalUpdated + ', failed:', totalFailed + ')');

    if (count < PAGE_SIZE || (LIMIT != null && totalProcessed >= LIMIT)) hasMore = false;
    else page++;
  }

  console.log('Done. Total processed:', totalProcessed, 'Updated:', totalUpdated, 'Failed:', totalFailed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
