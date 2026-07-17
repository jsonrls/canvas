begin;

update public.rooms
set name = left(
  coalesce(nullif(regexp_replace(btrim(name), '\\s+', ' ', 'g'), ''), 'Study room'),
  120
)
where name is distinct from left(
  coalesce(nullif(regexp_replace(btrim(name), '\\s+', ' ', 'g'), ''), 'Study room'),
  120
);

alter table public.rooms
  drop constraint rooms_name_length;

alter table public.rooms
  add constraint rooms_name_length check (
    char_length(btrim(name)) between 1 and 120
  );

insert into public.room_members (room_id, user_id, role)
select room.id, room.owner_id, 'owner'
from public.rooms as room
on conflict (room_id, user_id)
do update set role = 'owner';

insert into public.documents (room_id, kind, title, updated_by)
select
  room.id,
  'notes',
  left(room.name || ' shared notes', 160),
  room.owner_id
from public.rooms as room
on conflict (room_id, kind) do nothing;

create function private.is_room_owner_user(
  target_room_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_user_id is not null
    and exists (
      select 1
      from public.rooms as room
      where room.id = target_room_id
        and room.owner_id = target_user_id
    );
$$;

create function private.touch_room_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.protect_room_membership_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.room_id is distinct from old.room_id
    or new.user_id is distinct from old.user_id
  then
    raise exception 'Room membership identity cannot be changed.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger update_room_timestamp
before update on public.rooms
for each row execute function private.touch_room_updated_at();

create trigger protect_room_membership_identity
before update on public.room_members
for each row execute function private.protect_room_membership_identity();

revoke all on function private.is_room_owner_user(uuid, uuid)
  from public, anon;
grant execute on function private.is_room_owner_user(uuid, uuid)
  to authenticated;

revoke all on function private.touch_room_updated_at()
  from public, anon, authenticated;
revoke all on function private.protect_room_membership_identity()
  from public, anon, authenticated;

drop policy "Authenticated users can create owned rooms" on public.rooms;
revoke insert on table public.rooms from authenticated;

drop policy "Room owners can update memberships" on public.room_members;
create policy "Room owners can update non-owner memberships"
on public.room_members
for update
to authenticated
using (
  private.is_room_owner(room_id)
  and not private.is_room_owner_user(room_id, user_id)
)
with check (
  private.is_room_owner(room_id)
  and not private.is_room_owner_user(room_id, user_id)
  and role in ('editor', 'viewer')
);

drop policy "Users can leave or owners can remove memberships"
  on public.room_members;
create policy "Non-owners can leave or be removed"
on public.room_members
for delete
to authenticated
using (
  not private.is_room_owner_user(room_id, user_id)
  and (
    user_id = (select auth.uid())
    or private.is_room_owner(room_id)
  )
);

create function public.create_study_room(
  input_name text,
  input_is_public boolean default false
)
returns table (room_id uuid, room_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  normalized_name text;
  slug_base text;
  created_room_id uuid;
  created_room_slug text;
  attempt integer;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to create a room.'
      using errcode = '42501';
  end if;

  normalized_name := regexp_replace(btrim(coalesce(input_name, '')), '\\s+', ' ', 'g');

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Room names must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  slug_base := trim(
    both '-' from lower(regexp_replace(normalized_name, '[^a-zA-Z0-9]+', '-', 'g'))
  );
  slug_base := left(coalesce(nullif(slug_base, ''), 'study-room'), 48);

  for attempt in 1..5 loop
    created_room_slug := slug_base || '-' || left(
      replace(pg_catalog.gen_random_uuid()::text, '-', ''),
      10
    );

    begin
      insert into public.rooms (slug, name, owner_id, is_public)
      values (
        created_room_slug,
        normalized_name,
        authenticated_user_id,
        coalesce(input_is_public, false)
      )
      returning id into created_room_id;

      exit;
    exception
      when unique_violation then
        created_room_id := null;
    end;
  end loop;

  if created_room_id is null then
    raise exception 'A unique room address could not be generated. Try again.'
      using errcode = '23505';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (created_room_id, authenticated_user_id, 'owner');

  insert into public.documents (room_id, kind, title, updated_by)
  values (
    created_room_id,
    'notes',
    left(normalized_name || ' shared notes', 160),
    authenticated_user_id
  );

  return query select created_room_id, created_room_slug;
end;
$$;

create function public.add_room_member_by_email(
  input_room_id uuid,
  input_email text,
  input_role text default 'editor'
)
returns table (
  member_user_id uuid,
  member_display_name text,
  member_assigned_role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  normalized_email text;
  normalized_role text := lower(btrim(coalesce(input_role, '')));
  room_owner_id uuid;
  target_user_id uuid;
  target_display_name text;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to add a room member.'
      using errcode = '42501';
  end if;

  select room.owner_id
  into room_owner_id
  from public.rooms as room
  where room.id = input_room_id;

  if room_owner_id is null then
    raise exception 'That room is unavailable.'
      using errcode = 'P0002';
  end if;

  if room_owner_id <> authenticated_user_id then
    raise exception 'Only the room owner can add collaborators.'
      using errcode = '42501';
  end if;

  if normalized_role not in ('editor', 'viewer') then
    raise exception 'Collaborators must be added as an editor or viewer.'
      using errcode = '22023';
  end if;

  normalized_email := lower(btrim(coalesce(input_email, '')));

  if char_length(normalized_email) < 3
    or char_length(normalized_email) > 320
    or position('@' in normalized_email) < 2
  then
    raise exception 'Enter a valid BoardPrep account email.'
      using errcode = '22023';
  end if;

  select account.id
  into target_user_id
  from auth.users as account
  where lower(account.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'No BoardPrep account matches that email.'
      using errcode = 'P0002';
  end if;

  if target_user_id = room_owner_id then
    raise exception 'The room owner is already a member.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.room_members as membership
    where membership.room_id = input_room_id
      and membership.user_id = target_user_id
  ) then
    raise exception 'That account is already a room member.'
      using errcode = '23505';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (input_room_id, target_user_id, normalized_role);

  select profile.display_name
  into target_display_name
  from public.profiles as profile
  where profile.id = target_user_id;

  return query
  select
    target_user_id,
    coalesce(target_display_name, 'Study partner'),
    normalized_role;
end;
$$;

revoke all on function public.create_study_room(text, boolean)
  from public, anon, authenticated;
revoke all on function public.add_room_member_by_email(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.create_study_room(text, boolean)
  to authenticated;
grant execute on function public.add_room_member_by_email(uuid, text, text)
  to authenticated;

comment on function public.create_study_room(text, boolean) is
  'Atomically creates an authenticated user-owned room, owner membership, and notes document.';
comment on function public.add_room_member_by_email(uuid, text, text) is
  'Lets a room owner add one existing account without exposing auth user rows.';
comment on function private.is_room_owner_user(uuid, uuid) is
  'Protects the immutable owner membership from role changes, removal, and self-leave.';

commit;
