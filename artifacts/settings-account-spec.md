# Qollab Settings and shared account frame — final design specification

Status: ready for Coder. Design-only deliverable; no production implementation.

## Goal and scope

Help a signed-in person recognize their account, reach profile/password/rooms destinations, and end their session safely. Replace the hero/sidebar/card composition with a calm, centered, divider-led account surface consistent with Rooms and DESIGN.md v1.1. Share the frame across Settings and Profile; preserve ProfilePanel's content, form, validation, preview, pending state, and success behavior.

This specification commits the design. It introduces no features, settings, dialogs, dependencies, authentication changes, new data fetching, or theme changes.

## Evidence and limits

Inspected `.agents/DESIGN.md` v1.1, account-shell.tsx, settings-panel.tsx, profile-panel.tsx, sign-out-button.tsx, settings/page.tsx, and the Rooms header in rooms-dashboard.tsx. The source confirms repeated identity/privacy content, numbered editorial settings cards, and a separate sidebar. The supplied authenticated baseline describes their rendered appearance; this design pass did not independently inspect that browser session or perform usability/accessibility tests.

Consulted installed Astryx CLI: layout guidance; build kit for account settings; settings template skeleton; component references for AppShell, Layout, LayoutContent, Section, HStack, VStack, List, ListItem, Heading, Text, Button, Avatar, Divider; and token reference. Use Qollab's theme values, not the CLI's default palette examples. Frontend-design informed hierarchy and spacing; the approved Qollab fonts, restrained motion, and flat surfaces override its general stylistic suggestions.

Important verified constraints: ListItem plain-string descriptions truncate; use wrapping Text content instead. ListItem supports noninteractive rows containing one link. Button supports link rendering with href and a Next Link adapter. AppShell already supplies a main landmark and skip link. Its loading-button implementation does not excuse dropping existing SignOutButton behavior.

## User flow

1. Existing server authentication check runs. Unauthenticated access retains `/login?next=%2Fsettings`; profile fetch and errors retain existing behavior.
2. Signed-in person lands on Settings: compact account navigation, explicit page title, then identity summary.
3. Profile navigation or “Edit public profile” opens `/profile`; “Reset password” opens `/reset-password`; “View rooms”, header “Back to rooms”, and Qollab brand open `/rooms`. These remain ordinary links, with browser back/open-in-new-tab behavior.
4. “Sign out” starts the existing cleanup and sign-out sequence. Pending feedback stays at the action. Failure leaves the page usable and offers retry through the same button. Success follows the existing redirect without a new success page or toast.

## Committed visual hierarchy

One flat white application canvas using surface tokens, one shadowless header with a border-token divider, and one centered account column capped at 640px. No sidebar, context panel, hero, large blue area, section numbering, card outlines, decorative shadows, texture, or marketing eyebrow.

Use Inter Tight and the existing theme's ordinary Heading scale. H1 is “Settings” with no display variant; supporting sentence: “Manage your account and sign-in.” Use h2 for “Signed in as”, “Account”, “Privacy”, and “Sign out”. Section headings use semibold primary ink. Body and helper text retain the base body size; helpers use secondary ink, never disabled color. Identity name uses semibold Text rather than becoming a second page title. No new font sizes or theme tokens.

Blue belongs to links, focus, and the current navigation indicator. Current navigation uses primary ink on accent-muted with a blue bottom indicator and semibold label, so selection is not color-only. Neutral actions remain quiet; the single destructive control uses the theme's destructive Button variant, without a red region background.

Spacing: label-to-description gap 1–2; identity avatar-to-copy gap 3; row copy-to-action gap 3–4; section heading-to-content gap 4; section block padding 6; navigation-to-title and title-to-first-section gap 6. Use spacing-8 above the content on desktop/tablet and spacing-6 on mobile; spacing-8 after sign-out. All numbers here are Astryx spacing steps, not arbitrary pixel utilities. Section owns its spacing; do not double-pad List and its parent.

## Structure and component mapping

