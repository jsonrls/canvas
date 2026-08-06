---
goal: Create the Qollab landing page and selectable room directory layouts
version: 1.0
date_created: 2026-07-30
last_updated: 2026-07-30
owner: Qollab
status: "Completed"
tags: [feature, landing-page, dashboard, accessibility, responsive]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Implement a public five-section Qollab landing page, remove the oversized authenticated dashboard introduction, and provide independently selectable card and list layouts for joined and public room directories.

## 1. Requirements & Constraints

- **REQ-001**: Replace the redirect in `src/app/page.tsx` with a five-section public landing page containing Hero, Why Qollab, Workspace Toolkit, How It Works, and Footer sections.
- **REQ-002**: Use the transparent Qollab lockup from `public/brand/qollab-logo-lockup.png`.
- **REQ-003**: Remove the `rooms-home-hero` introduction from `src/components/rooms/rooms-dashboard.tsx`.
- **REQ-004**: Add independent Card and List layout controls to the Ready to Open and Open Study Groups sections.
- **REQ-005**: Preserve all existing room join, leave, open, manage, and create actions.
- **ACC-001**: Give all interactive controls accessible names, visible focus states, semantic state attributes, and touch targets of at least 44 pixels.
- **ACC-002**: Maintain a valid heading hierarchy after removing the dashboard hero.
- **RES-001**: Support viewport widths of 375, 768, 1024, and 1440 pixels without horizontal scrolling.
- **PER-001**: Keep the landing page server-rendered and avoid adding client-side JavaScript to static marketing content.
- **CON-001**: Reuse the existing global design tokens and Lucide icon set.
- **CON-002**: Preserve unrelated changes in the dirty worktree.
- **GUD-001**: Respect `prefers-reduced-motion` for landing-page transitions.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Build the public Qollab landing experience.

| Task     | Description                                                                                                                                                         | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Replace `src/app/page.tsx` redirect with semantic header, Hero, Why, Workspace Toolkit, How It Works, and Footer content.                                           | ✅        | 2026-07-30 |
| TASK-002 | Add isolated `.landing-*` styles to `src/app/globals.css` using warm cream surfaces, violet brand accents, responsive layouts, and reduced-motion-safe transitions. | ✅        | 2026-07-30 |
| TASK-003 | Add page metadata and direct calls to action for `/login` and `/rooms`.                                                                                             | ✅        | 2026-07-30 |

### Implementation Phase 2

- GOAL-002: Simplify and extend the authenticated rooms dashboard.

| Task     | Description                                                                                                                | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Remove `rooms-home-hero` markup and retain an accessible page-level heading in `src/components/rooms/rooms-dashboard.tsx`. | ✅        | 2026-07-30 |
| TASK-005 | Add reusable Card/List controls with independent state for joined and public room sections.                                | ✅        | 2026-07-30 |
| TASK-006 | Add list-layout modifiers and responsive control styles in `src/app/globals.css`.                                          | ✅        | 2026-07-30 |

### Implementation Phase 3

- GOAL-003: Validate correctness and responsive behavior.

| Task     | Description                                                                                    | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Run Prettier, TypeScript, and targeted ESLint checks.                                          | ✅        | 2026-07-30 |
| TASK-008 | Verify landing and dashboard behavior at desktop and mobile widths in the running application. | ✅        | 2026-07-30 |
| TASK-009 | Update this plan to Completed after all validations pass.                                      | ✅        | 2026-07-30 |

## 3. Alternatives

- **ALT-001**: Use one global layout preference for both room sections. Rejected because independent selectors let users scan joined and discoverable rooms differently.
- **ALT-002**: Add a client-side animation library to the landing page. Rejected because CSS provides the required polish without increasing the JavaScript bundle.
- **ALT-003**: Keep the dashboard hero and place controls beneath it. Rejected because the user explicitly requested removal.

## 4. Dependencies

- **DEP-001**: Existing `QollabBrandLogo` component in `src/components/brand/qollab-brand-logo.tsx`.
- **DEP-002**: Existing room actions and `RoomDirectory` data in `src/components/rooms/rooms-dashboard.tsx`.
- **DEP-003**: `lucide-react` for consistent interface and marketing icons.

## 5. Files

- **FILE-001**: `src/app/page.tsx` — public landing page.
- **FILE-002**: `src/components/rooms/rooms-dashboard.tsx` — dashboard removal and layout controls.
- **FILE-003**: `src/app/globals.css` — landing and room layout styling.
- **FILE-004**: `plan/feature-landing-room-layouts-1.md` — executable implementation record.

## 6. Testing

- **TEST-001**: Confirm `npm run typecheck` succeeds.
- **TEST-002**: Confirm targeted ESLint succeeds for changed TypeScript and TSX files.
- **TEST-003**: Confirm Card and List selectors expose the selected state and update only their associated section.
- **TEST-004**: Confirm room actions remain present in both layouts.
- **TEST-005**: Confirm the landing page contains exactly the requested conceptual sections and working internal navigation.
- **TEST-006**: Confirm no horizontal overflow at 375, 768, 1024, and 1440 pixel widths.

## 7. Risks & Assumptions

- **RISK-001**: Existing global CSS is large and shared; all new landing selectors must be namespaced to prevent regressions.
- **RISK-002**: List layout action widths can overflow on narrow screens; mobile styles must return cards to a stacked arrangement.
- **ASSUMPTION-001**: The public landing page belongs at `/`, while authenticated workspaces remain at `/rooms`.
- **ASSUMPTION-002**: The Workspace Toolkit is the fifth section requested by the user.

## 8. Related Specifications / Further Reading

[Qollab logo meaning](../QOLLAB_LOGO.md)

[Existing design system](../.agents/DESIGN.md)
