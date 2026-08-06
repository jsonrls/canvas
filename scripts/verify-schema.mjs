import { spawnSync } from "node:child_process";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const databasePassword = process.env.SUPABASE_DB_PASSWORD;
const poolerHost = process.env.SUPABASE_DB_POOLER_HOST;

if (!supabaseUrl || !databasePassword || !poolerHost) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_DB_PASSWORD, and SUPABASE_DB_POOLER_HOST are required.",
  );
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const connection = [
  `host=${poolerHost}`,
  "port=5432",
  `user=postgres.${projectRef}`,
  "dbname=postgres",
  "sslmode=require",
  "gssencmode=disable",
].join(" ");
const assertionSql = String.raw`
do $$
declare
  expected_tables text[] := array['rooms', 'room_members', 'documents', 'document_versions', 'profiles', 'saved_study_guides', 'breakout_rooms', 'breakout_documents', 'breakout_room_members'];
  table_name text;
begin
  foreach table_name in array expected_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relkind = 'r'
        and c.relrowsecurity
    ) then
      raise exception 'Missing table or RLS disabled: %', table_name;
    end if;

    if has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
      or has_table_privilege('anon', format('public.%I', table_name), 'INSERT')
      or has_table_privilege('anon', format('public.%I', table_name), 'UPDATE')
      or has_table_privilege('anon', format('public.%I', table_name), 'DELETE')
    then
      raise exception 'anon has a table privilege on %', table_name;
    end if;
  end loop;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = any(expected_tables)
  ) <> 22 then
    raise exception 'Expected exactly 22 public-table RLS policies';
  end if;

  if not exists (
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d
      on d.adrelid = a.attrelid
      and d.adnum = a.attnum
    where n.nspname = 'public'
      and c.relname = 'rooms'
      and a.attname = 'viewer_can_collaborate'
      and a.atttypid = 'boolean'::regtype
      and a.attnotnull
      and pg_get_expr(d.adbin, d.adrelid) = 'false'
  ) then
    raise exception 'The global viewer collaboration switch is missing or unsafe';
  end if;

  if has_table_privilege('authenticated', 'public.rooms', 'INSERT')
    or not has_table_privilege('authenticated', 'public.rooms', 'SELECT')
    or not has_table_privilege('authenticated', 'public.rooms', 'UPDATE')
    or not has_table_privilege('authenticated', 'public.rooms', 'DELETE')
  then
    raise exception 'Room grants do not require atomic creation';
  end if;

  if has_table_privilege(
    'authenticated',
    'public.room_members',
    'INSERT'
  ) then
    raise exception 'Room membership grants bypass lifecycle functions';
  end if;

  if has_table_privilege('authenticated', 'public.document_versions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.document_versions', 'DELETE')
  then
    raise exception 'Authenticated users can mutate existing version rows';
  end if;

  if not has_table_privilege('authenticated', 'public.saved_study_guides', 'SELECT')
    or not has_table_privilege('authenticated', 'public.saved_study_guides', 'INSERT')
    or not has_table_privilege('authenticated', 'public.saved_study_guides', 'DELETE')
    or has_table_privilege('authenticated', 'public.saved_study_guides', 'UPDATE')
    or has_table_privilege('anon', 'public.saved_study_guides', 'SELECT')
  then
    raise exception 'Saved study-guide grants do not match creator-private immutability';
  end if;

  if not has_table_privilege('authenticated', 'public.breakout_rooms', 'SELECT')
    or has_table_privilege('authenticated', 'public.breakout_rooms', 'INSERT')
    or has_table_privilege('authenticated', 'public.breakout_rooms', 'UPDATE')
    or has_table_privilege('authenticated', 'public.breakout_rooms', 'DELETE')
    or has_table_privilege('anon', 'public.breakout_rooms', 'SELECT')
  then
    raise exception 'Breakout-room grants do not enforce function-only creation';
  end if;

  if not has_table_privilege('authenticated', 'public.breakout_documents', 'SELECT')
    or not has_table_privilege('authenticated', 'public.breakout_documents', 'UPDATE')
    or has_table_privilege('authenticated', 'public.breakout_documents', 'INSERT')
    or has_table_privilege('authenticated', 'public.breakout_documents', 'DELETE')
    or has_table_privilege('anon', 'public.breakout_documents', 'SELECT')
  then
    raise exception 'Breakout-document grants do not match parent-room access';
  end if;

  if not has_table_privilege('authenticated', 'public.breakout_room_members', 'SELECT')
    or has_table_privilege('authenticated', 'public.breakout_room_members', 'INSERT')
    or has_table_privilege('authenticated', 'public.breakout_room_members', 'UPDATE')
    or has_table_privilege('authenticated', 'public.breakout_room_members', 'DELETE')
    or has_table_privilege('anon', 'public.breakout_room_members', 'SELECT')
  then
    raise exception 'Breakout membership grants do not enforce function-only joins';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_study_guides'
      and policyname in (
        'Creators can view their saved study guides',
        'Members can save their own study guides',
        'Creators can delete their saved study guides'
      )
  ) <> 3 then
    raise exception 'Saved study-guide RLS policies are incomplete';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'saved_study_guides'
      and c.conname = 'saved_study_guides_payload_shape'
      and pg_get_constraintdef(c.oid) like '%65536%'
  ) then
    raise exception 'Saved study-guide payload constraint is missing';
  end if;

  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT')
    or not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
    or not has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
    or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
  then
    raise exception 'Profile table grants do not match least privilege';
  end if;

  if (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in (
        'is_room_member',
        'is_room_owner',
        'can_access_document',
        'can_edit_room',
        'can_edit_document',
        'can_view_profile',
        'is_room_owner_user',
        'can_read_room_pdf_object',
        'can_write_room_pdf_object',
        'enforce_saved_study_guide_limit',
        'is_breakout_member',
        'can_edit_breakout',
        'can_read_breakout_pdf_object',
        'can_write_breakout_pdf_object',
        'can_collaborate_room',
        'can_collaborate_document',
        'can_collaborate_breakout'
      )
      and p.prosecdef
      and p.proconfig = array['search_path=""']
  ) <> 17 then
    raise exception 'Private authorization helpers are not fully hardened';
  end if;

  if (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_study_room',
        'add_room_member_by_email',
        'join_public_room',
        'create_breakout_room',
        'list_breakout_room_directory',
        'count_breakout_rooms',
        'join_breakout_room',
        'set_viewer_collaboration'
      )
      and p.prosecdef
      and p.proconfig = array['search_path=""']
  ) <> 8 then
    raise exception 'Public room lifecycle functions are not hardened';
  end if;

  if not has_function_privilege(
      'authenticated',
      'public.create_study_room(text,boolean)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.create_study_room(text,boolean)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.add_room_member_by_email(uuid,text,text)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.add_room_member_by_email(uuid,text,text)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.join_public_room(uuid)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.join_public_room(uuid)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.create_breakout_room(uuid,text)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.create_breakout_room(uuid,text)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.list_breakout_room_directory(uuid)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.list_breakout_room_directory(uuid)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.count_breakout_rooms(uuid)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.count_breakout_rooms(uuid)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.join_breakout_room(uuid,text)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.join_breakout_room(uuid,text)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.set_viewer_collaboration(uuid,boolean)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.set_viewer_collaboration(uuid,boolean)',
      'EXECUTE'
    )
  then
    raise exception 'Room lifecycle function grants are unsafe';
  end if;

  if exists (
    select 1
    from public.rooms r
    left join public.room_members m
      on m.room_id = r.id
      and m.user_id = r.owner_id
      and m.role = 'owner'
    where m.user_id is null
  ) then
    raise exception 'A room lacks its immutable owner membership';
  end if;

  if exists (
    select 1
    from public.rooms r
    cross join (values ('notes'), ('pdf'), ('whiteboard')) as tool(kind)
    left join public.documents d
      on d.room_id = r.id
      and d.kind = tool.kind
    where d.id is null
  ) then
    raise exception 'A room lacks a Phase 3 study-tool document';
  end if;

  if exists (
    select 1
    from public.breakout_rooms b
    cross join (values ('notes'), ('pdf'), ('whiteboard')) as tool(kind)
    left join public.breakout_documents d
      on d.breakout_room_id = b.id
      and d.kind = tool.kind
    where d.id is null
  ) then
    raise exception 'A breakout room lacks an isolated study-tool document';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'documents'
      and c.conname = 'documents_pdf_metadata'
      and pg_get_constraintdef(c.oid) like '%pdf_asset_revision%'
      and pg_get_constraintdef(c.oid) like '%15728640%'
  ) then
    raise exception 'The PDF metadata constraint is missing or incomplete';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'breakout_documents'
      and c.conname = 'breakout_documents_pdf_metadata'
      and pg_get_constraintdef(c.oid) like '%breakouts/%'
      and pg_get_constraintdef(c.oid) like '%15728640%'
  ) then
    raise exception 'The breakout PDF metadata constraint is missing or incomplete';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Room members can read private PDFs',
        'Room editors can upload private PDFs',
        'Room editors can replace private PDFs',
        'Room editors can delete replaced private PDFs'
      )
  ) <> 4 then
    raise exception 'Private PDF Storage policies are incomplete';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Breakout members can read private PDFs',
        'Breakout editors can upload private PDFs',
        'Breakout editors can replace private PDFs',
        'Breakout editors can delete replaced private PDFs'
      )
  ) <> 4 then
    raise exception 'Breakout PDF Storage policies are incomplete';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'boardprep-pdfs'
      and public = false
      and file_size_limit = 15728640
      and allowed_mime_types = array['application/pdf']::text[]
  ) then
    raise exception 'The private PDF bucket restrictions are incorrect';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'create_profile_after_user_signup'
      and not t.tgisinternal
  ) then
    raise exception 'Profile signup trigger is missing';
  end if;

  if (
    select count(*)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        (c.relname = 'rooms' and t.tgname = 'update_room_timestamp')
        or (
          c.relname = 'room_members'
          and t.tgname = 'protect_room_membership_identity'
        )
      )
      and not t.tgisinternal
  ) <> 2 then
    raise exception 'Room lifecycle protection triggers are missing';
  end if;
end
$$;

select 'Schema verification passed: 9 RLS tables, 22 public policies, 8 private-PDF policies, 25 hardened helpers, global viewer collaboration, persistent breakout memberships, isolated room and breakout study tools, constrained private storage, owner invariants, immutable versions, and profile provisioning.';
`;
const result = spawnSync(
  "psql",
  [connection, "-v", "ON_ERROR_STOP=1", "-At", "-c", assertionSql],
  {
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: databasePassword },
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
