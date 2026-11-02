begin;

alter table public.rooms
  add column banner_storage_path text,
  add constraint rooms_banner_storage_path check (
    banner_storage_path is null
    or (
      split_part(banner_storage_path, '/', 1) = id::text
      and banner_storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]jpg$'
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'room-banners',
  'room-banners',
  false,
  716800,
  array['image/jpeg']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function private.can_read_room_banner_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]jpg$'
    then exists (
      select 1
      from public.rooms as room
      where room.id = split_part(object_name, '/', 1)::uuid
        and (
          room.is_public
          or private.is_room_member(room.id)
        )
    )
    else false
  end;
$$;

create function private.can_write_room_banner_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]jpg$'
    then private.is_room_owner(split_part(object_name, '/', 1)::uuid)
    else false
  end;
$$;

revoke all on function private.can_read_room_banner_object(text)
  from public, anon;
revoke all on function private.can_write_room_banner_object(text)
  from public, anon;
grant execute on function private.can_read_room_banner_object(text)
  to authenticated;
grant execute on function private.can_write_room_banner_object(text)
  to authenticated;

create policy "Accessible rooms can read private banners"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'room-banners'
  and private.can_read_room_banner_object(name)
);

create policy "Room owners can upload private banners"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'room-banners'
  and private.can_write_room_banner_object(name)
);

create policy "Room owners can delete private banners"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'room-banners'
  and private.can_write_room_banner_object(name)
);

comment on column public.rooms.banner_storage_path is
  'Versioned private Storage object path for the room banner uploaded by its owner.';
comment on function private.can_read_room_banner_object(text) is
  'Allows members and authenticated visitors of public rooms to read a valid room banner object.';
comment on function private.can_write_room_banner_object(text) is
  'Allows only the room owner to upload or remove a valid versioned room banner object.';

commit;