| Region, in reading order | Components and content | Interaction and grouping |
| --- | --- | --- |
| Shared frame | AppShell section variant, zero content padding; one Layout with centered 640px account content; HStack/VStack for header and content structure | Preserve a single main landmark and working skip mechanism. Do not duplicate AppShell's built-in landmarks/skip link. Retain a focusable account-content target surrounding title and page content. |
| Header | Shadowless semantic header with HStack; existing QollabBrandLogo in named `/rooms` link; ghost Button rendered as link for “Back to rooms”, leading ArrowLeft | Standard 56px header budget; one bottom divider. Header interior may use the existing Rooms 1120px cap. Header width is the intentional exception to the account-content cap. Do not add account menu or repeat the user identity here. |
| Account navigation | HStack rendered as nav, accessible name “Account”; two ghost Button links, “Profile” and “Settings” | Both always visible, in this order; active destination receives aria-current=page. They navigate routes: no tab roles or roving arrow-key behavior. Divider below navigation. |
| Page introduction | VStack; Heading level 1 and secondary Text | Settings copy as above. Profile retains its supplied title/intro, rendered in this quieter shared hierarchy. No duplicate title inside panel. |
| Identity | Section with zero inline padding; h2 “Signed in as”; HStack with Avatar size lg and VStack of name and email | Avatar is noninteractive, no status/checkmark or tooltip; use the name's initials and Q fallback for blank data. Name and email are fully visible and selectable. Do not repeat an edit action here. |
| Account actions | Section; List with h2 “Account” as its header, spacious density and dividers; three noninteractive ListItems | Each row has title, wrapping Text description, and exactly one explicit link action. No row href, click handler, interactiveRef, or pointer cursor. |
| Privacy | Section with h2 “Privacy” and secondary body Text | “Your account email never appears to collaborators in shared study rooms.” Plain content; no Banner, status token, shield badge, or dismiss action. |
| Session action | Divider, then Section with h2 “Sign out”, body Text, and existing SignOutButton | “Qollab clears locally stored offline notes before ending your session.” Destructive button labeled “Sign out”. Keep separate from the navigation rows. Inline failure immediately follows the control. |

Account rows, in order:

| Row title | Description | Action |
| --- | --- | --- |
| Public profile | Your display name appears in shared study rooms. | Edit public profile → `/profile` |
| Password & recovery | Request a secure, time-limited email link to choose a new password. | Reset password → `/reset-password` |
| Study rooms | Create a room, join your study partners, or reopen recent work. | View rooms → `/rooms` |

Use Button's link rendering for action styling; the rendered element must be an anchor. Ghost treatment with text-accent is sufficient. Row titles are labels, not additional headings. Omit leading icons and trailing arrows in these rows: the explicit action labels communicate destinations. This keeps scarce width for readable text.

For ListItem, place wrapping description and its action in a layout-capable description node if endContent cannot adapt without clipping. The desktop action can occupy the trailing column; below md it must follow the description. The title stays fixed in reading order. Do not accept truncation or nested interaction to preserve an endContent layout.

## Responsive contract and text wireframe

All sizes share this order: header → Profile / Settings nav → page title and intro → Signed in as → Account rows → Privacy → Sign out. Dividers span the content width. Content aligns left inside the centered column; no centered body copy.

| Viewport | Required structure |
| --- | --- |
| Desktop 1440×900 | Header lockup left and Back to rooms right within the Rooms-style header container. Account reading column centered, 640px maximum. Compact nav above h1. Each account row places copy left and action right, top aligned. Identity has avatar beside wrapping copy. Sign-out copy precedes a left-aligned, content-width button. |
| Tablet 768×1024 | Same single column and visible navigation. 640px maximum leaves comfortable outer margins. Rows may retain trailing actions when measured without compression. No rail, drawer, or hidden navigation. |
| Mobile 390×844 | Spacing-4 outer gutters give 358px available width. Compact approved brand symbol in header if full lockup crowds Back to rooms; retain accessible name “Qollab rooms”. Both nav links remain visible. Account actions stack beneath their descriptions and align left. Identity avatar remains beside text; values wrap. Sign-out button remains content-width with at least 44px target height. Natural vertical scrolling is expected. |

