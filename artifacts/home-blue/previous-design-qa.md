# Design QA — Reference-led room sidebar

## Comparison target

- Source visual truth: `/var/folders/sc/ytyq1pp961j1ccy5gzb7gd0c0000gn/T/codex-clipboard-gfvzOM.png`
- Implementation route: `/rooms/test-552853613d`
- State: authenticated owner, room `Test`, Shared notes selected, viewer editing enabled, account menu closed
- CSS viewport: `1200 × 633` at `1×`; the sidebar target occupies `248 × 633` CSS pixels
- Source pixels: `496 × 1266` (`2×` density)
- Implementation pixels: `248 × 633` (`1×` density)
- Normalization: the source was downsampled to `248 × 633` before comparison

## Evidence

- Source normalized to implementation density: `artifacts/sidebar-reference-normalized-248x633.png`
- Browser-rendered implementation: `artifacts/qollab-sidebar-1200x633.png`
- Same-input, side-by-side comparison: `artifacts/qollab-sidebar-comparison.png`
- Full room capture: `artifacts/qollab-room-sidebar-full-1200x633.png`
- Responsive captures: `artifacts/qollab-room-tablet-1024x768.png`, `artifacts/qollab-room-mobile-390x844.png`

The full comparison target is the sidebar itself, and the normalized side-by-side image keeps every label, icon, and control legible at 1:1. A smaller focused crop was not needed.

## Required fidelity surfaces

- Fonts and typography: IBM Plex Sans preserves the source's compact sans-serif character. Section headings use the same uppercase, widely tracked hierarchy; navigation labels use a regular optical weight with a medium selected state.
- Spacing and layout: the desktop rail is fixed at `248px`, fills the viewport, uses a `14px` outer navigation gutter, and matches the source's `220px × 36px` selected-row proportion. Qollab's room switcher and additional study tools intentionally add vertical content while retaining the reference rhythm.
- Colors and tokens: the dark brown-gray rail, muted slate selected fill, pale-blue icons, warm section labels, off-white text, and coral selection accent are mapped through the Astryx theme and sidebar-scoped tokens.
- Image quality and assets: the existing raster Qollab brand mark is used at its intended size with `next/image`; no placeholder, CSS art, custom SVG, emoji, or generated substitute is present. Navigation icons use the existing Lucide family consistently.
- Copy and content: Boardprep-specific copy was intentionally replaced with Qollab's real room destinations and collaboration controls. Labels are concise, product-specific, and untruncated at the canonical width.

## Comparison history

### Pass 0 — structural refinement

The initial browser capture (`artifacts/qollab-sidebar-reference-size.png`) found one P2 issue: the viewer-editing control collided with the account footer at the 633px reference height. The room selector, section gaps, viewer row, and helper copy were compacted without removing functionality.

### Pass 1 — normalized production comparison

The revised production sidebar was captured at `248 × 633` and compared beside the density-normalized source. The lower controls now remain separate, the rail is fully visible, and no P0, P1, or P2 mismatch remains.

## Findings

- P0: none
- P1: none
- P2: none
- P3: Qollab's brand mark and product-specific room/collaboration controls differ from the Boardprep reference by design; their visual treatment follows the reference system.

## Interaction, accessibility, and responsiveness

- PDF annotation becomes the pressed workspace tab and Shared notes can be restored.
- Breakout rooms navigates to `/rooms/test-552853613d/breakouts`; returning to the room restores the sidebar.
- The account trigger opens a semantic menu containing Profile, Settings, and Logout, then closes cleanly.
- The room switcher is exposed as a labeled combobox with all available rooms.
- Viewer editing is exposed as a labeled checked switch; it was inspected without mutating the persisted room setting.
- At `1024 × 768` and `390 × 844`, the desktop rail hides and the existing compact room navigation remains usable with the workspace content visible.
- The production page contains meaningful content and no Next.js error overlay. Console errors were limited to a Brave extension attempting to redefine `ethereum`; no application-origin error was observed.

