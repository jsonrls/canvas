begin;

create function private.can_edit_room(target_room_id uuid)
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
        and membership.role in ('owner', 'editor')
    );
$$;

create function private.can_edit_document(target_document_id uuid)
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
        and membership.role in ('owner', 'editor')
    );
$$;

revoke all on function private.can_edit_room(uuid) from public, anon;
revoke all on function private.can_edit_document(uuid) from public, anon;
grant execute on function private.can_edit_room(uuid) to authenticated;
grant execute on function private.can_edit_document(uuid) to authenticated;

drop policy "Members can create documents" on public.documents;
create policy "Editors can create documents"
on public.documents
for insert
to authenticated
with check (
  private.can_edit_room(room_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy "Members can update documents" on public.documents;
create policy "Editors can update documents"
on public.documents
for update
to authenticated
using (private.can_edit_room(room_id))
with check (
  private.can_edit_room(room_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy "Members can create document versions" on public.document_versions;
create policy "Editors can create document versions"
on public.document_versions
for insert
to authenticated
with check (
  private.can_edit_document(document_id)
  and created_by = (select auth.uid())
);

comment on function private.can_edit_room(uuid) is
  'Returns true only for authenticated owner/editor memberships.';
comment on function private.can_edit_document(uuid) is
  'Returns true only when an authenticated owner/editor can mutate the document.';

commit;
