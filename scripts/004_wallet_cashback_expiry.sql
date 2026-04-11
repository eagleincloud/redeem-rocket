-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Wallet cashback expiry columns
-- Adds expiry_date to wallet_transactions; INR-only balance view
-- Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Add expiry date column (cashback credits expire 1 year after credit)
alter table wallet_transactions
  add column if not exists expiry_date timestamptz;

-- Backfill existing cashback rows with a 1-year expiry from created_at
update wallet_transactions
set expiry_date = created_at + interval '1 year'
where type = 'cashback' and expiry_date is null;

-- View: active (non-expired) wallet balance per user
create or replace view active_wallet_balance as
select
  user_id,
  sum(case when type in ('cashback', 'refund') then amount else -amount end) as balance_inr
from wallet_transactions
where
  (type in ('cashback', 'refund') and (expiry_date is null or expiry_date > now()))
  or type = 'payment'
group by user_id;

-- View: cashback credits expiring soon (within 30 days)
create or replace view expiring_cashback as
select
  id,
  user_id,
  amount,
  description,
  created_at,
  expiry_date,
  (expiry_date - now()) as time_until_expiry
from wallet_transactions
where
  type = 'cashback'
  and expiry_date is not null
  and expiry_date > now()
  and expiry_date <= now() + interval '30 days'
order by expiry_date asc;
