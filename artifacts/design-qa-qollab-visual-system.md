# Design QA — Qollab visual-system redesign

## Scope

- Source visual truth: `/var/folders/sc/ytyq1pp961j1ccy5gzb7gd0c0000gn/T/codex-clipboard-3yejBD.png`
- Canonical implementation state: `/login`, signed out, empty email and password fields
- Canonical viewport: 1710 × 883 CSS pixels
- Additional coverage: public landing page at 1710 × 883 and 390 × 844; login, signup, and password-reset states at 390 × 844

## Density normalization

- The source artifact is 3420 × 1766 physical pixels and represents a 1710 × 883 CSS-pixel viewport at 2× density.
- The implementation artifact is 1710 × 883 physical pixels at 1× density.
- The source was downsampled to 1710 × 883 before comparison. This avoids treating device-pixel density as a layout-scale mismatch.

## Evidence

- Implementation screenshot: `artifacts/qollab-login-implementation-1710x883.png`
- Full-view side-by-side comparison: `artifacts/qollab-login-comparison-1710x883.png`
- Focused auth-form comparison: `artifacts/qollab-login-form-comparison.png`
- Focused room-preview comparison: `artifacts/qollab-login-room-comparison.png`
- Landing-page desktop capture: `artifacts/qollab-home-desktop-1710x883.png`
- Landing-page desktop full-page capture: `artifacts/qollab-home-full.png`
- Landing-page mobile capture: `artifacts/qollab-home-mobile-final.png`
- Landing-page mobile full-page capture: `artifacts/qollab-home-mobile-full.png`
- Login mobile capture: `artifacts/qollab-login-mobile.png`

The full comparison was inspected at original resolution. The focused comparisons preserve readable type, control borders, shadows, grid lines, participant avatars, and the study-room card geometry, so the details that matter are not hidden by an overview-scale image.

## Pass history

### Pass 0 — invalid scale comparison

An initial capture used a 2048 × 1058 CSS viewport while the source was interpreted at its physical dimensions. This produced an apparent frame-scale mismatch. Metadata inspection established that the supplied source is a 2× capture, so that comparison was discarded rather than recorded as an implementation defect.

### Pass 1 — normalized canonical comparison

The source was normalized to 1710 × 883 and the implementation was recaptured at the same CSS viewport and signed-out state. The split-frame proportions, warm canvas, cobalt grid field, display typography, form rhythm, radii, shadows, and study-room preview are aligned. No actionable P0, P1, or P2 visual differences remain.

## Findings

- P0: none
- P1: none
- P2: none
- P3: Brave's installed extensions inject `cz-shortcut-listen` and a crypto-provider script into the page, which can trigger a development-only hydration warning and the Next.js issue badge. These are browser chrome/injected markup, not app-owned visual or runtime defects, and are excluded from the source comparison.

## Interaction and responsive verification

- Landing primary CTA navigates to `/login`.
- Landing account CTA navigates to `/signup`.
- Landing workspace CTA scrolls to `#workspace`.
- Password visibility toggles between masked and visible states and updates `aria-pressed`.
- Login, signup, and password-reset pages have no horizontal overflow at 390 × 844.
- Landing CTAs meet a 52-pixel mobile height; the compact header CTA is 42 pixels high.
- Protected room, profile, settings, breakout, and room-settings URLs redirect signed-out visitors to `/login` with a preserved `next` value.
- No app-owned browser console errors were observed in the verified states.

## Static verification

- `npm run typecheck`: passed
- `npm run lint`: passed
- Prettier check for all touched source styles/components: passed
- `git diff --check`: passed

## Final result

passed
