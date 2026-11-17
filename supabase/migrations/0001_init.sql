-- Resale Inventory Manager: initial schema (v1)
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- Safe to run once on a fresh project.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type item_status as enum (
  'SOURCED', 'NEEDS_PHOTOS', 'LISTED', 'SOLD', 'SHIPPED', 'RETURNED'
);
create type listed_on as enum ('DEPOP', 'INSTAGRAM', 'BOTH');
create type sale_platform as enum ('DEPOP', 'INSTAGRAM');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Categories: the managed list. Each one owns its SKU prefix and counter,
-- so SKUs like TOP-0042 are never reused, even after an item is archived.
-- ---------------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  sku_prefix  text not null unique check (sku_prefix ~ '^[A-Z]{2,5}$'),
  next_number integer not null default 1 check (next_number > 0),
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Items: one flat table. All money is integer cents.
-- ---------------------------------------------------------------------------
create table items (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null unique,
  category_id      uuid not null references categories (id),

  title            text not null check (length(trim(title)) > 0),
  brand            text,
  size             text,
  color            text,
  condition        text,
  description      text,

  photo_path       text,          -- path inside the item-photos storage bucket

  source           text,
  source_cost      integer not null default 0 check (source_cost >= 0),
  acquired_date    date not null default current_date,
  storage_location text,

  status           item_status not null default 'SOURCED',

  listed_on        listed_on,
  list_price       integer check (list_price >= 0),
  listed_date      date,

  sold_platform    sale_platform,
  sold_price       integer check (sold_price >= 0),
  sold_date        date,
  platform_fees    integer check (platform_fees >= 0),
  shipping_cost    integer check (shipping_cost >= 0),
  buyer_notes      text,

  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index items_status_idx   on items (status) where archived_at is null;
create index items_category_idx on items (category_id);
create index items_sold_date_idx on items (sold_date) where sold_date is not null;

create trigger items_updated_at
  before update on items
  for each row execute function set_updated_at();

-- Never hard-delete an item with sale history; archive it instead.
create function prevent_sold_item_delete() returns trigger
language plpgsql as $$
begin
  if old.sold_date is not null or old.sold_price is not null then
    raise exception 'Items with a sale can''t be deleted. Archive it instead.';
  end if;
  return old;
end;
$$;

create trigger items_no_delete_sold
  before delete on items
  for each row execute function prevent_sold_item_delete();

-- ---------------------------------------------------------------------------
-- next_sku: atomically hands out the next SKU for a category, e.g. TOP-0042.
-- ---------------------------------------------------------------------------
create function next_sku(p_category_id uuid) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_prefix text;
  v_number integer;
begin
  update categories
     set next_number = next_number + 1
   where id = p_category_id
  returning sku_prefix, next_number - 1 into v_prefix, v_number;

  if v_prefix is null then
    raise exception 'Unknown category';
  end if;

  return v_prefix || '-' || lpad(v_number::text, 4, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- Settings: a single row. Fee presets are data, never hardcoded in the app.
-- ---------------------------------------------------------------------------
create table settings (
  id          boolean primary key default true check (id), -- only one row allowed
  -- Starting guesses only. Depop's fees change by country and over time;
  -- check your Depop fee page and update this row (v1.1 adds an editor).
  fee_presets jsonb not null default '{
    "INSTAGRAM": { "percent": 0,   "fixedCents": 0 },
    "DEPOP":     { "percent": 3.3, "fixedCents": 45 }
  }'::jsonb,
  stale_days  integer not null default 30 check (stale_days > 0),
  last_used   jsonb not null default '{}'::jsonb, -- { source, storageLocation, platform }
  updated_at  timestamptz not null default now()
);

create trigger settings_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: only the logged-in admin can read or write anything.
-- Sign-ups are disabled in Supabase Auth, so "authenticated" means her.
-- The publishable (anon) key alone sees nothing.
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table items      enable row level security;
alter table settings   enable row level security;

create policy "admin full access" on categories
  for all to authenticated using (true) with check (true);
create policy "admin full access" on items
  for all to authenticated using (true) with check (true);
create policy "admin full access" on settings
  for all to authenticated using (true) with check (true);

revoke all on categories, items, settings from anon;
revoke execute on function next_sku(uuid) from anon, public;
grant execute on function next_sku(uuid) to authenticated, service_role;

-- health_check: lets /api/health (called by a daily cron, not logged in)
-- touch the database so the free project doesn't pause. Returns no data.
create function health_check() returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from settings) $$;

revoke execute on function health_check() from public;
grant execute on function health_check() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: a private bucket for the one reference photo per item.
-- The app shows photos through short-lived signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 2097152, array['image/webp', 'image/jpeg']);

create policy "admin reads photos" on storage.objects
  for select to authenticated using (bucket_id = 'item-photos');
create policy "admin uploads photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'item-photos');
create policy "admin updates photos" on storage.objects
  for update to authenticated using (bucket_id = 'item-photos');
create policy "admin deletes photos" on storage.objects
  for delete to authenticated using (bucket_id = 'item-photos');

-- ---------------------------------------------------------------------------
-- Starter data
-- ---------------------------------------------------------------------------
insert into settings default values;

insert into categories (name, sku_prefix, sort_order) values
  ('Tops',        'TOP', 1),
  ('Bottoms',     'BTM', 2),
  ('Dresses',     'DRS', 3),
  ('Outerwear',   'OUT', 4),
  ('Shoes',       'SHO', 5),
  ('Bags',        'BAG', 6),
  ('Accessories', 'ACC', 7),
  ('Other',       'OTH', 8);