Use the existing md breakpoint for stacked versus trailing row actions. At 200% zoom, let effective CSS viewport width trigger the compact layout. Header can grow/wrap when text enlargement requires it: 56px is the normal budget, not a clipping constraint. Never shrink labels or targets to force a one-line header. At narrower widths, including 320px reflow, all destinations remain available without horizontal scrolling.

Maintain one effective vertical content scroller using the AppShell/Layout contract; do not nest separately scrolling settings sections. No sticky action bar or fixed-height section. Focused controls, errors, and the final button must scroll fully into view. Do not force all mobile content into the initial viewport.

## States and accessibility

| State | Required result |
| --- | --- |
| Default | Primary text, secondary explanations, quiet separators; actionable links distinguishable from plain row text. Static rows have no hover affordance. |
| Hover | Existing token-based overlay on links/buttons only; no movement, elevation, or morph animation. |
| Focus | Clearly visible theme focus ring, not clipped by parent overflow. Every header/nav/action target is at least 44×44px, with spacing-2 between neighboring controls. |
| Pressed | Theme pressed feedback without geometry changes. Native link/button activation behavior preserved. |
| Current page | One Profile/Settings link has aria-current=page, semibold label, accent-muted background and indicator. Current link remains a normal link, not disabled. |
| Long identity | Show entire display name and email with wrapping and safe word breaks; no line clamp or ellipsis in Settings. Copy has minimum-width-zero behavior. Do not rely on a title attribute or hover tooltip to reveal values. |
| Null email | Show “Email unavailable” as ordinary secondary text. No warning badge, fake email, or empty line. Reset-password stays enabled; its destination owns recovery entry and validation. |
| Sign-out pending | Preserve exact existing “Logging out…” label for danger/menu variants, spinner, disabled control, aria-busy, and duplicate-activation prevention. Keep control height and surrounding alignment stable. Other links retain existing behavior. |
| Cleanup failure | Show exact “Offline notes could not be cleared. Retry sign out.” as persistent role=alert beside/below the action. Do not call server sign-out. Button becomes enabled for retry. |
| Other sign-out failure | Show exact “Sign out could not finish safely. Retry sign out.” with the same alert/retry behavior. Clear stale error when retry starts. |
| Success | Existing sign-out redirect completes. Do not introduce a confirmation dialog, completion panel, or additional account state. |
| Page loading/fetch error | Preserve existing server/navigation boundary behavior. Do not flash a fabricated identity, add a client loading phase, or display fetch failures as an empty account. |

Keyboard order follows visual order: skip link; Qollab rooms; Back to rooms; Profile; Settings; Edit public profile; Reset password; View rooms; Sign out. Activating skip moves focus to account content/main and bypasses repeated frame controls; retain the programmatically focusable account-content target. Exactly one h1 and one main landmark. Sections are named by their h2 headings. No tablist, menu, grid, row-level keyboard interception, or positive tabindex.

Use decorative icon semantics for ArrowLeft/avatar when adjacent text supplies equivalent information. Native Enter activates links; Enter/Space activates sign-out. Error text is announced once through role=alert and remains readable without moving focus unexpectedly. Verify that any substituted Astryx loading semantics do not generate conflicting repeated announcements. Honor reduced motion; no new animation.

Measure actual rendered text contrast (normal text 4.5:1 minimum; large text 3:1), focus/non-text contrast, target bounds, and keyboard visibility. Palette values or screenshots alone are not evidence of accessibility compliance.

## Profile integration and tradeoffs

The compact navigation intentionally replaces the template's sidebar: two stable destinations do not justify a second region, duplicate identity, or a mobile drawer. This is a bounded exception to the general workspace rail pattern, consistent with the explicit account scope.

