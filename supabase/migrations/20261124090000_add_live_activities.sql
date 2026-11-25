begin;

-- Teacher-led live activities (polls, word clouds, open-ended, scales, quizzes).
-- All three tables are backend-only: the /api/rooms/[roomId]/live route checks
-- room membership and role, then reads and writes with the service role, so
-- quiz answer keys and individual student answers never reach other clients.

create table public.live_questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_option smallint,
  time_limit_seconds smallint,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint live_questions_kind check (
    kind in ('poll', 'word_cloud', 'open_ended', 'scale', 'quiz')
  ),
  constraint live_questions_prompt_length check (
    char_length(btrim(prompt)) between 3 and 200
  ),
  constraint live_questions_options_shape check (
    jsonb_typeof(options) = 'array'
    and (
      (kind in ('poll', 'quiz') and jsonb_array_length(options) between 2 and 6)
      or (kind not in ('poll', 'quiz') and jsonb_array_length(options) = 0)
    )
  ),
  constraint live_questions_quiz_fields check (
    (
      kind = 'quiz'
      and correct_option between 0 and jsonb_array_length(options) - 1
      and time_limit_seconds between 5 and 120
    )
    or (
      kind <> 'quiz'
      and correct_option is null
      and time_limit_seconds is null
    )
  ),
  constraint live_questions_position check (position >= 0)
);

create index live_questions_room_position_idx
  on public.live_questions(room_id, position);

create table public.live_sessions (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  question_id uuid references public.live_questions(id) on delete set null,
  is_accepting boolean not null default false,
  show_results boolean not null default false,
  opened_at timestamptz,
  updated_at timestamptz not null default now()
);

create index live_sessions_question_id_idx
  on public.live_sessions(question_id);

create table public.live_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.live_questions(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value jsonb not null,
  points integer not null default 0,
  submitted_at timestamptz not null default now(),
  constraint live_responses_one_per_question unique (question_id, user_id),
  constraint live_responses_value_shape check (
    jsonb_typeof(value) = 'object' and octet_length(value::text) <= 2048
  ),
  constraint live_responses_points check (points between 0 and 1000)
);

create index live_responses_room_user_idx
  on public.live_responses(room_id, user_id);

create index live_responses_user_id_idx
  on public.live_responses(user_id);

alter table public.live_questions enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_responses enable row level security;

revoke all on table public.live_questions from public, anon, authenticated;
revoke all on table public.live_sessions from public, anon, authenticated;
revoke all on table public.live_responses from public, anon, authenticated;

comment on table public.live_questions is
  'Host-authored live activity slides. Service-role access only via the live route; correct_option stays hidden from students until results are shown.';
comment on table public.live_sessions is
  'One row per room: the presented question, whether voting is open, and whether results are visible. Service-role access only.';
comment on table public.live_responses is
  'One answer per participant per question with server-computed quiz points. Service-role access only; students receive aggregates, never raw rows.';

commit;
