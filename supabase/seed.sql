-- Local Docker development data only. `supabase db reset` loads this file;
-- `supabase db push` never sends it to the cloud project.
--
-- Test accounts (password for all three: qollab-local-dev):
--   owner@qollab.test   owns "Local study room"
--   editor@qollab.test  editor in that room
--   viewer@qollab.test  viewer in that room

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', seed.id, 'authenticated',
  'authenticated', seed.email,
  extensions.crypt('qollab-local-dev', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', seed.display_name), now(), now(),
  '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'owner@qollab.test', 'Local Owner'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'editor@qollab.test', 'Local Editor'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'viewer@qollab.test', 'Local Viewer')
) as seed (id, email, display_name);

-- Email sign-in needs a matching identity row per user.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), users.id, users.id::text,
  jsonb_build_object('sub', users.id::text, 'email', users.email),
  'email', now(), now(), now()
from auth.users as users
where users.email like '%@qollab.test';

-- Mirrors public.create_study_room, which needs auth.uid() and so cannot run here.
insert into public.rooms (id, slug, name, owner_id, is_public)
values (
  '00000000-0000-4000-b000-000000000001',
  'local-study-room',
  'Local study room',
  '00000000-0000-4000-a000-000000000001',
  false
);

insert into public.room_members (room_id, user_id, role)
values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'owner'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002', 'editor'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000003', 'viewer');

insert into public.documents (room_id, kind, title, updated_by)
values
  ('00000000-0000-4000-b000-000000000001', 'notes', 'Local study room shared notes', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000001', 'pdf', 'Local study room shared PDF', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000001', 'whiteboard', 'Local study room whiteboard', '00000000-0000-4000-a000-000000000001');
