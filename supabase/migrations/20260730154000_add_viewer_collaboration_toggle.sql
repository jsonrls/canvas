begin;

alter table public.rooms
add column viewer_can_collaborate boolean not null default false;

create function private.can_collaborate_room(target_room_id uuid)
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
      join public.room_members as membership
        on membership.room_id = room.id
      where room.id = target_room_id
        and membership.user_id = (select auth.uid())
        and (
          membership.role in ('owner', 'editor')
          or (
            membership.role = 'viewer'
            and room.viewer_can_collaborate
          )
        )
    );
$$;

create function private.can_collaborate_document(target_document_id uuid)
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
      where document.id = target_document_id
        and private.can_collaborate_room(document.room_id)
    );
$$;

create function private.can_collaborate_breakout(
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
      join public.rooms as room
        on room.id = breakout.room_id
      join public.room_members as parent_membership
        on parent_membership.room_id = room.id
        and parent_membership.user_id = (select auth.uid())
      left join public.breakout_room_members as breakout_membership
        on breakout_membership.breakout_room_id = breakout.id
        and breakout_membership.user_id = (select auth.uid())
      where breakout.id = target_breakout_room_id
        and (
          parent_membership.role in ('owner', 'editor')
          or (
            parent_membership.role = 'viewer'
            and room.viewer_can_collaborate
            and breakout_membership.user_id is not null
          )
        )
    );
$$;

revoke all on function private.can_collaborate_room(uuid)
  from public, anon;
revoke all on function private.can_collaborate_document(uuid)
  from public, anon;
revoke all on function private.can_collaborate_breakout(uuid)
  from public, anon;
grant execute on function private.can_collaborate_room(uuid)
  to authenticated;
grant execute on function private.can_collaborate_document(uuid)
  to authenticated;
grant execute on function private.can_collaborate_breakout(uuid)
  to authenticated;

drop policy if exists "Editors can create documents"
  on public.documents;
create policy "Collaborators can create documents"
on public.documents
for insert
to authenticated
with check (
  (select private.can_collaborate_room(room_id))
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy if exists "Editors can update documents"
  on public.documents;
create policy "Collaborators can update documents"
on public.documents
for update
to authenticated
using ((select private.can_collaborate_room(room_id)))
with check (
  (select private.can_collaborate_room(room_id))
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy if exists "Editors can create document versions"
  on public.document_versions;
create policy "Collaborators can create document versions"
on public.document_versions
for insert
to authenticated
with check (
  (select private.can_collaborate_document(document_id))
  and created_by = (select auth.uid())
);

drop policy if exists "Room editors can update breakout documents"
  on public.breakout_documents;
create policy "Breakout collaborators can update documents"
on public.breakout_documents
for update
to authenticated
using ((select private.can_collaborate_breakout(breakout_room_id)))
with check (
  (select private.can_collaborate_breakout(breakout_room_id))
  and (updated_by is null or updated_by = (select auth.uid()))
);

create function public.set_viewer_collaboration(
  input_room_id uuid,
  input_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  updated_enabled boolean;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to change collaboration access.'
      using errcode = '42501';
  end if;

  if input_enabled is null then
    raise exception 'Choose whether viewers can collaborate.'
      using errcode = '22023';
  end if;

  update public.rooms as room
  set viewer_can_collaborate = input_enabled
  where room.id = input_room_id
    and exists (
      select 1
      from public.room_members as membership
      where membership.room_id = room.id
        and membership.user_id = authenticated_user_id
        and membership.role in ('owner', 'editor')
    )
  returning room.viewer_can_collaborate
  into updated_enabled;

  if updated_enabled is null then
    raise exception 'Only room owners and editors can change collaboration access.'
      using errcode = '42501';
  end if;

  return updated_enabled;
end;
$$;

revoke all on function public.set_viewer_collaboration(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_viewer_collaboration(uuid, boolean)
  to authenticated;

comment on column public.rooms.viewer_can_collaborate is
  'Global parent-room switch allowing viewers to type, draw, annotate, and save collaborative changes.';
comment on function private.can_collaborate_room(uuid) is
  'Authorizes room document collaboration for facilitators and enabled viewers.';
comment on function private.can_collaborate_document(uuid) is
  'Authorizes version creation through the parent room collaboration switch.';
comment on function private.can_collaborate_breakout(uuid) is
  'Authorizes breakout collaboration for facilitators and enabled joined viewers.';
comment on function public.set_viewer_collaboration(uuid, boolean) is
  'Allows a parent-room owner or editor to toggle viewer collaboration across the room and its breakouts.';

commit;
