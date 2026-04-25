-- ═══════════════════════════════════════════════════════════════════════════
-- Inventory Module - Stock and Valuation
-- Tables: inventory_items, inventory_movements, inventory_valuations
-- ═══════════════════════════════════════════════════════════════════════════

-- ── inventory_items ───────────────────────────────────────────────────────
-- Core inventory product tracking
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  sku             text NOT NULL,
  name            text NOT NULL,
  description     text,
  category        text,
  quantity_on_hand numeric(10,2) NOT NULL DEFAULT 0,
  reorder_level   numeric(10,2) NOT NULL DEFAULT 10,
  unit_cost       numeric(14,2) NOT NULL,
  selling_price   numeric(14,2) NOT NULL,
  unit            text NOT NULL DEFAULT 'unit'  -- unit, pack, box, etc.
  supplier_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  location        text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, sku),
  CHECK (quantity_on_hand >= 0),
  CHECK (unit_cost > 0),
  CHECK (selling_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON public.inventory_items (business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items (sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items (business_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON public.inventory_items (business_id)
  WHERE quantity_on_hand <= reorder_level AND is_active = true;

DROP TRIGGER IF EXISTS inventory_items_set_updated_at ON public.inventory_items;
CREATE TRIGGER inventory_items_set_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ii_select" ON public.inventory_items;
DROP POLICY IF EXISTS "ii_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "ii_update" ON public.inventory_items;
DROP POLICY IF EXISTS "ii_delete" ON public.inventory_items;
CREATE POLICY "ii_select" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "ii_insert" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "ii_update" ON public.inventory_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ii_delete" ON public.inventory_items FOR DELETE USING (true);

-- ── inventory_movements ───────────────────────────────────────────────────
-- Track all inventory changes (purchases, sales, adjustments, losses)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type   text NOT NULL CHECK (movement_type IN (
                  'purchase','sale','adjustment','loss','return','transfer','opening')),
  quantity        numeric(10,2) NOT NULL,
  unit_cost       numeric(14,2),
  reference_type  text CHECK (reference_type IN ('invoice','expense','order','manual')),
  reference_id    uuid,
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CHECK (quantity != 0)
);

CREATE INDEX IF NOT EXISTS idx_movements_business ON public.inventory_movements (business_id);
CREATE INDEX IF NOT EXISTS idx_movements_item ON public.inventory_movements (inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.inventory_movements (business_id, movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.inventory_movements (created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "im_all" ON public.inventory_movements;
CREATE POLICY "im_all" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

-- ── inventory_valuations ───────────────────────────────────────────────────
-- Period snapshot of total inventory value
CREATE TABLE IF NOT EXISTS public.inventory_valuations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  valuation_date  date NOT NULL,
  total_items     integer NOT NULL DEFAULT 0,
  total_quantity  numeric(14,2) NOT NULL DEFAULT 0,
  total_cost_value numeric(14,2) NOT NULL DEFAULT 0,
  total_retail_value numeric(14,2) NOT NULL DEFAULT 0,
  valuation_method text NOT NULL DEFAULT 'fifo'
                  CHECK (valuation_method IN ('fifo','lifo','weighted_average')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, valuation_date)
);

CREATE INDEX IF NOT EXISTS idx_valuations_business ON public.inventory_valuations (business_id);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON public.inventory_valuations (business_id, valuation_date DESC);

DROP TRIGGER IF EXISTS valuations_set_updated_at ON public.inventory_valuations;
CREATE TRIGGER valuations_set_updated_at BEFORE UPDATE ON public.inventory_valuations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_valuations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "iv_all" ON public.inventory_valuations;
CREATE POLICY "iv_all" ON public.inventory_valuations FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger: Update inventory quantity on movement
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.inventory_items
  SET quantity_on_hand = quantity_on_hand + NEW.quantity
  WHERE id = NEW.inventory_item_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_inventory_quantity ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_quantity
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_movement();

-- ═══════════════════════════════════════════════════════════════════════════
-- Function: Calculate total inventory value for a business
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calculate_inventory_total_value(p_business_id text)
RETURNS TABLE(
  total_cost_value numeric,
  total_retail_value numeric,
  total_items bigint,
  total_quantity numeric
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ii.quantity_on_hand * ii.unit_cost), 0)::numeric,
    COALESCE(SUM(ii.quantity_on_hand * ii.selling_price), 0)::numeric,
    COUNT(*)::bigint,
    COALESCE(SUM(ii.quantity_on_hand), 0)::numeric
  FROM public.inventory_items ii
  WHERE ii.business_id = p_business_id AND ii.is_active = true;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Function: Get low stock items
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_low_stock_items(p_business_id text)
RETURNS TABLE(
  id uuid,
  sku text,
  name text,
  quantity_on_hand numeric,
  reorder_level numeric,
  unit_cost numeric
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ii.id,
    ii.sku,
    ii.name,
    ii.quantity_on_hand,
    ii.reorder_level,
    ii.unit_cost
  FROM public.inventory_items ii
  WHERE ii.business_id = p_business_id
    AND ii.is_active = true
    AND ii.quantity_on_hand <= ii.reorder_level
  ORDER BY ii.quantity_on_hand ASC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Inventory audit log
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inventory_audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  item_id     uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  action      text NOT NULL,
  old_quantity numeric(10,2),
  new_quantity numeric(10,2),
  performed_by uuid,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_business ON public.inventory_audit_logs (business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_item ON public.inventory_audit_logs (item_id);

ALTER TABLE public.inventory_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ial_all" ON public.inventory_audit_logs;
CREATE POLICY "ial_all" ON public.inventory_audit_logs FOR ALL USING (true) WITH CHECK (true);
