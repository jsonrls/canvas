begin;

-- Live activities inside breakout rooms. Each breakout has its own questions,
-- session, answers and Q&A, in tables of their own, so main-room rows and the
-- routes that read them do not change and cannot see breakout rows.
-- Column types, checks and unique keys are copied from the main-room tables,
-- so 20261124090000 and 20261125090000 must be applied first. A later change
-- to a live_* table must be repeated here.
-- Access stays service-role only: the breakout live route checks breakout
-- membership and role before it reads or writes.

create table public.breakout_live_questions (
  like public.live_questions
    including defaults including constraints including indexes
);
alter table public.breakout_live_questions
  rename column room_id to breakout_room_id;
alter table public.breakout_live_questions
  add constraint breakout_live_questions_breakout_room_id_fkey
    foreign key (breakout_room_id)
    references public.breakout_rooms(id) on delete cascade,
  add constraint breakout_live_questions_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete cascade;

create table public.breakout_live_sessions (
  like public.live_sessions
    including defaults including constraints including indexes
);
alter table public.breakout_live_sessions
  rename column room_id to breakout_room_id;
alter table public.breakout_live_sessions
  add constraint breakout_live_sessions_breakout_room_id_fkey
    foreign key (breakout_room_id)
    references public.breakout_rooms(id) on delete cascade,
  add constraint breakout_live_sessions_question_id_fkey
    foreign key (question_id)
    references public.breakout_live_questions(id) on delete set null;

create table public.breakout_live_responses (
  like public.live_responses
    including defaults including constraints including indexes
);
alter table public.breakout_live_responses
  rename column room_id to breakout_room_id;
alter table public.breakout_live_responses
  add constraint breakout_live_responses_question_id_fkey
    foreign key (question_id)
    references public.breakout_live_questions(id) on delete cascade,
  add constraint breakout_live_responses_breakout_room_id_fkey
    foreign key (breakout_room_id)
    references public.breakout_rooms(id) on delete cascade,
  add constraint breakout_live_responses_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

create table public.breakout_live_qa_items (
  like public.live_qa_items
    including defaults including constraints including indexes
);
alter table public.breakout_live_qa_items
  rename column room_id to breakout_room_id;
alter table public.breakout_live_qa_items
  add constraint breakout_live_qa_items_question_id_fkey
    foreign key (question_id)
    references public.breakout_live_questions(id) on delete cascade,
  add constraint breakout_live_qa_items_breakout_room_id_fkey
    foreign key (breakout_room_id)
    references public.breakout_rooms(id) on delete cascade,
  add constraint breakout_live_qa_items_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

create table public.breakout_live_qa_votes (
  like public.live_qa_votes
    including defaults including constraints including indexes
);
alter table public.breakout_live_qa_votes
  add constraint breakout_live_qa_votes_item_id_fkey
    foreign key (item_id)
    references public.breakout_live_qa_items(id) on delete cascade,
  add constraint breakout_live_qa_votes_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- The main tables index created_by nowhere; account deletion needs one here.
create index breakout_live_questions_created_by_idx
  on public.breakout_live_questions(created_by);

alter table public.breakout_live_questions enable row level security;
alter table public.breakout_live_sessions enable row level security;
alter table public.breakout_live_responses enable row level security;
alter table public.breakout_live_qa_items enable row level security;
alter table public.breakout_live_qa_votes enable row level security;

revoke all on table public.breakout_live_questions
  from public, anon, authenticated;
revoke all on table public.breakout_live_sessions
  from public, anon, authenticated;
revoke all on table public.breakout_live_responses
  from public, anon, authenticated;
revoke all on table public.breakout_live_qa_items
  from public, anon, authenticated;
revoke all on table public.breakout_live_qa_votes
  from public, anon, authenticated;

comment on table public.breakout_live_questions is
  'Host-authored live questions of one breakout. Service-role access only through the breakout live route.';
comment on table public.breakout_live_sessions is
  'One row per breakout: the presented question, whether voting is open, and whether results are visible. Service-role access only.';
comment on table public.breakout_live_responses is
  'One answer per participant per breakout question. Service-role access only; students receive aggregates, never raw rows.';
comment on table public.breakout_live_qa_items is
  'Audience questions for a breakout Q&A slide. Authors are never sent to clients. Service-role access only.';
comment on table public.breakout_live_qa_votes is
  'One upvote per participant per breakout Q&A item. Service-role access only.';

commit;
