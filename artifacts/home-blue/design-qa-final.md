# Qollab homepage design review

Status: ready — no P1 or P2 design defects found in the reviewed evidence.
Reviewed 2026-09-15 against `.agents/DESIGN.md` and the supplied reference.

## Result

The homepage is a coherent blue adaptation of the reference: compact navigation,
centered display headline, student collaboration artwork, spacious feature grid,
alternating neutral/white sections, prominent blue CTA, and dark wordmark footer.
Mobile navigation wraps without hiding destinations; the 390px hero keeps all
five portraits and both actions visible. The page uses Qollab's own content,
without unsupported pricing, metrics, testimonials, or integrations. This is a
reference-inspired redesign, not an exact clone of the low-resolution image.

## Evidence inspected directly

- `artifacts/home-blue/reference.png` — supplied 236 × 918 source.
- `artifacts/home-blue/desktop-hero-final.png` — clear centered hierarchy and blue actions.
- `artifacts/home-blue/desktop-features-final.png` — balanced two-column grid and readable copy.
- `artifacts/home-blue/desktop-workspace-polished.png` — coherent split section, improved heading breaks, and tool index.
- `artifacts/home-blue/desktop-footer-focus.png` — despite filename, shows the three steps and CTA.
- `artifacts/home-blue/desktop-footer-final.png` — legible blue CTA and dark footer.
- `artifacts/home-blue/mobile-390-final.png` — loaded mobile hero, wrapped navigation, intact artwork.
- `artifacts/home-blue/mobile-320-final.png` — readable stacked header/actions and intact artwork at narrow width.
- `artifacts/home-blue/mobile-features-final.png` — readable single-column feature panels at 320px.
- `artifacts/home-blue/login-mobile.png` — valid, legible mobile sign-in destination.
- `src/app/page.tsx` — single h1, named landmarks/sections, semantic links,
  skip link, explicit image dimensions and decorative alt, auth-aware actions,
  44px minimum control height, and surface-specific focus tokens.

Initial full-page screenshots (`desktop.png`, `desktop-initial.png`, `mobile.png`)
contain stitching/scale artifacts and duplicated sections absent from the source.
They are excluded from visual signoff. Initial viewport files also include
loading or stale scroll positions; use the final-suffixed evidence above.

## Verification reported by orchestrator

- No horizontal overflow at 1200px, 768px, 390px, or 320px.
- Explore workspace reaches `#workspace`; the study CTA reaches the login page.
- Header room action retains `/rooms`, redirecting guests to `/login?next=%2Frooms`.
- Footer keyboard focus measured as a white 3px outline.
- Build, lint, and typecheck pass; browser error logs are empty.
- Palette calculations: white on primary blue 5.17:1; text-accent on Soft Blue 5.95:1.

These are attributed checks, not independently rerun by Design. This review does
not claim screen-reader testing, full accessibility compliance, or authenticated
workspace regression coverage.

## Optional P3 polish

- Feature panels use restrained icons and text instead of the reference's richer
  tool illustrations. Future verified product imagery could add depth; do not
  fabricate screenshots or imply unavailable functionality.
- Put feature headings before supporting taglines if future copy changes aim to
  improve scanning. Existing panels remain readable and usable.

## Handoff

Completed: design specification, shared blue palette, saved reference/artwork,
and visual review. Preserve the compact authenticated app geometry, existing
fonts, and semantic status colors. No design blocker remains in inspected views.
Recommended next role: orchestrator for final integration and delivery. The loaded 320px hero/features and final polished workspace capture pass visual
review. No further design dispatch is required.
