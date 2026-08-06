begin;

create table public.breakout_documents (
  id uuid primary key default gen_random_uuid(),
  breakout_room_id uuid not null references public.breakout_rooms(id) on delete cascade,
  kind text not null,
  title text not null,
  yjs_state text,
  yjs_state_updated_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  pdf_storage_path text,
  pdf_file_name text,
  pdf_file_size bigint,
  pdf_asset_revision uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (breakout_room_id, kind),
  constraint breakout_documents_kind check (
    kind in ('notes', 'pdf', 'whiteboard')
  ),
  constraint breakout_documents_title_length check (
    char_length(btrim(title)) between 1 and 160
  ),
  constraint breakout_documents_yjs_state_size check (
    yjs_state is null or octet_length(yjs_state) <= 25165824
  ),
  constraint breakout_documents_pdf_metadata check (
    (
      pdf_storage_path is null
      and pdf_file_name is null
      and pdf_file_size is null
      and pdf_asset_revision is null
    )
    or (
      kind = 'pdf'
      and pdf_storage_path = 'breakouts/' || breakout_room_id::text || '/' || pdf_asset_revision::text || '.pdf'
      and char_length(btrim(pdf_file_name)) between 1 and 180
      and pdf_file_size between 5 and 15728640
      and pdf_asset_revision is not null
    )
  )
);

create index breakout_documents_breakout_room_id_idx
  on public.breakout_documents(breakout_room_id);
create index breakout_documents_updated_by_idx
  on public.breakout_documents(updated_by);

insert into public.breakout_documents (
  breakout_room_id,
  kind,
  title,
  yjs_state,
  yjs_state_updated_at,
  updated_by
)
select
  breakout.id,
  tool.kind,
  left(breakout.name || tool.title_suffix, 160),
  case when tool.kind = 'notes' then breakout.yjs_state else null end,
  case
    when tool.kind = 'notes' then breakout.yjs_state_updated_at
    else null
  end,
  breakout.updated_by
from public.breakout_rooms as breakout
cross join (
  values
    ('notes', ' shared notes'),
    ('pdf', ' shared PDF'),
    ('whiteboard', ' whiteboard')
) as tool(kind, title_suffix)
on conflict (breakout_room_id, kind) do nothing;

create function private.is_breakout_member(target_breakout_room_id uuid)
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
      join public.room_members as membership
        on membership.room_id = breakout.room_id
      where breakout.id = target_breakout_room_id
        and membership.user_id = (select auth.uid())
    );
$$;

create function private.can_edit_breakout(target_breakout_room_id uuid)
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
      join public.room_members as membership
        on membership.room_id = breakout.room_id
      where breakout.id = target_breakout_room_id
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    );
$$;

revoke all on function private.is_breakout_member(uuid)
  from public, anon;
revoke all on function private.can_edit_breakout(uuid)
  from public, anon;
grant execute on function private.is_breakout_member(uuid)
  to authenticated;
grant execute on function private.can_edit_breakout(uuid)
  to authenticated;

alter table public.breakout_documents enable row level security;

create policy "Room members can view breakout documents"
on public.breakout_documents
for select
to authenticated
using (private.is_breakout_member(breakout_room_id));

create policy "Room editors can update breakout documents"
on public.breakout_documents
for update
to authenticated
using (private.can_edit_breakout(breakout_room_id))
with check (
  private.can_edit_breakout(breakout_room_id)
  and (updated_by is null or updated_by = (select auth.uid()))
);

revoke all on table public.breakout_documents
  from public, anon, authenticated;
grant select, update on table public.breakout_documents
  to authenticated;

create function private.can_read_breakout_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^breakouts/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
    then private.is_breakout_member(split_part(object_name, '/', 2)::uuid)
    else false
  end;
$$;

create function private.can_write_breakout_pdf_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^breakouts/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]pdf$'
    then private.can_edit_breakout(split_part(object_name, '/', 2)::uuid)
    else false
  end;
$$;

revoke all on function private.can_read_breakout_pdf_object(text)
  from public, anon;
revoke all on function private.can_write_breakout_pdf_object(text)
  from public, anon;
grant execute on function private.can_read_breakout_pdf_object(text)
  to authenticated;
grant execute on function private.can_write_breakout_pdf_object(text)
  to authenticated;

create policy "Breakout members can read private PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_read_breakout_pdf_object(name)
);

create policy "Breakout editors can upload private PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_breakout_pdf_object(name)
);

create policy "Breakout editors can replace private PDFs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_breakout_pdf_object(name)
)
with check (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_breakout_pdf_object(name)
);

create policy "Breakout editors can delete replaced private PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'boardprep-pdfs'
  and private.can_write_breakout_pdf_object(name)
);

create or replace function public.create_breakout_room(
  input_room_id uuid,
  input_name text
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
  normalized_name text;
  created_breakout_room_id uuid;
  created_breakout_room_code text;
  attempt integer;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to create a breakout room.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.room_members as membership
    where membership.room_id = input_room_id
      and membership.user_id = authenticated_user_id
      and membership.role in ('owner', 'editor')
  ) then
    raise exception 'Only room owners and editors can create breakout rooms.'
      using errcode = '42501';
  end if;

  normalized_name := regexp_replace(
    btrim(coalesce(input_name, '')),
    '\s+',
    ' ',
    'g'
  );

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 80 then
    raise exception 'Breakout room names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  for attempt in 1..8 loop
    created_breakout_room_code := upper(
      left(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 8)
    );

    begin
      insert into public.breakout_rooms (
        room_id,
        name,
        code,
        created_by,
        updated_by
      )
      values (
        input_room_id,
        normalized_name,
        created_breakout_room_code,
        authenticated_user_id,
        authenticated_user_id
      )
      returning id into created_breakout_room_id;

      exit;
    exception
      when unique_violation then
        created_breakout_room_id := null;
    end;
  end loop;

  if created_breakout_room_id is null then
    raise exception 'A unique breakout room code could not be generated. Try again.'
      using errcode = '23505';
  end if;

  insert into public.breakout_documents (
    breakout_room_id,
    kind,
    title,
    updated_by
  )
  values
    (
      created_breakout_room_id,
      'notes',
      left(normalized_name || ' shared notes', 160),
      authenticated_user_id
    ),
    (
      created_breakout_room_id,
      'pdf',
      left(normalized_name || ' shared PDF', 160),
      authenticated_user_id
    ),
    (
      created_breakout_room_id,
      'whiteboard',
      left(normalized_name || ' whiteboard', 160),
      authenticated_user_id
    );

  return query
  select created_breakout_room_id, created_breakout_room_code;
end;
$$;

comment on table public.breakout_documents is
  'One isolated notes, PDF annotation, and whiteboard document per breakout room.';
comment on constraint breakout_documents_pdf_metadata
  on public.breakout_documents is
  'Keeps a breakout PDF object path aligned with its breakout and revision.';
comment on function private.is_breakout_member(uuid) is
  'Authorizes breakout document reads through parent-room membership.';
comment on function private.can_edit_breakout(uuid) is
  'Authorizes breakout writes through parent-room owner/editor membership.';

commit;
