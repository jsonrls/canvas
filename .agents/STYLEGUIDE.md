# Qollab code style

Follow the root `AGENTS.md` and [DESIGN.md](./DESIGN.md). Preserve existing user
changes and behavior when refactoring. This guide describes current conventions,
not hypothetical libraries or directory structures.

## Organization

- Routes and request boundaries live in `src/app/`.
- UI lives under feature folders in `src/components/`; shared frame and controls
  live in `shell/` and `ui/`.
- Domain validation and pure models live in the corresponding `src/lib/` feature.
- Browser lifecycle hooks stay close to their feature or in `src/hooks/` when
  shared across workspaces.
- Node collaboration runtime modules live in `server/`.
- Keep files focused on one responsibility. Split substantial views, pure
  calculations, and resource lifecycles; do not create a generic framework or
  replace a giant component with an equally giant hook.

## TypeScript and React

Use descriptive names, explicit object shapes, discriminated unions, and bounded
validation at external-data boundaries. Prefer type-only imports for shared
contracts. Mark server-only data modules explicitly. Do not add broad `any`
casts or weaken strict checking to hide refactor errors.

Use function components and feature-local state. Effects synchronize external
resources; event handlers perform user actions. Effects must release listeners,
timers, observers, providers, documents, and pending async work. A late async
result must not revive a disposed connection or overwrite a newer request.

Preserve stable document ownership across reconnects and avoid moving
high-frequency pointer state into application-wide context. Keep PDF, whiteboard,
and AI dependencies dynamically loaded. Parallelize independent reads, but
serialize writes to the same durable resource.

## UI and styling

Read installed Next documentation and perform the Astryx discovery workflow
before UI changes. Use the shared shell, Astryx layout components, and semantic
token utilities. Import buttons and icons through the project's shared controls.
Do not introduce raw layout wrappers, static inline styles, hardcoded brand
colors, or new component CSS modules. Use renderer-specific CSS only for the
exceptions documented in DESIGN.md. Theme values belong in
`theme/qollab-workshop.ts`, not component-local color tables.

Preserve accessible names, keyboard operation, visible focus, touch targets,
responsive scroll ownership, and explicit loading/error/read-only states. A
passing source-string assertion does not prove these behaviors.

## Errors and logging

Validate untrusted values before use. Surface actionable user errors without
leaking provider bodies or secrets. Log structured event names and safe diagnostic
metadata at important boundaries. Never log tokens, request URLs containing
tokens, passwords, collaborative content, or private account details. Persistence
and shutdown failures must be observable and must not report success.

## Verification

Use the installed Node assertion/tsx verification pattern. Test observable outputs
and failure behavior, not implementation spelling. Keep static checks for genuine
policies such as client/server boundaries or shared-button usage, and identify
them as static checks. See TESTING.md for local versus hosted test scope.

Run formatting on changed files, lint, strict TypeScript, relevant behavioral
checks, and the production build. Repeat checks after changes affecting their
results. Do not claim browser, accessibility, scale, or hosted-service verification
without performing it.
