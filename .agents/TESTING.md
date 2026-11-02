# Qollab verification

Executable scripts in `package.json` are authoritative. Tests use Node assertions,
`tsx`, real Yjs documents, and selected server rendering. Jest, React Testing
Library, MSW, Cypress, k6, and the old illustrative CI workflow are not installed
or configured by this repository.

## Local checks

```bash
npm run verify:workspace
npm run theme:check
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run verify:buttons
npm run verify:password-reset
npm run verify:account-profile
npm run verify:conflict-review
npm run verify:phase-3
npm run verify:phase-4
npm run verify:study-tools
npm run verify:collaboration-lifecycle
npm run verify:collaboration-persistence
npm run verify:workspace-shell
npm run verify:design-system
```

`verify:workspace` detects numbered copies in generated output and checks that
private capacity fixtures and CLI state cannot be committed accidentally.
Typecheck and build run this check first. It reports conflicts rather than deleting
files or suppressing TypeScript errors.

The model/provider checks validate bounded inputs, outputs, file payloads,
CRDT merge behavior, request contracts, and refusals without paid model calls.
The collaboration lifecycle check exercises online recovery, authentication cancellation,
listener cleanup, and IndexedDB disposal. The persistence check covers serialized
snapshots and standalone shutdown exit codes using a local runtime stub. Neither
requires hosted credentials.

Rendered-markup checks establish server-rendered semantics only. Static policy
checks establish source boundaries, not browser behavior or hosted permissions.

## Hosted and network integration checks

Inspect each script and its target before running. These verifiers use supplied
environment configuration and can create/delete disposable Auth, database, or
storage fixtures:

- `verify:schema`: inspects the configured schema and policies using `psql`.
- `verify:rooms`, `verify:breakouts`, `verify:room-icons`: room/member/asset lifecycles.
- `verify:version-history`: membership, synchronization, persistence, immutable history.
- `verify:offline-sync`: account-scoped offline storage and hosted CRDT recovery.
- `verify:phase-3-storage`: private PDF upload/replacement/read authorization.
- `verify:saved-study-guides`: private guide lifecycle and retention boundaries.
- `verify:serverless-collaboration`: independent standalone processes with Supabase relay.
- `verify:vercel`: actual deployed cookie-authenticated WebSocket adapter using
  `QOLLAB_DEPLOYMENT_URL` or the script's configured default.

`verify:yjs` starts a local generic Yjs server. It proves protocol synchronization,
not the application's authorization or the Vercel route. No standalone test should
be presented as proof of the deployed upgrade path.

Use a designated development project, retain cleanup in `finally`, and never
print or commit credentials. Capacity test output is private local state in
`capacity-results/`. Do not run a load test or a production-targeted verifier as a
routine local lint/typecheck step.

## Browser acceptance

Exercise main and breakout workspaces at desktop, tablet, and phone widths.
Verify Notes/PDF/Whiteboard switching, read-only permissions, Q&A draft retention,
modal dismissal/focus return, editor and canvas scrolling, and no horizontal page
overflow. Test AI results with deterministic fixtures before live provider use.

Offline-to-online checks must observe restored synchronization and preservation
of local edits, not just a changed status label. Persistence tests must cover
rejected and hanging saves, concurrent writes, cleanup, and shutdown failure.
Do not claim accessibility compliance from source checks or screenshots alone.

## Structure review verification (2026-10-02)

Local browser review used a temporary synthetic room fixture with expected
unauthenticated network errors and no hosted submissions. Main and breakout
frames were inspected at desktop, tablet, and phone widths (320–1440px).
Q&A retained its draft across closing, resizing, and tool switching. Desktop rail,
tablet Dialog, and mobile BottomSheet presentations were observed; Escape
returned focus to the trigger. A targeted mobile fix verified direct Tab and
Shift+Tab wrapping for enabled, disabled, and read-only composer controls.
Mobile PDF empty state and whiteboard fit the viewport; the main frame had one
main landmark. The temporary route was removed after review.

This pass did not exercise real PDF uploads, populated Q&A scrolling, a software
keyboard, hosted authentication/authorization, or live collaboration in a browser.
Dedicated local lifecycle and persistence scripts cover their stated boundaries;
historical hosted results below are not a fresh hosted pass.

## Historical verification evidence

The following reports describe earlier sessions, not a fresh pass on the current
working tree. Current check results must be reported separately.

Phase 3 browser acceptance on 2026-07-17 used a disposable confirmed owner and room against the real development services. At desktop width it verified the PDF empty state, direct private upload and PDF.js render, page-comment creation, text save, reply, bookmark, 125% zoom, whiteboard rectangle/text/image insertion, live status, and clean application console. At `375 × 812` it verified visible Notes/PDF/Board navigation, a non-zero responsive whiteboard, no horizontal document overflow, and no framework overlay. Temporary Storage, room, and Auth records were removed afterward.

Phase 4 acceptance on 2026-07-18 passed the full repository gate, every Phase 1–3 verifier, the deterministic Phase 4 contract, and a live OpenAI structured-output smoke test. An authenticated disposable room then verified explicit note capture, loading and success states, keyboard tab navigation, immediate quiz feedback, flashcard flipping, learning recommendations, untrusted embedded-instruction handling, cautious misconception review, the persistent medical-study notice, and unchanged notes on return. At `375 × 812` it measured zero horizontal overflow, 56-pixel result tabs, and 50-pixel workspace controls. The application produced no warnings or errors and no framework overlay; unrelated wallet-extension console noise was excluded by origin. The temporary room, memberships, documents, and Auth user were removed afterward.

Saved-guide acceptance on 2026-07-18 passed the hosted migration and lifecycle verifier: creator metadata lists omit full JSON, creator detail loads the validated payload, another room member and outsider receive no rows, non-creators cannot delete, creators can delete, and temporary users/rooms cascade cleanly.

The 2026-07-17 browser acceptance pass additionally verified `Live → Offline → Live`, writable Tiptap content during network emulation, the exact IndexedDB key and minimal registry, disabled checkpoint actions, clean-context receipt of the reconnected edit, no console warnings/errors, and account-wide database removal before sign-out.

Password-recovery browser acceptance on 2026-07-17 verified the request page at desktop and 375-pixel widths, visible labels and helper text, the login return path, invalid-or-expired update-link routing, and a clean application-origin console. The authenticated update form remains covered by its static contract and Server Action verification; no recovery email was sent during acceptance.

Conflict review visual/interactive browser acceptance was not executed because three checks exposed neither the documented browser CLI nor a browser runtime backend. On 2026-07-17, the product owner explicitly accepted the passing production HTTP smoke, full build, authenticated two-client CRDT merge, real Yjs transaction-origin detector, static accessible panel rendering, strict types, and lint as the implementation closure gate. This is a documented verification exception: it is not evidence for real-browser focus order, responsive appearance, or the complete click-through checkpoint flow, which remain recommended regression coverage.

Room-management interactive browser acceptance was also unavailable. Closure evidence is the production build, static accessibility/interaction review, protected-route HTTP smoke, remote schema assertions, the disposable three-user lifecycle verifier, and all collaboration regression suites; responsive visual appearance and complete click-through behavior remain recommended browser regression coverage.
