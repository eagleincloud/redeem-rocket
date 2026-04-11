-- RedeemRocket → Supabase PostgreSQL
-- Review and run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "admin_config" (
  "id" text NOT NULL,
  "config_key" text NOT NULL,
  "config_value" text NOT NULL,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "advertisements" (
  "id" text NOT NULL,
  "merchant_id" text,
  "placement" text NOT NULL,
  "image_url" text NOT NULL,
  "link_url" text,
  "start_date" timestamptz,
  "end_date" timestamptz,
  "is_active" integer,
  "click_count" integer,
  "impression_count" integer,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_claim_requests" (
  "id" text NOT NULL,
  "scraped_business_id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "owner_name" text NOT NULL,
  "owner_email" text,
  "owner_phone" text NOT NULL,
  "owner_address" text,
  "business_license_number" text,
  "gst_number" text,
  "pan_number" text,
  "additional_documents" jsonb,
  "status" text,
  "admin_notes" text,
  "admin_id" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "businesses" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "image" text,
  "lat" numeric NOT NULL,
  "lng" numeric NOT NULL,
  "address" text,
  "phone" text,
  "email" text,
  "rating" numeric,
  "is_active" integer,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cart" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "product_id" text NOT NULL,
  "quantity" integer,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_auction_bids" (
  "id" text NOT NULL,
  "auction_id" text NOT NULL,
  "user_id" text NOT NULL,
  "bid_amount" numeric NOT NULL,
  "bid_payment_amount" numeric NOT NULL,
  "status" text,
  "payment_status" text,
  "otp" text,
  "refund_amount" numeric,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lead_participations" (
  "lead_id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "fee_paid" numeric NOT NULL,
  "paid_at" timestamptz,
  PRIMARY KEY ("lead_id")
);

CREATE TABLE IF NOT EXISTS "merchant_auctions" (
  "id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "product_name" text NOT NULL,
  "product_image" text,
  "product_video" text,
  "category" text,
  "quantity" integer,
  "base_price" numeric NOT NULL,
  "current_bid" numeric,
  "bid_count" integer,
  "duration_hours" integer,
  "bid_increment" numeric,
  "bid_start_date" timestamptz,
  "bid_end_date" timestamptz,
  "product_expiry_date" date,
  "has_guarantee" integer,
  "status" text,
  "winner" text,
  "created_at" timestamptz,
  "ended_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_offers" (
  "id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "config" text,
  "is_active" integer,
  "redemption_count" integer,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_products" (
  "id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "name" text NOT NULL,
  "price" numeric NOT NULL,
  "selling_price" numeric,
  "discount_type" text,
  "discount_value" numeric,
  "split_rule" numeric,
  "category" text,
  "image" text,
  "product_video" text,
  "description" text,
  "quantity" integer,
  "is_featured" integer,
  "allow_silver_rr" integer,
  "cashback_amount" numeric,
  "platform_margin" numeric,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_settlements" (
  "id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "order_id" text,
  "amount" numeric NOT NULL,
  "settlement_type" text,
  "status" text,
  "settled_at" timestamptz,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_wallet_transactions" (
  "id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "amount" numeric NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchants" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "merchant_key" text,
  "name" text NOT NULL,
  "phone" text,
  "email" text,
  "role" text,
  "categories" text,
  "shop_name" text,
  "area" text,
  "pincode" text,
  "pan_number" text,
  "gstin" text,
  "aadhaar_number" text,
  "wallet_balance" numeric,
  "trial_days_left" integer,
  "is_active" integer,
  "badges" text,
  "package_tier" text,
  "rules" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "offers" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "discount" numeric NOT NULL,
  "discount_type" text,
  "min_purchase" numeric,
  "coin_multiplier" integer,
  "business_id" text,
  "valid_from" timestamptz,
  "valid_until" timestamptz,
  "is_active" integer,
  "image" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" text NOT NULL,
  "order_id" text NOT NULL,
  "product_id" text NOT NULL,
  "quantity" integer NOT NULL,
  "price" numeric NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "merchant_id" text,
  "lead_id" text,
  "total_amount" numeric NOT NULL,
  "cashback_used" numeric,
  "gold_rr_used" numeric,
  "silver_rr_used" numeric,
  "cash_paid" numeric,
  "cashback_amount" numeric,
  "platform_margin" numeric,
  "payment_method" text,
  "status" text,
  "address" text,
  "otp" text,
  "otp_verified" integer,
  "otp_verified_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "otps" (
  "id" text NOT NULL,
  "phone" text,
  "email" text,
  "code" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "verified" integer,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "platform_revenue" (
  "id" text NOT NULL,
  "source" text NOT NULL,
  "amount" numeric NOT NULL,
  "description" text,
  "order_id" text,
  "auction_id" text,
  "lead_id" text,
  "advertisement_id" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price" numeric NOT NULL,
  "image" text,
  "category" text,
  "business_id" text NOT NULL,
  "coin_multiplier" integer,
  "stock" integer,
  "is_active" integer,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "requirement_bids" (
  "id" text NOT NULL,
  "requirement_id" text NOT NULL,
  "merchant_id" text NOT NULL,
  "amount" numeric NOT NULL,
  "message" text,
  "eta" text,
  "status" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "requirements" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text,
  "budget" numeric,
  "location" text,
  "platform_fee" numeric,
  "status" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "schema_migrations" (
  "version" text NOT NULL,
  "applied_at" timestamptz,
  PRIMARY KEY ("version")
);

CREATE TABLE IF NOT EXISTS "scraped_businesses" (
  "id" text NOT NULL,
  "merchant_key" text,
  "place_id" text,
  "name" text NOT NULL,
  "category" text,
  "subcategory" text,
  "address" text,
  "area" text,
  "city" text,
  "pincode" text,
  "phone" text,
  "mobile" text,
  "email" text,
  "website" text,
  "latitude" numeric,
  "longitude" numeric,
  "rating" numeric,
  "review_count" integer,
  "price_level" text,
  "opening_hours" text,
  "business_status" text,
  "types" text,
  "description" text,
  "amenities" text,
  "verification_status" text,
  "claimed_by_merchant_id" text,
  "verified_by_admin_id" text,
  "verified_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "scratch_cards" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "order_id" text NOT NULL,
  "reward_type" text NOT NULL,
  "reward_amount" numeric NOT NULL,
  "reward_message" text,
  "is_scratched" integer,
  "scratched_at" timestamptz,
  "created_at" timestamptz,
  "expires_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_events" (
  "id" integer NOT NULL GENERATED BY DEFAULT AS IDENTITY,
  "user_id" text NOT NULL,
  "event_type" text NOT NULL,
  "entity_id" text,
  "metadata" jsonb,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_signals" (
  "id" integer NOT NULL GENERATED BY DEFAULT AS IDENTITY,
  "user_id" text,
  "product_id" text,
  "signal_type" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "email" text,
  "password" text,
  "role" text,
  "cashback_balance" numeric,
  "coins" numeric,
  "gold_rr" numeric,
  "silver_rr" numeric,
  "whatsapp_notifications" integer,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "amount" numeric NOT NULL,
  "type" text NOT NULL,
  "category" text,
  "description" text,
  "order_id" text,
  "product_name" text,
  "merchant_name" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);