## Static verification

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run theme:check`: passed
- `npx astryx doctor`: 6 passed, 0 warnings, 0 failures
- `git diff --check`: passed
- `npm run build -- --webpack`: passed on Next.js 16.3.0

final result: passed

---

# Design QA — Halid/Astryx foundation checkpoint

## Comparison target

- Source visual truth: `artifacts/halid-redesign/reference-1280x800.png`
- Browser-rendered implementation: `artifacts/halid-redesign/qollab-foundation-production-1280x800.png`
- Same-input comparison: `artifacts/halid-redesign/reference-vs-qollab-foundation-1280x800.png`
- Responsive evidence: `artifacts/halid-redesign/qollab-foundation-production-390x844.png`
- Viewport and density: both desktop captures are 1280 × 800 CSS pixels and
  1280 × 800 image pixels at 1×. No density normalization was required.
- State: light-mode Halid documentation reference compared with the Qollab
  production marketing route. These are not equivalent product states, so the
  comparison can verify foundation direction but cannot pass authenticated
  workspace fidelity.

The combined image was opened and judged as one input. A focused crop was not
used because the blocking mismatch is the full-view route and frame, not a
small-detail discrepancy; cropping would imply false precision.

## Findings

- [P1] The approved authenticated workspace frame is not wired to a route.
  Location: Qollab room and directory surfaces.
  Evidence: the source shows a persistent left rail, focused content canvas,
  and right context rail, while the production evidence is still the public
  marketing page. The new shell primitives compile but are intentionally
  unwired at this checkpoint.
  Impact: the source and implementation do not yet represent the same state,
  so full design fidelity and core workspace interaction QA are blocked.
  Fix: migrate the collaborative room and Notes flow onto `QollabAppShell`,
  then recapture an authenticated 1280 × 800 state.

- [P2] Route-owned cobalt and graph-paper presentation remains visible.
  Location: `src/app/home.module.css` and later route-specific migrations.
  Evidence: the foundation screenshot still presents a cobalt marketing hero
  and grid, while the Halid direction is flat and neutral with violet used
  sparingly. The raw global palette and global body grid are gone; this visible
  remainder is owned by a later route phase.
  Impact: the current public route does not yet demonstrate the new semantic
  token system end to end.
  Fix: migrate the public route in its planned phase and retire its hardcoded
  brand presentation after the authenticated workspace is verified.

## Required fidelity surfaces

- Fonts and typography: Inter Tight and JetBrains Mono are loaded through
  `next/font/google`; production rendering is compact and legible. Exact Halid
  workspace hierarchy remains untestable until the matching route is wired.
- Spacing and layout rhythm: the new 256px navigation, 56px header, flexible
  center, and 360px context budgets are encoded in the shared shell. They are
  not visible in the current route, which is the primary blocker.
- Colors and tokens: Qollab Violet and its light/dark semantic contract are
  generated from the neutral Astryx theme. The duplicate raw `:root` palette,
  legacy cobalt literals in global CSS, and global page grid no longer override
  it. Route-owned marketing colors remain as the P2 finding above.
- Image quality and assets: both captures are sharp 1× browser screenshots.
  Qollab uses its existing brand asset; no emoji, CSS drawing, placeholder, or
  handcrafted SVG was introduced by the foundation.
- Copy and content: product copy remains Qollab-specific by design. It cannot
  be compared line for line with Halid's treasury documentation content.

## Comparison history

- Pass 0: the baseline showed Inter, a raw late cobalt palette, a global page
  grid, and no reusable Astryx application-frame contract.
- Foundation fix: installed Inter Tight and JetBrains Mono at the root, rebuilt
  the neutral-violet theme, removed the duplicate palette and page grid,
  converted legacy cobalt references to semantic accent mixes, documented the
  system, and added the four shared shell primitives.
- Pass 1: production build and the combined 1280 × 800 evidence confirm the
  font/token foundation and clean responsive rendering. The route/state
  mismatch and route-owned marketing styling remain, so P1/P2 findings are
  still actionable in the next implementation phases.

## Interaction and implementation checks

- `Inspect the workspace` moves to `/#workspace` and exposes the intended
  region.
- `/rooms` redirects to `/login?next=%2Frooms`, and the sign-in form, password
  reveal control, recovery link, and account link are present and labeled.
- The 390 × 844 production capture has no visible horizontal overflow or
  overlapping primary controls.
- The optimized production build rendered without an application error
  overlay; server output was clean. A development-only hydration warning came
  from the selected Brave extension adding `cz-shortcut-listen` to `<body>`.

## Implementation checklist

- Wire the collaborative room and Notes surface to the shared shell.
- Supply real Qollab navigation, room, presence, and version-history content.
- Recapture the authenticated workspace at 1280 × 800 and all canonical
  responsive viewports.
- Repeat the combined comparison until no P0/P1/P2 findings remain.

final result: blocked
