begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    char_length(btrim(display_name)) between 1 and 60
  ),
  constraint profiles_avatar_path_length check (
    avatar_path is null or char_length(avatar_path) <= 500
  )
);

create function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      target_profile_id = (select auth.uid())
      or exists (
        select 1
        from public.room_members as own_membership
        join public.room_members as target_membership
          on target_membership.room_id = own_membership.room_id
        where own_membership.user_id = (select auth.uid())
          and target_membership.user_id = target_profile_id
      )
    );
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_display_name text;
begin
  candidate_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Study partner'
  );

  insert into public.profiles (id, display_name, created_at, updated_at)
  values (
    new.id,
    left(candidate_display_name, 60),
    coalesce(new.created_at, now()),
    coalesce(new.created_at, now())
  );

  return new;
end;
$$;

create function private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger update_profile_timestamp
before update on public.profiles
for each row execute function private.touch_profile_updated_at();

insert into public.profiles (id, display_name, created_at, updated_at)
select
  existing_user.id,
  left(
    coalesce(
      nullif(btrim(existing_user.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(existing_user.email, ''), '@', 1), ''),
      'Study partner'
    ),
    60
  ),
  coalesce(existing_user.created_at, now()),
  coalesce(existing_user.updated_at, existing_user.created_at, now())
from auth.users as existing_user
on conflict (id) do nothing;

revoke all on function private.can_view_profile(uuid) from public, anon;
grant execute on function private.can_view_profile(uuid) to authenticated;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.touch_profile_updated_at()
  from public, anon, authenticated;

alter table public.profiles enable row level security;

create policy "Users can view shared-room profiles"
on public.profiles
for select
to authenticated
using (private.can_view_profile(id));

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

comment on table public.profiles is
  'Public application identity data linked one-to-one with auth.users.';
comment on column public.profiles.avatar_path is
  'Optional storage path only; public or signed URL generation belongs in the application.';
comment on function private.can_view_profile(uuid) is
  'Allows an authenticated user to see their profile or a profile sharing a room.';
comment on function private.handle_new_user() is
  'Creates the public profile row required by application clients after signup.';

commit;
