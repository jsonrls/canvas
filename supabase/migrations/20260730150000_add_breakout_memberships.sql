begin;

create table public.breakout_room_members (
  breakout_room_id uuid not null references public.breakout_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (breakout_room_id, user_id)
);

create index breakout_room_members_user_id_idx
  on public.breakout_room_members(user_id);

alter table public.breakout_room_members enable row level security;

create policy "Participants can view their breakout memberships"
on public.breakout_room_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_edit_breakout(breakout_room_id))
);

revoke all on table public.breakout_room_members
  from public, anon, authenticated;
grant select on table public.breakout_room_members
  to authenticated;

create or replace function private.is_breakout_member(
  target_breakout_room_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.breakout_rooms as breakout
      join public.room_members as parent_membership
        on parent_membership.room_id = breakout.room_id
        and parent_membership.user_id = (select auth.uid())
      left join public.breakout_room_members as breakout_membership
        on breakout_membership.breakout_room_id = breakout.id
        and breakout_membership.user_id = (select auth.uid())
      where breakout.id = target_breakout_room_id
        and (
          parent_membership.role in ('owner', 'editor')
          or breakout_membership.user_id is not null
        )
    );
$$;

drop policy if exists "Room members can view breakout rooms"
  on public.breakout_rooms;

create policy "Facilitators and joined participants can view breakout rooms"
on public.breakout_rooms
for select
to authenticated
using ((select private.is_breakout_member(id)));

create function public.list_breakout_room_directory(
  input_room_id uuid
)
returns table (
  breakout_room_id uuid,
  breakout_room_name text,
  breakout_room_created_at timestamptz,
  breakout_room_code text,
  is_joined boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  parent_role text;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to view breakout rooms.'
      using errcode = '42501';
  end if;

  select membership.role
  into parent_role
  from public.room_members as membership
  where membership.room_id = input_room_id
    and membership.user_id = authenticated_user_id;

  if parent_role is null then
    raise exception 'Parent-room membership is required to view breakout rooms.'
      using errcode = '42501';
  end if;

  return query
  select
    breakout.id,
    breakout.name,
    breakout.created_at,
    case
      when parent_role in ('owner', 'editor')
        or joined.user_id is not null
      then breakout.code
      else null
    end,
    (
      parent_role in ('owner', 'editor')
      or joined.user_id is not null
    )
  from public.breakout_rooms as breakout
  left join public.breakout_room_members as joined
    on joined.breakout_room_id = breakout.id
    and joined.user_id = authenticated_user_id
  where breakout.room_id = input_room_id
  order by breakout.created_at asc
  limit 100;
end;
$$;

create function public.count_breakout_rooms(
  input_room_id uuid
)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  breakout_count bigint;
begin
  if authenticated_user_id is null
    or not exists (
      select 1
      from public.room_members as membership
      where membership.room_id = input_room_id
        and membership.user_id = authenticated_user_id
    )
  then
    raise exception 'Parent-room membership is required to count breakout rooms.'
      using errcode = '42501';
  end if;

  select count(*)
  into breakout_count
  from public.breakout_rooms as breakout
  where breakout.room_id = input_room_id;

  return breakout_count;
end;
$$;

create function public.join_breakout_room(
  input_room_id uuid,
  input_code text
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
  normalized_code text := upper(btrim(coalesce(input_code, '')));
  parent_role text;
  matched_breakout_id uuid;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to join a breakout room.'
      using errcode = '42501';
  end if;

  if normalized_code !~ '^[A-Z0-9]{8}$' then
    raise exception 'Enter a valid 8-character breakout room code.'
      using errcode = '22023';
  end if;

  select membership.role
  into parent_role
  from public.room_members as membership
  where membership.room_id = input_room_id
    and membership.user_id = authenticated_user_id;

  if parent_role is null then
    raise exception 'Parent-room membership is required to join a breakout room.'
      using errcode = '42501';
  end if;

  select breakout.id
  into matched_breakout_id
  from public.breakout_rooms as breakout
  where breakout.room_id = input_room_id
    and breakout.code = normalized_code;

  if matched_breakout_id is null then
    raise exception 'That breakout room does not belong to this study room.'
      using errcode = '22023';
  end if;

  if parent_role = 'viewer' then
    insert into public.breakout_room_members (
      breakout_room_id,
      user_id
    )
    values (
      matched_breakout_id,
      authenticated_user_id
    )
    on conflict (breakout_room_id, user_id) do nothing;
  end if;

  return query
  select matched_breakout_id, normalized_code;
end;
$$;

revoke all on function public.list_breakout_room_directory(uuid)
  from public, anon, authenticated;
revoke all on function public.count_breakout_rooms(uuid)
  from public, anon, authenticated;
revoke all on function public.join_breakout_room(uuid, text)
  from public, anon, authenticated;

grant execute on function public.list_breakout_room_directory(uuid)
  to authenticated;
grant execute on function public.count_breakout_rooms(uuid)
  to authenticated;
grant execute on function public.join_breakout_room(uuid, text)
  to authenticated;

comment on table public.breakout_room_members is
  'Persistent participant join status for private breakout rooms.';
comment on function public.list_breakout_room_directory(uuid) is
  'Lists parent-room breakouts while revealing codes only to facilitators and joined participants.';
comment on function public.count_breakout_rooms(uuid) is
  'Counts all breakouts for an authenticated parent-room member.';
comment on function public.join_breakout_room(uuid, text) is
  'Atomically records a viewer breakout membership after validating its private code.';
comment on function private.is_breakout_member(uuid) is
  'Authorizes breakout reads for parent-room facilitators and persistently joined viewers.';

commit;
