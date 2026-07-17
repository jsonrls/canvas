# BoardPrep Canvas

BoardPrep Canvas is an authenticated collaborative study-notes application built with Next.js, Supabase, Tiptap, and Yjs. Signed-in users can create public or private study rooms, discover and join public rooms, switch among their rooms, and collaborate according to owner/editor/viewer membership. Room owners can update settings and manage existing BoardPrep accounts as collaborators. Members can edit together, see live presence and cursors, continue editing through network interruptions, review overlapping offline and shared changes, save immutable named versions, and restore an earlier version into the live shared document. The browser persists account-scoped Yjs updates in IndexedDB, while the separate Yjs service persists shared document state in Supabase and reloads it after a restart.

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
```

`NEXT_PUBLIC_YJS_WS_URL` is the browser-visible address of the service started by `npm run dev:yjs`; it is not a generated credential. Production must use a separately hosted `wss://` endpoint. `YJS_ALLOWED_ORIGIN` can require an exact browser Origin in production.

The database pooler settings are used only by the schema verifier; application data access goes through the Supabase Data API and RLS.

## Room lifecycle behavior

- Room creation atomically creates the room, immutable owner membership, and notes document. Server-generated slugs are normalized and collision resistant.
- Signed-in users can discover and explicitly join public rooms. Private rooms are visible only to members, and non-owner members can leave explicitly.
- Owners can rename a room, change its visibility, add an existing account by exact email as editor or viewer, change non-owner roles, remove non-owner members, and delete the room with typed-name confirmation.
- Owners cannot demote, remove, or leave themselves. Collaborator email addresses are never returned by room reads or rendered in browser props.
- Opening `/rooms/[roomId]` never creates data. Viewers receive a persisted read-only snapshot and do not open a writable WebSocket or IndexedDB collaboration path.

## Version history behavior

- Owners and editors can save named snapshots containing ProseMirror JSON and the corresponding full Yjs state.
- Restoring first saves the current notes as a safety version, then replaces the live editor content so the change synchronizes through Yjs.
- Viewers can read documents and history, but cannot edit, save versions, or open an editing WebSocket.
- Existing version rows cannot be updated or deleted by authenticated users.

## Offline editing behavior

- The editor waits for the account-and-room IndexedDB document before mounting, using the key `boardprep:${userId}:${roomId}:notes`.
- An already-loaded room remains editable without network access. Local and remote status are reported separately, and version save/restore controls stay disabled until live sync returns.
- Reconnection requests a fresh access token and reconnects the same Yjs document, so offline and concurrent updates merge through the CRDT instead of replacing either side.
- Explicit sign-out clears every registered offline document for that account before ending the server session. Tokens, email addresses, and authorization decisions are never stored in the offline registry.
- IndexedDB is unencrypted same-origin browser storage. Use a private operating-system/browser profile for sensitive notes, especially on shared devices.

## Reconnection review behavior

- Yjs always performs the document merge. BoardPrep opens a review only when the current mounted browser session produced focused editor updates while remote sync was unavailable and then received remote document updates during reconciliation; editor initialization, presence changes, and conflict-free reconnects stay silent.
- The inline review compares plain-text excerpts from `Your offline draft` and the `Current merged note`. Keeping the merged note is the recommended, non-destructive action.
- `Use my offline draft` requires a second confirmation and first saves the current merged JSON and Yjs state as an authenticated immutable version. A checkpoint failure or an intervening live edit aborts replacement and leaves the merged note unchanged.
- Review drafts and update counters are transient in-memory data. BoardPrep does not persist a separate conflict queue or treat the review as an authorization source.

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
```

`verify:version-history` uses disposable confirmed users and temporary database rows. It checks profile provisioning/privacy, RLS, read-only viewers, role-escalation denial, tokenless/unauthorized WebSocket rejection, multi-client sync, restart persistence, version creation, and immutability, then cleans up in `finally`.

`verify:rooms` uses three disposable confirmed users to prove atomic creation, unique slugs, private/public access, explicit public joining and leaving, exact-email membership, editor/viewer enforcement, immutable ownership, owner-only settings, deletion cascades, and cleanup.

`verify:offline-sync` uses the production offline adapter with an in-memory IndexedDB implementation and disposable Supabase fixtures. It verifies local recovery, account/room isolation, sign-out cleanup, disabled-storage fallback, authenticated reconnect, concurrent CRDT merge, and durable remote persistence.

`verify:conflict-review` proves fail-closed local-only and remote-only classification, actual Yjs transaction-origin tracking, pre-remote draft capture, merged content, excerpt/label behavior, and the review region's static accessibility and action markup.

`verify:password-reset` checks input normalization, password confirmation limits, HTTP(S)-only callback construction, trusted-claim update ordering, accessible form contracts, recovery failure routing, and the login entry point without sending an email.

## Current limitations

- Cold offline startup is not implemented: the protected route and application shell must already be available. A service worker/cache strategy remains roadmap work.
- Reconnection review is current-session and excerpt-based; it does not infer unsynchronized intent after a full application restart or provide semantic rich-text/per-author diffs.
- Yjs persistence currently rewrites the complete state blob; large documents will need incremental-update compaction and monitoring.
- WebSocket access tokens are sent as upgrade query parameters. The service never logs request URLs, but production infrastructure should redact query strings or introduce short-lived connection tickets.
- Adding collaborators is limited to existing BoardPrep accounts identified by exact email. Pending invitations, outbound invitation delivery, ownership transfer, room archival, and public-room pagination/search remain future work.
