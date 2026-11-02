# Qollab architecture

This document describes the implemented application. Product ideas and future
capabilities belong in [ROADMAP.md](./ROADMAP.md), not the current architecture.
Installed dependency versions and executable commands are in `package.json`.

## Repository boundaries

- `src/app/`: Next.js App Router pages, layouts, Server Actions, and HTTP handlers.
  Pages authenticate, load authorized data, and compose feature components.
- `src/components/`: feature UI grouped under account, auth, rooms, collaboration,
  home, and brand. `shell/` owns reusable workspace framing; `ui/` contains only
  shared controls such as buttons, icons, loading indicators, and toasts.
- `src/hooks/`: browser collaboration and presentation lifecycles.
- `src/lib/`: domain-specific models, validation, and repositories. Repository
  modules marked `server-only` stay out of client runtime bundles. Type-only
  imports do not bundle their server implementations.
- `server/`: Node-compatible collaboration runtime and standalone WebSocket entry.
  The Next.js collaboration route adapts this runtime to Vercel WebSockets.
- `supabase/migrations/`: ordered, authoritative database and storage changes.
- `theme/qollab-workshop.ts`: editable Astryx theme; `theme/generated/` contains
  its canonical generated CSS, runtime theme, and declarations.
- `scripts/`: executable local checks and explicitly separate hosted integration
  verifiers. See [TESTING.md](./TESTING.md) before running hosted checks.
- `.agents/`: engineering/product documentation; `plan/` holds historical feature
  plans; `artifacts/` holds design evidence. These are not application modules.

Use feature-local components and pure models before adding shared helpers. Keep
route files small, browser-heavy tools dynamically imported, and lifecycle code
separate from rendering. Do not introduce a parallel generic service/store layer.

## Feature ownership

- `collaboration/{whiteboard,pdf,ai}/` contains tool-specific hooks and views.
  The three `*-study-tool.tsx` files compose these modules. Pure geometry and
  payload helpers live beside their domain models in `src/lib/`.
- `src/lib/collaboration/provider-lifecycle.ts` owns provider authentication,
  online recovery, retry scheduling, and disposal for all workspace consumers.
  `use-notes-collaboration.ts` owns main notes persistence and conflict review.
- `server/document-persistence.mjs` serializes saves per document within one
  process; `collaboration-shutdown.mjs` bounds shutdown and reports failure.
- `shell/` owns the shared app frame, navigation, header, and responsive context
  panel. Breakout Q&A keeps its draft above the responsive presentation boundary.

## Runtime and state

The application uses Next.js App Router with React, TypeScript, Astryx, and
Tailwind. Tiptap renders notes, React PDF renders PDFs, and a native SVG surface
renders whiteboards. PDF, whiteboard, and AI workspaces are loaded dynamically.

React state and refs hold local interaction state. Yjs owns collaborative content;
its awareness channel holds transient participants and laser positions. IndexedDB
persists editable documents per account, room, and tool. React context supplies
shared UI services such as toasts. Authentication is established and validated
on the server using Supabase cookie sessions. There is no Zustand store, Redis
cache, Vite runtime, Sentry integration, or installed general-purpose test runner.

## Authentication and data access

Server pages, actions, and routes use `src/lib/supabase/` to establish authenticated
context. Domain repositories apply room membership rules using user-scoped data
access and database RLS. Privileged operations remain server-side; neither the
service-role key nor the OpenAI key belongs in browser props or public variables.

The deployed schema is defined by migrations, including profiles, rooms,
room_members, documents, document_versions, saved_study_guides, breakout_rooms,
breakout_documents, and breakout_room_members. Supabase owns `auth.users`.
Profiles expose constrained application identity; they are readable by the user
and authorized shared-room collaborators.

Room roles are owner, editor, and viewer. A room setting can allow viewer
collaboration; upload and administrative permissions remain independently checked.
Breakout access also checks breakout membership. UI disabled states are not the
authorization boundary.

## Collaboration flow

