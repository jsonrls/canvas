---
goal: Add an accessible upward-opening account menu to study-room sidebars
version: 1.0
date_created: 2026-08-08
last_updated: 2026-08-08
owner: Qollab
status: "Completed"
tags: [feature, ui, accessibility, navigation]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Replace the separate sidebar user card and sign-out control with one reusable account trigger that opens a compact menu above the user container in main and breakout study rooms.

## 1. Requirements & Constraints

- **REQ-001**: Make the complete sidebar user container a clickable account-menu trigger.
- **REQ-002**: Position the account menu above its trigger without shifting sidebar layout.
- **REQ-003**: Render Profile, Settings, and Logout items in that order.
- **REQ-004**: Place a visible divider between Settings and Logout.
- **REQ-005**: Style Logout as a destructive red action and preserve the existing safe offline-document cleanup flow.
- **A11Y-001**: Expose trigger expansion state and menu relationships with ARIA attributes.
- **A11Y-002**: Support keyboard opening, menu-item traversal, Escape dismissal, focus return, and outside-click dismissal.
- **A11Y-003**: Preserve visible focus styles and announced logout error feedback.
- **CON-001**: Reuse the existing Lucide icon set, design tokens, and global sidebar styling.
- **CON-002**: Apply the same component to main-room and breakout-room sidebars.
- **CON-003**: Do not modify unrelated existing worktree changes.
- **ASSUMPTION-001**: Profile and account Settings use the conventional `/profile` and `/settings` destinations; implementing those destination pages is outside this menu-only change.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Build and integrate the reusable sidebar account menu.

| Task     | Description                                                                                                                                                                          | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-001 | Add `src/components/auth/sidebar-account-menu.tsx` with the user trigger, upward popover, Profile and Settings links, divider, and reusable menu-mode sign-out control.              | ✅        | 2026-08-08 |
| TASK-002 | Extend `src/components/auth/sign-out-button.tsx` with an explicit menu presentation while preserving all existing call sites.                                                        | ✅        | 2026-08-08 |
| TASK-003 | Replace the separate user card and labeled sign-out control in `src/components/collaboration/collaborative-room.tsx` and `src/components/collaboration/breakout-room-workspace.tsx`. | ✅        | 2026-08-08 |
| TASK-004 | Add account-menu layout, interaction, focus, destructive, error, and reduced-motion styles to `src/app/globals.css`.                                                                 | ✅        | 2026-08-08 |

### Implementation Phase 2

- GOAL-002: Validate behavior and regression safety.

| Task     | Description                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-005 | Run Prettier on changed TypeScript, CSS, and plan files.                                               | ✅        | 2026-08-08 |
| TASK-006 | Run ESLint and TypeScript checks and resolve issues introduced by this feature.                        | ✅        | 2026-08-08 |
| TASK-007 | Inspect the final diff to confirm existing sign-out behavior and unrelated user changes remain intact. | ✅        | 2026-08-08 |

## 3. Alternatives

- **ALT-001**: Keep Logout as a second button below the card; rejected because the requested menu groups all account actions under the avatar trigger.
- **ALT-002**: Use a hover-only popover; rejected because it would not support touch or keyboard interaction.
- **ALT-003**: Duplicate menu state and markup in each workspace; rejected because the two sidebars require identical behavior and styling.

## 4. Dependencies

- **DEP-001**: React client hooks already included in the application.
- **DEP-002**: `lucide-react` icons already included in the application.
- **DEP-003**: Existing `SignOutButton`, offline-document cleanup, and authenticated sign-out action.

## 5. Files

- **FILE-001**: `src/components/auth/sidebar-account-menu.tsx` — reusable account trigger and menu.
- **FILE-002**: `src/components/auth/sign-out-button.tsx` — menu presentation for Logout.
- **FILE-003**: `src/components/collaboration/collaborative-room.tsx` — main-room sidebar integration.
- **FILE-004**: `src/components/collaboration/breakout-room-workspace.tsx` — breakout sidebar integration.
- **FILE-005**: `src/app/globals.css` — account-menu visuals and interaction states.

## 6. Testing

- **TEST-001**: Confirm the menu opens above the user container and closes on repeat click, outside click, link activation, and Escape.
- **TEST-002**: Confirm keyboard focus enters the first item, traverses items with Arrow/Home/End keys, and returns to the trigger on Escape.
- **TEST-003**: Confirm Logout remains red, is separated by a divider, shows pending state, and exposes cleanup failures with `role="alert"`.
- **TEST-004**: Confirm both main-room and breakout-room sidebars use the same account menu.
- **TEST-005**: Run `npm run lint` and `npm run typecheck`.

## 7. Risks & Assumptions

- **RISK-001**: The sidebar is a scroll container, so the popover must open upward and remain inside its visible bounds.
- **RISK-002**: Refactoring sign-out presentation must not alter the cleanup-before-logout behavior.
- **ASSUMPTION-002**: The sidebar remains hidden at the existing mobile breakpoint; this feature follows the current responsive navigation behavior.

## 8. Related Specifications / Further Reading

[Qollab design system](../.agents/DESIGN.md)

[Qollab code style guide](../.agents/STYLEGUIDE.md)
