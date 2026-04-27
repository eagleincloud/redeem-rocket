-- Create products table for business product management
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  price numeric(10, 2) NOT NULL,
  selling_price numeric(10, 2),
  stock integer DEFAULT 0,
  image text,
  emoji text DEFAULT '📦',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(business_id, category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(business_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "products_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;

-- Products are only visible to owner
CREATE POLICY "products_own" ON public.products
  FOR SELECT USING (auth.uid() = business_id);

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid() = business_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid() = business_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();
