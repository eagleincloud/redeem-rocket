-- ── Requirements Quote Columns ──────────────────────────────────────────────
-- Adds quote tracking columns to customer_requirements table.
-- Used by RequirementsManagePage when a business sends a price quote.
--
-- Run in Supabase SQL editor.

ALTER TABLE public.customer_requirements
  ADD COLUMN IF NOT EXISTS my_quote_message  text,
  ADD COLUMN IF NOT EXISTS my_quote_price    numeric(14,2),
  ADD COLUMN IF NOT EXISTS my_quote_sent_at  timestamptz;
