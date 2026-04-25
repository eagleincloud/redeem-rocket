-- ═══════════════════════════════════════════════════════════════════════════
-- Payments Module - Stripe Integration Schema
-- Tables: transactions, stripe_customers, invoice_payments, payment_methods
-- ═══════════════════════════════════════════════════════════════════════════

-- ── stripe_customers ───────────────────────────────────────────────────────
-- Maps business/customers to Stripe customer records
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  stripe_customer_id text NOT NULL,
  email           text NOT NULL,
  name            text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, stripe_customer_id),
  UNIQUE(business_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_business ON public.stripe_customers (business_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers (stripe_customer_id);

DROP TRIGGER IF EXISTS stripe_customers_set_updated_at ON public.stripe_customers;
CREATE TRIGGER stripe_customers_set_updated_at BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sc_all" ON public.stripe_customers;
CREATE POLICY "sc_all" ON public.stripe_customers FOR ALL USING (true) WITH CHECK (true);

-- ── payment_methods ───────────────────────────────────────────────────────
-- Saved payment methods for customers
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL REFERENCES public.stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  stripe_payment_method_id text NOT NULL,
  type            text NOT NULL CHECK (type IN ('card','bank_account','wallet')),

  -- Card details
  card_brand      text,  -- visa, mastercard, amex, etc.
  card_last_four  text,
  card_exp_month  integer,
  card_exp_year   integer,

  -- Bank account details
  bank_account_last_four text,
  bank_account_holder_name text,

  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(stripe_customer_id, stripe_payment_method_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON public.payment_methods (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON public.payment_methods (stripe_customer_id) WHERE is_default = true;

DROP TRIGGER IF EXISTS payment_methods_set_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_set_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pm_all" ON public.payment_methods;
CREATE POLICY "pm_all" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

-- ── transactions ───────────────────────────────────────────────────────────
-- Payment transactions from Stripe
CREATE TABLE IF NOT EXISTS public.transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     text NOT NULL,
  stripe_id       text UNIQUE,
  stripe_charge_id text,
  stripe_payment_intent_id text,
  amount          numeric(14,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','succeeded','failed','cancelled','refunded','disputed')),

  payment_method_type text CHECK (payment_method_type IN ('card','bank_account','wallet','manual')),
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  stripe_customer_id text REFERENCES public.stripe_customers(stripe_customer_id) ON DELETE SET NULL,

  description     text,
  statement_descriptor text,
  receipt_email   text,
  receipt_url     text,

  metadata        jsonb,  -- Custom data passed to Stripe
  error_code      text,
  error_message   text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_business ON public.transactions (business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (business_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_id ON public.transactions (stripe_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (created_at DESC);

DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "txn_all" ON public.transactions;
CREATE POLICY "txn_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- ── invoice_payments ───────────────────────────────────────────────────────
-- Link invoices to payments (one invoice can have multiple payments)
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  transaction_id  uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount          numeric(14,2) NOT NULL,
  notes           text,
  applied_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CHECK (amount > 0),
  UNIQUE(invoice_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON public.invoice_payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_transaction ON public.invoice_payments (transaction_id);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ip_all" ON public.invoice_payments;
CREATE POLICY "ip_all" ON public.invoice_payments FOR ALL USING (true) WITH CHECK (true);

-- ── refunds ────────────────────────────────────────────────────────────────
-- Refund records for transactions
CREATE TABLE IF NOT EXISTS public.refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  stripe_refund_id text UNIQUE,
  amount          numeric(14,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','succeeded','failed','cancelled')),
  reason          text CHECK (reason IN ('duplicate','fraudulent','requested_by_customer','expired_uncaptured_charge','other')),
  metadata        jsonb,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON public.refunds (transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds (status);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON public.refunds (stripe_refund_id);

DROP TRIGGER IF EXISTS refunds_set_updated_at ON public.refunds;
CREATE TRIGGER refunds_set_updated_at BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rf_all" ON public.refunds;
CREATE POLICY "rf_all" ON public.refunds FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: Update invoice paid_amount when invoice_payment is created/deleted
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_invoice_paid_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_paid numeric(14,2);
BEGIN
  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice paid_amount
  UPDATE public.invoices
  SET paid_amount = v_total_paid
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_invoice_payment ON public.invoice_payments;
CREATE TRIGGER trigger_sync_invoice_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_paid_amount();

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: Update transaction status based on refunds
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_transaction_on_refund()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_refunded numeric(14,2);
  v_transaction_amount numeric(14,2);
BEGIN
  -- Get transaction amount
  SELECT amount INTO v_transaction_amount
  FROM public.transactions
  WHERE id = NEW.transaction_id;

  -- Calculate total refunded
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
  FROM public.refunds
  WHERE transaction_id = NEW.transaction_id AND status = 'succeeded';

  -- Update transaction status
  UPDATE public.transactions
  SET status = CASE
      WHEN v_total_refunded >= v_transaction_amount THEN 'refunded'
      WHEN v_total_refunded > 0 THEN 'refunded'
      ELSE status
    END
  WHERE id = NEW.transaction_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_transaction_on_refund ON public.refunds;
CREATE TRIGGER trigger_update_transaction_on_refund
  AFTER UPDATE ON public.refunds
  FOR EACH ROW WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION public.update_transaction_on_refund();

-- ═══════════════════════════════════════════════════════════════════════════
-- Payment audit log
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('transaction','refund','payment_method')),
  entity_id   uuid,
  stripe_id   text,
  action      text NOT NULL,
  status      text,
  amount      numeric(14,2),
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_business ON public.payment_audit_logs (business_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_entity ON public.payment_audit_logs (entity_type, entity_id);

ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pal_all" ON public.payment_audit_logs;
CREATE POLICY "pal_all" ON public.payment_audit_logs FOR ALL USING (true) WITH CHECK (true);
