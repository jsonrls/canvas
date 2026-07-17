---
goal: Add a secure temporary password-reset flow before Phase 3 resumes
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, authentication, supabase, nextjs]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Add public password-reset request UI and an authenticated new-password screen using the existing Supabase SSR cookie flow, then return development focus to the remaining Phase 3 study features.

## 1. Requirements & Constraints

- **REQ-001**: Expose a public `/reset-password` page linked from `/login`.
- **REQ-002**: Send recovery email requests through `supabase.auth.resetPasswordForEmail` with `/auth/confirm?next=/reset-password/update` as the configured callback.
- **REQ-003**: Let a recovery-authenticated user choose and confirm a new password at `/reset-password/update` through `supabase.auth.updateUser`.
- **REQ-004**: Sign out the recovery session after a successful update and return the user to `/login` with confirmation feedback.
- **SEC-001**: Return account-neutral request feedback and never expose whether an email is registered.
- **SEC-002**: Authenticate the password-update Server Action from validated Supabase claims rather than trusting page or proxy state.
- **SEC-003**: Accept only HTTP(S) site URLs from configured environment values and keep the service-role credential server-only.
- **CON-001**: Do not add database migrations, dependencies, or Phase 3 roadmap completion changes.
- **GUD-001**: Match the existing warm editorial login surface with visible labels, 44-pixel controls, inline status feedback, password visibility controls, and mobile-safe layout.
- **PAT-001**: Keep pure validation and initial-state values outside files marked `"use server"`; Server Action modules export async functions only.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish reusable validated password-recovery contracts.

| Task     | Description                                                                                                                        | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Add `src/lib/auth/password-reset.ts` with normalized email, password confirmation, and trusted recovery callback helpers.          | ✅        | 2026-07-17 |
| TASK-002 | Add `src/app/reset-password/actions.ts` with account-neutral recovery request handling and authenticated password update handling. | ✅        | 2026-07-17 |
| TASK-003 | Extend `src/app/auth/confirm/route.ts` only as needed to preserve safe recovery redirects and actionable failure routing.          | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Deliver an accessible reset-request and new-password experience.

| Task     | Description                                                                                                                               | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Add the public `/reset-password` Server Component and client request form with loading, success, and error states.                        | ✅        | 2026-07-17 |
| TASK-005 | Add the authenticated `/reset-password/update` Server Component and client form with confirmation and password visibility controls.       | ✅        | 2026-07-17 |
| TASK-006 | Link the login password field to the reset page, render post-reset confirmation, and add responsive auth styles in `src/app/globals.css`. | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Verify the complete recovery boundary without sending unsolicited production email.

| Task     | Description                                                                                                                                               | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Add `scripts/verify-password-reset.ts` and `verify:password-reset` for validation, callback safety, route markup, and Server Action export assertions.    | ✅        | 2026-07-17 |
| TASK-008 | Run focused verification, formatting, ESLint, strict TypeScript, production build, existing authentication HTTP smoke, and relevant collaboration checks. | ✅        | 2026-07-17 |
| TASK-009 | Finalize this plan and the structured session change log after all checks pass.                                                                           | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Handle recovery entirely in a browser Supabase client. Rejected because the configured public key is documented as stale and the application already uses cookie-backed SSR Auth.
- **ALT-002**: Build a custom password-reset token table. Rejected because Supabase Auth already provides expiring, single-purpose recovery links and session validation.
- **ALT-003**: Expose the update form to any unauthenticated request and rely on the mutation to fail. Rejected because the page should explain expired or invalid recovery links before accepting a password.

## 4. Dependencies

- **DEP-001**: Existing `@supabase/ssr@0.12.3` and `@supabase/supabase-js@2.110.7` cookie-backed server client.
- **DEP-002**: Existing `/auth/confirm` PKCE and token-hash exchange route.
- **DEP-003**: Existing BoardPrep auth layout, design tokens, and Lucide icon package.

## 5. Files

- **FILE-001**: `src/lib/auth/password-reset.ts` — recovery validation and redirect contracts.
- **FILE-002**: `src/app/reset-password/actions.ts` — request and update Server Actions.
- **FILE-003**: `src/app/reset-password/page.tsx` and `reset-password-form.tsx` — public request flow.
- **FILE-004**: `src/app/reset-password/update/page.tsx` and `update-password-form.tsx` — authenticated password update flow.
- **FILE-005**: `src/app/login/page.tsx` and `login-form.tsx` — reset entry and completion feedback.
- **FILE-006**: `src/app/auth/confirm/route.ts` and `src/app/globals.css` — recovery failure routing and auth styling.
- **FILE-007**: `scripts/verify-password-reset.ts` and `package.json` — focused verification command.

## 6. Testing

- **TEST-001**: Reject malformed email input and normalize valid email addresses.
- **TEST-002**: Reject passwords shorter than 8 characters, longer than 128 characters, or mismatched confirmation values.
- **TEST-003**: Build a callback only from configured HTTP(S) origins and preserve the fixed safe update path.
- **TEST-004**: Assert reset/update forms expose visible labels, correct autofill values, status regions, and password visibility controls.
- **TEST-005**: Assert the update action validates trusted claims before calling `updateUser` and that action files export no non-function runtime values.
- **TEST-006**: Confirm `/reset-password` returns 200 and `/reset-password/update` rejects an unauthenticated request.

## 7. Risks & Assumptions

- **RISK-001**: Supabase must allow the `/auth/confirm` redirect URL and have an operational SMTP provider; the UI cannot override hosted dashboard configuration.
- **RISK-002**: Supabase’s default email service is rate-limited and intended only for trial use; production should use custom SMTP.
- **ASSUMPTION-001**: Existing recovery templates use either PKCE `code` redirects or `token_hash` recovery links, both already handled by `/auth/confirm`.
- **ASSUMPTION-002**: Requiring 8–128 characters is compatible with the application’s existing 8-character minimum and the configured Supabase policy.

## 8. Related Specifications / Further Reading

- [Supabase password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [BoardPrep security guidance](../.agents/SECURITY.md)
- [BoardPrep design system](../.agents/DESIGN.md)

## 9. Verification Results

- `npm run verify:password-reset`, `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Existing Yjs, schema, room-management, version-history, offline-sync, and conflict-review verification suites passed.
- Browser acceptance passed at desktop and 375-pixel widths; invalid or expired update links returned to the request page with an alert, and no application-origin console warnings or errors were present.
- No recovery email was sent during verification.
