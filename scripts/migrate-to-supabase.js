/**
 * Migrate exported MySQL data (RedeemRocket + redeem_rocket_premium) into
 * Supabase PostgreSQL using the unified schema.
 *
 * Use either:
 *   A) DATABASE_URL (Postgres connection string) – runs schema + inserts via pg
 *   B) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY – inserts via Supabase JS (run schema in SQL Editor first)
 *
 * Usage:
 *   npm run migrate:supabase
 *   node scripts/migrate-to-supabase.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const usePg = Boolean(DATABASE_URL);
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (!usePg && !useSupabase) {
  console.error('Set either DATABASE_URL (Postgres connection string) or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

let supabase;
if (useSupabase) {
  const { createClient } = await import('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

let pgClient;
if (usePg) {
  const { default: pg } = await import('pg');
  pgClient = new pg.Client({ connectionString: DATABASE_URL });
  await pgClient.connect();
  console.log('Connected to Supabase Postgres via DATABASE_URL');
  const schemaPath = path.join(__dirname, 'supabase-unified-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pgClient.query(schemaSql);
  console.log('Unified schema applied.');
}

const EXPORT_DIR = path.join(__dirname, 'mysql-export');
const BATCH_SIZE = 100;

function loadDbData(dbName) {
  const p = path.join(EXPORT_DIR, dbName, 'all-data.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Build a row for the unified table: source_db, source_id + pick only keys that exist in allowed set */
function toUnifiedRow(sourceDb, sourceId, row, allowedKeys) {
  const out = { source_db: sourceDb, source_id: String(sourceId) };
  for (const key of allowedKeys) {
    if (key in row && row[key] !== undefined && row[key] !== '') out[key] = row[key];
  }
  return out;
}

