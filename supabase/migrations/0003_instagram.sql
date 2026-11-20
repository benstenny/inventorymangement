-- Resale Inventory Manager: add Instagram as a place to sell.
-- Run AFTER 0002_business_plan.sql. Paste this whole file into Supabase > SQL Editor > New query, click Run.
--
-- What changes:
--   * Instagram joins Depop and flea market.
--   * "Listed on" becomes a list (any of Depop, Instagram, flea market) instead of
--     DEPOP / FLEA_MARKET / BOTH, which stopped making sense with three places.
--     Existing "BOTH" items become Depop + flea market.
--   * Instagram gets a 0% fee preset (sales are paid by Venmo, Zelle or cash).

alter type sale_platform add value if not exists 'INSTAGRAM' after 'DEPOP';

-- ---------------------------------------------------------------------------
-- listed_on: single value -> list of platforms. Empty list = not listed yet.
-- ---------------------------------------------------------------------------
alter table items add column listed_on_list sale_platform[] not null default '{}';

update items
   set listed_on_list = case listed_on::text
         when 'BOTH'        then array['DEPOP', 'FLEA_MARKET']::sale_platform[]
         when 'DEPOP'       then array['DEPOP']::sale_platform[]
         when 'FLEA_MARKET' then array['FLEA_MARKET']::sale_platform[]
         else '{}'::sale_platform[]
       end;

alter table items drop column listed_on;
drop type listed_on;
alter table items rename column listed_on_list to listed_on;

-- ---------------------------------------------------------------------------
-- Settings: Instagram fee preset; remember platforms as a list from now on.
-- ---------------------------------------------------------------------------
alter table settings alter column fee_presets set default '{
  "DEPOP":       { "percent": 3.3, "fixedCents": 45 },
  "INSTAGRAM":   { "percent": 0,   "fixedCents": 0 },
  "FLEA_MARKET": { "percent": 0,   "fixedCents": 0 }
}'::jsonb;

update settings
   set fee_presets = '{"INSTAGRAM": {"percent": 0, "fixedCents": 0}}'::jsonb || fee_presets,
       last_used   = last_used - 'platform';
