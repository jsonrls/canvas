begin;

alter table public.documents
  drop constraint documents_kind;

alter table public.documents
  add constraint documents_kind check (
    kind in ('notes', 'pdf', 'whiteboard')
  ),
  add column pdf_storage_path text,
  add column pdf_file_name text,
  add column pdf_file_size bigint,
  add column pdf_asset_revision uuid,
  add constraint documents_pdf_metadata check (
    (
      pdf_storage_path is null
      and pdf_file_name is null
      and pdf_file_size is null
      and pdf_asset_revision is null
    )
    or (
      kind = 'pdf'
      and pdf_storage_path = room_id::text || '/source.pdf'
      and char_length(btrim(pdf_file_name)) between 1 and 180
      and pdf_file_size between 5 and 15728640
      and pdf_asset_revision is not null
    )
  );

insert into public.documents (room_id, kind, title, updated_by)
select room.id, tool.kind, left(room.name || tool.title_suffix, 160), room.owner_id
from public.rooms as room
cross join (
  values
    ('pdf', ' shared PDF'),
    ('whiteboard', ' whiteboard')
) as tool(kind, title_suffix)
on conflict (room_id, kind) do nothing;

create or replace function public.create_study_room(
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

  normalized_name := regexp_replace(
    btrim(coalesce(input_name, '')),
    '\\s+',
    ' ',
    'g'
  );

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Room names must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  slug_base := trim(
    both '-' from lower(
      regexp_replace(normalized_name, '[^a-zA-Z0-9]+', '-', 'g')
    )
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
  values
    (
      created_room_id,
      'notes',
      left(normalized_name || ' shared notes', 160),
      authenticated_user_id
    ),
    (
      created_room_id,
      'pdf',
      left(normalized_name || ' shared PDF', 160),
      authenticated_user_id
    ),
    (
      created_room_id,
      'whiteboard',
      left(normalized_name || ' whiteboard', 160),
      authenticated_user_id
    );

  return query select created_room_id, created_room_slug;
end;
$$;

create function private.can_read_room_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/source\\.pdf$'
    then private.is_room_member(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

create function private.can_write_room_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/source\\.pdf$'
    then private.can_edit_room(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

revoke all on function private.can_read_room_pdf_object(text)
  from public, anon;
revoke all on function private.can_write_room_pdf_object(text)
  from public, anon;
grant execute on function private.can_read_room_pdf_object(text)
  to authenticated;
grant execute on function private.can_write_room_pdf_object(text)
  to authenticated;

create policy "Room members can read private PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_read_room_pdf_object(name)
);

create policy "Room editors can upload private PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_room_pdf_object(name)
);

create policy "Room editors can replace private PDFs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_room_pdf_object(name)
)
with check (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_room_pdf_object(name)
);

comment on function private.can_read_room_pdf_object(text) is
  'Authorizes private PDF object reads from the room-id storage prefix.';
comment on function private.can_write_room_pdf_object(text) is
  'Authorizes private PDF object writes only for owner/editor memberships.';
comment on column public.documents.pdf_storage_path is
  'Private BoardPrep PDF Storage object path; populated only for the pdf document kind.';
comment on column public.documents.pdf_asset_revision is
  'Changes on every PDF replacement so stale collaborative annotations stay isolated.';

commit;
