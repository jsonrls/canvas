begin;

-- Guest access to a main room's live activities: people without an account
-- join from a link or QR code the host shares, type a display name, and answer.
-- The live route still does every read and write with the service role; guests
-- never get a Supabase session. A guest is identified by a random token in an
-- HttpOnly cookie, and only its SHA-256 hash is stored here.
-- Breakouts stay member-only: their tables only gain participant_id, so the
-- shared queries can read it, and keep user_id required.

alter table public.live_sessions
  add column guest_code text unique,
  add constraint live_sessions_guest_code_format check (
    guest_code is null or guest_code ~ '^[A-Za-z0-9_-]{22}$'
  );

create table public.live_guests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token_hash text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint live_guests_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint live_guests_display_name_length check (
    char_length(btrim(display_name)) between 1 and 40
  )
);

create index live_guests_room_id_idx on public.live_guests(room_id);

alter table public.live_guests enable row level security;
revoke all on table public.live_guests from public, anon, authenticated;

-- Answers: exactly one of user_id and guest_id. participant_id is whichever
-- is set, so one-answer-per-person holds for members and guests alike.
alter table public.live_responses
  alter column user_id drop not null,
  add column guest_id uuid references public.live_guests(id) on delete cascade,
  add column participant_id uuid
    generated always as (coalesce(user_id, guest_id)) stored,
  add constraint live_responses_one_participant check (
    num_nonnulls(user_id, guest_id) = 1
  ),
  drop constraint live_responses_one_per_question;
alter table public.live_responses
  add constraint live_responses_one_per_question
    unique (question_id, participant_id);
create index live_responses_guest_id_idx on public.live_responses(guest_id);

alter table public.live_qa_items
  alter column user_id drop not null,
  add column guest_id uuid references public.live_guests(id) on delete cascade,
  add column participant_id uuid
    generated always as (coalesce(user_id, guest_id)) stored,
  add constraint live_qa_items_one_participant check (
    num_nonnulls(user_id, guest_id) = 1
  );
create index live_qa_items_guest_id_idx on public.live_qa_items(guest_id);
create index live_qa_items_question_participant_idx
  on public.live_qa_items(question_id, participant_id);

alter table public.live_qa_votes drop constraint live_qa_votes_pkey;
alter table public.live_qa_votes
  alter column user_id drop not null,
  add column guest_id uuid references public.live_guests(id) on delete cascade,
  add column participant_id uuid
    generated always as (coalesce(user_id, guest_id)) stored,
  add constraint live_qa_votes_one_participant check (
    num_nonnulls(user_id, guest_id) = 1
  ),
  add primary key (item_id, participant_id);
create index live_qa_votes_guest_id_idx on public.live_qa_votes(guest_id);

alter table public.breakout_live_responses
  add column participant_id uuid generated always as (user_id) stored;
alter table public.breakout_live_qa_items
  add column participant_id uuid generated always as (user_id) stored;
alter table public.breakout_live_qa_votes
  add column participant_id uuid generated always as (user_id) stored;

comment on column public.live_sessions.guest_code is
  'Random code in the guest link and QR code. Null when guests are off; a new code each time the host turns them on, so old links stop working.';
comment on table public.live_guests is
  'People answering a room''s live activities without an account. token_hash is the SHA-256 of the cookie token. Service-role access only.';
comment on column public.live_responses.participant_id is
  'user_id for members, guest_id for guests. Read this, never write it.';

commit;
