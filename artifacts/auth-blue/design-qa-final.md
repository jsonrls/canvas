# Qollab authentication design review

Status: ready — reviewed states have no unresolved P1/P2 design defects.
Date: 2026-09-15. Homepage review remains at
`artifacts/home-blue/design-qa-final.md`; its screenshots and style guide are
preserved.

## Result and design decisions

Login, signup, and password recovery follow the saved blue design system:
cream canvas, focused white form, Inter Tight typography, blue actions, and a
quiet desktop companion using the existing study artwork. Mobile hides the
companion and presents the form first with natural page scrolling. The former
fabricated live-room preview is removed. Native inputs are retained inside
Astryx Field to preserve their existing platform attributes and behavior.

## Evidence inspected directly

- `artifacts/auth-blue/signup-desktop.png`: initial desktop composition and
  original submit-text contrast defect.
- `artifacts/auth-blue/signup-desktop-final.png` and `login-desktop-final.png`:
  final desktop layout, corrected submit contrast, clear form/companion hierarchy.
- `artifacts/auth-blue/reset-desktop-error.png`: desktop recovery with readable
  error and corrected white submit label/icon.
- `artifacts/auth-blue/login-mobile.png` and `login-mobile-reveal.png`: 320px
  login and password reveal control; no visible layout shift.
- `artifacts/auth-blue/reset-mobile-error.png`: 320px recovery with long error,
  readable explanation, visible submit, and return link.
- `artifacts/auth-blue/signup-mobile.png` and `signup-mobile-bottom.png`: 320px
  signup fields, password help, submit, account switch, and naturally scrollable
  bottom content.
- Shared AuthShell, LoginForm, ResetPasswordForm, and UpdatePasswordForm source:
  labels/IDs, autocomplete, existing validation constraints, hidden next value,
  reveal semantics, error alerts, pending controls, and success-toast wiring.

## Defects resolved

1. P2: submit text/icons inherited black on blue. All three form submit buttons
   now explicitly use on-accent text. White label/icon is verified in mobile
   signup/login and desktop/mobile recovery captures.
2. P2: error text on muted error background calculated only 4.29:1. All three
   forms now use primary ink on the muted error surface, preserving role alert
   and messages. Desktop/mobile recovery captures confirm the readable result.

The alert uses Text with role alert and explicit tokens rather than Banner.
This is accepted because it retains persistent semantic error feedback and the
existing action messages without adding a parallel error-state abstraction.
Input boundaries and form hierarchy are visually clear in inspected evidence.

## Browser/verification findings reported by orchestrator

- No horizontal overflow in inspected mobile routes; inputs measure 44px high.
- Password reveal changes input type and aria-pressed; hiding reverses both.
- Empty signup submission focuses the invalid display-name field.
- Keyboard navigation reaches email then password with a blue native focus
  outline; browser error logs are empty.
- Custom next destination persists through hidden input and signup switch link.
- Unauthenticated reset completion redirects to the existing invalid/expired
  recovery error state rather than exposing the protected form.
- Authentication action, callback, and recovery guard hashes remain unchanged.
- Lint, typecheck, and password-reset verifier pass; production build is tracked
  separately by the orchestrator.

These checks were reported by the orchestrator, not independently rerun by
Design. Source and screenshots do not establish full accessibility compliance.

## Limits and optional polish

Protected reset completion was reviewed in source only; no valid recovery
session was supplied. Live email delivery, completed account creation/sign-in,
password changes, pending network states, and success toasts were not exercised
by Design. No real account changes or credentials were used for visual review.
These are verification limits, not observed regressions.

P3: signup placeholders clip at 320px. Visible labels and complete password help
remain intact, so the task stays understandable. Shorter future placeholders
could improve polish without changing validation.

## Handoff

Completed: shared auth specification and desktop/mobile review; both identified
contrast defects are resolved. No further design change is required for reviewed
states. Recommended next role: orchestrator. Complete the remaining integration
checks, report the protected/live-auth verification limits, and deliver.
