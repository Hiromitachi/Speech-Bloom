# SpeechBloom

A premium, mobile-first speech therapy web app — Headspace/Calm style — with 16 exercises, guided sessions, R-sound practice, progress tracking, achievements, and a therapist dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/speechbloom run dev` — run the frontend (dynamic port via $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + Framer Motion
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: Signed cookie (`userId` cookie, `SESSION_SECRET` env var)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema.ts` — Drizzle DB schema (users, exercises, sessions, logs, achievements)
- `lib/api-client-react/src/` — generated React Query hooks + custom fetch
- `artifacts/api-server/src/` — Express API server with routes
- `artifacts/speechbloom/src/` — React frontend (pages, components)

## Architecture decisions

- Cookie-based auth (not JWT): signed `userId` cookie via `cookie-parser` + `SESSION_SECRET`. No accounts needed — enter email to create/sign in.
- Contract-first API: OpenAPI spec drives codegen. Always edit `openapi.yaml` first, then run codegen.
- `credentials: 'include'` in `lib/api-client-react/src/custom-fetch.ts` — required for cookies to be sent cross-origin via the Replit proxy.
- React Query retry disabled for 401/403/404 to avoid spinner delays during auth checks.
- Google Fonts (`Nunito`) loaded via `<link>` in `index.html`, NOT as CSS `@import` (PostCSS rejects it).

## Product

- **Login**: email-based sign in / account creation (no password)
- **Onboarding**: 4-step flow — welcome, goals, daily minutes, confirmation
- **Dashboard**: streak card, quick actions, daily quote, recent achievements
- **Exercises**: 16 speech therapy exercises (articulation, fluency, voice, etc.)
- **R-Sound Practice**: dedicated R-sound drill with phoneme cards
- **Session**: guided timer-based session experience
- **Progress**: weekly charts, session history, stats
- **Achievements**: 10 unlockable achievements with progress tracking
- **Therapist Dashboard**: patient management and progress overview

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT add `@import url(...)` in CSS files — use `<link>` in `index.html` for web fonts.
- Always run `pnpm --filter @workspace/api-spec run codegen` after editing the OpenAPI spec.
- Run `pnpm run typecheck:libs` after editing any `lib/*` package before leaf artifact checks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