ProfilePanel remains visually distinct where it already contains cards; migrating that form would exceed this task. Keep its existing global style selectors and behavioral hooks. Place it inside the same 640px frame, with enough separation between its children. Do not remove broad account CSS merely because Settings no longer uses it. A targeted shell integration adjustment is justified only if the new width causes observable overflow, clipped focus, or unusable content; preserve all form wording and behavior and document the adjustment.

Moving the profile link into Account makes all three destinations consistently scannable and removes the duplicate action beside identity. Privacy stays next to the account controls as one plain section. Removing decorative claims such as status checks avoids implying verified security or synchronization state.

The sign-out action already clears local notes. Preserve its explanatory copy and cleanup-first behavior; adding a confirmation dialog is explicitly outside scope. Do not broaden this redesign into offline-data policy changes.

## Observable acceptance criteria

1. At 1440×900, 768×1024, and 390×844, Settings has the specified order, centered content no wider than 640px, flat shadowless header, and no hero/sidebar/numbered cards. Blue remains a functional accent.
2. All three Account actions reach their exact destinations. No interactive ancestor contains another action; each row adds only one keyboard stop. Header and account navigation remain available at every width.
3. Long multiword names, a long unbroken name, a long email, and null email render without clipping or horizontal overflow. Settings shows full values without hover. Test both routes at 200% zoom and Settings at 320px effective width.
4. Skip navigation works, account-content is focusable programmatically, headings form a correct outline, current page is announced, and keyboard focus is visible and unobscured throughout. Measure every control's minimum 44px target.
5. With safe test doubles, pending sign-out disables repeat activation and exposes busy state; cleanup runs before sign-out; cleanup failure prevents sign-out; both errors are announced and retryable. Success retains the existing redirect. Verify default and menu variants remain compatible with their other consumers, including menuitem semantics.
6. Profile still shows its existing preview, editable name, email/fallback, privacy note, validation, pending/save behavior, and success feedback. Check desktop/mobile/zoom and long data. No profile form redesign or auth-server changes.
7. Changed presentation uses installed Astryx APIs and existing token utilities. No raw div/span layout, inline style objects, new CSS module, arbitrary utility values, hardcoded colors, gradients, textures, decorative shadows, new settings, or dependencies.
8. Coder supplies before/after authenticated screenshots of both routes at the three target viewports, plus Settings long/null data and sign-out error/pending evidence. Report keyboard/zoom/contrast checks separately from screenshots. Safe fixtures must not trigger real sign-out or account mutation merely for visual QA.

## Connected workflow handoff

- Status: ready.
- Completed: final flow, hierarchy, responsive structures, component mapping, copy, interaction states, accessibility requirements, Profile regression boundary, and acceptance criteria.
- Artifact: `artifacts/settings-account-spec.md`. Evidence paths are identified above; no production files changed during this design assignment.
- Decisions: flat 640px surface, compact route navigation, full wrapping identity, three explicit-link rows, plain privacy section, isolated destructive action. No unresolved product choices and no Planner reconciliation required: decisions fit the supplied plan and dependencies.
- Assumptions: existing authenticated verification environment remains available to the orchestrator/Coder. Installed component behavior must be checked in the rendered implementation; this artifact is a specification, not a tested mockup.
- Unresolved verification: rendered Profile behavior at the narrower cap; exact contrast/focus/target measurements; server/client component composition and menu regression checks. These are implementation verification tasks, not approval blockers.
- Recommended next role: Coder, followed by Design review. Orchestrator owns dispatch; no worker was spawned.
- Concrete assignment: implement this specification in AccountShell and SettingsPanel, with narrowly scoped SignOutButton presentation updates as necessary. Settings page title/intro may change; authentication redirect, profile fetch, and server behavior may not. Preserve ProfilePanel and shared account styles except demonstrated shell integration repairs. Retire settings-only styling only after confirming exclusive use. Read relevant installed Next.js guides and verify Astryx APIs before coding. Preserve existing user edits. Run relevant account-profile/password-reset checks, lint/typecheck/format checks, theme/design-system checks available in the repository, and targeted runtime verification. Return changed paths, results and limitations, screenshots, and any design discrepancy to the orchestrator for Design review.
