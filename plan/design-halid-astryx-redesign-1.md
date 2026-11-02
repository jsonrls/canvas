---
goal: Migrate Qollab to a Halid-inspired, Astryx-native study workspace without changing collaboration behavior
version: 1.0
date_created: 2026-08-30
last_updated: 2026-08-30
owner: Qollab
status: "Planned"
tags: [design, migration, astryx, nextjs, collaboration, accessibility]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-7B61FF)

This plan translates the [Halid documentation reference](https://unslop.site/site/docs-article-halid) into an executable Qollab redesign. The result is a flat, content-first study workspace with persistent navigation, a readable central canvas, and a tool-specific context rail. It adopts Halid's structure and density, uses Qollab Violet rather than Halid's sample branding, and makes Astryx the implementation backbone.

This is a presentation migration. Existing routes, authorization, server actions, repositories, Yjs documents, offline recovery, presenter behavior, study-tool data, and API contracts remain functionally unchanged. The current dirty working tree is authoritative and must be preserved.

## 1. Requirements & Constraints

### Reference measurements and visual direction

The reference values below come from the [public Halid component source](https://unslop.site/source/articles-2.jsx). Qollab adaptations are listed separately so implementers do not mistake the reference for the target.

| Property         | Halid reference                      | Qollab target                                                                                    |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Desktop frame    | `240px 1fr 240px` at 1280×800        | 256px resizable navigation, flexible center, 360px context rail                                  |
| Rail padding     | 20px block, 18px inline              | Astryx spacing steps 5 and 4                                                                     |
| Main padding     | 24px block, 56px inline              | Astryx `LayoutContent` padding 4–6; visual tools use 0                                           |
| Reading measure  | 620px                                | 680px prose inside a 760px center budget                                                         |
| Typeface         | Inter Tight; JetBrains Mono for code | Inter Tight; JetBrains Mono only for code, keyboard hints, and breakout codes                    |
| H1               | 36px, 600, 1.1                       | 36px editorial title; Astryx heading scale for compact app headers                               |
| Body             | 14.5px, 1.65                         | Astryx 14px base scale; rich prose line-height 1.6–1.65                                          |
| Navigation       | 13px; compact section labels         | Astryx SideNav defaults with supporting section labels                                           |
| Ink              | `#0F0F14`                            | `--color-text-primary`                                                                           |
| Secondary text   | `#4A4A56`                            | `--color-text-secondary`                                                                         |
| Divider          | `#ECEBEF`                            | `--color-border`                                                                                 |
| Muted surface    | `#F5F5F7`                            | `--color-background-muted`                                                                       |
| Selected surface | `#F0EEFE`                            | Qollab `#EEE9FF`                                                                                 |
| Accent           | Halid `#5B5BD6`                      | Qollab `#7352FA`                                                                                 |
| Radius           | 6–8px                                | 6px elements, 9px containers, 12px page shell                                                    |
| Elevation        | No structural shadow                 | Dividers by default; low elevation only for popovers, dialogs, PDF pages, and transient overlays |

- **REQ-001**: Preserve every user-visible route and workflow: public landing, authentication, password recovery, room directory, room workspace, breakout directory/workspace, room administration, profile, settings, loading, error, and toast states.
- **REQ-002**: Use the Halid structure as a directional reference, not a literal branded clone. Qollab Violet `#7352FA` and Soft Violet `#EEE9FF` from `QOLLAB_LOGO.md` are authoritative.
- **REQ-003**: Use `AppShell variant="section" height="fill" contentPadding={0}` for authenticated application screens. Do not use the elevated AppShell treatment for the workspace.
- **REQ-004**: Use a 256px desktop `SideNav` with `minWidth: 240`, `maxWidth: 320`, and `autoSaveId: "qollab-primary-navigation"`. Use Astryx's generated `MobileNav` at the `md` breakpoint.
- **REQ-005**: Use one `Layout` inside the AppShell. The active tool owns the center slot, and useful secondary information owns a 360px end `LayoutPanel` with a divider. Do not nest another `Layout` inside the context rail.
- **REQ-006**: Cap shared-notes and AI reading content at 680px within a 760px content budget. PDF and whiteboard are explicit full-bleed exceptions.
- **REQ-007**: Use a 56px, shadowless application header with a 1px divider. The left navigation keeps its own Qollab identity; the header spans the center and context regions.
- **REQ-008**: Use one primary action per region. Move secondary actions into `MoreMenu` or compact toolbars.
- **REQ-009**: Use `List`/`ListItem` or `Table` rows for rooms, breakouts, members, versions, saved guides, comments, and other dense collections. Do not wrap repeated records in Cards.
- **REQ-010**: Use `Card` only for a discrete standalone widget, such as the auth form or an independently movable quick-create surface. Use `Section`, whitespace, and `Divider` for page grouping.
- **REQ-011**: Use `Badge` only for counts. Use `StatusDot` for live/sync/offline state and `Token` for roles, access, and categorical metadata.
- **REQ-012**: Use `Banner` for persistent offline, conflict, warning, and error states; `useToast()` for brief confirmation; `AlertDialog` for destructive confirmation; `Dialog purpose="form"` for desktop forms; and `BottomSheet height="tall"` for touch-oriented context or forms.
- **REQ-013**: Replace static page-layout `<div>`/`<span>` wrappers with Astryx `VStack`, `HStack`, `Grid`, `StackItem`, `Section`, `Text`, and semantic elements. Static inline `style` objects, arbitrary utilities, and new CSS modules are prohibited.
- **REQ-014**: Permit runtime geometry or user-authored color only inside rendering boundaries where component props cannot represent the value: PDF annotation coordinates, presenter coordinates, whiteboard coordinates/cursors, participant colors, and user-selected annotation colors. Each exception must be documented in `scripts/verify-design-system.ts`; static branded values inside those renderers must come from `useTheme()` or `tokenVar()`.
- **REQ-015**: Retain a light-only product mode for version 1 because `src/app/layout.tsx` currently forces light mode. Define complete dark token counterparts, but do not add a theme toggle in this migration.
- **REQ-016**: Extend Astryx's `neutralTheme` and override semantic tokens. Remove the hardcoded component-local SideNav palette and the late raw `:root` palette in `src/app/globals.css`.
- **REQ-017**: Use Inter Tight for body and headings and JetBrains Mono for code. Load both through the installed Next 16.3 `next/font/google` implementation so no browser request is made to Google.
- **REQ-018**: Keep the existing 14px/1.2 type scale, semibold headings, radius base 3/multiplier 1, and fast 110ms/medium 220ms motion. Override `--radius-page` and `--radius-chat` to 12px so the application shell does not inherit the generated 21px page radius.
- **REQ-019**: Eliminate the global graph-paper background, header blur, raised editor shell, oversized 10–18px control radii, and decorative structural shadows. A functional grid inside the whiteboard canvas remains allowed.
- **REQ-020**: Replace the landing page's CSS-drawn workspace preview with a verified, sanitized screenshot of the redesigned product. Do not use placeholder art or a hand-drawn fake interface.

### Theme token contract

`theme/qollab-workshop.ts` must extend `neutralTheme` and define the following token values. The runtime theme name and generated filenames remain `qollab-workshop` to avoid unnecessary migration churn.

| Astryx token                  | Light       | Dark        | Usage                                     |
| ----------------------------- | ----------- | ----------- | ----------------------------------------- |
| `--color-accent`              | `#7352FA`   | `#A998FF`   | Primary actions, focus, selected icons    |
| `--color-accent-muted`        | `#EEE9FF`   | `#30275C`   | Selected rows and violet callouts         |
| `--color-on-accent`           | `#FFFFFF`   | `#171717`   | Text/icons on accent fills                |
| `--color-text-accent`         | `#6845F0`   | `#B7AAFF`   | Small linked text; chosen for AA contrast |
| `--color-background-body`     | `#F3F2EF`   | `#111116`   | Warm-neutral outer canvas                 |
| `--color-background-surface`  | `#FFFFFF`   | `#19191F`   | Main study canvas and rails               |
| `--color-background-card`     | `#FFFFFF`   | `#1F1F25`   | Standalone widgets only                   |
| `--color-background-popover`  | `#FFFFFF`   | `#27272D`   | Menus, dialogs, overlays                  |
| `--color-background-muted`    | `#F5F5F7`   | `#222228`   | Recessed controls and muted sections      |
| `--color-background-inverted` | `#0F0F14`   | `#F3F2F7`   | Inverted surfaces                         |
| `--color-text-primary`        | `#0F0F14`   | `#F3F2F7`   | Main ink                                  |
| `--color-text-secondary`      | `#4A4A56`   | `#BCBBC4`   | Supporting copy                           |
| `--color-text-disabled`       | `#747480`   | `#7D7C87`   | Disabled content                          |
| `--color-icon-primary`        | `#0F0F14`   | `#F3F2F7`   | Primary icons                             |
| `--color-icon-secondary`      | `#4A4A56`   | `#BCBBC4`   | Secondary icons                           |
| `--color-icon-accent`         | `#7352FA`   | `#A998FF`   | Active icons                              |
| `--color-border`              | `#ECEBEF`   | `#34323C`   | Default dividers                          |
| `--color-border-emphasized`   | `#D8D6DE`   | `#54525E`   | Inputs and strong boundaries              |
| `--color-neutral`             | `#7352FA14` | `#A998FF24` | Selected/pressed neutral mix              |
| `--color-overlay-hover`       | `#0F0F1408` | `#FFFFFF0A` | Hover feedback                            |
| `--color-overlay-pressed`     | `#7352FA14` | `#A998FF20` | Pressed feedback                          |
| `--color-skeleton`            | `#E5E4E9`   | `#3B3944`   | Loading skeleton                          |
| `--color-track`               | `#D8D6DE`   | `#4B4954`   | Sliders and progress                      |
| `--color-success`             | `#207A55`   | `#8FD9B0`   | Success state                             |
| `--color-success-muted`       | `#E7F6EE`   | `#2B6A4A4D` | Success support                           |
| `--color-warning`             | `#9A6A1A`   | `#EAB85B`   | Warnings                                  |
| `--color-warning-muted`       | `#FFF8E6`   | `#D6923440` | Warning callouts                          |
| `--color-error`               | `#B53C36`   | `#FF9B90`   | Errors/destructive state                  |
| `--color-error-muted`         | `#F4D9D4`   | `#B94A414D` | Error callouts                            |

Small selected-row labels remain primary ink on `#EEE9FF` with a violet icon or indicator. Do not use `#7352FA` text on `#EEE9FF` because that pair measures approximately 4.11:1. White on `#7352FA` measures approximately 4.87:1 and passes WCAG AA for normal text.

### Astryx component mapping

| Existing responsibility     | Required Astryx mapping                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Page/application frame      | `AppShell`                                                                              |
| Center/header/panel regions | `Layout`, `LayoutHeader`, `LayoutContent`, `LayoutPanel`                                |
| Product/tool navigation     | `SideNav`, `SideNavSection`, `SideNavItem`, `MobileNav`                                 |
| Simple layout               | `VStack`, `HStack`, `Grid`, `StackItem`, `Center`                                       |
| Interactive tool header     | `Toolbar` with `OverflowList` or `MoreMenu`                                             |
| Room/path identity          | `Breadcrumbs` and semantic `Heading`/`Text`                                             |
| Dense records               | `List`/`ListItem` or `Table`                                                            |
| Presence                    | `Avatar`, `AvatarGroup`, `AvatarStatusDot`                                              |
| Live/sync/offline           | `StatusDot` plus visible text                                                           |
| Role/access/category        | `Token`                                                                                 |
| Counts only                 | `Badge`                                                                                 |
| Persistent state            | `Banner`                                                                                |
| Empty/loading/progress      | `EmptyState`, `Skeleton`, `Spinner`, `ProgressBar`                                      |
| Forms                       | `FormLayout`, `TextInput`, `TextArea`, `Selector`, `Switch`, `Field`                    |
| Tabs/view switching         | `TabList`/`Tab` or `SegmentedControl`                                                   |
| Desktop modal/form          | `Dialog`                                                                                |
| Mobile context/form         | `BottomSheet`                                                                           |
| Destructive decision        | `AlertDialog`                                                                           |
| Transient confirmation      | `useToast()`                                                                            |
| AI view organization        | `TabList`, `Section`, `List`; `ChatLayout` only if a real chat view is later introduced |

### Screen contract

| Route or state                                                   | Required target                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                              | Editorial, auto-height AppShell with restrained TopNav, concise 36px title, real product screenshot, row-based tool overview, numbered workflow, and one primary CTA. Do not force the application three-pane shell onto marketing content. |
| `/login`, `/signup`, `/reset-password`, `/reset-password/update` | Content-only surface with Qollab lockup, a single max-400px standalone auth Card, `FormLayout`, controlled Astryx inputs, inline field status, and preserved `next` routing.                                                                |
| `/rooms`                                                         | Shared SideNav; central joined/open room rows; wide-screen context panel for the existing create/join actions. Metrics become compact metadata rather than KPI cards.                                                                       |
| `/rooms/[roomId]` Notes                                          | Shared navigation; center document with breadcrumb and 680px editor measure; right version history; presence and sync in the header. Remove the raised editor Card.                                                                         |
| `/rooms/[roomId]` PDF                                            | Shared navigation; full-bleed muted center canvas; pinned tool toolbar; right annotation/comment context. The PDF page may use low elevation.                                                                                               |
| `/rooms/[roomId]` Whiteboard                                     | Shared navigation; full-bleed functional canvas; existing contextual controls remain available. The context rail appears only when it contains current behavior; do not invent a layers feature.                                            |
| `/rooms/[roomId]` AI                                             | 680–720px study output with Tabs, Sections, and dividers; existing source/configuration/saved-guide controls move to the context surface; repeated guide/result records become rows.                                                        |
| `/rooms/[roomId]/breakouts`                                      | Center breakout rows; 360px create/open context panel; role-sensitive codes and descriptions remain unchanged.                                                                                                                              |
| `/rooms/[roomId]/breakouts/[code]`                               | Compact three-region workspace with active tool center and 360px Q&A rail on wide screens. Remove the floating elevated Q&A panel.                                                                                                          |
| `/rooms/[roomId]/settings`                                       | Settings navigation plus a max-640px form; member records are rows; destructive room deletion remains an AlertDialog with exact-name confirmation.                                                                                          |
| `/profile`, `/settings`                                          | Shared account navigation, max-640px forms, and divider-led sections instead of decorative cards.                                                                                                                                           |
| Global loading/error/toast                                       | Astryx Spinner/Skeleton/EmptyState/Banner/Toast with the same Qollab shell and no separate palette island.                                                                                                                                  |

### Responsive contract

- **RSP-001**: At widths greater than 1024px, show the 256px SideNav, center tool, and 360px context panel simultaneously.
- **RSP-002**: From 768px through 1024px, keep the main navigation available as a compact/collapsible rail, remove the persistent context rail, and open the same controlled context content in `Dialog purpose="info" width={400}`.
- **RSP-003**: Below 768px, use AppShell's generated MobileNav, one content region, compact tool Tabs, and `BottomSheet height="tall"` for context. Keep 16px content inset where the tool is not full-bleed.
- **RSP-004**: Use `useMediaQuery("(max-width: 1024px)")` to switch context presentation and AppShell `mobileNav={{ breakpoint: "md" }}` for primary navigation.
- **RSP-005**: Preserve full-height PDF/whiteboard behavior, safe-area insets, reduced motion, and minimum 44px touch targets.
- **RSP-006**: Drop a rail instead of shrinking all three regions. No supported viewport may horizontally scroll because of the application frame.

### Behavioral invariants

- **BEH-001**: Preserve protected-route redirects, original `next` destinations, current field names, Server Action contracts, and role checks.
- **BEH-002**: Preserve create, join, leave, manage, public/joined grouping, owner/editor/viewer visibility, room icon upload/compression/removal, and private-by-default room creation.
- **BEH-003**: Render the currently passed `roomIconUrl` in the current-room identity without changing its repository or route contract.
- **BEH-004**: Keep PDF, whiteboard, and AI client-only lazy loads. `canManagePdf` remains distinct from viewer-collaboration-based `canEdit`.
- **BEH-005**: Keep Notes as the default tool, AI's note snapshot before switching, Notes/PDF/Board/AI mobile access, the room switcher, breakout count, viewer-collaboration control, and account menu.
- **BEH-006**: Preserve Yjs lifecycle, offline editing, local persistence, reconnection, conflict race checks, version save/restore, presenter follow/pointer/scroll behavior, and local-document cleanup before sign-out.
- **BEH-007**: Preserve PDF upload/replacement, signed refresh, bookmarks, annotations/comments, zoom, mobile tools, and viewer read-only behavior.
- **BEH-008**: Preserve every whiteboard tool, move/resize, zoom/pan, image/text/shape, laser, AI circle answer, attribution, confirmation, and mobile control.
- **BEH-009**: Preserve AI source boundaries, generation configuration, five keyboard-accessible views, quiz/flashcard state, saved-guide load/save/delete, and the safety notice.
- **BEH-010**: Preserve isolated breakout Notes/PDF/Whiteboard documents, viewer edit policy, copyable code, parent-room return, live presence, and Q&A behavior.
- **BEH-011**: Preserve account-menu arrow-key traversal, Escape/outside-click dismissal, focus restoration, form pending/error announcements, and destructive-dialog focus restoration.
- **BEH-012**: Do not change database migrations, API routes, repository field names, authorization semantics, rate limits, storage behavior, or Yjs document identifiers as part of the visual migration.

### Accessibility, performance, and repository constraints

- **A11Y-001**: Preserve one main landmark through AppShell, logical heading order, labeled navigation landmarks, visible focus, screen-reader-visible sync state, and correct Dialog/BottomSheet focus return.
- **A11Y-002**: All normal text must meet 4.5:1 contrast; large text and non-text controls must meet their WCAG AA thresholds. State may not rely on color alone.
- **A11Y-003**: Interactive rows may not contain nested interactive controls. Use a non-interactive `ListItem` with explicit trailing actions when a row needs more than one target.
- **A11Y-004**: Tool Tabs must expose selected state and a matching panel relationship; account and room navigation must expose `aria-current`.
- **A11Y-005**: Loading, save, offline, and error messages must use the correct live-region or semantic Astryx primitive without duplicate announcements.
- **PERF-001**: Preserve dynamic imports for PDF, whiteboard, and AI. Do not move their libraries into the shared shell bundle.
- **PERF-002**: Use variable fonts through `next/font` and avoid cumulative layout shift from font or screenshot sizing.
- **PERF-003**: Keep high-frequency cursor, presence, whiteboard, and annotation state outside new page-shell rerenders.
- **CON-001**: Read the relevant installed Next 16.3 guides in `node_modules/next/dist/docs/` before editing each Next.js surface.
- **CON-002**: Run Astryx discovery in the order `build`, `template`, then `component` documentation before writing each UI phase.
- **CON-003**: Treat all current modified and untracked files as user-owned. Do not reset, reconstruct from `HEAD`, or delete a style source until its replacement is verified route by route.
- **CON-004**: Import Astryx reset, core CSS, generated theme CSS, and `tailwind-theme.css` only once from `src/app/globals.css`.
- **CON-005**: Keep custom CSS only for global reset aliases, ProseMirror document semantics, PDF/whiteboard renderer mechanics, and browser-specific scroll behavior. Layout, spacing, color, shape, elevation, and typography must use Astryx props or token-backed utilities.

### Recorded pre-migration baseline

- **BASE-001**: The current worktree passes `npm run theme:check`, `npx astryx doctor`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `git diff --check`, `npm run verify:phase-3`, and `npm run verify:phase-4`.
- **BASE-002**: `npm run verify:password-reset` currently fails on a stale BoardPrep string assertion in `scripts/verify-password-reset.ts`; `npm run verify:account-profile` fails on a stale markup assertion in `scripts/verify-account-profile.ts`; `npm run verify:conflict-review` encounters the static PNG import from `LoadingScreen.tsx`.
- **BASE-003**: `npm run build` was not run during the read-only audit because its `prebuild` script regenerates the untracked theme artifacts. Run it only after Phase 2 intentionally updates those artifacts.

## 2. Implementation Steps

### Implementation Phase 1 — Freeze and baseline

- GOAL-001: Create a reproducible design and behavior baseline without modifying the application.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Record `git status --short` and the current passing/failing command matrix in `artifacts/halid-redesign/baseline.md`. Preserve the dirty tree exactly; do not stage, reset, or clean it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Yes       | 2026-08-30 |
| TASK-002 | Read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`, `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`, `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`, `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`, `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` before changing Next.js files.                                                                                                                                                                                                                                                                                                                               | Yes       | 2026-08-30 |
| TASK-003 | Run `npx astryx build "Halid-inspired collaborative study workspace with navigation, notes, PDF, whiteboard, AI, context rail, rooms, auth, settings, and mobile navigation"`; inspect `npx astryx template shell-side-nav --skeleton`, `npx astryx template LayoutDualPanelLayout --skeleton`, `npx astryx template LayoutSidebarLayout --skeleton`, `npx astryx template ToolbarThreeSlot --skeleton`, `npx astryx template ai-chat --skeleton`, and `npx astryx template DialogAdaptivePresentation --skeleton`. For each name in the exact component set AppShell, Layout, SideNav, MobileNav, Stack, Section, Card, Toolbar, OverflowList, MoreMenu, Breadcrumbs, List, ListItem, Table, Avatar, AvatarGroup, StatusDot, Token, Badge, Banner, EmptyState, Skeleton, Spinner, ProgressBar, FormLayout, Field, TextInput, TextArea, Selector, Switch, FileInput, Thumbnail, Slider, TabList, SegmentedControl, Dialog, BottomSheet, AlertDialog, and Toast, execute `npx astryx component` with that name; also run `npx astryx hook useMediaQuery` and `npx astryx hook useToast`. | Yes       | 2026-08-30 |
| TASK-004 | Capture Halid and current Qollab at 1280×800, plus current Qollab at 1710×883, 1200×633, 1024×768, and 390×844. Store non-sensitive captures under `artifacts/halid-redesign/` and create combined same-viewport reference/target comparison images.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Yes       | 2026-08-30 |

Completion criteria: the visual reference, current route/state matrix, dirty-tree warning, and baseline verifier results exist under `artifacts/halid-redesign/`; no production file has changed.

### Implementation Phase 2 — Theme and shared frame

- GOAL-002: Establish one token system and the reusable Astryx shell before migrating route content.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-005 | Rewrite `theme/qollab-workshop.ts` to extend `neutralTheme`, apply the token contract above, retain the `qollab-workshop` name, use radius base 3, override `--radius-page`/`--radius-chat` to 12px, and remove the hardcoded SideNav-local palette. Replace the invalid current `"selected:selected"` override with the documented `selected` state, using primary selected text, violet icon, a 2px inset start indicator, and `--color-accent-muted` background.                                                                                                                                                                                         | Yes       | 2026-08-30 |
| TASK-006 | Run `npm run theme:build` to regenerate `theme/generated/qollab-workshop.css`, `theme/generated/qollab-workshop.js`, and `theme/generated/qollab-workshop.d.ts`; run `npm run theme:check` immediately afterward. Never hand-edit generated artifacts.                                                                                                                                                                                                                                                                                                                                                                                                      | Yes       | 2026-08-30 |
| TASK-007 | Update `src/app/layout.tsx` to load `Inter_Tight` and `JetBrains_Mono` through `next/font/google`, expose `--font-qollab-body` and `--font-qollab-code`, preserve Metadata/Viewport/Theme/ToastProvider behavior, and keep mode `light`.                                                                                                                                                                                                                                                                                                                                                                                                                    | Yes       | 2026-08-30 |
| TASK-008 | Refactor `src/app/globals.css` so its import block remains the single Astryx/Tailwind entrypoint; remove the late raw `:root` palette and global page grid; map `--font-body`, `--font-display`, `--font-mono`, `--brand-primary`, `--canvas`, `--canvas-deep`, `--surface`, `--surface-raised`, `--ink`, `--ink-soft`, `--line`, `--line-strong`, `--blue`, `--blue-deep`, `--blue-soft`, `--violet`, `--violet-deep`, `--violet-soft`, `--yellow`, `--red`, `--green`, `--shadow-soft`, and `--shadow-float` to semantic Astryx tokens during migration; retain only behavior-critical editor/renderer/scroll rules until their owning phase is verified. | Yes       | 2026-08-30 |
| TASK-009 | Add `src/components/shell/qollab-side-navigation.tsx` for Qollab identity, room switcher, grouped destinations, current tool, breakout count, viewer-collaboration control, and account footer. Share its item definition with AppShell's MobileNav instead of duplicating labels/actions.                                                                                                                                                                                                                                                                                                                                                                  | Yes       | 2026-08-30 |
| TASK-010 | Add `src/components/shell/qollab-app-shell.tsx`, `src/components/shell/qollab-workspace-header.tsx`, and `src/components/shell/responsive-context-panel.tsx`. Implement `AppShell variant="section"`, one `Layout`, 256px resizable SideNav, 360px desktop `LayoutPanel`, ≤1024px Dialog, and <768px tall BottomSheet with controlled content/state.                                                                                                                                                                                                                                                                                                        | Yes       | 2026-08-30 |
| TASK-011 | Rewrite `.agents/DESIGN.md` as the canonical Astryx/Qollab design system: token table, typography, responsive budgets, component mapping, Card/List/Badge rules, renderer exceptions, and the CLI discovery contract. Remove obsolete BoardPrep/shadcn/Tailwind-only claims.                                                                                                                                                                                                                                                                                                                                                                                | Yes       | 2026-08-30 |

Astryx v0.5 renders a selected SideNav icon with the row's inherited color, so
the accessible foundation keeps selected text/icon in primary ink and uses the
violet 2px inset indicator. `selectedIcon` remains available for the selected
glyph variant; an independently violet icon would require swizzling the core
component and is deferred unless the routed shell proves that customization
necessary.

Completion criteria: `npm run theme:check` and `npx astryx doctor` pass; the shell renders a static fixture at all canonical viewports; no cobalt or raw late `:root` palette can override Qollab Violet.

### Implementation Phase 3 — Primary workspace and Notes

- GOAL-003: Migrate the main collaborative room and Notes flow without changing real-time behavior.

| Task     | Description                                                                                                                                                                                                                                                                                                                                      | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-012 | Refactor `src/components/collaboration/collaborative-room.tsx` onto `QollabAppShell`. Keep tool state, lazy imports, room switching, breakouts, viewer policy, presenter logic, offline state, and version state in their current owners. Render `roomIconUrl` in the current-room identity.                                                     |           |      |
| TASK-013 | Replace the current room header and mobile tab wrappers with `QollabWorkspaceHeader`, `Breadcrumbs`, `Toolbar`, `AvatarGroup`, `StatusDot`, `Token`, `IconButton`, `MoreMenu`, and responsive `TabList`. Keep all action labels, permissions, pressed states, and focus behavior.                                                                |           |      |
| TASK-014 | Refactor `src/components/collaboration/rich-text-editor.tsx` to use an Astryx `Toolbar` and Stack primitives around the ProseMirror renderer. Keep capture/restore handles, collaboration carets, formatting commands, selection behavior, placeholder, and scroll owner; make the document flat, white, and 680px wide instead of Card-wrapped. |           |      |
| TASK-015 | Refactor `src/components/collaboration/version-history-panel.tsx` into the shared context surface using compact row data, timestamps, status, save, preview, and restore actions. It is a 360px persistent rail above 1024px, a Dialog from 768–1024px, and a tall BottomSheet below 768px.                                                      |           |      |
| TASK-016 | Refactor `src/components/collaboration/conflict-review-panel.tsx`, offline/reconnect callouts in `collaborative-room.tsx`, and presenter-follow prompts to Astryx Banner/Dialog primitives while preserving conflict race checks, merge choices, retry, follow, and dismiss behavior.                                                            |           |      |
| TASK-017 | Refactor `src/components/auth/sidebar-account-menu.tsx`, `src/components/rooms/viewer-collaboration-toggle.tsx`, and `src/components/collaboration/mobile-tools-menu.tsx` to Astryx menus, controls, Text, and Stack primitives without changing keyboard traversal, Escape/outside-click close, focus restoration, or viewer-edit semantics.    |           |      |

Completion criteria: Notes, presence, account, offline, conflict, history, presentation, room switching, and mobile tools pass behavioral regression at all canonical viewports before study-tool internals are changed.

### Implementation Phase 4 — Study tools and breakout workspace

- GOAL-004: Apply the same shell, rows, and context rules to PDF, whiteboard, AI, and breakout collaboration.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                        | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-018 | Refactor `src/components/collaboration/pdf-study-tool.tsx` so the PDF owns a full-bleed muted center canvas, controls live in a pinned compact Toolbar, and comments/annotations use the responsive context surface. Preserve upload/replace/refresh, bookmarks, coordinate math, zoom, mobile tools, permissions, and viewer read-only state.                                                                     |           |      |
| TASK-019 | Refactor `src/components/collaboration/whiteboard-study-tool.tsx` around Astryx toolbars, menus, dialogs, status, and Stack primitives while leaving the SVG/canvas renderer and coordinate model intact. Replace hardcoded Qollab/static SVG colors with `useTheme()` tokens; preserve every tool, cursor, attribution, AI answer, and confirmation path.                                                         |           |      |
| TASK-020 | Refactor `src/components/collaboration/ai-study-tool.tsx` into a 680–720px center output plus responsive source/configuration/saved-guide context. Use `TabList`, `Section`, `List`, `Slider`, `Dialog`, `Banner`, and `EmptyState`; preserve generation, five views, keyboard behavior, quiz/flashcards, save/load/delete, and safety copy. Do not introduce ChatLayout because the existing feature is not chat. |           |      |
| TASK-021 | Refactor `src/components/collaboration/breakout-room-workspace.tsx` and `src/components/collaboration/breakout-qa-panel.tsx` onto the shared frame. Keep isolated document identifiers, parent-room return, copyable code, presence, viewer policy, and active tool behavior; turn Q&A into the 360px responsive context surface instead of a floating elevated panel.                                             |           |      |

Completion criteria: PDF, whiteboard, AI, breakout tools, and Q&A retain their existing document and permission behavior; their static chrome contains no bespoke palette, Card-wrapped dense list, or layout inline style.

### Implementation Phase 5 — Directories, room administration, and account

- GOAL-005: Migrate authenticated non-editor screens to the same navigation, row, form, and context patterns.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-022 | Refactor `src/components/rooms/rooms-dashboard.tsx` onto the shared AppShell. Render joined/open rooms as balanced List rows with dividers, keep compact metadata instead of KPI Cards, and move existing create/join actions into the wide context panel plus responsive Dialog/BottomSheet. Preserve leave confirmation/focus return and every role-sensitive action.                                                                                                              |           |      |
| TASK-023 | Refactor `src/components/rooms/room-banner-field.tsx` to Astryx Field/FileInput/Thumbnail/Button/Banner primitives while preserving image compression, upload, preview, removal, accepted types, limits, and form field names. Use the selected room icon in directory and workspace identity.                                                                                                                                                                                       |           |      |
| TASK-024 | Refactor `src/components/rooms/breakout-room-directory.tsx` from Card grids to List rows and the shared 360px create/open context. Preserve code visibility, descriptions, role rules, form action names, empty states, and navigation. Run `rg "breakout-room-menu" src`: if it has no importer, leave `src/components/rooms/breakout-room-menu.tsx` unchanged and excluded; if it has an importer, migrate its visible wrappers with the same Astryx primitives. Do not delete it. |           |      |
| TASK-025 | Refactor `src/components/rooms/room-settings.tsx` using `LayoutSidebarLayout` principles, max-640px FormLayout, compact member rows, Tokens, and AlertDialogs. Preserve owner-only role/removal actions and exact-name deletion confirmation.                                                                                                                                                                                                                                        |           |      |
| TASK-026 | Refactor `src/components/account/account-shell.tsx`, `src/components/account/profile-panel.tsx`, `src/components/account/settings-panel.tsx`, and `src/components/auth/sign-out-button.tsx` to the shared shell, max-640px forms, row controls, Banner/FieldStatus feedback, and Astryx Button variants. Preserve authentication redirects, display-name constraints, recovery links, and offline cleanup before sign-out.                                                           |           |      |

Completion criteria: rooms, breakouts, room settings, profile, and settings use one visual system; all role, focus, upload, destructive, pending, and empty states behave as before.

### Implementation Phase 6 — Public, authentication, and global state surfaces

- GOAL-006: Finish the visible route set and remove remaining palette islands.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-027 | Refactor `src/components/auth/auth-shell.tsx`, `src/app/login/login-form.tsx`, `src/app/reset-password/reset-password-form.tsx`, and `src/app/reset-password/update/update-password-form.tsx` to the auth contract. Use controlled Astryx inputs with `htmlName`, one standalone Card, inline status, password visibility controls, pending buttons, and preserved hidden `next` behavior. |           |      |
| TASK-028 | Refactor `src/app/page.tsx` into the editorial landing contract. Reuse the Qollab logo, real product language, row-based tool overview, and one primary CTA. After workspace QA, capture a sanitized 16:10 product image at deterministic dimensions and save it as `public/product/qollab-study-workspace.png`; use Next Image with intrinsic dimensions.                                 |           |      |
| TASK-029 | Refactor `src/components/ui/LoadingScreen.tsx`, `src/app/loading.tsx`, `src/app/rooms/[roomId]/loading.tsx`, and `src/app/error.tsx` to Astryx Spinner/Skeleton/EmptyState/Banner/Button primitives. Remove the static app-icon import that currently breaks the Node conflict verifier and keep accessible loading/error labels.                                                          |           |      |
| TASK-030 | Replace the custom viewport implementation in `src/components/ui/toast.tsx` with Astryx `useToast()`, which owns/falls back to its documented viewport. Preserve `ToastProvider` as a pass-through compatibility wrapper and preserve the `useSuccessToast` and `SuccessToastOnMount` exports atop `useToast()` so callers require no behavioral change.                                   |           |      |

Completion criteria: every public/auth/loading/error/toast surface uses the shared tokens, real brand assets, and semantic Astryx controls; no CSS-art product mockup remains.

### Implementation Phase 7 — CSS retirement, enforcement, and release QA

- GOAL-007: Remove superseded styling safely and prove visual, accessible, and behavioral completeness.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                 | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-031 | Delete `src/app/home.module.css`, `src/components/rooms/rooms-dashboard.module.css`, `src/components/account/settings-panel.module.css`, `src/components/rooms/room-banner.module.css`, `src/components/ui/LoadingScreen.module.css`, and `src/components/ui/toast.module.css` only after their importing routes pass visual QA. Remove their imports in the same changes.  |           |      |
| TASK-032 | Prune superseded cosmetic selectors from `src/app/globals.css` route by route. Retain a small documented section for ProseMirror, PDF, whiteboard, runtime cursor/annotation mechanics, reduced motion, safe areas, and browser scrollbars; all retained colors/spacing/radii must use semantic tokens.                                                                     |           |      |
| TASK-033 | Add `scripts/verify-design-system.ts` and `verify:design-system` in `package.json`. Fail on component CSS-module imports, raw layout `<div>` in migrated UI, static `style={{...}}`, raw color literals outside theme/assets/renderers, arbitrary Tailwind values, and repeated-record Cards. Keep a narrow, commented allowlist for runtime renderer geometry/user colors. |           |      |
| TASK-034 | Update `scripts/verify-password-reset.ts` and `scripts/verify-account-profile.ts` to assert current Qollab behavior instead of stale BoardPrep/markup strings. Ensure `scripts/verify-conflict-review.ts` runs after `src/components/ui/LoadingScreen.tsx` no longer imports the PNG module. Do not weaken authorization, error, or accessibility assertions.               |           |      |
| TASK-035 | Run formatting, `npm run theme:check`, `npx astryx doctor`, `npm run verify:design-system`, lint, typecheck, production build, all deterministic feature verifiers, and `git diff --check`. Run environment-backed integration verifiers when disposable credentials are available.                                                                                         |           |      |
| TASK-036 | Perform keyboard, screen-reader-structure, contrast, zoom, reduced-motion, overflow, safe-area, and two-session collaboration QA. Re-capture every canonical viewport/state, place each target beside the same-viewport Halid/current reference in one comparison image, fix visible discrepancies, and record the final result in `artifacts/halid-redesign/design-qa.md`. |           |      |

Completion criteria: every required gate passes or has an explicit environment-only disposition; all canonical route/state screenshots are approved against combined references; no legacy palette island or superseded CSS module remains.

## 3. Alternatives

- **ALT-001**: Copy Halid literally, including `#5B5BD6` and 240px rails; rejected because Qollab has an authoritative violet and context-heavy collaboration panels need more width.
- **ALT-002**: Keep the current Docket-like paper/cobalt/card treatment and only change colors; rejected because the late CSS palettes, graph texture, raised shells, and duplicate modules would continue to defeat Astryx tokens and Halid's content-first hierarchy.
- **ALT-003**: Introduce shadcn/ui or another component library; rejected because Astryx is already installed, required by repository policy, and provides the needed shell, layout, navigation, rows, state, form, and responsive primitives.
- **ALT-004**: Redesign the data model or collaboration architecture alongside the UI; rejected because it expands risk without helping the visual migration.
- **ALT-005**: Launch dark mode in the same release; rejected because the app currently forces light mode and the selected reference is light. Dark counterparts are defined now for future compatibility.
- **ALT-006**: Perform a one-shot CSS deletion; rejected because `src/app/globals.css` currently owns critical scroll, canvas, offline, presenter, and mobile behavior. Styling is retired only after each owner is migrated and verified.
- **ALT-007**: Use ChatLayout for the AI study assistant; rejected because the existing interaction is a generated study pack with five views, not a conversational chat.

## 4. Dependencies

- **DEP-001**: `@astryxdesign/core@^0.5.0`, `@astryxdesign/cli@^0.5.0`, and `@astryxdesign/theme-neutral@^0.5.0`.
- **DEP-002**: Next `16.3.0` and its installed local documentation and `next/font` implementation.
- **DEP-003**: React `19.2.7`, Lucide icons, Tailwind's Astryx token bridge, and the current Qollab brand assets.
- **DEP-004**: Existing Supabase Server Actions, repositories, migrations, RLS, storage, and authenticated route behavior.
- **DEP-005**: Existing Yjs/WebSocket/IndexedDB collaboration, offline, conflict, presentation, PDF, whiteboard, and AI contracts.
- **DEP-006**: The Halid reference URL/source and Qollab's canonical `QOLLAB_LOGO.md` colors.
- **DEP-007**: A disposable authenticated environment and two browser sessions for complete live-collaboration QA; deterministic checks do not depend on this environment.

## 5. Files

### New files

- **FILE-001**: `plan/design-halid-astryx-redesign-1.md` — this execution contract.
- **FILE-002**: `src/components/shell/qollab-app-shell.tsx` — shared authenticated AppShell/Layout frame.
- **FILE-003**: `src/components/shell/qollab-side-navigation.tsx` — shared desktop/mobile navigation definition.
- **FILE-004**: `src/components/shell/qollab-workspace-header.tsx` — breadcrumb, identity, status, presence, and action header.
- **FILE-005**: `src/components/shell/responsive-context-panel.tsx` — desktop LayoutPanel, tablet Dialog, and mobile BottomSheet presenter.
- **FILE-006**: `scripts/verify-design-system.ts` — static Astryx/token migration enforcement.
- **FILE-007**: `public/product/qollab-study-workspace.png` — sanitized verified product screenshot for the landing page.
- **FILE-008**: `artifacts/halid-redesign/baseline.md` — current command and route/state baseline.
- **FILE-009**: `artifacts/halid-redesign/design-qa.md` — final visual/accessibility QA record.

### Theme, framework, and design documentation

- **FILE-010**: `theme/qollab-workshop.ts` — editable Astryx theme.
- **FILE-011**: `theme/generated/qollab-workshop.css` — generated SSR CSS.
- **FILE-012**: `theme/generated/qollab-workshop.js` — generated runtime theme.
- **FILE-013**: `theme/generated/qollab-workshop.d.ts` — generated theme types.
- **FILE-013A**: `theme/generated/qollab-workshop.variants.d.ts` — Astryx-generated component variant augmentation referenced by the main declaration file.
- **FILE-014**: `src/app/layout.tsx` — fonts, Theme, metadata, viewport, and toast provider.
- **FILE-015**: `src/app/globals.css` — Astryx imports, temporary aliases, and retained renderer/global behavior.
- **FILE-016**: `.agents/DESIGN.md` — canonical Qollab/Astryx design documentation.
- **FILE-017**: `package.json` — theme and design-system verification scripts.
- **FILE-017A**: `eslint.config.mjs` — ignores Astryx-generated declarations so source lint remains authoritative.

### Public, auth, account, and global state

- **FILE-018**: `src/app/page.tsx` — editorial public landing.
- **FILE-019**: `src/app/login/login-form.tsx` — sign-in/sign-up form.
- **FILE-020**: `src/app/reset-password/reset-password-form.tsx` — recovery request form.
- **FILE-021**: `src/app/reset-password/update/update-password-form.tsx` — password update form.
- **FILE-022**: `src/app/error.tsx` — segment error state.
- **FILE-023**: `src/app/loading.tsx` — global loading state.
- **FILE-024**: `src/app/rooms/[roomId]/loading.tsx` — room loading state.
- **FILE-025**: `src/components/auth/auth-shell.tsx` — shared auth shell.
- **FILE-026**: `src/components/auth/sidebar-account-menu.tsx` — workspace account menu.
- **FILE-027**: `src/components/auth/sign-out-button.tsx` — safe logout action/presentation.
- **FILE-028**: `src/components/account/account-shell.tsx` — shared account shell.
- **FILE-029**: `src/components/account/profile-panel.tsx` — profile form.
- **FILE-030**: `src/components/account/settings-panel.tsx` — account settings controls.
- **FILE-031**: `src/components/brand/qollab-brand-logo.tsx` — brand presentation.
- **FILE-032**: `src/components/ui/LoadingScreen.tsx` — global/panel loading UI.
- **FILE-033**: `src/components/ui/toast.tsx` — toast compatibility wrapper/provider.

### Rooms and collaboration

- **FILE-034**: `src/components/rooms/rooms-dashboard.tsx` — room directory and actions.
- **FILE-035**: `src/components/rooms/room-banner-field.tsx` — room icon field.
- **FILE-036**: `src/components/rooms/breakout-room-directory.tsx` — breakout directory and create/open actions.
- **FILE-037**: `src/components/rooms/room-settings.tsx` — room administration.
- **FILE-038**: `src/components/collaboration/collaborative-room.tsx` — main workspace state and frame.
- **FILE-039**: `src/components/collaboration/rich-text-editor.tsx` — Notes renderer and toolbar.
- **FILE-040**: `src/components/collaboration/version-history-panel.tsx` — Notes context.
- **FILE-041**: `src/components/collaboration/conflict-review-panel.tsx` — offline conflict resolution.
- **FILE-042**: `src/components/rooms/viewer-collaboration-toggle.tsx` — viewer-edit control.
- **FILE-043**: `src/components/collaboration/mobile-tools-menu.tsx` — compact tool access.
- **FILE-044**: `src/components/collaboration/pdf-study-tool.tsx` — PDF tool.
- **FILE-045**: `src/components/collaboration/whiteboard-study-tool.tsx` — whiteboard tool.
- **FILE-046**: `src/components/collaboration/ai-study-tool.tsx` — AI study tool.
- **FILE-047**: `src/components/collaboration/breakout-room-workspace.tsx` — breakout workspace.
- **FILE-048**: `src/components/collaboration/breakout-qa-panel.tsx` — breakout Q&A context.

### Files deleted after verified replacement

- **FILE-049**: `src/app/home.module.css` — superseded landing CSS module.
- **FILE-050**: `src/components/rooms/rooms-dashboard.module.css` — superseded room-directory CSS module.
- **FILE-051**: `src/components/account/settings-panel.module.css` — superseded account CSS module.
- **FILE-052**: `src/components/rooms/room-banner.module.css` — superseded icon-field CSS module.
- **FILE-053**: `src/components/ui/LoadingScreen.module.css` — superseded loading CSS module.
- **FILE-054**: `src/components/ui/toast.module.css` — superseded toast CSS module.

### Verification files updated

- **FILE-055**: `scripts/verify-password-reset.ts` — replace stale BoardPrep assertion.
- **FILE-056**: `scripts/verify-account-profile.ts` — replace stale markup-coupled assertion.
- **FILE-057**: `scripts/verify-conflict-review.ts` — verify after loading asset import removal.

## 6. Testing

- **TEST-001**: Run `npm run theme:build` followed by `npm run theme:check`; generated theme artifacts must have no diff after the check.
- **TEST-002**: Run `npx astryx doctor`; all checks must pass with no warning.
- **TEST-003**: Run `npm run verify:design-system`; it must report no CSS-module imports, static inline layout styles, raw layout divs, unapproved color literals, arbitrary utilities, or dense-record Cards in migrated files.
- **TEST-004**: Run Prettier on every touched file, then `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.
- **TEST-005**: Run deterministic checks: `npm run verify:yjs`, `npm run verify:password-reset`, `npm run verify:account-profile`, `npm run verify:conflict-review`, `npm run verify:phase-3`, and `npm run verify:phase-4`.
- **TEST-006**: When disposable environment values are available, run `npm run verify:schema`, `npm run verify:version-history`, `npm run verify:rooms`, `npm run verify:room-icons`, `npm run verify:breakouts`, `npm run verify:offline-sync`, `npm run verify:phase-3-storage`, `npm run verify:saved-study-guides`, `npm run verify:serverless-collaboration`, and `npm run verify:vercel`.
- **TEST-007**: Verify `/`, all auth/recovery routes, `/rooms`, each room tool, breakout directory/workspace, room settings, profile, settings, loading, error, empty, pending, success, warning, offline, conflict, and destructive states at 1710×883, 1200×633, 1024×768, and 390×844.
- **TEST-008**: At 1280×800, compare the Halid reference and Qollab target side by side in one image. Confirm flat white rails/canvas, restrained warm outer canvas, 1px dividers, 6–9px control radii, compact typography, violet selected state, readable center measure, and absence of structural shadow.
- **TEST-009**: Keyboard-test skip link, SideNav/MobileNav, tool Tabs, menus, account menu, list rows, form fields, Dialog, BottomSheet, AlertDialog, version restore, conflict actions, AI views, PDF tools, and whiteboard controls. Confirm visible focus and correct focus return.
- **TEST-010**: Inspect landmarks, heading order, accessible names, `aria-current`/selected states, live regions, field errors, dialog names, and status text with a screen reader or accessibility tree.
- **TEST-011**: Verify contrast for every semantic token pair and UI state; specifically keep small selected text primary on `#EEE9FF` and white text on `#7352FA`.
- **TEST-012**: Test at 200% browser zoom, reduced motion, long room/user names, zero and high record counts, safe-area devices, keyboard-only use, and no horizontal overflow.
- **TEST-013**: Use two authenticated sessions to verify live presence, participant color, Notes edits, version creation/restore, PDF/whiteboard updates, presenter follow, breakout isolation/Q&A, viewer collaboration, reconnect, offline draft, conflict resolution, and sign-out cleanup.
- **TEST-014**: Confirm PDF, whiteboard, and AI remain separate client chunks and that shell interactions do not rerender high-frequency canvas/cursor state.
- **TEST-015**: Confirm the landing screenshot contains only fictional/non-sensitive content, has intrinsic dimensions, does not shift layout, and matches the final verified workspace.

## 7. Risks & Assumptions

- **RISK-001**: The worktree contains extensive uncommitted user work, including the entire theme and several CSS modules. An implementation that resets or reconstructs from `HEAD` can destroy current functionality.
- **RISK-002**: `src/app/globals.css` has more than 17,000 lines and owns both cosmetic and functional scroll/canvas behavior. Removing it by selector family instead of route/state verification can break editors or mobile tools.
- **RISK-003**: Moving one controlled context component between LayoutPanel, Dialog, and BottomSheet can remount local state. Context selection, drafts, and open state must live above the responsive presenter.
- **RISK-004**: Inter Tight changes line wrapping relative to current Inter. Rich-text, narrow toolbars, long names, and translated strings require explicit overflow QA.
- **RISK-005**: PDF and whiteboard use runtime coordinates and user-selected colors that cannot all be semantic theme tokens. An over-broad no-inline-style rewrite can corrupt annotations or cursor position.
- **RISK-006**: The room icon is currently passed to `CollaborativeRoom` but not destructured/rendered. Integrating it must not alter upload or repository behavior.
- **RISK-007**: Existing verifier failures can be mistaken for redesign regressions: password reset has stale BoardPrep copy, account profile has a stale markup assertion, and conflict review currently encounters a PNG module import through LoadingScreen.
- **RISK-008**: Full live-collaboration and storage verification needs disposable external services; local deterministic gates alone do not cover presence, signed URLs, RLS, or reconnection.
- **ASSUMPTION-001**: Qollab Violet `#7352FA` and Soft Violet `#EEE9FF` are the canonical brand colors.
- **ASSUMPTION-002**: The selected Halid reference is a structural and visual direction; Qollab retains its own information architecture and product copy.
- **ASSUMPTION-003**: Version 1 remains light-only, while dark token counterparts are maintained for future activation.
- **ASSUMPTION-004**: No database schema, API, Server Action, repository, or collaboration protocol change is required.
- **ASSUMPTION-005**: A sanitized authenticated fixture can be used to create the landing screenshot and visual QA captures.

## 8. Related Specifications / Further Reading

[Halid reference](https://unslop.site/site/docs-article-halid)

[Halid public component source](https://unslop.site/source/articles-2.jsx)

[Qollab logo and canonical violet](../QOLLAB_LOGO.md)

[Qollab design system](../.agents/DESIGN.md)

[Collaborative Notes plan](./feature-collaborative-notes-vertical-slice-1.md)

[Phase 3 study tools plan](./feature-phase-3-study-tools-1.md)

[Phase 4 AI assistant plan](./feature-phase-4-ai-assistant-1.md)

[Offline editing plan](./feature-offline-editing-sync-1.md)

[Conflict resolution plan](./feature-conflict-resolution-ui-1.md)

[Secure version history plan](./feature-secure-version-history-1.md)

[Room management plan](./feature-room-creation-management-1.md)

[Breakout live QA plan](./feature-breakout-live-qa-1.md)
