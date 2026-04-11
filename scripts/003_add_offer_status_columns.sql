-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Add status & approval columns to offers table
-- Required by AdminPanel offer approval flow
-- Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Add status column (pending_approval → approved | rejected)
alter table offers
  add column if not exists status text not null default 'approved'
  check (status in ('pending_approval', 'approved', 'rejected'));

-- Add rejection reason
alter table offers
  add column if not exists rejection_reason text;

-- Add price column (used for cashback calculation)
alter table offers
  add column if not exists price numeric(12, 2) default 0;

-- Add MRP and selling_price to products table (for cashback formula)
alter table products
  add column if not exists mrp           numeric(12, 2) default 0;

alter table products
  add column if not exists selling_price numeric(12, 2) default 0;

-- Index for admin offer approval queue
create index if not exists offers_status_idx on offers (status);

-- Backfill: mark all existing offers as approved so they continue to show
update offers set status = 'approved' where status is null;
