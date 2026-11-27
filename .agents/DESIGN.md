---
name: Qollab Halid/Astryx design system
version: 1.2
status: approved foundation
last_updated: 2026-10-09
---

# Qollab design system

## Brand identity (2026-11-25)

Supersedes every older colour, font, logo and primary-button rule below.
References: Figma (each person's live cursor colour: the logo pointer), Notion
(a black and white core, colour kept for content: the ink primary button),
Linear (one mark plus wordmark with strict one-colour variants). The token
table further down is historical; `theme/qollab-workshop.ts` is the source.

- Ink acts, cobalt points. The primary action is a flat ink pill
  (`--qollab-button-primary`); cobalt `#2B4BFF` marks links, focus, selection
  and the logo pointer. No gradient or glow on buttons. Small accent text uses
  the deeper `#1F3BE0`.
- Ink `#0E1024`, secondary text `#4B4F6B`, soft panels `#F2F3FA`, selected
  tint `#E8ECFF`. Success, warning and error colours are unchanged, and so are
  the six answer colours, which were tested for red-green colour blindness.
- Lexend headings, landing page included, over Figtree; JetBrains Mono for
  codes.
- The landing page keeps its layout, its blue panel and its pale photo fields.
- Controls (references: Stripe for a label above and an error in words below
  the field, Linear for menus as one rounded sheet with a tinted, ticked row,
  Notion for small confirm dialogs, Vercel for flat toasts). Single-line
  fields, selectors, dates and file pickers are pills with 16px insets; text
  areas are 16px. Focus is a solid 2px cobalt ring, no halo. A field's error is
  a plain line under it. Menus and lists have 16px corners and 8px rows;
  dialogs and sheets 24px; banners 16px; segmented controls, tokens and ghost
  buttons are pills. Toasts are flat. Shadows are neutral and only on things
  that float (`--qollab-popup-shadow`, `--qollab-dialog-shadow`).
- Logo: a ring (the room) and a pointer (a person arriving) that draw a Q. See
  `QOLLAB_LOGO.md`.

## Current front-end direction (2026-11-06)

The landing page follows the user's fintech reference image ("use this
instead"), after two earlier directions modelled on https://myboardprep.org/
were set aside. This section supersedes anything below that conflicts with it,
including Inter Tight, the warm body colour, 6px and 9px radii, and the flat
homepage rules. The token table below is historical;
`theme/qollab-workshop.ts` is the source.

- Look: white page, soft grey rounded cards (`bg-muted`, `rounded-3xl`) holding
  white insets, one flat saturated blue panel (`bg-accent-bg`), flat pale blue
  illustration fields (`bg-accent-muted`; no gradients or photos on the landing
  page since 2026-11-28), navy pill actions (`PillLink`), small label chips
  above section headings, medium-weight Lexend headings with tight tracking.
- Landing order: top bar (logo, centred links, Log in, Get started pill),
  centred hero, an illustrated study-group card beside the `RoomTour` panel
  (2026-11-28, after Notion's homepage: one drawn app window per chapter with a
  glass chapter dock that auto-advances until a chapter is picked; the
  screenshots, tour video and gradient grounds are gone, and every landing
  preview is a flat SVG in `landing-art.tsx`), eight tool tiles with small
  drawings, `#why`
  three cards, `#workspace` two tall cards, the wide "Ask the whiteboard" card
  and four small ones, `#live` activity picker beside a blue panel (2026-11-25, redesigned after Notion's product pages: the heading, a row of four activity tab cards, and one large `bg-muted` frame holding a white big screen drawn with the real charts and a phone whose taps change that screen; from `lg` it pins at full height and scrolling steps through the tabs) (after
  Mentimeter's type list and preview; it draws the room's own charts from
  `live-charts.tsx` and lists `LIVE_QUESTION_KINDS`), `#how` numbered
  steps beside a photo with a glass figure, study pack rows, `#roles` three
  cards with the editor card dark, `#faq` numbered accordion, closing panel,
  footer.
- Landing content (2026-11-25): any group, any subject. No landing, sign-in or
  placeholder copy may assume a medical, exam-board or other single-industry
  user.
- Sign-in, sign-up and both password pages share `AuthShell`: a centred
  column (bold heading, one line of intro, pill fields with placeholders and
  hidden labels, the pill `AuthSubmit` action) beside a tall pale blue panel
  with the group photo, two floating avatars, a sample room card and a
  caption. The panel hides below `lg`. No social sign-in buttons: the app has
  no providers.
- Room directory (`/rooms`, 2026-11-23): the title greets the signed-in person
  ("Your study rooms, {name}") and one sentence below states a fact from the
  data (rooms joined, and the most recently updated room). The "Study commons"
  strip is gone. Joined rooms sit in a `bg-muted rounded-3xl` panel and public
  rooms in a Soft Blue (`bg-accent-muted`) panel headed "Open to join", side by
  side at 3:2 from `lg` and stacked below it. Rooms are white `rounded-2xl`
  list rows inside the panel with 8px gaps, not `Card`s. This supersedes the
  ruled "Room directory" bullet below. Plan:
  `plan/feature-rooms-directory-greeting-home-1.md`.
- Account, room settings and breakout directory (2026-11-23): the same panel
  system as the room directory. Classes live in `src/components/ui/panel.ts`
  (`PANEL_MUTED`, `PANEL_ACCENT`, `PANEL_ROW`, `PANEL_HEADING`). Each section
  is a tonal `rounded-3xl` panel with a body-size heading; records and choices
  are white `rounded-2xl` rows inside it; privacy notes use the Soft Blue
  panel. Page titles are 24px, 29px from `md`. No dividers between sections,
  no coloured cards, no icon chips, no small label above a heading. The
  breakout directory lists rooms as rows beside a 384px form panel. The
  account menu is a pill trigger with a rounded floating panel and
  left-aligned 44px rows. This supersedes the divider-led account and
  settings rules below.
- Workspace frame and sidebar (2026-11-23, flush frame): the sidebar sits on
  the muted ground; the workspace is the white surface beside it, edge to
  edge, split from the sidebar by one hairline. No inset, no rounded sheet
  (tried and dropped: it left a gap above and below). The selected item is a white pill with no accent bar
  (muted inside the white phone drawer). A white room card at the top shows
  the icon, name, role and access, with a "Switch room" menu. Groups are
  "Study tools" and "Room"; "Room" holds Breakout rooms (plain count)
  and the Viewer editing row, which matches the nav items and has no
  tinted icon square. The account row is alone at the bottom. This supersedes
  the white rail, 1px divider and Soft Blue selected row described below.
- Room header (2026-11-23): identity is one line, "Room / Tool", then the
  access and role tokens. The sync status sits in a muted pill, and the
  actions (Present or Follow, version history, Manage; Reconnect, back,
  people and Q&A in breakouts) share one muted tray as ghost buttons. Height
  stays 56px. `scripts/verify-room-header.ts` still pins the contract.
  Colour in the header goes on state only: the sync pill is green when live,
  amber offline, red on error and grey otherwise. The action tray and its
  buttons stay neutral; Present shows the theme's pressed style while
  presenting.
  The header carries no presence avatars (2026-11-24). People is off the
  expanded room sidebar (2026-11-25); the collapsed sidebar's icon and the
  breakout sidebar still open the list. The collapsed sidebar keeps the
  account avatar at the bottom, below that icon.
- Notes, PDF and whiteboard toolbars (2026-11-25) share one size: a 40px pill of
  36×32px buttons on desktop, a 56px bar of 44px buttons on phones, 16px icons.
- Settings (2026-11-25): "Reset password" opens a dialog that emails the link to
  the signed-in address; `/reset-password` stays for people who are signed out.
- PDF tool (2026-11-23). References: tldraw, Excalidraw and FigJam (tools in
  one floating icon pill, labels as tooltips), Google Drive and Acrobat
  viewers (page controls floating over a grey desk). From 761px: the tools
  are one centred muted pill of icon-only buttons; the label stays for screen
  readers and the tooltip comes from `title`. The sync status pill, file
  name, Download and Replace (a file-up icon) sit to the right of it, so
  the separate file row is gone. The PDF's sync badge shows only when it is
  not live; "Live" is said once, in the room header. The page sits on a rounded muted desk. Page controls are a
  small centred pill with icon-only Previous and Next. From 761px to 1279px
  the file details drop to a line under the pill. The "More" (ellipsis)
  overflow menu is phone-only: from 761px its tools are all in the toolbar,
  so the trigger is hidden. On phones it opens a white bottom sheet of muted
  tiles; its tiles are `ButtonControl variant="custom"`, because the theme's
  ghost style forces a transparent fill with `!important`. Same for the
  whiteboard's "More" sheet.
- PDF "Clear all marks" (2026-11-24): an eraser button in the tool pill
  (and a tile in the phone "More" sheet) removes every drawing, highlight
  and underline on all pages of the current PDF revision, after an
  alert dialog that states the count and that it can't be undone. Focus
  starts on "Keep marks". Sticky notes, page comments, replies and bookmarks
  are kept. Anyone who can edit may use it, as with deleting one mark. The
  button is disabled when there are no marks.
- Whiteboard (2026-11-24). References: Excalidraw (tool pill floating at the
  top centre; zoom and undo bottom-left), tldraw (navigation and zoom in the
  bottom-left corner; labels as tooltips), FigJam (tools float over the
  board). From 761px the toolbar is a click-through layer over the board
  with white floating pills: tools and colour top-centre; undo, redo, zoom,
  reset and fit bottom-left; help, plus status and Retry when sync is not
  live, top-right; Delete and Clear all bottom-right. Notices float under
  the tool pill. The board is white with faint neutral dots. "Live" and the
  people count are not repeated (the room header and sidebar carry them).
  Phones keep the single row and the "More" sheet; the groups are
  `display: contents` there.
- Whiteboard voice (2026-11-25). References: Google Docs voice typing (one
  click turns the microphone on, one click turns it off) and ChatGPT dictation
  (a recording bar with the time, Cancel and Done). A microphone button sits
  before AI answer in the tool pill and as "Ask by voice" in the phone "More"
  sheet. While the microphone may be on, a card under the tools shows
  "Listening…", the time of one minute, where the voice goes, and the model
  download the first time; it floats, so the board does not resize. The words
  appear after Done. The question is placed as a circle with the words, an
  arrow and a blank circle, in free space in the view, and the usual AI answer
  fills the blank circle. If the answer fails, AI answer retries it. Whiteboard
  notices float on phones too, because resizing the board refits the camera.
- PDF fit page (2026-11-24): at 100% zoom the whole page fits the page area
  (the smaller of width and height, using the page's own aspect ratio), like
  "fit page" in PDF viewers, so slides need no scrolling. Zooming in still
  scrolls. Phones keep fit-to-width. `fitPageWidth` in
  `src/lib/pdf-annotations/study-tool.ts`.
- Notes canvas (2026-11-23): the formatting tools sit in one centred muted
  pill above the page instead of a ruled bar; groups are separated by space,
  not dividers. The footer has no rule and the word count sits in a muted
  pill. The viewer notice is a centred muted pill. The page itself stays on
  the white sheet.
- AI study assistant (2026-11-25). References: NotebookLM Studio (outputs
  listed first, saved work in its own list), Quizlet (one large card, click to
  flip, arrows underneath; study modes in one row of tiles). Saved guides sit
  in a 320px muted panel beside the pack from `xl` and below it before that.
  Before generating, the five outputs are white rows in a muted panel with one
  primary action. The views are five equal tiles across the pack, each with a
  coloured icon and its item count; the chosen one is tinted and edged in its
  colour with semibold text. On phones they are three over two, without counts.
  Quiz answers state right and wrong in words as well as colour. The options
  dialog is an Astryx `Dialog` with two `Slider`s. Deleting a saved guide opens
  an alert dialog that names it; focus starts on "Keep guide" and a failed
  delete shows its error inside the dialog. No small label above a
  heading, no icon chips, no numbered capability grid.
- Flashcard colour (2026-11-25). References: Kahoot (a flat colour and plain
  geometric shapes per choice), Quizlet (one large card that flips). Each card
  takes one of the six answer colours in turn as a tint (15% for the prompt, 25%
  for the answer) with corner shapes at 30%. Shapes are decoration: they are
  hidden from screen readers, and the label still says Prompt or Answer. Dark
  text over a shape keeps at least 6.8:1. Flipping fades and lifts the text in
  over 300ms; reduced motion turns it off.
- Live activities (2026-11-25). Reference: Mentimeter (packed word cloud,
  upright columns, donut, pie and dots, speech bubbles, one question filling
  the screen). Answers use six colours, `answer-1` to `answer-6` in the theme,
  tested for red-green colour blindness; besides flashcards and study pack
  tabs, this is the one place the app is multicoloured. Every mark keeps its label, and a correct answer has a tick
  and the word. Full screen draws answers as they arrive, with a Hide button, as
  Mentimeter does; students' own screens wait for "Show to students". Full
  screen shows only what a shared screen may:
  `projectorView` hides secret answers, unshown quiz-style results, form answers and
  unapproved questions. Scales and guesses are hills over a line; ranking and
  100 points are thick bars that slide when their order changes; the 2×2 grid
  uses named circles. A quiz shows a countdown ring; full-screen Q&A shows the
  top question alone. Above the question, its type is a coloured token (`LiveKindToken`; the
  question list keeps plain text):
  ten colours for twelve types, so types with one correct answer share green
  and types that place a mark share cyan; no red, which means delete or error.
  Hosts reorder questions with a grip handle (reference: dragging slides in
  Mentimeter's slide panel); arrow keys on the handle do the same, and a line
  shows where the question will land. Adding a question is a dialog, opened by a button that
  stays at the bottom of the host's panel (references: Kahoot's Add question,
  Mentimeter's New slide); from 672px of tool width (a container query, because
  a breakout's Q&A rail can sit beside it) the list and the question scroll on
  their own, and below it the button sits above the list. Motion stops under reduced
  motion. Plan:
  `plan/feature-live-visuals-1.md`.
- Live activities in breakouts (2026-11-25). References: Mentimeter (the same
  activity views) and Google Meet breakouts (each group works alone; the host
  can enter any group). The tool is the last item in the breakout's Study tools
  and phone selector, with the main room's icon, label, views and "Answer now"
  prompt. Each breakout has its own activities. The Q&A rail stays available
  beside it and tags its questions "Activities".
- Account frame (2026-11-23): the header holds the logo only. From `md`,
  "Back to rooms" and the Profile/Settings links sit in a 224px sidebar that
  starts under the logo; the page content stays capped at 640px beside it.
  Below `md` the links become a tab track above the title.
- Breakout workspace (2026-11-23): uses the same `RoomHeader` as the main
  room (name, presence, sync status, Reconnect on error); the separate status
  strip above the notes is gone. The error page and both controls dialogs use
  the muted panel; the loading screen shows its message in a muted pill.
- Buttons, app-wide: primary is a flat ink pill (`--qollab-button-primary` in
  the theme). Secondary and destructive are pills too; so are ghosts; links keep
  12px corners. `.landing-cta` reuses the same tokens for link actions.
- Fields, app-wide: single-line inputs, number inputs and selectors are pills
  like the buttons. Text areas keep their corners, since a pill cannot hold
  several lines.
- Field focus, app-wide: the border turns accent, with a one-pixel accent rim
  (`--qollab-field-focus-ring`), not an offset outline. A
  transparent outline remains for forced-colours mode. Fields in a warning or
  error state keep their status border. Buttons and links keep the outline.
- Liquid glass (`src/components/home/liquid-glass.ts`) stays on the room's tool
  dock and the figure panel in `SessionSteps`.
- No photographs since 2026-11-28: the landing and sign-in pages use flat SVG
  drawings from `landing-art.tsx`. `home-study-collaboration.png` is still in
  `public/images/` but nothing renders it.
- The reference's testimonials, logos, prices, stats and blog are replaced with
  real content: study packs, roles and product facts. Do not add invented
  proof or prices. Room fragments are labelled as a sample.

## Current redesign direction (2026-10-09)

The user requested an app redesign with anti-slop applied during the work.
The current direction is a study commons: blue ink, readable margins, concrete
study language, and flat controls. This section supersedes the older marketing
composition, auth surface treatment, and eight-icon homepage specification
below; those describe the previous design rather than current acceptance.

Marketing dials: ENERGY 2 / RHYTHM 3 / MOTION 1. Workspace dials:
ENERGY 1 / RHYTHM 2 / MOTION 1. Preserve Inter Tight, JetBrains Mono,
Qollab Blue, Soft Blue, logo geometry, light-only presentation, and existing
workflow and permission contracts.

- Homepage: asymmetric headline/artwork opening at desktop, compact purpose
  statement at `#why`, a reading margin and ruled tool index at `#workspace`,
  two entry paths at `#how`, compact closing action, and one footer row.
  Shared notes lead the tool index; PDF and whiteboard follow; a Soft Blue
  study-pack section describes the actual assistant without implying chat.
- At tablet widths the opening and tool index stack. On phones use 16px gutters,
  smaller display type, and visible entry actions; section destinations remain
  reachable through the page and footer. Artwork keeps its intrinsic ratio.
- Room directory: Study commons identity, Your study rooms title, one Create
  room action, joined/public collections as comparable rows, factual access
  and role labels, actual timestamps/counts, and specific empty-state copy.
- Workspace: compact room identity, selected tool and real access/sync state.
  Keep the 256px default navigation, 56px toolbar, and responsive context
  presentation. No new decorative panels or controls.
- Authentication: open 440px form on white, practical titles, desktop study
  companion hidden below 1024px. Preserve all labels, validation, password
  controls, redirects, recovery semantics, and pending behavior.
- Account: 640px reading/form measure with Profile/Settings navigation. Live
  initial-based profile preview uses real identity without a verification
  badge. Fields, help, validation, save, and privacy use Astryx primitives.
- Loading: stable existing logo, spinner, and truthful contextual text.
  Errors: plain recovery copy with working retry and rooms navigation, without
  an unsupported promise that local data is safe.

Decision reasons (anti-slop R-31): blue maintains brand recognition and marks
action; Inter Tight supports dense reading; mono distinguishes codes; shared
margins give the surfaces a recognizable alignment; unequal section spacing
expresses hierarchy; record rows support comparison; tool icons identify
actual operations; the existing artwork illustrates shared study rather than
customer endorsement; flat buttons keep study content foremost; stronger
control borders and focus outlines help users locate interactive elements.
Semantic status colors communicate real state, supplemented by text.

The theme source owns all colors. Controls use
`--color-border-emphasized` (`#828691` light, `#9696A3` dark) and the
`border-border-strong` Tailwind bridge. Buttons are flat with 6px radii,
white secondary surfaces, and visible hover/pressed/focus feedback.
Do not add generic metrics, testimonials, generated avatars, fake product
screenshots, decorative grids, or a theme toggle without a product reason.

Acceptance requires source and behavior checks plus rendered desktop, tablet,
390px, and 320px review. Record control outcomes, contrast calculations,
focus and overflow evidence, and limitations. Synthetic preview data is labeled
and temporary; never present its expected unauthenticated network errors as a
live collaboration result. The orchestrator runs the anti-slop Delivery Gate.

This is the canonical visual and component contract for Qollab. It translates
the [Halid documentation reference](https://unslop.site/site/docs-article-halid)
into a flat, content-first study workspace built with Astryx. The execution
contract is [design-halid-astryx-redesign-1.md](../plan/design-halid-astryx-redesign-1.md).

The redesign is presentational. Preserve routes, authorization, Server Actions,
repositories, Yjs documents, offline recovery, presenter behavior, study-tool
data, and API contracts.

## Brand

The logo is a ring and a pointer that draw a Q: a room, and a person arriving.
Meaning, files, sizes and usage are in [QOLLAB_LOGO.md](../QOLLAB_LOGO.md).
Give an icon-only brand link an accessible name such as “Qollab rooms.” Treat
the image as decorative when the link already names the destination.

## Visual principles

1. Content leads. Use a persistent navigation rail, readable center canvas, and
   a context rail only when it contains useful secondary information.
2. Structural surfaces are flat. White rails and canvases use 1px dividers, not
   decorative shadows, blur, gradients, or a global graph-paper texture.
3. Qollab Blue is scarce and functional: primary actions, focus, links,
   selected icons, and active indicators.
4. Group with spacing, `Section`, and `Divider` before escalating to `Card`.
5. Dense records are rows. Rooms, breakouts, members, versions, comments, and
   saved guides use `List`/`ListItem` or `Table`.
6. One region has one lead and at most one primary action. Put secondary actions
   in a compact `Toolbar`, `OverflowList`, or `MoreMenu`.
7. PDF and whiteboard are full-bleed tool canvases. Notes, forms, and AI reading
   content remain capped.
8. Version 1 is light-only. Complete dark tokens are maintained for future use,
   but this migration does not add a theme toggle.

## Theme contract

`theme/qollab-workshop.ts` extends Astryx `neutralTheme`. Keep the runtime name
and generated filenames `qollab-workshop`. Brand and semantic color belong in
that theme; never override `--color-*` in `:root`.

| Astryx token                  | Light       | Dark        | Role                                 |
| ----------------------------- | ----------- | ----------- | ------------------------------------ |
| `--color-accent`              | `#2563EB`   | `#93C5FD`   | Primary action, focus, selected icon |
| `--color-accent-muted`        | `#EAF2FF`   | `#172D50`   | Selection and blue callout           |
| `--color-on-accent`           | `#FFFFFF`   | `#171717`   | Content on accent fills              |
| `--color-text-accent`         | `#1D4ED8`   | `#BFDBFE`   | Small linked text                    |
| `--color-background-body`     | `#F3F2EF`   | `#111116`   | Restrained outer canvas              |
| `--color-background-surface`  | `#FFFFFF`   | `#19191F`   | Main canvas and rails                |
| `--color-background-card`     | `#FFFFFF`   | `#1F1F25`   | Standalone widgets only              |
| `--color-background-popover`  | `#FFFFFF`   | `#27272D`   | Menus and overlays                   |
| `--color-background-muted`    | `#F5F5F7`   | `#222228`   | Recessed controls and sections       |
| `--color-background-inverted` | `#0F0F14`   | `#F3F2F7`   | Inverted surface                     |
| `--color-text-primary`        | `#0F0F14`   | `#F3F2F7`   | Main ink                             |
| `--color-text-secondary`      | `#4A4A56`   | `#BCBBC4`   | Supporting copy                      |
| `--color-text-disabled`       | `#747480`   | `#7D7C87`   | Disabled content                     |
| `--color-icon-primary`        | `#0F0F14`   | `#F3F2F7`   | Primary icon                         |
| `--color-icon-secondary`      | `#4A4A56`   | `#BCBBC4`   | Secondary icon                       |
| `--color-icon-accent`         | `#2563EB`   | `#93C5FD`   | Active icon                          |
| `--color-border`              | `#ECEBEF`   | `#34323C`   | Default divider                      |
| `--color-border-emphasized`   | `#828691`   | `#9696A3`   | Input or strong boundary             |
| `--color-neutral`             | `#2563EB14` | `#93C5FD24` | Selected/pressed neutral mix         |
| `--color-overlay-hover`       | `#0F0F1408` | `#FFFFFF0A` | Hover feedback                       |
| `--color-overlay-pressed`     | `#2563EB14` | `#93C5FD20` | Pressed feedback                     |
| `--color-skeleton`            | `#E5E4E9`   | `#3B3944`   | Loading skeleton                     |
| `--color-track`               | `#D8D6DE`   | `#4B4954`   | Slider and progress track            |
| `--color-success`             | `#207A55`   | `#8FD9B0`   | Success state                        |
| `--color-success-muted`       | `#E7F6EE`   | `#2B6A4A4D` | Success support                      |
| `--color-warning`             | `#9A6A1A`   | `#EAB85B`   | Warning state                        |
| `--color-warning-muted`       | `#FFF8E6`   | `#D6923440` | Warning callout                      |
| `--color-error`               | `#B53C36`   | `#FF9B90`   | Error/destructive state              |
| `--color-error-muted`         | `#F4D9D4`   | `#B94A414D` | Error callout                        |

Selected-row text stays primary ink on Soft Blue, with a blue icon or 2px
indicator. Qollab Blue is for actions and icon emphasis; use text-accent for
small linked text. White on Qollab Blue is approximately 5.17:1; text-accent on
Soft Blue is approximately 5.95:1. These calculated palette checks do not
replace verification of actual rendered states, opacity, and focus visibility.

### Type, shape, elevation, and motion

- Body and headings: Inter Tight, loaded through `next/font/google`.
- Code, keyboard hints, and breakout codes: JetBrains Mono, also through
  `next/font/google`.
- Scale: 14px base, 1.2 ratio, semibold headings.
- Editorial page title: 36px, weight 600, line-height 1.1.
- Rich prose: 14px base with 1.6–1.65 line-height.
- Supporting labels use color and weight before a smaller size.
- Radius config: base 3, multiplier 1. Elements resolve to 6px and containers
  to 9px. Override page and chat radii to 12px.
- Motion: 110ms fast and 220ms medium. Honor reduced motion.
- Persistent rails, headers, editors, and panels have no shadow. Low elevation
  is reserved for PDF pages, popovers, dialogs, and transient overlays.
- Use a 4px spacing scale through Astryx spacing props. Raw pixels are reserved
  for structural region budgets, not interior spacing.

## Application frame

Authenticated screens use:

```tsx
<AppShell variant="section" height="fill" contentPadding={0}>
  <Layout>{/* one page layout */}</Layout>
</AppShell>
```

- Desktop SideNav: 256px default, 240px minimum, 320px maximum,
  `autoSaveId="qollab-primary-navigation"`.
- Application header: 56px, white, shadowless, with a 1px divider. It spans the
  center and context regions; the SideNav keeps its own Qollab identity.
- Center: flexible. Notes and AI use a 760px content budget with a 680px reading
  measure. Settings and account forms cap at 640px. Auth forms follow the 440px shared auth pattern below.
- Context: one 360px end `LayoutPanel` with a divider. Do not nest a second
  `Layout` inside it, and do not render an empty panel.
- PDF and whiteboard set center padding to 0 and fill the available region.
- The shell must not create horizontal page scrolling.

### Responsive contract

| Width        | Navigation                                 | Context                                                        | Content                                                  |
| ------------ | ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------- |
| `>1024px`    | Resizable 256px SideNav                    | Persistent 360px LayoutPanel                                   | Flexible center; capped reading measure where applicable |
| `768–1024px` | Compact/collapsible rail remains available | Same controlled content in `Dialog purpose="info" width={400}` | One primary tool region                                  |
| `<768px`     | AppShell MobileNav at `md`                 | Same controlled content in `BottomSheet height="tall"`         | One region; 16px inset unless full-bleed                 |

Use `useMediaQuery("(max-width: 1024px)")` for context presentation and
`mobileNav={{ breakpoint: "md" }}` for primary navigation. Context state must
live above the responsive presenter so moving between `LayoutPanel`, `Dialog`,
and `BottomSheet` does not lose drafts or selection.

Preserve dynamic viewport height, safe-area insets, reduced motion, and minimum
44 × 44px touch targets. Drop a rail rather than compressing all three.

## Component mapping

### Shared buttons

Import app-owned buttons from `@/components/ui/button`. The theme owns their
flat outline and interaction feedback; do not introduce per-page button colors
or shadows. Use `Button` for labeled actions and navigation (`href`/`as`),
`IconButton` for named icon-only actions, and `ButtonControl` when preserving
native children, form attributes, refs, or specialized control semantics.

- `primary`: flat blue main action.
- `secondary`: white supporting action with a visible border.
- `destructive`: flat red destructive confirmation or sign out.
- `ghost`: transparent utility action with neutral hover feedback.
- `danger-ghost`: flat red Remove/Delete action.
- `link`: flat blue navigation action, rendered as an anchor with `href`.
- Native `custom`: renderer annotations, switches, quiz/flashcard surfaces,
  or rich interactive rows whose geometry and status colors must remain intact.

Default height is 36px, compact (`sm`) is 32px for dense tools, and large (`lg`)
is 40px. Buttons and fields use these compact heights and are exempt from the
44px touch-target rule; text links, rows and navigation items keep it. Preserve
existing responsive layouts. Presses
and hover provide color feedback without movement. Labeled
buttons use explicit `isLoading`; native controls keep their own busy state and
spinner rather than inferring loading from `disabled` or `aria-busy`.

Run `npm run verify:buttons` for semantic regressions and migration coverage,
and `npm run theme:check` after changing the shared theme.

| Responsibility           | Astryx primitive                                                     |
| ------------------------ | -------------------------------------------------------------------- |
| Application frame        | `AppShell`                                                           |
| Center/header/context    | `Layout`, `LayoutHeader`, `LayoutContent`, `LayoutPanel`             |
| Product navigation       | `SideNav`, `SideNavSection`, `SideNavItem`, `MobileNav`              |
| Simple layout            | `VStack`, `HStack`, `Grid`, `StackItem`, `Center`                    |
| Interactive tool header  | `Toolbar`, `OverflowList`, `MoreMenu`                                |
| Route identity           | `Breadcrumbs`, `Heading`, `Text`                                     |
| Dense records            | `List`, `ListItem`, `Table`                                          |
| Presence                 | `Avatar`, `AvatarGroup`, `AvatarStatusDot`                           |
| Live/sync/offline        | `StatusDot` with visible text                                        |
| Role/access/category     | `Token`                                                              |
| Counts only              | `Badge`                                                              |
| Persistent warning/error | `Banner`                                                             |
| Loading/empty/progress   | `Skeleton`, `Spinner`, `EmptyState`, `ProgressBar`                   |
| Forms                    | `FormLayout`, `Field`, `TextInput`, `TextArea`, `Selector`, `Switch` |
| View switching           | `TabList`/`Tab` or `SegmentedControl`                                |
| Desktop form             | `Dialog purpose="form"`                                              |
| Tablet information       | `Dialog purpose="info"`                                              |
| Touch context/form       | `BottomSheet height="tall"`                                          |
| Destructive decision     | `AlertDialog`                                                        |
| Brief confirmation       | `useToast()`                                                         |

### Decision rules

- Use `Card` only for a self-contained standalone widget or hard boundary, such
  as the auth form or an independently movable quick-create surface.
- Use `Section`, whitespace, and `Divider` for normal page grouping.
- Repeated records are rows, never one Card per record.
- Use `Badge` only for a count. It is not status or decoration.
- Use `StatusDot` with visible text for live, syncing, offline, or error state.
- Use `Token` for roles, access, versions, and categorical metadata.
- Use `Banner` for persistent offline, conflict, warning, and error states; use
  Toast only for a brief confirmation.
- Interactive rows cannot contain nested interactive controls. When a record
  needs multiple actions, use a non-interactive `ListItem` with explicit
  trailing actions.
- The AI study assistant is a generated study pack, not chat. Use Tabs,
  Sections, Lists, and Dividers; introduce `ChatLayout` only for a real future
  conversational view.

## Route patterns

- Marketing follows the current study commons direction above: an asymmetric
  opening, compact purpose statement, ruled tool index, two session entry
  paths, and a simple footer. Application density and three-pane layouts do
  not apply to marketing.
- Rooms use the shared navigation, row-based joined/open collections, factual
  metadata, and one create-room dialog.
- Notes use the capped center document and version-history context. The editor
  is not wrapped in a raised Card.
- PDF uses a muted, full-bleed center with a pinned toolbar and annotation
  context. A PDF page may use low elevation.
- Whiteboard uses a full-bleed functional canvas. Show only existing contextual
  controls; do not invent a layers feature.
- AI uses a 680–720px reading surface, Tabs, Sections, dividers, and row-based
  saved guides/results.
- Breakout directories use rows and a 360px create/open panel. Breakout
  workspaces use Q&A in the context rail on wide screens, not a floating card.
- Settings and account routes use max-640px forms and divider-led sections.

## Previous marketing homepage: blue collaboration direction

This section is the saved reference for future marketing surfaces. It extends
this canonical app guide without enlarging authenticated workspace geometry.
The supplied reference is [reference.png](../artifacts/home-blue/reference.png).
Its visual hierarchy and rhythm are the reference; its business claims, prices,
integrations, testimonials, and embedded wording are not Qollab requirements.
The generated study artwork is
[home-study-collaboration.png](../public/images/home-study-collaboration.png)
(1942 × 809). It is illustrative, not a screenshot of the working app.

### Journey and composition

The visitor understands shared study, explores the existing tools, sees how a
session works, then opens a room. Keep `#why`, `#workspace`, and `#how` as real
section destinations. Preserve the async server authentication lookup and the
existing signed-in/signed-out routing for each CTA, profile, and sign-in link.

1. Compact header: Qollab lockup at left, the three section links centrally,
   account link and primary room action at right. Use a wrapping layout at
   narrow widths; keep every destination available without shrinking targets.
2. Centered hero on the body surface: short eyebrow, one prominent two-line
   heading such as “Where students connect and learn together,” one short
   supporting paragraph, primary auth-aware room CTA, and a secondary
   “Explore the workspace” anchor. Follow with the wide study artwork at its
   natural ratio. Do not layer live text or controls into the artwork.
3. `#why` on white: left-aligned section heading and short introduction,
   followed by four feature summaries in a two-column desktop grid. Each has
   a simple blue icon, short heading, and one or two sentences describing an
   existing capability. These are editorial features, not dense record cards.
4. `#workspace` on the body surface: a concise introduction to shared notes,
   PDF annotation, whiteboard, and AI study aids, plus a verified workspace
   preview if available. Label illustrative previews accurately. Use compact
   rows for tool descriptions; avoid duplicating every feature paragraph.
5. `#how` on white: three numbered steps, “Create the room,” “Build the
   thread,” and “Return prepared.” Use three columns on desktop and ordered
   stacked steps on mobile. Keep all copy readable without interaction.
6. Closing CTA: generous blue accent panel with a centered white heading,
   concise supporting copy, and a white CTA with blue text. Repeat the primary
   destination rather than introducing a new onboarding flow.
7. Dark footer: Qollab identity, a short purpose line, existing navigation and
   account destinations, and copyright. Use legible inverse text and a
   high-contrast brand variant. An oversized decorative wordmark is optional.

Do not reproduce the reference's pricing, testimonials, customer percentages,
integration logos, or invented usage metrics. Do not present illustrative
student portraits as customers or imply endorsement.

### Type, surfaces, and spacing

- Keep Inter Tight and JetBrains Mono. Marketing display headings use the
  largest suitable existing display tokens, with balanced line breaks and
  restrained weight; body copy uses a comfortable existing large body token.
  Do not change the global 14px base to enlarge one page.
- Use the shared centered page content width, consistent across header,
  sections, and footer. Keep hero prose within the existing reading measure.
- Use Astryx responsive spacing and token-backed utilities: approximately
  spacing-12 to spacing-20 between desktop section groups, spacing-8 to
  spacing-12 on mobile; spacing-4 to spacing-6 inside grouped content.
- White and warm neutral sections alternate quietly. Blue is concentrated in
  actions, selected states, icons, and the closing CTA. The workspace remains
  flat; soft shadows belong to artwork or a standalone preview, not every row.
- Use `VStack`, `HStack`, `Grid`, `Center`, and established frame primitives.
  Read verified component APIs before choosing props. No new CSS module,
  hardcoded component colors, arbitrary spacing, or raw div/span layout.

### Responsive, accessibility, and interaction states

- At narrow widths, keep a single content column and token-based page gutters;
  features and steps stack in reading order. Avoid horizontal scrolling at
  320px and 200% zoom. Navigation may wrap onto a separate row.
- Images scale proportionally with explicit intrinsic dimensions. No fixed
  height crop of the students. Reserve layout space while loading; if an
  image fails, the surrounding text and navigation still communicate the page.
- Minimum 44 × 44px targets with separated touch areas. Use real links for
  navigation and preserve visible keyboard focus in light, blue, and dark
  regions. Focus rings must contrast with the adjacent surface; white CTA
  buttons on blue need a visible contrasting focus treatment.
- One h1, named navigation landmarks, semantic sections, sequential heading
  levels, and logical keyboard order. Decorative icons and hero artwork have
  empty alternatives; a meaningful product screenshot has concise descriptive
  alt text. Provide a visible-on-focus skip link to main content.
- Hover and pressed feedback must not move layout. Preserve reduced-motion
  behavior; avoid automatic parallax or motion needed to understand the page.
- The homepage introduces no submission, destructive, modal, or permission
  interaction. Auth success determines CTA text and destination server-side;
  keep existing auth error behavior rather than inventing client session state.
  Destination pages own loading, empty, disabled, and error recovery states.

### Observable acceptance criteria

Review at desktop and mobile widths: the centered hero leads the page, the
student artwork is intact, blue is the recognizable accent, section spacing
has clear hierarchy, and the footer is distinct and legible. Every anchor lands
at its named section; signed-in and signed-out links retain their destinations.
Keyboard focus is visible across all surface colors; controls satisfy the
44px minimum; no horizontal overflow or heading collisions occur. Workspace
font scale, pane geometry, and semantic status colors remain unchanged.

## Shared authentication pattern

Login, signup, password-reset request, and password-reset completion share
`AuthShell`. Login/signup reuse `LoginForm`; reset variants retain their existing
forms and actions. This is a presentational redesign: preserve all routes,
server validation/security, redirects, `next` handling, field names/IDs,
autocomplete, length constraints, error text, pending text, and success toasts.

### Composition and visual direction

- Cream body surface, centered frame capped at 1120px, shared blue Qollab logo
  linked home; no separate “Back home” link. Use `Center`, `VStack`, `HStack`,
  responsive `Grid`, `Card`, `Heading`, and `Text` according to verified APIs.
- At desktop widths (1024px and above), the form region comes first, with a
  white standalone Card capped at 440px. The companion region is editorial,
  capped around 520px, with “Good company. A clearer way forward.” and concise
  study copy. Reuse the existing homepage student artwork at its intrinsic
  1942:809 ratio, with empty alt. Do not present it as a live room, customer
  endorsement, or verified application screenshot.
- Below 1024px, hide the decorative companion. Center the form in available
  width, with token-based gutters and natural vertical scrolling. The heading,
  fields, submit, recovery links, and account-switch link lead the page. Avoid
  fixed viewport heights that clip long errors or the software keyboard.
- Inter Tight, shared neutral surfaces and blue actions; form heading uses a
  restrained display token, approximately 36px desktop and 30px mobile. Keep
  supporting copy readable. Card padding uses spacing-6 mobile / spacing-8
  desktop, fields spacing-5 or spacing-6, and normal shared radii/borders.
  No decorative shadow or background effects behind the form.

### Forms, interaction, and recovery

- Use `FormLayout` and `Field` for structure. Native inputs within `Field` are
  permitted when needed to retain IDs, autocomplete, min/max length, hidden
  redirect fields, and password toggles unavailable in the installed TextInput.
  Style with semantic token-backed utilities; do not add CSS or layout div/span.
- Visible labels precede fields. Auth inputs and the submit pill are 40px high;
  input text uses the existing 16px token to avoid mobile focus zoom. Primary
  submit fills the form width. Focus rings contrast on white and cream.
- The password reveal button sits inside the input border at the trailing edge,
  with reserved input padding so text never overlaps its 40px target. Keep its current
  show/hide accessible name, `aria-controls`, and `aria-pressed`. Keep text and
  toggle hit areas separate. Preserve update-password's shared toggle for both
  password fields. Forgot-password is a separate readable link row if needed
  to prevent a label collision on narrow screens.
- Idle fields use labels and existing help text rather than placeholder-only
  instructions. Preserve native validation. Errors remain a persistent alert
  immediately before submit, using `Banner` with error semantics and the
  existing message. Long messages wrap; they never cover inputs or controls.
- During submission, preserve disabled submit, `aria-busy`, spinner, and exact
  pending copy. Do not clear user input, shift the form, or duplicate requests.
  Preserve existing success toast behavior and redirect outcomes.
- Signup keeps display name/email/password and existing password help. Password
  reset request retains its account-neutral email explanation and initial-error
  handling. Reset completion retains both password fields and existing recovery
  behavior for invalid/expired sessions. Do not add an account-existence claim,
  social sign-in provider, terms checkbox, or new authentication step.

### Acceptance and verification

Review all four routes at desktop, 390px, and 320px. The form is the strongest
interactive region, blue matches the homepage, mobile content fits without
horizontal overflow, and all labels/help/errors remain readable. Keyboard order
runs from header links through fields, reveal control, recovery action, submit,
and account-switch link as applicable. Verify labels, reveal names/state,
minimum target size, focus contrast, field constraints/autocomplete, pending and
error feedback, success toast, and unchanged navigation/redirects. Use safe test
fixtures for form states; do not trigger real account changes merely for a
visual check. Do not claim accessibility compliance from screenshots alone.

## Icons and state motion

First-party interface icons use the shared MorphIcons layer at
`src/components/ui/icons.tsx`, backed by the existing Lucide geometry. Preserve
icon size, stroke, color inheritance, viewBox, and alignment when migrating
imports. Brand logo artwork is not part of the icon replacement. Static icons
remain static by default; importing from the shared layer does not require
animation. The eight homepage icons below are an explicit user-approved
exception to the entry/hover restrictions in the general policy.

- Morph only meaningful existing state changes within one stable visual slot:
  password Eye/EyeOff, expanded/collapsed chevrons, Menu/Close, or Play/Pause
  where those controls already exist. Do not invent new interactions.
- Use the installed MorphIcons `snappy` spring and `reducedMotion="user"`.
  Keep the visual response brief and restrained, consistent with the shared
  110–220ms motion character; spring settling is not a fixed-duration promise.
  Avoid bouncy overshoot, idle loops, entry animation, and hover-only morphs.
- Keep the renderer mounted with a stable identity as its target shape changes.
  Control bounds and neighboring text must not move; do not stack duplicate
  icons, scale the button, or delay the state update until motion completes.
  Rapid repeated toggles must resolve to the latest actual control state.
- Under reduced motion, the shape changes immediately. If an icon pair cannot
  morph reliably, use immediate replacement rather than a distracting fallback.
  Loading spinners retain their existing progress semantics; no added idle motion.
- Preserve accessible control names and `aria-pressed`, `aria-expanded`, and
  `aria-controls` relationships. Decorative icons are hidden from assistive
  technology when a surrounding control already supplies its name. Morphing
  path data never becomes the label or a separate keyboard stop.
- Preserve 44px target areas, visible focus, current disabled states, and blue
  theme tokens. Styling belongs to existing component props or token utilities,
  not additional layout wrappers or icon-specific CSS files.

Acceptance: migrated static icons match their prior geometry and placement;
stateful icons morph in place only when state changes; keyboard controls and
names remain correct; rapid toggles reach the final state; reduced-motion users
receive immediate shape changes; no page layout or route behavior changes.
Verify actual motion with runtime observation or intermediate path evidence:
endpoint screenshots alone establish appearance, not animation correctness.

### Previous homepage decorative icon exception

The user explicitly requested animation for all eight homepage feature icons:
the four `#why` panels and four `#workspace` tool rows. This exception applies
only to those icons. Keep the original icon at rest and use these installed
Lucide pairs in both sections:

| Feature        | One animation cycle                    |
| -------------- | -------------------------------------- |
| Shared notes   | BookOpenText → BookOpen → BookOpenText |
| PDF annotation | FileText → FilePenLine → FileText      |
| Whiteboard     | PenTool → PencilLine → PenTool         |
| AI assistant   | Bot → BotMessageSquare → Bot           |

- Play one `snappy` out-and-back cycle on the element's first meaningful
  viewport entry (approximately 35% visible). Touch users receive the same entry
  animation; the effect is not dependent on hover discovery.
- Replay on mouse/pen pointer entry anywhere in the existing panel or row.
  Ignore entry while a cycle is running and enforce a short cooldown (about
  one second after completion). Do not queue cycles or animate continuously.
- Return after the outgoing morph settles; prefer completion-driven sequencing
  where the installed API supports it. Otherwise use a short bounded dwell,
  tuned for a brief total cycle around 600–900ms without claiming fixed spring
  duration. The final shape is always the original feature icon.
- Preserve size, blue color, stroke, alignment, and one mounted renderer slot.
  Do not animate the panel, background, text, or layout. These morphs illustrate
  the named feature; they do not imply a saved, active, selected, or loading state.
- Panels and rows remain noninteractive: no click action, pointer cursor,
  button role, tabindex, extra keyboard stop, or control-state attributes.
  Icons remain decorative and hidden from assistive technology; all feature
  information remains available in the visible heading and description.
- Preserve `reducedMotion="user"` and suppress decorative animation triggers
  entirely when the preference is reduce. Keep the original icon, rather than
  flashing the alternate shape instantly. If the preference changes during a
  cycle, stop and settle to the original icon. Cancel pending work on unmount.

Verify all eight slots animate and return to their original shape, entry works
without pointer input, repeated pointer entries do not create loops, reduced
motion leaves the canonical shape still, and icon/row bounds never shift.
The general no-entry/hover policy continues to apply elsewhere in the app.

## Renderer and custom-style boundaries

Prefer component props. If a prop cannot express the result, use token-backed
Tailwind utilities from `tailwind-theme.css`. Do not add raw layout `<div>` or
`<span>` wrappers, static `style={{...}}` objects, raw hex values, arbitrary
utilities, `@apply`, or new CSS modules.

Custom CSS is limited to global reset aliases, ProseMirror document semantics,
PDF/whiteboard renderer mechanics, reduced motion, safe areas, scrollbars, and
other browser-specific behavior. The only allowed runtime inline-style cases
are values that cannot be known statically:

- PDF annotation coordinates and dimensions.
- Presenter pointer coordinates.
- Whiteboard object, cursor, selection, pan, and zoom geometry.
- Participant colors and user-selected annotation/drawing colors.

Each exception must be narrowly allowlisted and documented in
`scripts/verify-design-system.ts`. Static brand values inside a renderer come
from `useTheme()` or `tokenVar()`, never a hardcoded color. A functional grid
inside the whiteboard is allowed; a decorative application-wide grid is not.

Keep PDF, whiteboard, and AI dynamically imported. Do not move their libraries
or high-frequency cursor/canvas state into the shared shell bundle.

## Required discovery workflow

Before changing any Next.js surface, read the relevant installed guide under
`node_modules/next/dist/docs/`; this repository's Next version may differ from
general framework knowledge.

Before writing each UI phase:

1. Read `npx astryx docs layout` and settle the frame, region budgets, and
   breakpoint behavior.
2. Run `npx astryx build "<idea>"`. This is the required starting point.
3. Inspect the recommended reference with
   `npx astryx template <name> --skeleton`.
4. Run `npx astryx component <Name>` for every component used. If uncertain,
   use `npx astryx search "<need>"`; do not guess a prop or component.
5. Consult `npx astryx docs tokens` and component props before adding custom
   styling.

Run every CLI command as `npx astryx ...`. Astryx reset, core CSS, generated
theme CSS, and `tailwind-theme.css` are imported exactly once from
`src/app/globals.css`.

Before finishing a UI change, re-read each touched file and replace static
layout wrappers, inline styles, raw colors or spacing, arbitrary utilities,
imported component CSS, and repeated-record Cards with Astryx primitives or
semantic tokens. Then run the design-system verifier, formatting, theme check,
Astryx doctor, lint, typecheck, relevant behavior checks, and visual/accessibility
QA required by the execution plan.
