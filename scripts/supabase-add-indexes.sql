-- Run in Supabase SQL Editor to add indexes to existing tables (idempotent)
CREATE INDEX IF NOT EXISTS idx_businesses_lat_lng ON public.businesses (lat, lng);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses (is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers (is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_offers_end_date ON public.offers (end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions (type);
CREATE INDEX IF NOT EXISTS idx_scraped_businesses_lat_lng ON public.scraped_businesses (lat, lng);
CREATE INDEX IF NOT EXISTS idx_scraped_businesses_name ON public.scraped_businesses (name);
