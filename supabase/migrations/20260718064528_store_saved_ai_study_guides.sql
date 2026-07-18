begin;

create table public.saved_study_guides (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  study_pack jsonb not null,
  generated_at timestamptz not null,
  source_characters integer not null,
  created_at timestamptz not null default now(),
  constraint saved_study_guides_title_length check (
    char_length(btrim(title)) between 3 and 120
  ),
  constraint saved_study_guides_source_characters check (
    source_characters between 80 and 18000
  ),
  constraint saved_study_guides_generated_before_save check (
    generated_at <= created_at + interval '5 minutes'
  ),
  constraint saved_study_guides_payload_shape check (
    jsonb_typeof(study_pack) = 'object'
    and study_pack ?& array[
      'summary',
      'quiz',
      'flashcards',
      'recommendations',
      'misconceptions'
    ]
    and study_pack - array[
      'summary',
      'quiz',
      'flashcards',
      'recommendations',
      'misconceptions'
    ] = '{}'::jsonb
    and octet_length(study_pack::text) <= 65536
  )
);

create index saved_study_guides_room_creator_created_at_idx
  on public.saved_study_guides(room_id, created_by, created_at desc);

create index saved_study_guides_created_by_idx
  on public.saved_study_guides(created_by);

alter table public.saved_study_guides enable row level security;

create policy "Creators can view their saved study guides"
on public.saved_study_guides
for select
to authenticated
using (
  created_by = (select auth.uid())
  and private.is_room_member(room_id)
);

create policy "Members can save their own study guides"
on public.saved_study_guides
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_room_member(room_id)
);

create policy "Creators can delete their saved study guides"
on public.saved_study_guides
for delete
to authenticated
using (
  created_by = (select auth.uid())
  and private.is_room_member(room_id)
);

revoke all on table public.saved_study_guides
  from public, anon, authenticated;

grant select, insert, delete on table public.saved_study_guides
  to authenticated;

comment on table public.saved_study_guides is
  'Creator-private, room-scoped, immutable AI study guides saved explicitly for later review.';
comment on column public.saved_study_guides.study_pack is
  'Validated five-view AI output only; the collaborative source note snapshot is not retained.';
comment on column public.saved_study_guides.generated_at is
  'Original model-generation time retained separately from the explicit save time.';

commit;
