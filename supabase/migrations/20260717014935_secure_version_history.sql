begin;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_slug_format check (slug ~ '^[a-z0-9-]{1,64}$'),
  constraint rooms_name_length check (char_length(name) between 1 and 120)
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint room_members_role check (role in ('owner', 'editor', 'viewer'))
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  kind text not null default 'notes',
  title text not null,
  yjs_state text,
  yjs_state_updated_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, kind),
  constraint documents_kind check (kind in ('notes')),
  constraint documents_title_length check (char_length(title) between 1 and 160),
  constraint documents_yjs_state_size check (
    yjs_state is null or octet_length(yjs_state) <= 25165824
  )
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  label text not null,
  content jsonb not null,
  yjs_state text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint document_versions_label_length check (
    char_length(btrim(label)) between 1 and 80
  ),
  constraint document_versions_content_object check (
    jsonb_typeof(content) = 'object'
  ),
  constraint document_versions_yjs_state_size check (
    octet_length(yjs_state) between 1 and 25165824
  )
);

create index rooms_owner_id_idx on public.rooms(owner_id);
create index room_members_user_id_idx on public.room_members(user_id);
create index documents_room_id_idx on public.documents(room_id);
create index document_versions_document_created_at_idx
  on public.document_versions(document_id, created_at desc);
create index document_versions_created_by_idx
  on public.document_versions(created_by);

create function private.is_room_member(target_room_id uuid)
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
      from public.room_members as membership
      where membership.room_id = target_room_id
        and membership.user_id = (select auth.uid())
    );
$$;

create function private.is_room_owner(target_room_id uuid)
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
      from public.rooms as room
      where room.id = target_room_id
        and room.owner_id = (select auth.uid())
    );
$$;

create function private.can_join_room(target_room_id uuid)
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
      from public.rooms as room
      where room.id = target_room_id
        and (room.is_public or room.owner_id = (select auth.uid()))
    );
$$;

create function private.can_access_document(target_document_id uuid)
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
      from public.documents as document
      join public.room_members as membership
        on membership.room_id = document.room_id
      where document.id = target_document_id
        and membership.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_room_member(uuid) from public, anon;
revoke all on function private.is_room_owner(uuid) from public, anon;
revoke all on function private.can_join_room(uuid) from public, anon;
revoke all on function private.can_access_document(uuid) from public, anon;

grant execute on function private.is_room_member(uuid) to authenticated;
grant execute on function private.is_room_owner(uuid) to authenticated;
grant execute on function private.can_join_room(uuid) to authenticated;
grant execute on function private.can_access_document(uuid) to authenticated;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy "Authenticated users can view accessible rooms"
on public.rooms
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or is_public
  or private.is_room_member(id)
);

create policy "Authenticated users can create owned rooms"
on public.rooms
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Room owners can update rooms"
on public.rooms
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Room owners can delete rooms"
on public.rooms
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Members can view room memberships"
on public.room_members
for select
to authenticated
using (private.is_room_member(room_id) or private.is_room_owner(room_id));

create policy "Users can join accessible rooms"
on public.room_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (
      role = 'owner'
      and private.is_room_owner(room_id)
    )
    or (
      role = 'editor'
      and private.can_join_room(room_id)
    )
  )
);

create policy "Room owners can update memberships"
on public.room_members
for update
to authenticated
using (private.is_room_owner(room_id))
with check (private.is_room_owner(room_id));

create policy "Users can leave or owners can remove memberships"
on public.room_members
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_room_owner(room_id)
);

create policy "Members can view documents"
on public.documents
for select
to authenticated
using (private.is_room_member(room_id));

create policy "Members can create documents"
on public.documents
for insert
to authenticated
with check (
  private.is_room_member(room_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy "Members can update documents"
on public.documents
for update
to authenticated
using (private.is_room_member(room_id))
with check (
  private.is_room_member(room_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy "Room owners can delete documents"
on public.documents
for delete
to authenticated
using (private.is_room_owner(room_id));

create policy "Members can view document versions"
on public.document_versions
for select
to authenticated
using (private.can_access_document(document_id));

create policy "Members can create document versions"
on public.document_versions
for insert
to authenticated
with check (
  private.can_access_document(document_id)
  and created_by = (select auth.uid())
);

revoke all on table public.rooms from anon, authenticated;
revoke all on table public.room_members from anon, authenticated;
revoke all on table public.documents from anon, authenticated;
revoke all on table public.document_versions from anon, authenticated;

grant select, insert, update, delete on table public.rooms to authenticated;
grant select, insert, update, delete on table public.room_members to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert on table public.document_versions to authenticated;

comment on table public.rooms is
  'Authenticated study rooms; public rooms still require a signed-in identity.';
comment on table public.room_members is
  'Authorization boundary for collaborative room, document, and version access.';
comment on table public.documents is
  'Current durable Yjs state for one collaborative document per room and kind.';
comment on table public.document_versions is
  'Immutable member-created rich-text and Yjs snapshots used for version history.';

commit;
