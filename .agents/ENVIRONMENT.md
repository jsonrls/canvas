# Qollab development environment

Use Node.js 20.9 or later and npm. Dependency versions are locked in
`package-lock.json`; use `npm ci` for a reproducible install. Supabase CLI is a
project dev dependency and is invoked with `npx supabase`, not a global install.

## Setup

From the repository root:

```bash
npm ci
cp .env.example .env
npm run theme:build
```

Fill in the project values in `.env` using `.env.example` as the authoritative
variable list. Keep service-role and provider keys server-only. Database pooler
credentials are needed by the schema verifier, not normal application requests.
Use a dedicated development Supabase project for integration checks.

Link and apply migrations only to the intended development project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Those commands modify the selected hosted project. A local Docker-backed Supabase
stack is optional and is not required by the default development workflow.

## Run

```bash
npm run dev:all
```

This starts Next.js on port 3000 and the standalone Yjs service on port 1234.
`npm run dev` and `npm run dev:yjs` run either process independently. Configure
`NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234` for the standalone service. If the web
port is occupied, use `npm run dev -- -p 3001` and align origin/callback settings;
do not terminate an unrelated process merely to free the default port.

On Vercel, omit `NEXT_PUBLIC_YJS_WS_URL` so the application uses its same-origin
cookie-authenticated collaboration route. See the README for deployment settings.

## Local checks

```bash
npm run verify:workspace
npm run theme:check
npm run lint
npm run typecheck
npm run format:check
npm run build
```

See [TESTING.md](./TESTING.md) for behavioral and hosted checks. There are no
`lint:fix`, `format`, `type-check`, `test:unit`, or `analyze` scripts unless they
are explicitly added to `package.json`. Use the installed ESLint/Prettier CLI for
intentional fixes rather than assuming those commands exist.

## Generated and private files

`theme/qollab-workshop.ts` is editable source. Rebuild its canonical generated
artifacts with `npm run theme:build`; never edit numbered copies. `.next/` is
reproducible Next output. If `verify:workspace` reports duplicate files such as
`routes.d 2.ts`, preserve needed copies outside the checkout and regenerate the
output after stopping the relevant dev process. Do not exclude conflicting
TypeScript declarations just to make a check pass.

Numbered files are consistent with filesystem copy/sync conflicts, but the
origin of the copies in this checkout has not been established. Avoid syncing
build/cache directories between machines; the hygiene check detects recurrence.

`.env*` (except `.env.example`), `capacity-results/`, and `supabase/.temp/` are
local state and ignored. Capacity fixtures can contain generated account
passwords. Never attach them to a report, print them in logs, or commit them.
Removing CLI state from Git tracking does not remove the local files.

## Troubleshooting

- Preserve the lockfile when investigating dependencies; start with `npm ci`.
- Check the actual WebSocket process and configured endpoint when sync fails.
- Run `npm run theme:build` after theme edits, then `npm run theme:check`.
- Inspect the specific failing verifier before supplying credentials or running
  it against a hosted database.
- Do not assume CI, Sentry, Redis, or performance monitoring is configured. See
  [ARCHITECTURE.md](./ARCHITECTURE.md) for the current implementation.
