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
  expected_tables text[] := array['rooms', 'room_members', 'documents', 'document_versions', 'profiles'];
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
  ) <> 15 then
    raise exception 'Expected exactly 15 public-table RLS policies';
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
        'is_room_owner_user'
      )
      and p.prosecdef
      and p.proconfig = array['search_path=""']
  ) <> 7 then
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
        'join_public_room'
      )
      and p.prosecdef
      and p.proconfig = array['search_path=""']
  ) <> 3 then
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
    left join public.documents d
      on d.room_id = r.id
      and d.kind = 'notes'
    where d.id is null
  ) then
    raise exception 'A room lacks its notes document';
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

select 'Schema verification passed: 5 RLS tables, 15 policies, atomic room lifecycle functions, 10 hardened helpers, owner invariants, immutable versions, and profile provisioning.';
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
