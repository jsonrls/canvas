---
goal: Redesign Qollab sign-in and sign-up as distinct, accessible experiences
version: 1.0
date_created: 2026-07-30
last_updated: 2026-07-30
owner: Qollab
status: "Completed"
tags: [feature, authentication, frontend, accessibility, responsive]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Replace the ambiguous combined authentication form with dedicated sign-in and
sign-up pages inside one coherent Qollab welcome experience. Preserve the
existing Supabase actions, safe redirect behavior, password recovery flow, and
brand assets.

## 1. Requirements & Constraints

- **REQ-001**: Provide distinct `/login` and `/signup` pages with clear
  page-specific fields, copy, and calls to action.
- **REQ-002**: Preserve the existing `signIn` and `signUp` server actions and
  safe `next` redirect behavior.
- **REQ-003**: Reuse the transparent Qollab logo lockup and the existing warm
  cream and violet brand palette.
- **REQ-004**: Present a compact study-room preview that communicates the
  product purpose without requiring animation or remote media.
- **REQ-005**: Keep password reset and password update routes visually
  consistent with the redesigned authentication shell.
- **ACC-001**: Use persistent labels, appropriate autocomplete values, visible
  focus states, live status regions, and at least 44-pixel interactive targets.
- **ACC-002**: Give password visibility controls accessible names and pressed
  states.
- **RES-001**: Support widths of 375, 768, 1024, and 1440 pixels without
  horizontal scrolling.
- **PER-001**: Keep the page shell server-rendered and limit client state to
  form submission and password visibility.
- **CON-001**: Preserve unrelated changes in the dirty worktree.
- **CON-002**: Use the existing Lucide icon package and avoid new dependencies.
- **GUD-001**: Respect `prefers-reduced-motion`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish the shared authentication composition.

| Task     | Description                                                                                                            | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create a reusable auth shell with Qollab navigation, form content area, security note, and branded study-room preview. | ✅        | 2026-07-30 |
| TASK-002 | Add isolated `.auth-*` styles for the split desktop composition and compact mobile presentation.                       | ✅        | 2026-07-30 |
| TASK-003 | Keep the shared shell semantic, keyboard accessible, and free of layout-dependent client JavaScript.                   | ✅        | 2026-07-30 |

### Implementation Phase 2

- GOAL-002: Separate and clarify sign-in and account creation.

| Task     | Description                                                                                                               | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Refactor the existing client form to render only the fields and server action required by the active authentication mode. | ✅        | 2026-07-30 |
| TASK-005 | Redesign `/login` with sign-in copy, reset success feedback, and a direct route to account creation.                      | ✅        | 2026-07-30 |
| TASK-006 | Add `/signup` with display-name guidance, new-password semantics, and a direct route back to sign-in.                     | ✅        | 2026-07-30 |
| TASK-007 | Apply the shared shell to password reset and password update routes for a continuous recovery journey.                    | ✅        | 2026-07-30 |

### Implementation Phase 3

- GOAL-003: Verify implementation quality.

| Task     | Description                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-008 | Run formatting, TypeScript, and targeted lint checks.                                                  | ✅        | 2026-07-30 |
| TASK-009 | Verify sign-in, sign-up, recovery, focus, and password visibility behavior in the running application. | ✅        | 2026-07-30 |
| TASK-010 | Check responsive layouts at 375, 768, 1024, and 1440 pixels and confirm no horizontal overflow.        | ✅        | 2026-07-30 |

## 3. Alternatives

- **ALT-001**: Keep one combined form with two submit buttons. Rejected because
  it exposes irrelevant fields and makes the active intent unclear.
- **ALT-002**: Add a third-party authentication UI library. Rejected because
  the current server actions are already secure and the dependency would add
  unnecessary weight.
- **ALT-003**: Use a full-screen photo in the supporting panel. Rejected to keep
  the page original, lightweight, and recognizably Qollab.

## 4. Dependencies

- **DEP-001**: Existing auth actions in `src/app/login/actions.ts`.
- **DEP-002**: Existing transparent lockup exposed by
  `src/components/brand/qollab-brand-logo.tsx`.
- **DEP-003**: Existing reset actions and forms under
  `src/app/reset-password`.
- **DEP-004**: `lucide-react` for interface icons.

## 5. Files

- **FILE-001**: `src/components/auth/auth-shell.tsx` — shared authentication
  page composition.
- **FILE-002**: `src/app/login/login-form.tsx` — mode-specific auth form.
- **FILE-003**: `src/app/login/page.tsx` — sign-in entry page.
- **FILE-004**: `src/app/signup/page.tsx` — account creation entry page.
- **FILE-005**: `src/app/reset-password/page.tsx` — recovery entry page.
- **FILE-006**: `src/app/reset-password/update/page.tsx` — new password page.
- **FILE-007**: `src/app/globals.css` — shared responsive auth styling.
- **FILE-008**: `plan/feature-auth-experience-redesign-1.md` — implementation
  record.

## 6. Testing

- **TEST-001**: Confirm `npm run typecheck` succeeds.
- **TEST-002**: Confirm targeted ESLint succeeds for changed TSX files.
- **TEST-003**: Confirm sign-in contains only email and current-password fields.
- **TEST-004**: Confirm sign-up contains display name, email, and new-password
  fields.
- **TEST-005**: Confirm action feedback is announced and submit controls expose
  pending state.
- **TEST-006**: Confirm password visibility controls work with keyboard input
  and expose accurate accessible state.
- **TEST-007**: Confirm no horizontal overflow at 375, 768, 1024, and 1440
  pixel widths.

## 7. Risks & Assumptions

- **RISK-001**: Global authentication selectors are shared by recovery forms;
  the redesign must preserve their expected input and button structure.
- **RISK-002**: The supporting preview can crowd shorter screens; it must
  collapse before it causes page-level horizontal overflow.
- **ASSUMPTION-001**: A dedicated `/signup` route is preferable to a query
  parameter because it gives account creation distinct metadata and semantics.
- **ASSUMPTION-002**: The existing email confirmation behavior remains the
  source of truth after account creation.

## 8. Related Specifications / Further Reading

[Existing design system](../.agents/DESIGN.md)

[Password reset plan](./feature-password-reset-1.md)
