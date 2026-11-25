begin;

-- Mentimeter-style question types beyond the first five: multi-statement
-- scales, ranking, 100 points, 2x2 grid, guess the number, quick form, pin on
-- image and live Q&A. Access stays service-role only through the live route.

alter table public.live_questions
  add column settings jsonb not null default '{}'::jsonb,
  add column image_path text,
  drop constraint live_questions_kind,
  drop constraint live_questions_options_shape,
  add constraint live_questions_kind check (
    kind in (
      'poll', 'word_cloud', 'open_ended', 'scale', 'quiz',
      'ranking', 'points', 'grid', 'number', 'form', 'pin', 'qa'
    )
  ),
  add constraint live_questions_options_shape check (
    jsonb_typeof(options) = 'array'
    and case
      when kind in ('poll', 'quiz', 'ranking', 'points')
        then jsonb_array_length(options) between 2 and 6
      when kind in ('grid', 'form')
        then jsonb_array_length(options) between 1 and 6
      when kind = 'scale'
        then jsonb_array_length(options) between 0 and 6
      else jsonb_array_length(options) = 0
    end
  ),
  add constraint live_questions_settings_shape check (
    jsonb_typeof(settings) = 'object' and octet_length(settings::text) <= 1024
  ),
  add constraint live_questions_image check (
    (kind = 'pin') = (image_path is not null)
    and (
      image_path is null
      or (
        split_part(image_path, '/', 1) = room_id::text
        and image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]jpg$'
      )
    )
  );

create table public.live_qa_items (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.live_questions(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint live_qa_items_body_length check (
    char_length(btrim(body)) between 1 and 280
  ),
  constraint live_qa_items_status check (
    status in ('pending', 'visible', 'answered', 'hidden')
  )
);

create index live_qa_items_question_idx
  on public.live_qa_items(question_id, created_at);
create index live_qa_items_room_id_idx on public.live_qa_items(room_id);
create index live_qa_items_user_id_idx on public.live_qa_items(user_id);

create table public.live_qa_votes (
  item_id uuid not null references public.live_qa_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create index live_qa_votes_user_id_idx on public.live_qa_votes(user_id);

alter table public.live_qa_items enable row level security;
alter table public.live_qa_votes enable row level security;

revoke all on table public.live_qa_items from public, anon, authenticated;
revoke all on table public.live_qa_votes from public, anon, authenticated;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'live-images', 'live-images', false, 2097152, array['image/jpeg']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.live_questions.settings is
  'Per-type settings such as axis labels, number range and secret answer, and Q&A moderation. The secret answer is stripped before students see a question.';
comment on table public.live_qa_items is
  'Audience questions for a live Q&A slide. Authors are never sent to clients. Service-role access only.';
comment on table public.live_qa_votes is
  'One upvote per participant per Q&A item. Service-role access only.';

commit;
