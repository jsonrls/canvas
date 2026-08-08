---
goal: Build authenticated Profile and Settings pages for Qollab accounts
version: 1.0
date_created: 2026-08-08
last_updated: 2026-08-08
owner: Qollab
status: "Completed"
tags: [feature, account, profile, settings, security, ui]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Implement the `/profile` and `/settings` destinations used by the sidebar account menu. The Profile page provides a server-authorized display-name update, while Settings provides account identity, password recovery, room navigation, and safe sign-out controls.

## 1. Requirements & Constraints

- **REQ-001**: Add authenticated `/profile` and `/settings` App Router pages with page-specific metadata.
- **REQ-002**: Build one reusable account shell with Qollab branding, predictable back navigation, active Profile/Settings navigation, and responsive content layout.
- **REQ-003**: Show the current profile identity and email without exposing private data to unauthenticated users.
- **REQ-004**: Allow a signed-in user to update only their own display name.
- **REQ-005**: Normalize display names by trimming whitespace and enforce the database-compatible 1–60 character range.
- **REQ-006**: Show pending, success, and recoverable error feedback next to the profile form.
- **REQ-007**: Provide Settings actions for editing the profile, returning to rooms, resetting the password through the existing recovery flow, and safely logging out.
- **SEC-001**: Authenticate every server mutation independently and rely on profile row-level security as defense in depth.
- **SEC-002**: Keep the sign-in email read-only because email-change confirmation is not implemented in this scope.
- **A11Y-001**: Use semantic landmarks, headings, labels, status roles, visible focus states, and minimum 44px interactive targets.
- **A11Y-002**: Keep content usable at 375px without horizontal scrolling and respect the global reduced-motion rule.
- **CON-001**: Reuse the existing Supabase profile schema, password-reset flow, sign-out cleanup, Lucide icons, Qollab logo, and global design tokens.
- **CON-002**: Preserve unrelated changes in the existing dirty worktree.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Implement account-domain behavior and authenticated routes.

| Task     | Description                                                                                                                                  | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Add `src/lib/profiles/model.ts` with pure display-name normalization, length constants, and a typed domain error.                            | ✅        | 2026-08-08 |
| TASK-002 | Extend `src/lib/profiles/repository.ts` with `updateProfileDisplayName`, scoped by the authenticated user ID.                                | ✅        | 2026-08-08 |
| TASK-003 | Add `src/app/profile/action-state.ts` and `src/app/profile/actions.ts` for authenticated updates, path revalidation, and user-safe feedback. | ✅        | 2026-08-08 |
| TASK-004 | Add `src/app/profile/page.tsx` and `src/app/settings/page.tsx` with explicit authentication redirects and minimal serialized props.          | ✅        | 2026-08-08 |
| TASK-005 | Extend `src/lib/supabase/proxy.ts` so `/profile` and `/settings` receive the same protected-route behavior as `/rooms`.                      | ✅        | 2026-08-08 |

### Implementation Phase 2

- GOAL-002: Build the responsive account interface and verify it.

| Task     | Description                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-006 | Add `src/components/account/account-shell.tsx`, `profile-panel.tsx`, and `settings-panel.tsx` for shared navigation, profile editing, security, and logout UI. | ✅        | 2026-08-08 |
| TASK-007 | Extend `src/components/auth/sign-out-button.tsx` with an optional pre-sign-out callback and a destructive labeled presentation for Settings.                   | ✅        | 2026-08-08 |
| TASK-008 | Add scoped account-page styles and responsive states to `src/app/globals.css`.                                                                                 | ✅        | 2026-08-08 |
| TASK-009 | Add `scripts/verify-account-profile.ts` and `verify:account-profile` to test display-name normalization deterministically.                                     | ✅        | 2026-08-08 |
| TASK-010 | Run Prettier, account verification, ESLint, TypeScript, production build, and final diff checks.                                                               | ✅        | 2026-08-08 |

## 3. Alternatives

- **ALT-001**: Build visual placeholder pages only; rejected because the existing profile table and password-recovery flow support useful account behavior now.
- **ALT-002**: Add avatar upload in the same change; rejected because no profile-avatar storage bucket or upload policy exists.
- **ALT-003**: Allow direct email changes; rejected because the confirmation and reauthentication workflow is not implemented.
- **ALT-004**: Duplicate complete page chrome for each route; rejected because shared account navigation should remain visually and behaviorally consistent.

## 4. Dependencies

- **DEP-001**: Existing `public.profiles` table and self-update row-level security policy.
- **DEP-002**: Existing authenticated Supabase context in `src/lib/supabase/server.ts`.
- **DEP-003**: Existing password-reset route and safe `SignOutButton` cleanup flow.
- **DEP-004**: Existing Qollab brand logo and `lucide-react` icon set.

## 5. Files

- **FILE-001**: `src/lib/profiles/model.ts` — pure display-name rules.
- **FILE-002**: `src/lib/profiles/repository.ts` — authenticated profile persistence.
- **FILE-003**: `src/app/profile/action-state.ts` — profile form state contract.
- **FILE-004**: `src/app/profile/actions.ts` — profile update server action.
- **FILE-005**: `src/app/profile/page.tsx` — authenticated Profile route.
- **FILE-006**: `src/app/settings/page.tsx` — authenticated Settings route.
- **FILE-007**: `src/components/account/account-shell.tsx` — shared account-page shell.
- **FILE-008**: `src/components/account/profile-panel.tsx` — profile editor.
- **FILE-009**: `src/components/account/settings-panel.tsx` — settings and security controls.
- **FILE-010**: `src/components/auth/sign-out-button.tsx` — destructive account-page variant.
- **FILE-011**: `src/lib/supabase/proxy.ts` — protected account paths.
- **FILE-012**: `src/app/globals.css` — account-page styling.
- **FILE-013**: `scripts/verify-account-profile.ts` — deterministic validation checks.
- **FILE-014**: `package.json` — account-profile verification command.

## 6. Testing

- **TEST-001**: Accept and trim a valid 1–60 character display name.
- **TEST-002**: Reject non-string, empty, whitespace-only, and over-60-character display names with safe messages.
- **TEST-003**: Confirm unauthenticated `/profile` and `/settings` requests redirect to login with the original destination.
- **TEST-004**: Confirm Profile exposes labeled input, helper text, pending state, and announced success/error feedback.
- **TEST-005**: Confirm Settings links to Profile, rooms, and password recovery and exposes destructive safe logout.
- **TEST-006**: Confirm both routes render at desktop and 375px without horizontal overflow.
- **TEST-007**: Run `npm run verify:account-profile`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.

## 7. Risks & Assumptions

- **RISK-001**: Display-name changes may not update an already-open WebSocket presence label until that room reconnects; new page loads read the updated profile immediately.
- **RISK-002**: Profile writes must never use a service-role-only bypass without the authenticated user JWT.
- **ASSUMPTION-001**: An initial-based avatar is the supported presentation until avatar storage is implemented.
- **ASSUMPTION-002**: Password changes continue through the existing email recovery flow to avoid adding an incomplete reauthentication path.

## 8. Related Specifications / Further Reading

[Sidebar account menu implementation](./feature-sidebar-account-menu-1.md)

[Qollab design system](../.agents/DESIGN.md)

[Qollab code style guide](../.agents/STYLEGUIDE.md)
