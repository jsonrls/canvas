 What This Is

  This project is Canvas / MyBoardPrep Collaborative Learning Suite: an authenticated, real-time collaborative study workspace for board exam
  preparation. The core unit is a study room where students, instructors, or reviewers can work together on shared notes, PDFs, whiteboards,
  and AI-generated study materials.

  It is built with:

  - Next.js / React for the app
  - Supabase Auth, Postgres, Storage, and RLS for identity, data, and private files
  - Yjs + y-websocket for real-time collaboration and CRDT merging
  - Tiptap for rich-text collaborative notes
  - React PDF for PDF rendering
  - OpenAI Responses API for study-pack generation
  - IndexedDB for local-first recovery after network interruptions

  Strategically, the SaaS validation doc says the strongest opportunity is not “generic AI study app,” but a group-native study workspace for
  high-stakes exam cohorts, especially Philippine licensure review groups such as PNLE nursing cohorts.

  Implemented Features

  Authentication & Account Management

  - Email/password sign-up and sign-in
  - Supabase cookie-backed sessions
  - Protected room routes
  - Automatic profile creation with display name
  - Profile-backed presence and version authorship
  - Account-neutral password reset flow
  - Authenticated new-password update flow
  - Sign-out that clears local offline documents

  Room Lifecycle & Permissions

  - Authenticated /rooms dashboard
  - Create public or private rooms
  - Server-generated collision-resistant room slugs
  - Joined-room list
  - Public-room discovery and explicit join
  - Leave public/joined rooms as non-owner
  - Owner-only room settings
  - Rename room
  - Toggle room visibility
  - Add existing users by exact email
  - Assign owner, editor, or viewer roles
  - Change non-owner roles
  - Remove non-owner members
  - Delete room with typed-name confirmation
  - Immutable owner role: owner cannot demote, remove, or leave themselves
  - Viewers get read-only access

  Collaborative Notes

  - Real-time rich-text editing with Tiptap and Yjs
  - Bold, italic, strike, headings, lists, quotes, code, undo, redo
  - Live cursors
  - User presence
  - Connection status states
  - Durable Yjs persistence in Supabase
  - Read-only snapshots for viewers
  - Room-scoped Yjs document routing
  - Notes use the room slug as their collaboration document name

  Version History

  - Named note snapshots
  - Stores ProseMirror JSON and full Yjs state
  - Newest-first history list
  - Version author and timestamp metadata
  - Restore older versions into the live collaborative note
  - Safety version before restore
  - Immutable version rows
  - Viewers can read history but cannot save or restore

  Offline Editing & Sync

  - Account/room/tool-scoped IndexedDB persistence
  - Offline editing after a room has already loaded
  - Local and remote status shown separately
  - Reconnect with fresh access token
  - Yjs CRDT merge on reconnection
  - No last-write-wins replacement
  - Version actions disabled while offline
  - Sign-out clears all registered offline documents for that account
  - Offline storage does not persist tokens, emails, or authorization data

  Conflict / Reconnection Review

  - Detects current-session overlap between offline local edits and remote edits
  - Shows an inline review only when both local and remote document updates occurred
  - Compares “Your offline draft” vs “Current merged note”
  - Recommends keeping the Yjs merged result
  - “Use my offline draft” requires confirmation
  - Saves the current merged state as an immutable safety version before override
  - Conflict-review data is transient and not persisted

  PDF Study Tool

  - One active private PDF per room
  - Owners/editors can upload or replace PDFs
  - 15 MiB PDF limit
  - Private Supabase Storage bucket
  - Two-phase signed upload flow
  - Server revalidates MIME, size, path, and %PDF- header
  - Members receive short-lived signed read URLs
  - Viewers can read PDFs but cannot upload or annotate
  - PDF rendering with page navigation and zoom
  - Highlights
  - Underlines
  - Freehand marks
  - Sticky notes
  - Page comments
  - Replies
  - Bookmarks
  - Annotation geometry validation
  - PDF revision isolation so stale annotations do not appear on replaced PDFs

  Whiteboard Study Tool

  - SVG-based collaborative whiteboard
  - Freehand drawing
  - Rectangles and ellipses
  - Lines and arrows
  - Text blocks
  - Image insertion with size/type limits
  - Multi-user Yjs merging per element
  - Viewer read-only mode
  - Awareness-only laser pointer
  - Laser is not persisted
  - Responsive whiteboard layout
  - Separate whiteboard Yjs document from notes and PDF

  AI Study Assistant

  - Captures an explicit snapshot of the current note text
  - Generates one structured study pack with:
      - Discussion summary
      - 3–5 question quiz
      - 4–8 flashcards
      - 2–5 learning recommendations
      - Cautious misconception review

  - Distinct UI views for each output type
  - Keyboard-operable tabs/views
  - Authenticated room-membership check before OpenAI call
  - Server-only OpenAI key
  - Provider storage disabled
  - Strict JSON Schema and runtime validation
  - Prompt-injection separation: note text treated as untrusted data
  - Request size, output, timeout, and rate limits
  - Persistent notice that AI output is a study aid, not medical advice
  - Viewers can generate from notes they can already read
  - AI generation currently uses notes only, not PDF or whiteboard extraction

  Saved AI Study Guides

  - Explicitly save generated study guides
  - Private saved-guide library per creator and room
  - List up to 50 saved guides
  - Metadata-only list view
  - Load full guide only on detail request
  - Reopen saved guide without another model call
  - Delete with inline confirmation
  - Stores generated output, title, timestamps, source character count
  - Does not store source note snapshot, quiz reveal state, or provider metadata
  - Creator-private RLS
  - Immutable saved-guide rows
  - Cascades on room/account deletion

  Presenter / Viewer Features Added By Developer

  - PowerPoint-style whiteboard laser with focal point and fading trail
  - Laser can remain active while drawing, shaping, arrowing, or placing text
  - Viewer follow-presenter control
  - Three-second lost-presenter prompt
  - Follow presenter across Notes, Whiteboard, and PDF
  - Following viewers track presenter’s relative notes scroll position
  - Viewer-only participants receive live whiteboard and PDF changes
  - PDF access refreshes when signed URLs fail or expire

  Security Features

  - Supabase Row Level Security across exposed app tables
  - Private authorization helpers
  - No anonymous table privileges
  - Server-only service-role key
  - Authenticated Yjs WebSocket upgrades
  - Owner/editor write access, viewer read access
  - Private PDF bucket with storage RLS
  - Exact-email collaborator lookup contained inside owner-authorized DB function
  - Safe bounded API errors
  - Password reset does not reveal account existence
  - AI provider credentials and error bodies never exposed to browser
  - Offline IndexedDB scoped by account, room, and tool

  Testing / Verification Features

  The docs list verification scripts for:

  - Formatting
  - Lint
  - Build
  - Typecheck
  - Yjs sync
  - Schema/RLS
  - Room lifecycle
  - Version history
  - Offline sync
  - Conflict review
  - Password reset
  - Phase 3 PDF/whiteboard
  - Phase 3 storage
  - Phase 4 AI
  - Saved study guides

  Several browser acceptance checks are documented as passed, though a few older visual/browser checks had explicit environment exceptions.

  Planned / Not Yet Complete Features

  Study & Learning Roadmap

  - Inline comments
  - @mentions
  - Chat
  - Group flashcards workflow: Draft → Review → Instructor Approval → Published Deck
  - Checklist
  - Pomodoro timer
  - Case discussions
  - Case library
  - AI case analysis
  - Differential diagnosis tools
  - Treatment-plan templates
  - Instructor case reviews
  - Shared saved AI guides
  - PDF/whiteboard AI extraction
  - Spaced repetition
  - Mastery tracking
  - Weak-topic analytics
  - Adaptive quizzes
  - Progress dashboards
  - Question bank
  - Exam calendar

  Collaboration Roadmap

  - Screen sharing
  - Voice notes
  - Reactions
  - Advanced whiteboard templates
  - Better mobile collaboration
  - Video conferencing
  - Breakout rooms
  - Recording/playback
  - Collaborative concept maps
  - Polling

  SaaS / Business Gaps

  - Billing and subscriptions
  - Entitlements and plan quotas
  - Product analytics
  - Funnel tracking
  - Retention analytics
  - Public marketing site
  - Guided onboarding
  - Exam-specific templates
  - Pending invitations
  - Bulk invites
  - Organization administration
  - Institutional SSO
  - Roster imports
  - Abuse reporting/moderation
  - Privacy export/deletion workflows

  PowerPoint / Slides Assessment

  PowerPoint is not implemented as a full feature. The docs recommend treating it as a slides-as-document workflow:

  - Best MVP: convert PPTX to PDF and reuse the existing PDF annotation tool
  - Medium option: convert PPTX to slide images with presenter controls
  - Not recommended: native in-browser PowerPoint renderer, because it is very complex

  Current Limitations

  - Cold offline startup is not implemented
  - Offline support works after the protected app shell has loaded
  - Reconnection review is excerpt-based, not semantic rich-text diffing
  - Yjs persistence rewrites full state blobs
  - Only one active PDF per room
  - No PDF OCR or semantic text extraction
  - No advanced whiteboard transforms/templates
  - AI only uses note snapshots
  - Saved guides are private to creator
  - AI rate limit is instance-local
  - WebSocket tokens are sent as upgrade query params
  - Collaborator addition requires existing accounts and exact email
  - No production SaaS operations yet: billing, analytics, onboarding, and marketing are absent

  Built with Yjs + y-websocket for real-time CRDT merging, enabling multiple users to co-edit notes, whiteboards, and PDFs simultaneously. Features include:

• Live cursors and user presence indicators
• Tiptap rich-text collaborative notes with bold, italic, headings, lists, and more
• SVG-based collaborative whiteboard with freehand, shapes, arrows, and text
• Room-scoped Yjs document routing for notes, whiteboard, and PDF layers
• Durable Yjs persistence in Supabase
• Offline editing with IndexedDB and CRDT merge on reconnection
• Conflict/reconnection review when both local and remote edits occurred
• Presenter mode with laser pointer and viewer follow controls
• Connection status states and authenticated WebSocket upgrades
• Read-only snapshots for viewer-role participants
