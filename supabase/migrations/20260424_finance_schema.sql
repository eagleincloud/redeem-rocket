-- ═══════════════════════════════════════════════════════════════════════════
-- Finance Module - Core Schema
-- Tables: invoices, invoice_items, expenses, financial_summaries
-- ═══════════════════════════════════════════════════════════════════════════

-- ── invoices ───────────────────────────────────────────────────────────────
-- Main invoice record with customer and amount tracking
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number  text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','viewed','partial','paid','overdue','cancelled')),
  issue_date      date NOT NULL DEFAULT CURRENT_DATE,
  due_date        date NOT NULL,
  total_amount    numeric(14,2) NOT NULL,
  paid_amount     numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount      numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  notes           text,
  terms           text,
  last_sent_at    timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, invoice_number),
  CHECK (paid_amount <= total_amount),
  CHECK (discount_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices (business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices (business_id, due_date) WHERE status != 'paid' AND status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices (customer_id);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (true);

-- ── invoice_items ─────────────────────────────────────────────────────────
-- Individual line items for each invoice
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    numeric(10,2) NOT NULL,
  unit_price  numeric(14,2) NOT NULL,
  tax_rate    numeric(5,2) NOT NULL DEFAULT 0,
  amount      numeric(14,2) NOT NULL,
  order_index integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items (invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ii_all" ON public.invoice_items;
CREATE POLICY "ii_all" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);

-- ── expenses ───────────────────────────────────────────────────────────────
-- Business expense tracking
CREATE TABLE IF NOT EXISTS public.expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  category    text NOT NULL CHECK (category IN (
              'salary','rent','utilities','marketing','supplies','equipment',
              'software','travel','meals','insurance','taxes','other')),
  description text NOT NULL,
  amount      numeric(14,2) NOT NULL,
  currency    text NOT NULL DEFAULT 'USD',
  status      text NOT NULL DEFAULT 'recorded'
              CHECK (status IN ('draft','recorded','reimbursed','cancelled')),
  expense_date date NOT NULL,
  payment_method text CHECK (payment_method IN ('cash','card','bank_transfer','check','other')),
  receipt_url text,
  notes       text,
  approved_by uuid REFERENCES public.business_team_members(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business ON public.expenses (business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (business_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (business_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses (business_id, status);

DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;
CREATE TRIGGER expenses_set_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (true);

-- ── financial_summaries ────────────────────────────────────────────────────
-- Monthly/yearly financial aggregates
CREATE TABLE IF NOT EXISTS public.financial_summaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  period_type     text NOT NULL CHECK (period_type IN ('month','quarter','year')),
  total_revenue   numeric(14,2) NOT NULL DEFAULT 0,
  total_expenses  numeric(14,2) NOT NULL DEFAULT 0,
  total_invoiced  numeric(14,2) NOT NULL DEFAULT 0,
  total_paid      numeric(14,2) NOT NULL DEFAULT 0,
  net_income      numeric(14,2) NOT NULL DEFAULT 0,
  invoice_count   integer NOT NULL DEFAULT 0,
  expense_count   integer NOT NULL DEFAULT 0,
  outstanding_amount numeric(14,2) NOT NULL DEFAULT 0,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, period_start, period_end, period_type)
);

CREATE INDEX IF NOT EXISTS idx_summaries_business ON public.financial_summaries (business_id);
CREATE INDEX IF NOT EXISTS idx_summaries_period ON public.financial_summaries (business_id, period_start, period_end);

DROP TRIGGER IF EXISTS summaries_set_updated_at ON public.financial_summaries;
CREATE TRIGGER summaries_set_updated_at BEFORE UPDATE ON public.financial_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fs_all" ON public.financial_summaries;
CREATE POLICY "fs_all" ON public.financial_summaries FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger: Auto-update financial_summaries when invoices change
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_financial_summary_on_invoice_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_period_start date;
  v_period_end date;
  v_summary_id uuid;
BEGIN
  -- Determine the period (start and end of month)
  v_period_start := date_trunc('month', NEW.issue_date)::date;
  v_period_end := (date_trunc('month', NEW.issue_date) + interval '1 month' - interval '1 day')::date;

  -- Upsert financial summary for this period
  INSERT INTO public.financial_summaries (
    business_id, period_start, period_end, period_type,
    total_invoiced, total_paid, net_income, invoice_count,
    outstanding_amount, last_calculated_at
  ) SELECT
    NEW.business_id,
    v_period_start,
    v_period_end,
    'month'::text,
    COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status IN ('paid','viewed') THEN paid_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount - paid_amount ELSE 0 END), 0),
    COUNT(CASE WHEN status != 'cancelled' THEN 1 END),
    COALESCE(SUM(CASE WHEN status NOT IN ('paid','cancelled') THEN total_amount - paid_amount ELSE 0 END), 0),
    now()
  FROM public.invoices
  WHERE business_id = NEW.business_id
    AND issue_date >= v_period_start
    AND issue_date <= v_period_end
  ON CONFLICT (business_id, period_start, period_end, period_type) DO UPDATE SET
    total_invoiced = EXCLUDED.total_invoiced,
    total_paid = EXCLUDED.total_paid,
    net_income = EXCLUDED.net_income,
    invoice_count = EXCLUDED.invoice_count,
    outstanding_amount = EXCLUDED.outstanding_amount,
    last_calculated_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_summary_on_invoice ON public.invoices;
CREATE TRIGGER trigger_update_summary_on_invoice
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_financial_summary_on_invoice_change();

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger: Update invoice status when fully paid
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_invoice_status_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Check if invoice is fully paid
  IF NEW.paid_amount >= NEW.total_amount AND NEW.status NOT IN ('paid', 'cancelled') THEN
    NEW.status := 'paid';
  -- Check if partially paid
  ELSIF NEW.paid_amount > 0 AND NEW.status IN ('sent','viewed','draft') THEN
    NEW.status := 'partial';
  -- Check if overdue
  ELSIF CURRENT_DATE > NEW.due_date AND NEW.paid_amount < NEW.total_amount AND NEW.status NOT IN ('cancelled','paid') THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_status_on_payment ON public.invoices;
CREATE TRIGGER trigger_update_status_on_payment
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_status_on_payment();

-- ═══════════════════════════════════════════════════════════════════════════
-- Audit/Activity log for financial events
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.finance_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('invoice','expense','payment')),
  entity_id   uuid NOT NULL,
  action      text NOT NULL CHECK (action IN ('created','updated','sent','viewed','paid','cancelled','approved')),
  old_values  jsonb,
  new_values  jsonb,
  performed_by uuid,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_activities_business ON public.finance_activities (business_id);
CREATE INDEX IF NOT EXISTS idx_finance_activities_entity ON public.finance_activities (entity_type, entity_id);

ALTER TABLE public.finance_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fa_all" ON public.finance_activities;
CREATE POLICY "fa_all" ON public.finance_activities FOR ALL USING (true) WITH CHECK (true);