/** Insert in batches (Supabase client) */
async function insertBatchSupabase(table, rows) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length} rows OK`);
}

/** Insert in batches (pg client) */
async function insertBatchPg(table, rows) {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]).filter((k) => rows[0][k] !== undefined);
  const quoted = cols.map((c) => `"${c}"`).join(', ');
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];
    let idx = 1;
    for (const row of chunk) {
      const rowPh = cols.map(() => `$${idx++}`).join(', ');
      placeholders.push(`(${rowPh})`);
      for (const c of cols) values.push(row[c] ?? null);
    }
    const sql = `INSERT INTO public.${table} (${quoted}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
    await pgClient.query(sql, values);
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length} rows OK`);
}

async function insertBatch(table, rows) {
  if (usePg) return insertBatchPg(table, rows);
  return insertBatchSupabase(table, rows);
}

async function main() {
  const rr = loadDbData('RedeemRocket');
  const premium = loadDbData('redeem_rocket_premium');

  // ---- USERS ----
  const userKeys = ['name', 'phone', 'email', 'password', 'password_hash', 'role', 'cashback_balance', 'coins', 'gold_rr', 'silver_rr', 'whatsapp_notifications', 'is_active', 'last_login', 'last_login_ip', 'login_count', 'failed_login_attempts', 'firebase_uid', 'username', 'status', 'profile_image_url', 'bio', 'date_of_birth', 'gender', 'is_verified', 'email_verified', 'created_at', 'updated_at'];
  const usersRows = [
    ...(rr.users || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, userKeys)),
    ...(premium.users || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, userKeys)),
  ];
  await insertBatch('users', usersRows);

  // ---- MERCHANTS ----
  const merchantKeys = ['user_id', 'merchant_key', 'name', 'phone', 'email', 'role', 'categories', 'shop_name', 'area', 'pincode', 'pan_number', 'gstin', 'aadhaar_number', 'wallet_balance', 'trial_days_left', 'is_active', 'badges', 'package_tier', 'rules', 'business_id', 'company_name', 'logo_url', 'created_at', 'updated_at'];
  const merchantsRows = [
    ...(rr.merchants || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, merchantKeys)),
    ...(premium.merchant_profiles || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, { ...r, user_id: r.user_id }, merchantKeys)),
  ];
  await insertBatch('merchants', merchantsRows);

  // ---- BUSINESSES ----
  const businessKeys = ['merchant_id', 'name', 'type', 'category', 'description', 'image', 'lat', 'lng', 'address', 'phone', 'email', 'rating', 'review_count', 'is_verified', 'is_active', 'featured', 'views_count', 'created_at', 'updated_at'];
  const businessesRows = [
    ...(rr.businesses || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, businessKeys)),
    ...(premium.businesses || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, businessKeys)),
  ];
  await insertBatch('businesses', businessesRows);

  // ---- ORDERS (map customer_id -> user_id for premium) ----
  const orderKeys = ['user_id', 'customer_id', 'merchant_id', 'business_id', 'lead_id', 'total_amount', 'cashback_used', 'gold_rr_used', 'silver_rr_used', 'cash_paid', 'cashback_amount', 'platform_margin', 'payment_method', 'status', 'address', 'otp', 'otp_verified', 'otp_verified_at', 'deleted_at', 'created_at', 'updated_at'];
  const ordersRR = (rr.orders || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, orderKeys));
  const ordersPremium = (premium.orders || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, { ...r, user_id: r.customer_id }, orderKeys));
  await insertBatch('orders', [...ordersRR, ...ordersPremium]);

  // ---- ORDER_ITEMS (RedeemRocket only) ----
  const orderItemsKeys = ['order_id', 'product_id', 'offer_id', 'name', 'quantity', 'price', 'created_at', 'updated_at'];
  const orderItemsRows = (rr.order_items || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, orderItemsKeys));
  await insertBatch('order_items', orderItemsRows);

  // ---- PRODUCTS (RR products + premium premium_products + merchant_products) ----
  const productKeys = ['business_id', 'merchant_id', 'name', 'description', 'image', 'price', 'category', 'sku', 'stock_quantity', 'is_active', 'created_at', 'updated_at'];
  const productsRows = [
    ...(rr.products || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, productKeys)),
    ...(premium.premium_products || []).map((r) => toUnifiedRow('redeem_rocket_premium', `pp_${r.id}`, r, productKeys)),
    ...(premium.merchant_products || []).map((r) => toUnifiedRow('redeem_rocket_premium', `mp_${r.id}`, r, productKeys)),
  ].filter((r) => r.source_id);
  await insertBatch('products', productsRows);

  // ---- OFFERS (RR: discount->discount_value, min_purchase->min_order_value, valid_from/until->start_date/end_date) ----
  const offerKeys = ['business_id', 'merchant_id', 'title', 'description', 'discount_value', 'discount_type', 'min_order_value', 'max_discount', 'start_date', 'end_date', 'is_active', 'usage_limit', 'used_count', 'code', 'created_at', 'updated_at'];
  const offersRR = (rr.offers || []).map((r) => toUnifiedRow('RedeemRocket', r.id, {
    ...r,
    discount_value: r.discount ?? r.discount_value,
    min_order_value: r.min_purchase ?? r.min_order_value,
    start_date: r.valid_from ?? r.start_date,
    end_date: r.valid_until ?? r.end_date,
  }, offerKeys));
  await insertBatch('offers', offersRR);

  // ---- WALLET_TRANSACTIONS ----
  const walletKeys = ['user_id', 'amount', 'type', 'description', 'reference_type', 'reference_id', 'balance_after', 'created_at'];
  const walletRows = [
    ...(rr.wallet_transactions || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, walletKeys)),
    ...(premium.transactions || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, walletKeys)),
  ];
  await insertBatch('wallet_transactions', walletRows);

  // ---- OTPS (RR has "code", premium may have "otp_code") ----
  const otpKeys = ['phone', 'email', 'otp_code', 'purpose', 'expires_at', 'verified_at', 'created_at'];
  const otpsRR = (rr.otps || []).map((r) => toUnifiedRow('RedeemRocket', r.id, { ...r, otp_code: r.code || r.otp_code }, otpKeys));
  const otpsPremium = (premium.otp_verifications || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, otpKeys));
  await insertBatch('otps', [...otpsRR, ...otpsPremium]);

  // ---- SCRAPED_BUSINESSES (RedeemRocket) ----
  const scrapedKeys = ['name', 'address', 'phone', 'lat', 'lng', 'place_id', 'raw_json', 'created_at', 'updated_at'];
  const scrapedRows = (rr.scraped_businesses || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, scrapedKeys));
  await insertBatch('scraped_businesses', scrapedRows);

  // ---- COUPONS (premium only) ----
  const couponKeys = ['merchant_id', 'business_id', 'title', 'code', 'discount_type', 'discount_value', 'min_order_value', 'max_redemptions', 'redeemed_count', 'start_date', 'end_date', 'is_active', 'created_at', 'updated_at'];
  const couponsRows = (premium.coupons || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, couponKeys));
  await insertBatch('coupons', couponsRows);

  // ---- COUPON_REDEMPTIONS (premium only) ----
  const redemptionKeys = ['coupon_id', 'customer_id', 'business_id', 'redemption_code', 'amount_saved', 'redeemed_at', 'status'];
  const redemptionsRows = (premium.coupon_redemptions || []).map((r) => toUnifiedRow('redeem_rocket_premium', r.id, r, redemptionKeys));
  await insertBatch('coupon_redemptions', redemptionsRows);

  // ---- ADMIN_CONFIG (RedeemRocket) ----
  const adminConfigKeys = ['config_key', 'config_value', 'created_at', 'updated_at'];
  const adminRows = (rr.admin_config || []).map((r) => toUnifiedRow('RedeemRocket', r.id, r, adminConfigKeys));
  await insertBatch('admin_config', adminRows);

  console.log('\nMigration complete.');
}

main()
  .then(() => {
    if (pgClient) pgClient.end();
  })
  .catch((err) => {
    if (pgClient) pgClient.end();
    console.error(err);
    process.exit(1);
  });
