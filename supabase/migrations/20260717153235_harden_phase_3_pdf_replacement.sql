begin;

alter table public.documents
  drop constraint documents_pdf_metadata;

alter table public.documents
  add constraint documents_pdf_metadata check (
    (
      pdf_storage_path is null
      and pdf_file_name is null
      and pdf_file_size is null
      and pdf_asset_revision is null
    )
    or (
      kind = 'pdf'
      and pdf_storage_path = room_id::text || '/' || pdf_asset_revision::text || '.pdf'
      and char_length(btrim(pdf_file_name)) between 1 and 180
      and pdf_file_size between 5 and 15728640
      and pdf_asset_revision is not null
    )
  );

create or replace function private.can_read_room_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
    then private.is_room_member(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

create or replace function private.can_write_room_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
    then private.can_edit_room(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

create policy "Room editors can delete replaced private PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_room_pdf_object(name)
);

comment on constraint documents_pdf_metadata on public.documents is
  'Keeps one active versioned private PDF object path aligned with its room and revision.';

commit;
