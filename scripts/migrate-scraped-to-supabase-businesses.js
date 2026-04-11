/**
 * Migrate MySQL scraped_businesses → Supabase table "businesses" (same schema).
 *
 * Source: Host hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com, DB RedeemRocket, table scraped_businesses
 * Target: Supabase public.businesses (create table first with scripts/supabase-businesses-from-scraped.sql)
 *
 * Usage:
 *   1. In Supabase SQL Editor, run: scripts/supabase-businesses-from-scraped.sql
 *   2. node scripts/migrate-scraped-to-supabase-businesses.js
 *
 * Env:
 *   MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (default: RedeemRocket)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com',
  user: process.env.MYSQL_USER || 'admin',
  password: process.env.MYSQL_PASSWORD || 'EIC12345',
  port: Number(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'RedeemRocket',
  charset: 'utf8mb4',
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BATCH_SIZE = 200;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

/** Column list matching MySQL scraped_businesses (same order as schema) */
const COLUMNS = [
  'id', 'merchant_key', 'place_id', 'name', 'category', 'subcategory', 'address', 'area', 'city',
  'pincode', 'phone', 'mobile', 'email', 'website', 'latitude', 'longitude', 'rating', 'review_count',
  'price_level', 'opening_hours', 'business_status', 'types', 'description', 'amenities',
  'verification_status', 'claimed_by_merchant_id', 'verified_by_admin_id', 'verified_at',
  'created_at', 'updated_at',
];

function rowToPayload(row) {
  const out = {};
  for (const col of COLUMNS) {
    let v = row[col];
    if (v === undefined) continue;
    if (v instanceof Date) v = v.toISOString();
    else if (typeof v === 'object' && v !== null) v = String(v);
    out[col] = v;
  }
  return out;
}

async function main() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  try {
    const [rows] = await conn.query('SELECT * FROM scraped_businesses');
    const total = rows.length;
    console.log('Fetched', total, 'rows from MySQL scraped_businesses');

    if (total === 0) {
      console.log('No data to migrate.');
      return;
    }

    const payloads = rows.map(rowToPayload);

    console.log('Inserting into Supabase public.businesses in batches of', BATCH_SIZE, '...');
    for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
      const chunk = payloads.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('businesses').insert(chunk);
      if (error) {
        console.error('Batch error at offset', i, ':', error.message);
        throw error;
      }
      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, total)} / ${total}\r`);
    }
    console.log('\nMigrated', total, 'rows to Supabase public.businesses.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
