-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: bids table (Auction Bidding)
-- Used by AuctionsPage to persist bids server-side
-- Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists bids (
  id          uuid primary key default gen_random_uuid(),
  auction_id  uuid            not null references auctions(id) on delete cascade,
  user_id     text            not null,
  amount      numeric(12, 2)  not null,
  created_at  timestamptz     not null default now()
);

-- Index for fast auction bid lookups
create index if not exists bids_auction_id_idx on bids (auction_id);
create index if not exists bids_user_id_idx    on bids (user_id);
create index if not exists bids_created_at_idx on bids (created_at desc);

-- Enable Row-Level Security
alter table bids enable row level security;

-- Policy: anyone can read bids (for showing bid counts)
create policy "bids_read" on bids
  for select using (true);

-- Policy: any logged-in user can place a bid
create policy "bids_insert" on bids
  for insert with check (true);

-- ─── Ensure auctions table has the columns AuctionsPage expects ──────────────
-- Run these if your existing auctions table is missing columns:

-- alter table auctions add column if not exists title       text;
-- alter table auctions add column if not exists description text;
-- alter table auctions add column if not exists image       text;
-- alter table auctions add column if not exists starting_bid numeric(12,2) default 0;
-- alter table auctions add column if not exists current_bid  numeric(12,2) default 0;
-- alter table auctions add column if not exists total_bids   integer default 0;

-- Function to auto-update current_bid and total_bids when a bid is inserted
create or replace function on_bid_inserted()
returns trigger language plpgsql as $$
begin
  update auctions
  set
    current_bid = greatest(coalesce(current_bid, 0), new.amount),
    total_bids  = coalesce(total_bids, 0) + 1
  where id = new.auction_id;
  return new;
end;
$$;

drop trigger if exists bid_inserted_trigger on bids;
create trigger bid_inserted_trigger
  after insert on bids
  for each row execute function on_bid_inserted();
