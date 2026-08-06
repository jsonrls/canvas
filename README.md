# Qollab

Qollab is an authenticated collaborative study workspace built with Next.js, Supabase, Tiptap, React PDF, Yjs, and the OpenAI Responses API. Signed-in users can create public or private study rooms and work together in isolated Notes, PDF, Whiteboard, and AI Assistant workspaces according to owner/editor/viewer membership. Notes include live cursors, offline recovery, overlap review, and immutable version history. The private PDF workspace adds highlights, underlines, freehand marks, sticky notes, page comments, replies, bookmarks, and zoom. The SVG whiteboard adds drawing, shapes, arrows, text, images, and a transient laser pointer. The assistant converts an explicit note snapshot into a summary, quiz, flashcards, learning recommendations, and cautious misconception review. Account-scoped Yjs updates persist in IndexedDB, while the separate Yjs service persists each shared document in Supabase and reloads it after a restart.

Each Supabase Auth account has a constrained `public.profiles` row. Signup creates it automatically from the supplied display name, existing accounts are backfilled, and the application uses that name for presence and version authorship. Profile RLS limits reads to the current user and collaborators who share a room.

Users who forget their password can request an account-neutral recovery email at `/reset-password`. Recovery links are exchanged through the cookie-backed `/auth/confirm` route before the authenticated new-password form is shown.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and a Supabase project. `psql` is only required for `verify:schema`.

```bash
npm install
cp .env.example .env
# Fill in the Supabase project values, then apply the migrations.
npx supabase link --project-ref your-project-ref
npx supabase db push
npm run dev:all
```

