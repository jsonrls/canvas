begin;

alter table public.breakout_rooms
  add column description text not null default '';

alter table public.breakout_rooms
  add constraint breakout_rooms_description_length check (
    char_length(description) <= 240
  );

comment on column public.breakout_rooms.description is
  'Short facilitator-authored purpose shown in the breakout room directory.';

drop function public.list_breakout_room_directory(uuid);

create function public.list_breakout_room_directory(
  input_room_id uuid
)
returns table (
  breakout_room_id uuid,
  breakout_room_name text,
  breakout_room_description text,
  breakout_room_created_at timestamptz,
  breakout_room_code text,
  is_joined boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  parent_role text;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required to view breakout rooms.'
      using errcode = '42501';
  end if;

  select membership.role
  into parent_role
  from public.room_members as membership
  where membership.room_id = input_room_id
    and membership.user_id = authenticated_user_id;

  if parent_role is null then
    raise exception 'Parent-room membership is required to view breakout rooms.'
      using errcode = '42501';
  end if;

  return query
  select
    breakout.id,
    breakout.name,
    breakout.description,
    breakout.created_at,
    case
      when parent_role in ('owner', 'editor')
        or joined.user_id is not null
      then breakout.code
      else null
    end,
    (
      parent_role in ('owner', 'editor')
      or joined.user_id is not null
    )
  from public.breakout_rooms as breakout
  left join public.breakout_room_members as joined
    on joined.breakout_room_id = breakout.id
    and joined.user_id = authenticated_user_id
  where breakout.room_id = input_room_id
  order by breakout.created_at asc
  limit 100;
end;
$$;

revoke all on function public.list_breakout_room_directory(uuid)
  from public, anon, authenticated;
grant execute on function public.list_breakout_room_directory(uuid)
  to authenticated;

comment on function public.list_breakout_room_directory(uuid) is
  'Lists breakout names and descriptions while revealing codes only to facilitators and joined participants.';

drop function public.create_breakout_room(uuid, text);

create function public.create_breakout_room(
  input_room_id uuid,
  input_name text,
  input_description text
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
  normalized_description text;
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
  normalized_description := regexp_replace(
    btrim(coalesce(input_description, '')),
    '\s+',
    ' ',
    'g'
  );

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 80 then
    raise exception 'Breakout room names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  if
    char_length(normalized_description) < 1
    or char_length(normalized_description) > 240
  then
    raise exception 'Breakout room descriptions must be between 1 and 240 characters.'
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
        description,
        code,
        created_by,
        updated_by
      )
      values (
        input_room_id,
        normalized_name,
        normalized_description,
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

revoke all on function public.create_breakout_room(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_breakout_room(uuid, text, text)
  to authenticated;

comment on function public.create_breakout_room(uuid, text, text) is
  'Creates a described breakout room and its study tools for an authenticated parent-room owner or editor.';

commit;
