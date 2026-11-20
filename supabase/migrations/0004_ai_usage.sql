-- 0004: a daily counter for the AI price helper, so a bug or a stuck button can never run up
-- the Gemini bill. Stores only how many checks ran each day, never the answers (Google's
-- terms don't allow storing Grounded Results).

create table ai_usage (
  day   date primary key default current_date,
  count integer not null default 0 check (count >= 0)
);

alter table ai_usage enable row level security;
create policy "admin full access" on ai_usage
  for all to authenticated using (true) with check (true);
revoke all on ai_usage from anon;

-- Counts one AI call for today if today's count is under the limit. Returns true when the call
-- may go ahead, false when the limit is reached. Atomic, so two taps can't both slip through.
create function use_ai_quota(daily_limit integer) returns boolean
language sql
security invoker
as $$
  with bumped as (
    insert into ai_usage as u (day, count) values (current_date, 1)
    on conflict (day) do update set count = u.count + 1
      where u.count < daily_limit
    returning 1
  )
  select exists (select 1 from bumped);
$$;

revoke all on function use_ai_quota(integer) from anon, public;
grant execute on function use_ai_quota(integer) to authenticated;
