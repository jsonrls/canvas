begin;

create or replace function public.join_breakout_room(
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
    on conflict on constraint breakout_room_members_pkey do nothing;
  end if;

  return query
  select matched_breakout_id, normalized_code;
end;
$$;

comment on function public.join_breakout_room(uuid, text) is
  'Atomically records an idempotent viewer breakout membership after validating its private code.';

commit;