1. A server page reads authorized room metadata, initial document snapshots, and
   supporting profile/version information.
2. The browser initializes the selected tool's Yjs document. Editable tools load
   their account-scoped IndexedDB state; read-only tools do not create writable
   offline stores.
3. The WebSocket service validates identity, room/breakout membership, and write
   permissions before attaching a connection. Read-only connections receive live
   updates while the server rejects document writes.
4. Yjs merges document updates; awareness propagates presence separately.
5. The runtime persists full document state to Supabase and relays document,
   awareness, and presentation events across runtime instances through Supabase.

Main notes use `<roomSlug>`, with `--pdf` and `--whiteboard` suffixes for the
other tools. Breakouts use `<roomSlug>--breakout--<CODE>` plus the same tool
suffixes. These names and existing IndexedDB keys are compatibility contracts;
a file refactor must not rename stored documents.

Locally, `npm run dev:all` runs Next.js and the standalone Node WebSocket server.
The browser uses `NEXT_PUBLIC_YJS_WS_URL` and an authenticated token endpoint.
On Vercel, omitting that variable selects the same-origin `/api/collaboration`
adapter with cookie authentication. Deployment configuration selects `hnd1`;
this repository does not establish a multi-region deployment or measured SLA.

## Recovery and history

Offline persistence uses `boardprep:${userId}:${roomId}:${kind}` identities, with
breakout scope incorporated into the room identity. The historical prefix is
retained to preserve existing data. Main notes, PDF annotations, and whiteboards persist locally. Breakout notes
currently recover in memory while their tab remains open; they do not initialize
IndexedDB. A loaded editable workspace can continue through network loss. Cold offline startup is not implemented.

Notes reconciliation compares current-session offline edits with remotely merged
content. Yjs remains the merge authority. Replacing a merge with the offline draft
requires confirmation and an immutable safety version; a failed checkpoint or
intervening edit aborts replacement. Version history stores both ProseMirror JSON
and matching Yjs state. Sign-out clears the account's registered offline stores.

## Study tools

PDF uploads use private storage, signed upload/read URLs, metadata and file-header
validation, and asset revisions. A room/breakout has one active PDF. Annotation
coordinates are normalized, and annotations from replaced revisions are hidden.
PDF comments, replies, and bookmarks use independent Yjs entries.

The whiteboard keeps drawings, shapes, arrows, text, and bounded images as
independent Yjs objects. Camera geometry maps pointer positions to world space.
Laser trails are transient awareness state. Detected question/target geometry can
request an AI answer, stored as ordinary collaborative text.

The AI study assistant captures an explicit note snapshot and sends it to a
room-authorized server endpoint. Server-side request construction uses bounded
input/output, structured output validation, provider storage disabled, timeouts,
and instance-local rate limiting. It produces summaries, quizzes, flashcards,
recommendations, and cautious misconception signals. Saved guides are creator
private; source note snapshots are not saved with them. General PDF extraction,
shared saved-guide libraries, and distributed AI quotas remain future work.

## Styling and composition

The root layout loads the generated theme and global integration once. Shared
shell components own workspace regions and responsive framing. Feature components
own tool interactions; canvas state must not move into the shell. Use Astryx props
and semantic token utilities for ordinary UI. Renderer geometry, editor content,
and browser-specific mechanics have narrowly scoped styling exceptions described
in [DESIGN.md](./DESIGN.md).

## Verification and limits

Checks establish only what they exercise. Local contract and model tests do not
prove hosted authorization, browser focus behavior, data durability under every
failure, or production capacity. Hosted verification scripts explicitly create
and clean up disposable fixtures. `verify:vercel` exercises the deployed adapter;
standalone Yjs tests are not a substitute for that path.

Full-state persistence, instance-local AI limits, unencrypted browser storage,
one-PDF-per-room limits, and lack of cold offline startup remain known design
constraints. Monitoring, institutional roles, guaranteed backups, and learning
outcome improvements must not be described as implemented without evidence.
