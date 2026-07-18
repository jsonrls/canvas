begin;

create or replace function private.enforce_saved_study_guide_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_count integer;
begin
  perform 1
  from public.rooms
  where id = new.room_id
  for update;

  select count(*)
    into saved_count
  from public.saved_study_guides
  where room_id = new.room_id
    and created_by = new.created_by;

  if saved_count >= 50 then
    raise exception 'saved study-guide limit reached';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_saved_study_guide_limit() from public, anon, authenticated;

drop trigger if exists enforce_saved_study_guide_limit on public.saved_study_guides;
create trigger enforce_saved_study_guide_limit
before insert on public.saved_study_guides
for each row execute function private.enforce_saved_study_guide_limit();

comment on function private.enforce_saved_study_guide_limit() is
  'Serializes and enforces the creator/room saved-guide limit of 50 rows.';

commit;
