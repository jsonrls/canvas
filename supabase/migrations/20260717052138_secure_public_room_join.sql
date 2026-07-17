begin;

drop policy "Users can join accessible rooms" on public.room_members;
revoke insert on table public.room_members from authenticated;

drop function private.can_join_room(uuid);

create function public.join_public_room(input_room_id uuid)
returns table (joined_room_id uuid, joined_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  room_is_public boolean;
  membership_role text;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to join a room.'
      using errcode = '42501';
  end if;

  select room.is_public
  into room_is_public
  from public.rooms as room
  where room.id = input_room_id;

  if room_is_public is null or not room_is_public then
    raise exception 'That public room is unavailable.'
      using errcode = '42501';
  end if;

  select membership.role
  into membership_role
  from public.room_members as membership
  where membership.room_id = input_room_id
    and membership.user_id = authenticated_user_id;

  if membership_role is null then
    insert into public.room_members (room_id, user_id, role)
    values (input_room_id, authenticated_user_id, 'editor')
    on conflict (room_id, user_id) do nothing;

    select membership.role
    into membership_role
    from public.room_members as membership
    where membership.room_id = input_room_id
      and membership.user_id = authenticated_user_id;
  end if;

  if membership_role is null then
    raise exception 'The public room could not be joined.';
  end if;

  return query select input_room_id, membership_role;
end;
$$;

revoke all on function public.join_public_room(uuid)
  from public, anon, authenticated;
grant execute on function public.join_public_room(uuid)
  to authenticated;

comment on function public.join_public_room(uuid) is
  'Atomically adds the authenticated user as an editor of an existing public room.';

commit;
