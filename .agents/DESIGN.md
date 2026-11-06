---
name: Qollab Halid/Astryx design system
version: 1.2
status: approved foundation
last_updated: 2026-10-09
---

# Qollab design system

## Current front-end direction (2026-11-06)

The landing page follows the user's fintech reference image ("use this
instead"), after two earlier directions modelled on https://myboardprep.org/
were set aside. This section supersedes anything below that conflicts with it,
including Inter Tight, the warm body colour, 6px and 9px radii, and the flat
homepage rules. The token table below is historical;
`theme/qollab-workshop.ts` is the source.

- Look: white page, soft grey rounded cards (`bg-muted`, `rounded-3xl`) holding
  white insets, one saturated blue panel (`.landing-sky`), pale blue photo
  fields (`.landing-photo`), navy pill actions (`PillLink`), small label chips
  above section headings, medium-weight Inter headings with tight tracking.
- Landing order: top bar (logo, centred links, Log in, Get started pill),
  centred hero, photo card beside the `LiveRoom` panel, six tool tiles, `#why`
  three cards, `#workspace` two tall cards and four small ones, `#how` numbered
  steps beside a photo with a glass figure, study pack rows, `#roles` three
  cards with the editor card dark, `#faq` numbered accordion, closing panel,
  footer.
- Theme colours are unchanged: Qollab Blue `#2563EB`, ink `#0F1B3D`, Bricolage
  Grotesque headings elsewhere in the app. Only `.landing-root` swaps the
  heading face to Inter.
- Sign-in, sign-up and both password pages share this look through
  `AuthShell`: chip, heading, form in a grey card with white fields, the pill
  `AuthSubmit` action, and a pale photo panel on desktop.
- Buttons, app-wide: primary is a blue gradient pill with a darker rim and a
  soft glow (`--qollab-button-gradient-primary`, `--qollab-button-glow-primary`
  in the theme). Secondary and destructive are pills too; ghost and link keep
  12px corners. `.landing-cta` reuses the same tokens for link actions.
- Fields, app-wide: single-line inputs, number inputs and selectors are pills
  like the buttons. Text areas keep their corners, since a pill cannot hold
  several lines.
- Liquid glass (`src/components/home/liquid-glass.ts`) stays on the room's tool
  dock and the figure panel in `SessionSteps`.
- The one photograph is `home-study-collaboration.png`. Its white ground is
  multiplied onto pale fields, so do not place it on saturated colour.
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

Qollab brings questions, ideas, and people into one shared space. The logo's
interlocking loops represent equal collaborators; its negative space forms a Q
and speech bubble; the central dot is their shared focus. Rounded geometry keeps
the identity precise but approachable.

- Qollab Blue `#2563EB` is the primary brand color.
- Soft Blue `#EAF2FF` is the selected and supporting brand surface.
- Use the full lockup in marketing, authentication, and roomy headers at about
  160 × 49px or larger.
- Use the symbol in compact navigation, favicons, app icons, and avatars.
- Preserve logo proportions and clear space. Do not redraw, rotate, outline,
  shadow, or place it over a busy image. The approved blue refresh replaces
  only the violet accent with Qollab Blue in every logo variant; preserve all
  path geometry, proportions, neutral ink, and clear space. No other recoloring.
- Give an icon-only brand link an accessible name such as “Qollab rooms.” Treat
  the image as decorative when the link already names the destination.

The source of truth for logo meaning, assets, and usage is
[QOLLAB_LOGO.md](../QOLLAB_LOGO.md).

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

Default height is 44px, compact (`sm`) is 36px for dense tools, and large (`lg`)
is 48px. Preserve mobile touch targets and existing responsive layouts. Presses
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
  linked home and a visible “Back home” link. Use `Center`, `VStack`, `HStack`,
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
- Visible labels precede fields. Inputs and buttons are at least 44px high;
  input text uses the existing 16px token to avoid mobile focus zoom. Primary
  submit fills the form width. Focus rings contrast on white and cream.
- The password reveal button sits inside the input border at the trailing edge,
  with reserved input padding so text never overlaps its 44px target. Keep its current
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