Open [http://localhost:3000/rooms](http://localhost:3000/rooms). Unauthenticated requests are redirected to `/login`.

`npm run dev:all` starts:

- Next.js at `http://localhost:3000`
- The authenticated Yjs service at `ws://localhost:1234`

Use `npm run dev` or `npm run dev:yjs` when only one process is needed. Docker and a local `DATABASE_URL` are not required.

## Environment

The server requires the Supabase project URL and service-role key. The service key must remain server-only: never add a `NEXT_PUBLIC_` prefix, pass it through props, or expose it to browser code.

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_POOLER_HOST=aws-0-your-region.pooler.supabase.com

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234
YJS_HOST=127.0.0.1
YJS_PORT=1234
OPENAI_API_KEY=your-server-only-openai-api-key
# Optional; defaults to gpt-4o-mini
# OPENAI_MODEL=gpt-4o-mini
# Optional; defaults to gpt-4o-mini for quick whiteboard answers
# OPENAI_WHITEBOARD_MODEL=gpt-4o-mini
```

`NEXT_PUBLIC_YJS_WS_URL` is the browser-visible address of the service started by `npm run dev:yjs`; it is not a generated credential. Production must use a separately hosted `wss://` endpoint. `YJS_ALLOWED_ORIGIN` can require an exact browser Origin in production.

The database pooler settings are used only by the schema verifier; application data access goes through the Supabase Data API and RLS.

## Room lifecycle behavior

- Room creation atomically creates the room, immutable owner membership, and separate notes, PDF, and whiteboard documents. Server-generated slugs are normalized and collision resistant.
- Signed-in users can discover and explicitly join public rooms. Private rooms are visible only to members, and non-owner members can leave explicitly.
- Owners can rename a room, change its visibility, add an existing account by exact email as editor or viewer, change non-owner roles, remove non-owner members, and delete the room with typed-name confirmation.
- Owners cannot demote, remove, or leave themselves. Collaborator email addresses are never returned by room reads or rendered in browser props.
- Opening `/rooms/[roomId]` never creates data. Viewers receive a persisted read-only snapshot and do not open a writable WebSocket or IndexedDB collaboration path.

## Phase 3 study tools

- Owners and editors may upload or replace one active room PDF up to 15 MiB. Files are uploaded through a short-lived signed upload URL, revalidated by the server, stored in the private `boardprep-pdfs` bucket, and served to members through short-lived signed read URLs.
- PDF annotations use normalized page geometry and stable Yjs map keys. Every value is boundary-checked before rendering, and a new asset revision hides annotations belonging to the replaced PDF.
- The whiteboard stores each drawing, shape, arrow, text block, or embedded image as an independent Yjs value. Images are limited to 1 MiB; the laser pointer uses awareness and is never persisted.
- Notes use the room slug as their remote document name. PDF and whiteboard channels use `${roomSlug}--pdf` and `${roomSlug}--whiteboard`, preventing one tool from overwriting another.
- Viewers receive server snapshots and signed PDF reads but cannot upload, annotate, draw, create offline stores, or open writable collaboration sockets.

## Phase 4 AI assistant

- Opening the assistant captures the current collaborative-note text before the editor unmounts. Generation is explicit; later note edits are included only after returning to Notes and reopening the assistant.
- One authenticated request creates a discussion summary, 3–5 question quiz, 4–8 flashcards, 2–5 focused learning recommendations, and zero or more cautious misconception signals.
- Every request revalidates room membership. `OPENAI_API_KEY` remains server-only, provider storage is disabled, request and output sizes are bounded, generation times out after 30 seconds, and a basic instance-local limit allows five attempts per user/room in ten minutes.
- Strict JSON Schema and runtime validation protect the UI from incomplete model output. Note text is labeled as untrusted data and kept separate from model instructions.
- Generated packs are private, ephemeral browser state: they are not written to Postgres, Yjs, or the collaborative notes. The interface consistently labels them as study aids that require verification, not medical advice.
- Creators can explicitly save a validated guide to a private room library, reopen it without another model call, and delete it after inline confirmation. Lists return metadata only; the source note snapshot, revealed-card state, and provider metadata are never stored.
- Whiteboard editors can generate a compact answer from a detected circled question and place it inside the blank circled target indicated by an arrow. Drawing the arrow or blank target triggers the answer automatically, with the toolbar action available as a retry. The question is sent through a separate server-only route, and the generated answer is stored as a normal collaborative whiteboard text element.

## Version history behavior

- Owners and editors can save named snapshots containing ProseMirror JSON and the corresponding full Yjs state.
- Restoring first saves the current notes as a safety version, then replaces the live editor content so the change synchronizes through Yjs.
- Viewers can read documents and history, but cannot edit, save versions, or open an editing WebSocket.
- Existing version rows cannot be updated or deleted by authenticated users.

## Offline editing behavior

- Each editable tool waits for its account/room/kind IndexedDB document, using `boardprep:${userId}:${roomId}:${kind}` with `notes`, `pdf`, or `whiteboard`.
- An already-loaded room remains editable without network access. Local and remote status are reported separately, and version save/restore controls stay disabled until live sync returns.
- Reconnection requests a fresh access token and reconnects the same Yjs document, so offline and concurrent updates merge through the CRDT instead of replacing either side.
- Explicit sign-out clears every registered offline document for that account before ending the server session. Tokens, email addresses, and authorization decisions are never stored in the offline registry.
- IndexedDB is unencrypted same-origin browser storage. Use a private operating-system/browser profile for sensitive notes, especially on shared devices.

## Reconnection review behavior

- Yjs always performs the document merge. Qollab opens a review only when the current mounted browser session produced focused editor updates while remote sync was unavailable and then received remote document updates during reconciliation; editor initialization, presence changes, and conflict-free reconnects stay silent.
- The inline review compares plain-text excerpts from `Your offline draft` and the `Current merged note`. Keeping the merged note is the recommended, non-destructive action.
- `Use my offline draft` requires a second confirmation and first saves the current merged JSON and Yjs state as an authenticated immutable version. A checkpoint failure or an intervening live edit aborts replacement and leaves the merged note unchanged.
- Review drafts and update counters are transient in-memory data. Qollab does not persist a separate conflict queue or treat the review as an authorization source.

## Verification

```bash
npm run format:check
npm run lint
npm run build
npm run typecheck
npm run verify:yjs
npm run verify:schema
npm run verify:rooms
npm run verify:version-history
npm run verify:offline-sync
npm run verify:conflict-review
npm run verify:password-reset
npm run verify:phase-3
npm run verify:phase-3-storage
npm run verify:phase-4
npm run verify:saved-study-guides
```

`verify:version-history` uses disposable confirmed users and temporary database rows. It checks profile provisioning/privacy, RLS, read-only viewers, role-escalation denial, tokenless/unauthorized WebSocket rejection, multi-client sync, restart persistence, version creation, and immutability, then cleans up in `finally`.

`verify:rooms` uses three disposable confirmed users to prove atomic creation, unique slugs, private/public access, explicit public joining and leaving, exact-email membership, editor/viewer enforcement, immutable ownership, owner-only settings, deletion cascades, and cleanup.

`verify:offline-sync` uses the production offline adapter with an in-memory IndexedDB implementation and disposable Supabase fixtures. It verifies local recovery, account/room isolation, sign-out cleanup, disabled-storage fallback, authenticated reconnect, concurrent CRDT merge, and durable remote persistence.

`verify:conflict-review` proves fail-closed local-only and remote-only classification, actual Yjs transaction-origin tracking, pre-remote draft capture, merged content, excerpt/label behavior, and the review region's static accessibility and action markup.

`verify:password-reset` checks input normalization, password confirmation limits, HTTP(S)-only callback construction, trusted-claim update ordering, accessible form contracts, recovery failure routing, and the login entry point without sending an email.

`verify:phase-3` checks PDF magic/MIME/size validation, normalized annotation and whiteboard boundaries, isolated offline/remote names, independent CRDT-map merging, client-only loading, read-only controls, zoom, and upload-route guards. `verify:phase-3-storage` uses disposable confirmed users to prove the private bucket limits, three-document room invariant, owner upload/replacement, viewer denial, member signed reads, outsider denial, and old-object cleanup.

`verify:phase-4` checks source limits, exact output shapes, strict structured-output settings, provider refusal handling, authentication and membership wiring, server-only configuration, all five assistant views, keyboard tab behavior, medical-study messaging, and responsive navigation contracts without consuming provider tokens.

`verify:saved-study-guides` uses disposable confirmed users and a temporary room to verify the hosted saved-guide table, metadata-only lists, creator detail loading, member/outsider isolation, immutable grants, owner deletion, and cleanup cascades.

## Current limitations

- Cold offline startup is not implemented: the protected route and application shell must already be available. A service worker/cache strategy remains roadmap work.
- Reconnection review is current-session and excerpt-based; it does not infer unsynchronized intent after a full application restart or provide semantic rich-text/per-author diffs.
- Yjs persistence currently rewrites the complete state blob; large documents will need incremental-update compaction and monitoring.
- Phase 3 intentionally provides one active PDF per room and a focused SVG whiteboard. PDF libraries/OCR, semantic text selection, whiteboard templates, object transforms, and large media libraries remain later work.
- Phase 4 sends only note snapshots; PDF and whiteboard extraction are not included. Saved guides are creator-private and not shared with room members; the in-memory rate limit is instance-local rather than a distributed production quota.
- WebSocket access tokens are sent as upgrade query parameters. The service never logs request URLs, but production infrastructure should redact query strings or introduce short-lived connection tickets.
- Adding collaborators is limited to existing Qollab accounts identified by exact email. Pending invitations, outbound invitation delivery, ownership transfer, room archival, and public-room pagination/search remain future work.
