# Halid redesign pre-migration baseline

Captured on 2026-08-30 before production redesign files were changed. The
command results below are the already-audited baseline recorded in
[`plan/design-halid-astryx-redesign-1.md`](../../plan/design-halid-astryx-redesign-1.md#recorded-pre-migration-baseline).
They were not rerun to create this document.

## Dirty-tree warning

The worktree was already extensively modified and untracked before this design
foundation was documented. Every existing change is user-owned and
authoritative. Do not stage, reset, clean, reconstruct from `HEAD`, or delete a
style source until its route-by-route replacement is verified.

The following `git status --short` snapshot was captured immediately before
writing `.agents/DESIGN.md` and this baseline, so those documentation changes do
not appear separately in the snapshot:

```text
 D .agents/knowledge/mistakes-build.json
 D .agents/knowledge/mistakes-deployment.json
 D .agents/knowledge/mistakes-index.json
 D .agents/knowledge/mistakes-logic.json
 D .agents/knowledge/mistakes-performance.json
 D .agents/knowledge/mistakes-runtime.json
 D .agents/knowledge/mistakes-security.json
 D .agents/knowledge/mistakes-testing.json
 D .agents/logs/changes-2024-01-15.txt
 D .agents/logs/changes-2026-07-17.txt
 D .agents/logs/changes-2026-07-18.txt
 D .agents/skills/change-logger/SKILL.md
 D .agents/skills/mistake-learner/SKILL.md
 M package-lock.json
 M package.json
 M plan/feature-collaborative-notes-vertical-slice-1.md
 M plan/feature-offline-editing-sync-1.md
 M plan/feature-password-reset-1.md
 M plan/feature-phase-3-study-tools-1.md
 M plan/feature-room-creation-management-1.md
 M plan/feature-secure-version-history-1.md
 M scripts/verify-breakout-rooms.mjs
 M scripts/verify-schema.mjs
 M src/app/globals.css
 M src/app/layout.tsx
 M src/app/login/login-form.tsx
 M src/app/login/page.tsx
 M src/app/page.tsx
 M src/app/reset-password/reset-password-form.tsx
 M src/app/reset-password/update/update-password-form.tsx
 M src/app/rooms/[roomId]/breakouts/actions.ts
 M src/app/rooms/[roomId]/breakouts/page.tsx
 M src/app/rooms/[roomId]/loading.tsx
 M src/app/rooms/[roomId]/page.tsx
 M src/app/rooms/actions.ts
 M src/app/settings/page.tsx
 M src/components/account/profile-panel.tsx
 M src/components/account/settings-panel.tsx
 M src/components/auth/sign-out-button.tsx
 M src/components/collaboration/ai-study-tool.tsx
 M src/components/collaboration/breakout-room-workspace.tsx
 M src/components/collaboration/collaborative-room.tsx
 M src/components/collaboration/conflict-review-panel.tsx
 M src/components/collaboration/pdf-study-tool.tsx
 M src/components/collaboration/rich-text-editor.tsx
 M src/components/collaboration/version-history-panel.tsx
 M src/components/collaboration/whiteboard-study-tool.tsx
 M src/components/rooms/breakout-room-directory.tsx
 M src/components/rooms/breakout-room-menu.tsx
 M src/components/rooms/room-settings.tsx
 M src/components/rooms/rooms-dashboard.module.css
 M src/components/rooms/rooms-dashboard.tsx
 M src/components/rooms/viewer-collaboration-toggle.tsx
 M src/components/ui/LoadingScreen.tsx
 M src/lib/breakout-rooms/repository.ts
 M src/lib/rooms/repository.ts
 M supabase/.temp/cli-latest
 M supabase/config.toml
?? .vscode/
?? AGENTS.md
?? CLAUDE.md
?? CONCURRENT_CAPACITY_TEST_PROMPT.md
?? PITCH.md
?? SAAS_OPPORTUNITY_VALIDATION.md
?? artifacts/
?? capacity-results/
?? design-qa.md
?? plan/design-halid-astryx-redesign-1.md
?? public/brand/qollab-logo-concept-v1.png
?? scripts/run-concurrent-capacity.mjs
?? scripts/verify-room-banners.mjs
?? src/app/home.module.css
?? src/components/account/settings-panel.module.css
?? src/components/rooms/room-banner-field.tsx
?? src/components/rooms/room-banner.module.css
?? src/components/ui/LoadingScreen.module.css
?? src/components/ui/toast.module.css
?? src/components/ui/toast.tsx
?? src/lib/room-banners/
?? supabase/migrations/20260823103431_add_room_banners.sql
?? supabase/migrations/20260829153136_add_breakout_room_descriptions.sql
?? theme/
```

## Audited command matrix

| Command                          | Baseline              | Disposition                                                                                                                       |
| -------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run theme:check`            | Pass                  | Theme source and generated artifacts agreed at audit time.                                                                        |
| `npx astryx doctor`              | Pass                  | Existing Astryx setup passed its diagnostic.                                                                                      |
| `npm run typecheck`              | Pass                  | No TypeScript error in the audited tree.                                                                                          |
| `npm run lint`                   | Pass                  | No lint error in the audited tree.                                                                                                |
| `npm run format:check`           | Pass                  | Configured formatting scope passed.                                                                                               |
| `git diff --check`               | Pass                  | No whitespace error in the audited diff.                                                                                          |
| `npm run verify:phase-3`         | Pass                  | Existing study-tool deterministic verifier passed.                                                                                |
| `npm run verify:phase-4`         | Pass                  | Existing AI deterministic verifier passed.                                                                                        |
| `npm run verify:password-reset`  | Known fail            | Stale BoardPrep string assertion in `scripts/verify-password-reset.ts`; update the assertion without weakening behavior.          |
| `npm run verify:account-profile` | Known fail            | Stale markup assertion in `scripts/verify-account-profile.ts`; update it to current behavior.                                     |
| `npm run verify:conflict-review` | Known fail            | Static PNG import reaches the Node verifier through `LoadingScreen.tsx`; remove that import during the planned loading migration. |
| `npm run build`                  | Intentionally not run | `prebuild` regenerates currently untracked theme artifacts. Run only after Phase 2 intentionally updates them.                    |

The three known failures predate the Halid migration and are not redesign
regressions. Environment-backed storage, Supabase, WebSocket, and deployment
checks require disposable credentials and are outside this local audited
matrix.

## Behavior and route inventory

The presentation migration must preserve this baseline surface:

| Surface             | Routes or states to preserve                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Public and auth     | `/`, `/login`, `/signup`, `/reset-password`, `/reset-password/update` and original `next` redirects                              |
| Room directory      | `/rooms`; joined/public grouping, create/join/leave, role-sensitive actions, room icon workflow                                  |
| Main workspace      | `/rooms/[roomId]`; Notes default, PDF, Whiteboard, AI, room switcher, presence, viewer collaboration, presentation, account menu |
| Breakouts           | `/rooms/[roomId]/breakouts` and `/rooms/[roomId]/breakouts/[code]`; isolated tools, code sharing, parent return, presence, Q&A   |
| Administration      | `/rooms/[roomId]/settings`, `/profile`, `/settings`; pending/error states, role checks, destructive confirmation                 |
| Collaboration state | Live sync, offline editing, reconnect, conflict review, version save/restore, presenter follow, sign-out cleanup                 |
| Global state        | Loading, empty, pending, success, warning, error, toast, Dialog, BottomSheet, and AlertDialog states                             |

Canonical visual QA viewports are 1710 × 883, 1200 × 633, 1024 × 768, and
390 × 844. Halid and Qollab are additionally compared at 1280 × 800. The
Phase 1 capture set is now complete:

- `reference-1280x800.png`
- `qollab-before-1280x800.png`
- `qollab-before-1710x883.png`
- `qollab-before-1200x633.png`
- `qollab-before-1024x768.png`
- `qollab-before-390x844.png`
- `reference-vs-qollab-before-1280x800.png`

Post-foundation production captures are recorded separately as
`qollab-foundation-production-1280x800.png`,
`qollab-foundation-production-390x844.png`, and
`reference-vs-qollab-foundation-1280x800.png`.

## Mutation guard

- Do not run `npm run build` merely as a baseline check.
- Do not hand-edit generated theme artifacts.
- Do not remove CSS or CSS modules until each importing route has a verified
  Astryx replacement.
- Do not change database, API, repository, authorization, storage, or Yjs
  contracts as part of the visual migration.
