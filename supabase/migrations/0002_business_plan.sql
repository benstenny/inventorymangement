-- Resale Inventory Manager: changes from the business plan (Nov 2026)
-- Run AFTER 0001_init.sql. Paste this whole file into Supabase > SQL Editor > New query, click Run.
--
-- What changes:
--   * She sells on Depop and at flea markets (not Instagram).
--   * Three photos per item (front, back, styled) instead of one.
--   * Measurements, flaws and a "washed" flag for the prep checklist.
--   * Sale payment method (flea markets: Venmo, Zelle, cash) and shipping proof photo.
--   * An expenses table (supplies, laundromat and so on) for the monthly report.
--   * Settings for pricing (lowest price, haggle room), shipping time, budgets and suggestions.

begin;

-- ---------------------------------------------------------------------------
-- Platforms: Depop and flea market. Instagram values (if any) become Depop.
-- ---------------------------------------------------------------------------
alter table items
  alter column listed_on     type text using listed_on::text,
  alter column sold_platform type text using sold_platform::text;

update items set listed_on = 'DEPOP' where listed_on = 'INSTAGRAM';
update items set sold_platform = 'DEPOP' where sold_platform = 'INSTAGRAM';

drop type listed_on;
drop type sale_platform;
create type listed_on     as enum ('DEPOP', 'FLEA_MARKET', 'BOTH');
create type sale_platform as enum ('DEPOP', 'FLEA_MARKET');

alter table items
  alter column listed_on     type listed_on     using listed_on::listed_on,
  alter column sold_platform type sale_platform using sold_platform::sale_platform;

create type payment_method as enum ('DEPOP', 'VENMO', 'ZELLE', 'CASH');

-- ---------------------------------------------------------------------------
-- Items: photos, prep and sale details
-- ---------------------------------------------------------------------------
alter table items rename column photo_path to photo_front_path;

alter table items
  add column photo_back_path   text,
  add column photo_styled_path text,
  add column flaws             text,
  add column measurements      jsonb not null default '{}'::jsonb
    check (jsonb_typeof(measurements) = 'object'),
  add column washed            boolean not null default false,
  add column payment_method    payment_method,
  add column shipped_date      date,
  add column ship_proof_path   text;

-- Sold items waiting to be packed, for the "Pack today" list.
create index items_to_pack_idx on items (sold_date) where status = 'SOLD' and archived_at is null;

-- ---------------------------------------------------------------------------
-- Expenses: supplies, laundromat, anything that isn't the cost of an item.
-- ---------------------------------------------------------------------------
create type expense_kind as enum ('SUPPLIES', 'UPKEEP', 'OTHER');

create table expenses (
  id         uuid primary key default gen_random_uuid(),
  spent_on   date not null default current_date,
  kind       expense_kind not null default 'SUPPLIES',
  amount     integer not null check (amount > 0),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_spent_on_idx on expenses (spent_on);

create trigger expenses_updated_at
  before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;
create policy "admin full access" on expenses
  for all to authenticated using (true) with check (true);
revoke all on expenses from anon;

-- ---------------------------------------------------------------------------
-- Settings: pricing, shipping, budgets and suggestion lists
-- ---------------------------------------------------------------------------
alter table settings
  add column min_price        integer not null default 1000  check (min_price >= 0),   -- $10
  add column haggle_room      integer not null default 300   check (haggle_room >= 0), -- $3
  add column ship_within_days integer not null default 5     check (ship_within_days > 0),
  add column inventory_budget integer not null default 13000 check (inventory_budget >= 0), -- $130/month
  add column upkeep_budget    integer not null default 7000  check (upkeep_budget >= 0),    -- $70/month
  add column sources          text[]  not null default array[
    'Thrift Vintage Fashion', 'OC Rag House', 'Goodwill', 'Salvation Army'
  ],
  add column storage_spots    text[]  not null default array['Tops bin', 'Bottoms bin'];

-- Fee presets: flea market is free; Depop stays a starting guess to check against her Depop account.
alter table settings alter column fee_presets set default '{
  "DEPOP":       { "percent": 3.3, "fixedCents": 45 },
  "FLEA_MARKET": { "percent": 0,   "fixedCents": 0 }
}'::jsonb;

update settings
   set fee_presets = (fee_presets - 'INSTAGRAM')
                     || '{"FLEA_MARKET": {"percent": 0, "fixedCents": 0}}'::jsonb,
       last_used   = case when last_used->>'platform' = 'INSTAGRAM'
                          then last_used - 'platform' else last_used end;

commit;
