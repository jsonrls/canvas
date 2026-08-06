begin;

create table public.breakout_rooms (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  yjs_state text,
  yjs_state_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breakout_rooms_name_length check (
    char_length(btrim(name)) between 1 and 80
  ),
  constraint breakout_rooms_code_format check (
    code ~ '^[A-Z0-9]{8}$'
  ),
  constraint breakout_rooms_yjs_state_size check (
    yjs_state is null or octet_length(yjs_state) <= 25165824
  )
);

create index breakout_rooms_room_id_created_at_idx
  on public.breakout_rooms(room_id, created_at);
create index breakout_rooms_created_by_idx
  on public.breakout_rooms(created_by);
create index breakout_rooms_updated_by_idx
  on public.breakout_rooms(updated_by);

alter table public.breakout_rooms enable row level security;

create policy "Room members can view breakout rooms"
on public.breakout_rooms
for select
to authenticated
using (private.is_room_member(room_id));

revoke all on table public.breakout_rooms from public, anon, authenticated;
grant select on table public.breakout_rooms to authenticated;

create function public.create_breakout_room(
  input_room_id uuid,
  input_name text
)
returns table (
  breakout_room_id uuid,
  breakout_room_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  normalized_name text;
  created_breakout_room_id uuid;
  created_breakout_room_code text;
  attempt integer;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to create a breakout room.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.room_members as membership
    where membership.room_id = input_room_id
      and membership.user_id = authenticated_user_id
      and membership.role in ('owner', 'editor')
  ) then
    raise exception 'Only room owners and editors can create breakout rooms.'
      using errcode = '42501';
  end if;

  normalized_name := regexp_replace(
    btrim(coalesce(input_name, '')),
    '\s+',
    ' ',
    'g'
  );

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 80 then
    raise exception 'Breakout room names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  for attempt in 1..8 loop
    created_breakout_room_code := upper(
      left(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 8)
    );

    begin
      insert into public.breakout_rooms (
        room_id,
        name,
        code,
        created_by,
        updated_by
      )
      values (
        input_room_id,
        normalized_name,
        created_breakout_room_code,
        authenticated_user_id,
        authenticated_user_id
      )
      returning id into created_breakout_room_id;

      exit;
    exception
      when unique_violation then
        created_breakout_room_id := null;
    end;
  end loop;

  if created_breakout_room_id is null then
    raise exception 'A unique breakout room code could not be generated. Try again.'
      using errcode = '23505';
  end if;

  return query
  select created_breakout_room_id, created_breakout_room_code;
end;
$$;

revoke all on function public.create_breakout_room(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_breakout_room(uuid, text)
  to authenticated;

comment on table public.breakout_rooms is
  'Parent-room-scoped collaborative breakout notes with globally unique join codes.';
comment on column public.breakout_rooms.code is
  'Globally unique eight-character code used to open a breakout within its parent room.';
comment on function public.create_breakout_room(uuid, text) is
  'Creates a breakout room for an authenticated parent-room owner or editor.';

commit;
