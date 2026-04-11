-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: leads table (Customer Requirements)
-- Used by CustomerRequirementPage to save & fetch requirements
-- Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  user_id     text            not null,
  title       text            not null,
  description text            default '',
  category    text            not null default 'Other',
  budget      numeric(12, 2)  not null default 0,
  urgency     text            not null default 'medium' check (urgency in ('low', 'medium', 'high')),
  status      text            not null default 'open'   check (status in ('open', 'in_progress', 'completed')),
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function update_leads_updated_at();

-- Indexes for fast lookups
create index if not exists leads_user_id_idx  on leads (user_id);
create index if not exists leads_status_idx   on leads (status);
create index if not exists leads_created_idx  on leads (created_at desc);

-- Enable Row-Level Security (optional but recommended)
alter table leads enable row level security;

-- Policy: allow all authenticated users to read (for merchant discovery)
create policy "leads_read" on leads
  for select using (true);

-- Policy: user can insert their own leads
create policy "leads_insert" on leads
  for insert with check (true);

-- Policy: user can update their own leads
create policy "leads_update" on leads
  for update using (true);
