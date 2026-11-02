@AGENTS.md

<!-- ASTRYX:START -->
Astryx v0.5.0 · 163 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: read `astryx docs layout` before writing any page or screen — page frame, region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   163 components by category
  template --list    page + block recipes
  docs <topic>       browser-support, cli-integrations, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->


<!-- BEGIN CLAUDE HANDOFF 2026-10-27 -->
# qollab: project handoff

Qollab: collaborative study workspace with notes, PDFs, whiteboard, and AI study tools; Next.js, Supabase, and Yjs.

Prepared from local documentation, manifests, and directory structure on 27 October 2026. This is onboarding context, not proof that builds, integrations, or deployments work. Prior chat history is not included.

## Read first

- `AGENTS.md`
- `.agents/AGENTS.md`
- `README.md`
- `.agents/DESIGN.md`

Follow applicable AGENTS.md and nested instructions before editing. Preserve existing guidance above this section. If older documentation conflicts with current implementation, identify the discrepancy; do not discard security or workflow requirements.

## Source map

- `src/`
- `server/`
- `public/`
- `supabase/`
- `scripts/`
- `plan/`
- `theme/`

## Setup and checks

The following scripts are declared in local manifests; they were not executed for this documentation update. Read their bodies and lifecycle hooks before running them, especially integration tests and operations that can access hosted services. Use the package manager and lockfile already chosen by the project.

### `package.json`

Declared dependencies: next 16.3.0, react 19.2.7, typescript 5.9.3, @supabase/supabase-js 2.110.7, yjs 13.6.31.

Lockfiles: `package-lock.json`.
Run from `.`: `dev`, `dev:all`, `start`, `build`, `lint`, `typecheck`, `format:check` (package script names).
Invoke a listed script with `npm run <script>`.
Lifecycle hook present: `prebuild`; inspect it before running the related command.
Lifecycle hook present: `pretypecheck`; inspect it before running the related command.

## Configuration and private data

Keep credentials, local environment values, databases, session files, and user data out of documentation and commits. Preserve existing environment files. Check local versus hosted targets before starting services or tests.

- `.env.example`: variable names include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_POOLER_HOST`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_YJS_WS_URL`, `YJS_HOST`, `YJS_PORT`, `OPENAI_API_KEY`.

## Continuation notes

Preserve owner/editor/viewer authorization, room isolation, and account-scoped offline data. Read .agents/AGENTS.md and established design guidance before UI changes.

Inspect current Git status before changes when repository metadata is available. Dated QA reports and plans are evidence to review, not proof that an issue is still open or already resolved. Confirm the next requested task with the user rather than inventing a backlog.

## Working agreement

- Determine the requested outcome from the current conversation and repository. A review request does not authorize implementation. Make routine choices independently; ask when missing information materially changes the result.
- Read affected files completely before editing. Preserve unrelated behavior, local changes, and existing security boundaries. Prefer simple, explicit code grouped by feature; reuse shared layouts and utilities instead of duplicating them.
- Use descriptive names and small-to-medium functions. Pass state explicitly. Comments should explain invariants, assumptions, or external requirements. Log useful boundary errors without exposing private data.
- Follow the project's platform and formatting conventions. Prefer full-file rewrites only when they preserve unrelated work and remain within scope.
- Run checks appropriate to the change and any applicable repository requirements. Test observable behavior; report what actually ran and what remains unverified.
- Obtain required authorization before destructive operations, deployment, publishing, merging, or external messages. Do not change global settings or install unrelated dependencies.
- Give concise progress updates. Finish with the outcome, verification, and remaining action. Use subagents only when explicitly authorized.

<!-- END CLAUDE HANDOFF 2026-10-27 -->
