begin;

-- Guest link codes become the room slug plus 10 random lowercase letters or
-- digits (for example biology-101-a8kd93lmqz), so a shared link says which room
-- it opens. The suffix keeps it unguessable. Codes already issued in the old
-- format are turned off; the host turns guests on again for a new link.

update public.live_sessions
set guest_code = null
where guest_code is not null
  and guest_code !~ '^[a-z0-9-]{1,64}-[a-z0-9]{10}$';

alter table public.live_sessions
  drop constraint live_sessions_guest_code_format,
  add constraint live_sessions_guest_code_format check (
    guest_code is null or guest_code ~ '^[a-z0-9-]{1,64}-[a-z0-9]{10}$'
  );

commit;
