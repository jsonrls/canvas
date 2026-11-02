# MorphIcons migration design review

Status: ready for reviewed icon behavior; no observed P1/P2 design defect.
Date: 2026-09-15.

Previous design reviews remain preserved at:
- `artifacts/home-blue/design-qa-final.md`
- `artifacts/auth-blue/design-qa-final.md`

## Scope and direct evidence

Reviewed `src/components/ui/icons.tsx`, stateful icon usage in login and password
reset forms, sampled room-state icon usages, and
`artifacts/morph-icons/login-mobile.png` against
`artifacts/auth-blue/login-password-inline.png`. Also compared
`artifacts/morph-icons/home-features.png` with
`artifacts/home-blue/desktop-features-final.png`: the four feature icons preserve
their geometry, blue color, stroke character, alignment, and surrounding layout.

The shared adapter uses Lucide geometry through MorphIcon, with `snappy` spring
and `reducedMotion="user"`. Named static exports preserve the same data shape;
stateful password visibility retains one AppIcon instance while its target data
changes. The surrounding button keeps its accessible name, aria-pressed, and
aria-controls. Icons remain decorative when the surrounding control names them.

The 390px login capture preserves the eye and arrow shapes, size/alignment,
blue/white contrast, inline reveal placement, and form geometry. The security
note was removed under separate authorization and is not an icon regression.
Static icons remaining still is intentional: motion indicates a state change,
not the mere presence of an icon on the page.

## Runtime evidence reported by orchestrator

- Password icon path changed from a 375-character canonical path to an
  intermediate 2846-character path, then settled to a 478-character final path.
  This establishes an intermediate morph rather than only endpoint replacement.
- Three rapid visibility toggles resolved to aria-pressed false and a masked
  password, consistent with the final control state.
- Reveal icon measured 18 × 18px inside the 44px control; submit icon measured
  17 × 17px. Observed SVGs remained aria-hidden; no overflow at 390px.
- All 87 named exports rendered successfully in an SSR check; first-party
  imports were migrated through the shared layer.
- A pure Node driver check stubbed matchMedia to reduced motion, then morphed
  Eye to EyeOff with the user policy: it settled immediately to the canonical
  EyeOff path and requested zero animation frames. This is isolated library
  policy coverage, not an OS/browser preference-toggle test.
- Lint, typecheck, password-reset verification, and production build passed.
  Homepage viewport showed no overflow and browser error logs were empty.

These checks are attributed evidence and were not independently rerun by Design.
Screenshots alone cannot establish animation timing or accessibility compliance.

## Verification limits

OS reduced-motion could not be emulated through the available browser API.
The wrapper's user-preference policy was verified in source and isolated driver
testing; behavior after an actual OS preference change was not tested. Authenticated panel/menu
interactions were not exercised live. No user-flow or layout change is approved
as part of this icon migration.

## Handoff

Completed: icon motion policy, source review, login appearance comparison, and
assessment of supplied runtime evidence. No required design fix remains in the
reviewed scope. Recommended next role: orchestrator. Complete integration/build
checks and deliver with the reduced-motion and authenticated-control verification
limits stated accurately.
