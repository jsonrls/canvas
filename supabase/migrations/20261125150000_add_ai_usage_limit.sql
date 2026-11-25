begin;

-- One row per accepted AI request, so limits hold across server instances.
create table public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_feature
    check (feature in ('study-pack', 'whiteboard-answer'))
);

create index ai_usage_events_user_feature_idx
  on public.ai_usage_events(user_id, feature, created_at);
create index ai_usage_events_created_at_idx
  on public.ai_usage_events(created_at);

alter table public.ai_usage_events enable row level security;
revoke all on table public.ai_usage_events from public, anon, authenticated;
grant select, insert, delete on table public.ai_usage_events to service_role;

-- Returns 0 and records the request, or the seconds to wait.
create function public.consume_ai_allowance(
  input_user_id uuid,
  input_feature text,
  input_window_seconds integer,
  input_window_limit integer,
  input_day_limit integer,
  input_app_day_limit integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  window_count integer;
  window_start timestamptz;
  day_count integer;
  day_start timestamptz;
  app_count integer;
  app_start timestamptz;
begin
  -- One lock, so concurrent requests cannot pass the same limit together.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('consume_ai_allowance')
  );

  delete from public.ai_usage_events
  where created_at < pg_catalog.now() - interval '24 hours';

  select count(*), min(created_at) into app_count, app_start
  from public.ai_usage_events;

  select
    count(*), min(created_at),
    count(*) filter (where created_at > pg_catalog.now()
      - pg_catalog.make_interval(secs => input_window_seconds)),
    min(created_at) filter (where created_at > pg_catalog.now()
      - pg_catalog.make_interval(secs => input_window_seconds))
  into day_count, day_start, window_count, window_start
  from public.ai_usage_events
  where user_id = input_user_id and feature = input_feature;

  if app_count >= input_app_day_limit then
    return greatest(1, ceil(extract(epoch from
      app_start + interval '24 hours' - pg_catalog.now()))::integer);
  end if;
  if day_count >= input_day_limit then
    return greatest(1, ceil(extract(epoch from
      day_start + interval '24 hours' - pg_catalog.now()))::integer);
  end if;
  if window_count >= input_window_limit then
    return greatest(1, ceil(extract(epoch from window_start
      + pg_catalog.make_interval(secs => input_window_seconds)
      - pg_catalog.now()))::integer);
  end if;

  insert into public.ai_usage_events (user_id, feature)
  values (input_user_id, input_feature);
  return 0;
end;
$$;

revoke all on function public.consume_ai_allowance(
  uuid, text, integer, integer, integer, integer
) from public, anon, authenticated;
grant execute on function public.consume_ai_allowance(
  uuid, text, integer, integer, integer, integer
) to service_role;

comment on table public.ai_usage_events is
  'Accepted AI requests of the last 24 hours, for rate limits. Service-role access only.';

commit;
