-- =============================================================================
-- Redeem Rocket: Unified schema for Supabase PostgreSQL
-- Merges similar tables from RedeemRocket + redeem_rocket_premium MySQL DBs
-- Run this in Supabase SQL Editor, then run: node scripts/migrate-to-supabase.js
-- =============================================================================

-- Every merged table has: id (uuid PK), source_db, source_id (original DB id for traceability)
-- source_db = 'RedeemRocket' | 'redeem_rocket_premium'

-- -----------------------------------------------------------------------------
-- USERS (RedeemRocket.users + redeem_rocket_premium.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  name text,
  phone text,
  email text,
  password text,
  password_hash text,
  role text,
  cashback_balance numeric DEFAULT 0,
  coins numeric DEFAULT 0,
  gold_rr numeric DEFAULT 0,
  silver_rr numeric DEFAULT 0,
  whatsapp_notifications smallint DEFAULT 1,
  is_active smallint DEFAULT 1,
  last_login timestamptz,
  last_login_ip text,
  login_count int DEFAULT 0,
  failed_login_attempts int DEFAULT 0,
  firebase_uid text,
  username text,
  status text DEFAULT 'active',
  profile_image_url text,
  bio text,
  date_of_birth date,
  gender text,
  is_verified smallint DEFAULT 0,
  email_verified smallint DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_users_source ON public.users (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);

-- -----------------------------------------------------------------------------
-- MERCHANTS (RedeemRocket.merchants + redeem_rocket_premium.merchant_profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  user_id text,
  merchant_key text,
  name text,
  phone text,
  email text,
  role text,
  categories text,
  shop_name text,
  area text,
  pincode text,
  pan_number text,
  gstin text,
  aadhaar_number text,
  wallet_balance numeric DEFAULT 0,
  trial_days_left int DEFAULT 7,
  is_active smallint DEFAULT 0,
  badges text,
  package_tier text DEFAULT 'starter',
  rules text,
  business_id text,
  company_name text,
  logo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_merchants_source ON public.merchants (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants (user_id);

-- -----------------------------------------------------------------------------
-- BUSINESSES (RedeemRocket.businesses + redeem_rocket_premium.businesses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  merchant_id text,
  name text NOT NULL,
  type text,
  category text,
  description text,
  image text,
  lat numeric,
  lng numeric,
  address text,
  phone text,
  email text,
  rating numeric DEFAULT 0,
  review_count int DEFAULT 0,
  is_verified smallint DEFAULT 0,
  is_active smallint DEFAULT 1,
  featured smallint DEFAULT 0,
  views_count int DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_businesses_source ON public.businesses (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_businesses_merchant_id ON public.businesses (merchant_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses (category);
CREATE INDEX IF NOT EXISTS idx_businesses_lat_lng ON public.businesses (lat, lng);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses (is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses (created_at DESC);

-- -----------------------------------------------------------------------------
-- ORDERS (RedeemRocket.orders + redeem_rocket_premium.orders)
-- user_id/customer_id mapped to user_id; merchant_id/business_id mapped to business_id
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  user_id text,
  customer_id text,
  merchant_id text,
  business_id text,
  lead_id text,
  total_amount numeric NOT NULL,
  cashback_used numeric DEFAULT 0,
  gold_rr_used numeric DEFAULT 0,
  silver_rr_used numeric DEFAULT 0,
  cash_paid numeric DEFAULT 0,
  cashback_amount numeric DEFAULT 0,
  platform_margin numeric DEFAULT 0,
  payment_method text DEFAULT 'cash',
  status text DEFAULT 'pending',
  address text,
  otp text,
  otp_verified smallint DEFAULT 0,
  otp_verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders (merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON public.orders (business_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- -----------------------------------------------------------------------------
-- ORDER_ITEMS (RedeemRocket.order_items; premium may have in orders/line items)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text,
  order_id text NOT NULL,
  product_id text,
  offer_id text,
  name text,
  quantity int DEFAULT 1,
  price numeric,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- PRODUCTS (RedeemRocket.products + redeem_rocket_premium.premium_products / merchant_products)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  business_id text,
  merchant_id text,
  name text,
  description text,
  image text,
  price numeric,
  category text,
  sku text,
  stock_quantity int,
  is_active smallint DEFAULT 1,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_products_source ON public.products (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products (business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = 1;

-- -----------------------------------------------------------------------------
-- OFFERS (RedeemRocket.offers + redeem_rocket_premium.coupons as offer-type)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  business_id text,
  merchant_id text,
  title text,
  description text,
  discount_value numeric,
  discount_type text,
  min_order_value numeric,
  max_discount numeric,
  start_date timestamptz,
  end_date timestamptz,
  is_active smallint DEFAULT 1,
  usage_limit int,
  used_count int DEFAULT 0,
  code text,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_source ON public.offers (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_offers_business ON public.offers (business_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers (is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_offers_end_date ON public.offers (end_date) WHERE end_date IS NOT NULL;

-- -----------------------------------------------------------------------------
-- WALLET_TRANSACTIONS (RedeemRocket.wallet_transactions + redeem_rocket_premium.transactions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  user_id text,
  amount numeric,
  type text,
  description text,
  reference_type text,
  reference_id text,
  balance_after numeric,
  created_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_source ON public.wallet_transactions (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions (type);

-- -----------------------------------------------------------------------------
-- OTPS (RedeemRocket.otps + redeem_rocket_premium.otp_verifications)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL,
  source_id text NOT NULL,
  phone text,
  email text,
  otp_code text,
  purpose text,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_otps_source ON public.otps (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON public.otps (phone);

-- -----------------------------------------------------------------------------
-- SCRAPED_BUSINESSES (RedeemRocket only - keep for claim flow)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scraped_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL DEFAULT 'RedeemRocket',
  source_id text NOT NULL,
  name text,
  address text,
  phone text,
  lat numeric,
  lng numeric,
  place_id text,
  raw_json jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE INDEX IF NOT EXISTS idx_scraped_businesses_source ON public.scraped_businesses (source_db, source_id);
CREATE INDEX IF NOT EXISTS idx_scraped_businesses_lat_lng ON public.scraped_businesses (lat, lng);
CREATE INDEX IF NOT EXISTS idx_scraped_businesses_name ON public.scraped_businesses (name);

-- -----------------------------------------------------------------------------
-- COUPONS & COUPON_REDEMPTIONS (redeem_rocket_premium - keep as separate)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL DEFAULT 'redeem_rocket_premium',
  source_id text NOT NULL,
  merchant_id text,
  business_id text,
  title text,
  code text,
  discount_type text,
  discount_value numeric,
  min_order_value numeric,
  max_redemptions int,
  redeemed_count int DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active smallint DEFAULT 1,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL DEFAULT 'redeem_rocket_premium',
  source_id text NOT NULL,
  coupon_id text,
  customer_id text,
  business_id text,
  redemption_code text,
  amount_saved numeric,
  redeemed_at timestamptz,
  status text DEFAULT 'redeemed',
  UNIQUE (source_db, source_id)
);

-- -----------------------------------------------------------------------------
-- ADMIN_CONFIG (RedeemRocket)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_db text NOT NULL DEFAULT 'RedeemRocket',
  source_id text NOT NULL,
  config_key text NOT NULL,
  config_value text,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (source_db, source_id)
);

-- Enable RLS (optional; add policies per your app)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- etc.
