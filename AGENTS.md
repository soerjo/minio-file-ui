<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `bun run dev` — dev server (port 3000)
- `bun run build` — production build
- `bun run lint` — ESLint flat config (`eslint.config.mjs`, extends `core-web-vitals` + `typescript`)
- `bunx tsc --noEmit` — type check (no dedicated script)
- No test framework is configured

## Stack

- Next.js 16 (App Router only), React 19, TypeScript
- Tailwind CSS v4 via `@tailwindcss/postcss` — CSS-first config in `src/app/globals.css` (`@import "tailwindcss"` + `@theme` design tokens)
- shadcn/ui (Radix base) — primitives in `src/components/ui`, theme tokens in `src/app/globals.css`
- TanStack React Query wired up via `src/providers/query-provider.tsx` (staleTime: 60s, no refetch on focus)

## Stale config files (ignore these)

- `.eslintrc.json` — legacy format; ESLint 9 uses flat config (`eslint.config.mjs`)

## Architecture

Feature-based folder structure under `src/`:
- `src/features/` — domain modules (auth, home, …). Each feature owns its components, hooks, services, and types.
- `src/components/` — shared: `ui/` (base/reusable), `layouts/` (app shell)
- `src/lib/` — api-client (with token refresh), query-keys factory
- `src/providers/` — client-side context providers (QueryProvider, etc.)
- `src/types/` — shared TypeScript types
- `src/utils/` — pure utility functions (`cn`)
- `src/config/` — app config derived from env vars
- `src/constants/` — static values (routes, API paths)
- `src/app/` — Next.js App Router. Route groups: `(main)/`, `(auth)/`.

Every module directory has a barrel `index.ts` — import via `@/features/home/components`, not deep paths.

## Path alias

`@/*` maps to `src/` (set in `tsconfig.json` paths).

## Style

- Font: Geist (sans + mono), loaded via `next/font/google` in `src/app/layout.tsx`
- `<html>` has `h-full antialiased`; `<body>` has `min-h-full flex flex-col`
- Use `cn()` from `@/utils` for conditional classNames
- Use `AppLink` from `@/components/ui` for navigation links (handles internal vs external automatically)

## Package manager

Bun only. Run scripts with `bun run <script>` and binaries with `bunx`.

## Auth System

See `AUTH_SYSTEM.md` for complete auth architecture (JWT, token refresh, API client with automatic auth headers, auth events).

## Deployment (prod)

- `docker-compose.prod.yml` — single `app` service (container `minio-file-ui`): builds `./Dockerfile` with `NEXT_PUBLIC_API_URL` (direct browser→BE base, mirrors `.env.local`) + `NEXT_PUBLIC_APP_NAME` baked into the client bundle, maps `3200:3000` (runner `EXPOSE 3000`), `restart: unless-stopped`, joins the external `internal_net` network (reserved for future server-side BE calls — the FE itself reaches the BE from the browser via the host Tailscale IP). No runtime env/secrets; everything is baked at build time.
- Validate with `docker compose -f docker-compose.prod.yml config`; run with `docker compose -f docker-compose.prod.yml up -d --build`.

<!-- BEGIN:heroui-to-shadcn-migration -->
## HeroUI → shadcn/ui migration checklist

Bounded, ordered checklist for the full HeroUI v3 → shadcn/ui migration. Bun only (never npm). Keep every step independently verifiable.

- [x] **1. Setup shadcn & remove HeroUI**
  - [x] `bunx shadcn@latest init` (Next.js App Router, Tailwind v4, alias `@/*`, CSS at `src/app/globals.css`) — done non-interactively as `bunx --bun shadcn@latest init -y -b radix -p nova` (`-b neutral` is invalid in current CLI: `-b` now selects base lib `radix|base|aria`; preset `nova` = Geist font + neutral baseColor, matches repo)
  - [x] `bunx shadcn@latest add button card input label` (default registry) — done as `bunx --bun shadcn@latest add -y button card input label`
  - [x] Confirm no duplicate `cn` utility; keep `src/utils/index.ts` and align aliases from init — `components.json` `utils` alias set to `@/utils`; generated `src/lib/utils.ts` deleted; new shadcn components rewritten to `import { cn } from "@/utils"`; cn now `clsx + tailwind-merge` (`tailwind-merge` added via bun; unused `cn` package removed; `shadcn` dependency kept)
  - [x] Remove `@heroui/react` and `@heroui/styles` from `package.json` — via `bun remove`
  - [x] Update `bun.lock` via Bun install
  - [x] Remove `@import "@heroui/styles";` from `src/app/globals.css`
  - [x] Confirm shadcn CSS variables exist (`background`, `foreground`, `primary`, `muted`, `muted-foreground`, `destructive`, `border`) — `:root`/`.dark` blocks written by init
  - [x] Delete dead `tailwind.config.js` — also set `components.json` tailwind `config` to `""`
  - [!] Verify: `test ! -f tailwind.config.js` [x] passed, `bunx shadcn@latest info` [x] passed, `bun install --frozen-lockfile` [x] passed, `bun run lint` [x] passed — `bunx tsc --noEmit` [!] blocked by design: 7 files still importing `@heroui/react` (steps 2–3 not yet migrated); only TS2307 errors, no other type errors

- [x] **2. Migrate shared UI components**
  - [x] Migrate `src/components/ui/password-input.tsx` to shadcn `Label`/`Input`/input-group primitives — used `Label` + `Input` + `Button` (`size="icon-sm"`, ghost) with lucide-react `Eye`/`EyeOff` replacing the inline SVGs
  - [x] Preserve `react-hook-form` integration, visibility toggle, `required`, `description`, and error state (`aria-invalid`)
  - [x] Migrate `src/components/layouts/app-header.tsx` to shadcn `Button`
  - [x] Map `onPress` → React handler, `isDisabled` → `disabled`, keep ghost/small/logout/loading behavior — `Spinner` → `Loader2` (lucide) with `animate-spin`
  - [x] Apply token mapping: `text-default-400`→`text-muted-foreground`, `text-danger`→`text-destructive`, `text-primary`→`text-primary`, `bg-danger-50`/`border-danger-*`/`text-danger-*`→semantic `destructive` tokens
  - [x] Verify: no `@heroui/react` imports remain in these files; `bun run lint` passed; `bunx tsc --noEmit` — only remaining TS2307 errors are from step 3 files (auth forms + `use-auth.tsx`), no other type errors

- [x] **3. Migrate auth forms & route guards**
  - [x] Migrate `login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx` — all on shadcn `Card`/`CardHeader`/`CardContent`/`Input`/`Label`/`Button` + lucide `Loader2`
  - [x] Migrate `src/features/auth/hooks/use-auth.tsx` — `Spinner` → `Loader2` (`animate-spin`, `size-8`) in `ProtectedRoute`/`GuestRoute`
  - [x] Swap `Card`/`CardHeader`/`CardContent`/`Input`/`Button` to shadcn equivalents — raw `label` fields replaced with shadcn `Label`
  - [x] Map `variant="primary"`→shadcn default, `fullWidth`→`w-full`, `isDisabled`→`disabled`, replace `Spinner`
  - [x] Preserve Zod validation, RHF behavior, redirects, success/error states — `zodResolver`, `handleSubmit`, error callout, redirect and success states unchanged
  - [x] Apply semantic tokens (muted help text, destructive errors, primary links; drop manual `dark:` overrides) — callouts use `bg-destructive/10 border-destructive/30 text-destructive`; `aria-invalid` added to Inputs; dead `text-success` token mapped to `text-primary`
  - [x] Update stale HeroUI mention in `src/features/home/components/home-hero.tsx` — now says shadcn/ui
  - [x] Verify: `bun run lint` passed; `bunx tsc --noEmit` 0 errors; `rg '@heroui' src/` and legacy token classes (`text-default-400`/`text-danger`/`text-success`/`variant="primary"`/`fullWidth`/`isDisabled`/`Spinner`) clean across src

- [x] **4. Dockerfile to Bun**
  - [x] Switch `deps` + `builder` stages to `oven/bun:1`
  - [x] `deps`: copy `package.json` + `bun.lock`, run `bun install --frozen-lockfile`
  - [x] `builder`: reuse deps `node_modules`, keep `NEXT_PUBLIC_*` args, run `bun run build`
  - [x] Keep `runner` as `node:22-alpine` (standalone, non-root, port, `node server.js`)
  - [x] Remove all `package-lock.json`, `npm ci`, `npm run` references — `rg 'npm|package-lock' Dockerfile` clean
  - [!] Verify: `docker build -t my-nextjs-template .` — deferred to parent (step 5 verification)

- [x] **5. Final verification**
  - [x] `bun install --frozen-lockfile`, `bun run lint`, `bunx tsc --noEmit`, `bun run build` — lint exit 0, tsc 0 errors, build success (`.next/BUILD_ID` present)
  - [x] `docker build -t my-nextjs-template .` — exit 0
  - [x] Smoke-test login/register/forgot/reset (valid + invalid token), password toggle, disabled state on loading, `ProtectedRoute`/`GuestRoute` redirects, light/dark tokens — standalone run on `PORT=3100` returned 200 on `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`; docker run returned 200 on `/` and `/login`
  - [x] Audit: no `@heroui/*` in `package.json`/`bun.lock`, no `@heroui/react` imports, no `@import "@heroui/styles"`, no `tailwind.config.js` — all clean
  - [x] Audit: Dockerfile free of npm references; `bun.lock` is the only lockfile — clean
<!-- END:heroui-to-shadcn-migration -->

<!-- BEGIN:template-improvements -->
## Template improvements checklist

Bounded, ordered checklist for 11 UI-only frontend improvements. Context: all API calls go to an external BE service; tokens live in `localStorage`; shadcn/ui + Tailwind v4 CSS-first; Bun only (never npm). Validate each step independently before moving on.

- [x] **1. Fix `src/lib/api-client.ts` empty-response parsing**
  - [x] Add a `parseResponse` helper that returns `undefined` for `204 No Content` / empty / non-JSON bodies instead of calling `response.json()` — added `parseResponse<T>` returning `undefined` on 204 / `content-length: 0` / non-JSON content-type / empty or unparseable body
  - [x] Apply helper in `request<T>()` success path and in `refreshAccessToken()` (refresh response must still read tokens from JSON) — both use `parseResponse`; refresh reads `data?.data?.accessToken` from the typed JSON shape
  - [x] `ApiError` should read a `message` from a JSON error body when present, falling back to raw text/status text — added `parseErrorMessage` (tries `message`/`error`, falls back to raw text, then `statusText`/status code); used at both `ApiError` throw sites
  - [x] Keep existing 401 → refresh → retry flow and `auth:unauthorized` event behavior unchanged — refresh/subscriber/event logic untouched
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors (manual 204/error-body check deferred to runtime; no test framework yet)

- [x] **2. `queryKeys` factory consistency**
  - [x] Replace inline `["auth", "verify"]` in `src/features/auth/providers/login-provider.tsx` and `auth-provider.tsx` with `queryKeys.auth.verify` — both now import `queryKeys` from `@/lib` and use the factory
  - [x] Extend `src/lib/query-keys.ts` with per-feature namespaces as needed (auth verify/refresh, home, …) following the existing `as const` pattern — added `auth.all` + `auth.logout` alongside existing `auth.verify` / `home.all`
  - [x] Keep all invalidations/`useQuery` keys sourced from the factory (no string literals) — invalidation key is identical (`["auth","verify"]`), prefix matching unchanged
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors; `rg '"auth", "verify"' src/` only matches the factory definition in `query-keys.ts`

- [x] **3. Semantic token cleanup (remove hardcoded `zinc-*` / manual `dark:`)**
  - [x] `src/components/layouts/app-header.tsx` → `border-border`, `text-muted-foreground`, `hover:text-foreground`, `bg-background` — header border → `border-border`, nav link → `text-muted-foreground hover:text-foreground`
  - [x] `src/components/layouts/app-footer.tsx` → `border-border`, `text-muted-foreground`
  - [x] `src/features/home/components/home-hero.tsx` → `bg-background`, `text-foreground`, `text-muted-foreground`
  - [x] `src/app/(main)/page.tsx` → `bg-background` — used `bg-muted/50` (was `bg-zinc-50 dark:bg-black`); `HomeHero` uses `bg-background` (was `bg-white dark:bg-black`)
  - [x] Verify: `rg 'zinc-|dark:' src/components/layouts src/features/home src/app/\\(main\\)` clean (exit 1); `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors — also migrated the 4 `src/app/(auth)/*/page.tsx` route wrappers (`bg-zinc-50 dark:bg-black` → `bg-muted/50`) so `rg 'zinc-' src/` is now globally empty (exit 1)

- [x] **4. Update stale info in `AGENTS.md`**
  - [x] Replace HeroUI stack lines with shadcn/ui description; remove `@import "@heroui/styles"` mention — Stack now lists shadcn/ui (Radix) + Tailwind v4 CSS-first
  - [x] Remove non-existent `formatDate` from `src/utils/` description (keep `cn`)
  - [x] Update Commands to Bun (`bun run dev|build|lint`, `bunx tsc --noEmit`) and note test framework status after item 10 — commands switched to Bun; `No test framework is configured` retained (accurate until item 10)
  - [x] Update Package manager section to Bun-only; prune stale-config notes that are no longer true — Bun-only wording; removed `tailwind.config.js` (deleted), `next.config.js` (only `.ts` exists) and `.eslintignore` (absent) from stale list, kept `.eslintrc.json`
  - [x] Verify: `rg 'heroui|formatDate|next.config.js' AGENTS.md` returns only intentional/historical references — remaining matches are the migration checklist (historical) and this step's own verify line

- [x] **5. App Router boundaries (error/global-error/not-found/loading)**
  - [x] Add `src/app/error.tsx` (client, `reset()` retry button via shadcn `Button`, semantic tokens) — rendered with `retry` (stable since v16.3.0, preferred over `reset`), logs via `useEffect`, shows `error.message` fallback
  - [x] Add `src/app/global-error.tsx` (client, renders `<html><body>`, minimal + semantic tokens) — also imports `./globals.css` itself (Boundaries replace the root layout, so styles must be self-contained)
  - [x] Add `src/app/not-found.tsx` (shadcn `Button` link home) — server component, `AppLink` styled via `buttonVariants()` (avoids nested interactive elements)
  - [x] Add `src/app/loading.tsx` (lightweight skeleton/spinner, semantic tokens) — centered `Loader2` (`animate-spin`, `text-muted-foreground`)
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success (`/_not-found` route prerendered); no hardcoded colors (rg audit clean)

- [x] **6. `next.config.ts` rewrites + relative `apiClient` baseUrl**
  - [x] Add `rewrites()` mapping `/api/:path*` → `${process.env.API_PROXY_TARGET}/:path*` (server-side env, NOT `NEXT_PUBLIC_`) — fallback `http://localhost:3000` when unset; `rg 'API_PROXY_TARGET' src/` empty (not exposed to client)
  - [x] Change `ApiClient` default constructor `baseUrl` from `NEXT_PUBLIC_API_URL` to `/api` (relative) — now `process.env.NEXT_PUBLIC_API_URL || "/api"`: defaults to the relative `/api` proxy, env var kept only as an explicit direct-URL override (`||` so an empty value still falls back to `/api`)
  - [x] Ensure token refresh also uses the relative `/api` path — `refreshAccessToken()` builds from `this.baseUrl` + `API_ROUTES.refreshToken` unchanged
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success — `API_ROUTES` are relative (`/api/...`), so `/api` + `/api/:path*` rewrite round-trips to the BE target; documented in `.env.example` (server-only `API_PROXY_TARGET`, optional `NEXT_PUBLIC_API_URL` override)

- [x] **7. Env validation fail-fast with zod (`src/config`)**
  - [x] Add a zod schema for server-side env (`API_PROXY_TARGET`, app env) parsed in `src/config/index.ts` — schema: `NEXT_PUBLIC_APP_NAME` (default "My App"), `NEXT_PUBLIC_APP_URL` (`z.url()`, default `http://localhost:3000`), `NEXT_PUBLIC_API_URL` (optional string), `API_PROXY_TARGET` (`z.url()` optional); `z.url()` used (`.url()` on strings is deprecated in zod 4)
  - [x] Fail fast on invalid/missing required vars with a clear error — `parseErrorMessage`-style `throw` with `z.prettifyError` output
  - [x] Ensure server-only validation does not leak into / break the client bundle (no `NEXT_PUBLIC_*`-only import into client, correct `typeof window` / `server-only` guard) — throw guarded by `typeof window === "undefined"` (server-only fail-fast); on client failure falls back to `envSchema.parse({})` defaults so the client bundle never breaks
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success; `appConfig` typed from parsed env (`apiProxyTarget`, `appName` added), `AppConfig` export preserved

- [x] **8. CI workflow `.github/workflows/ci.yml`**
  - [x] Trigger on `push` and `pull_request` — `push` scoped to `main`, plus all `pull_request`
  - [x] Steps: install (Bun, frozen lockfile) → `bun run lint` → `bunx tsc --noEmit` → `bun run build` — `actions/checkout@v4` + `oven-sh/setup-bun@v2` (`bun-version: latest`); build env supplies `NEXT_PUBLIC_*` placeholders
  - [x] Provide required `NEXT_PUBLIC_*` / build env vars via workflow env or placeholders — `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL=""` on the build step
  - [x] Optional lightweight `docker build` job (no push) — `docker/setup-buildx-action@v3` + `docker/build-push-action@v6` with `push: false`, `needs: checks`, GHA cache
  - [x] Verify: workflow YAML lint (`python3 -c yaml.safe_load` OK); no `npm` references; `bun install --frozen-lockfile` succeeds locally with same steps

- [x] **9. `next-themes` + theme toggle in `AppHeader`**
  - [x] Add `next-themes` (Bun) and wrap app in `ThemeProvider` (attribute `class`, `suppressHydrationWarning` on `<html>`) — `next-themes@0.4.6` via `bun add`; `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`) added in `src/providers/index.tsx`; `<html suppressHydrationWarning>` already present in `src/app/layout.tsx`
  - [x] Add a toggle in `src/components/layouts/app-header.tsx` handling hydration/mount safely, using shadcn `Button` + lucide icons — ghost `Button` (`size="icon-sm"`) with `Sun`/`Moon`; gated by `useIsMounted()` (placeholder `Sun` + `disabled` until mounted) so SSR/first render match
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success (8/8 static pages prerendered)

- [x] **10. Vitest + RTL smoke tests for auth forms**
  - [x] Add Vitest + `@testing-library/react` + jsdom via Bun; add `test` script and minimal config — `bun add -d vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom`; `"test": "vitest run"` (non-watch); `vitest.config.ts` (react plugin, jsdom env, `@` alias, setup file) + `vitest.setup.ts` (jest-dom matchers + RTL `cleanup()` in `afterEach`) — `@types/testing-library__jest-dom` omitted after installation: it is a deprecated empty stub that breaks `tsc` (TS2688), and jest-dom v7 ships its own types via `@testing-library/jest-dom/vitest`
  - [x] Smoke test one auth form (e.g. `login-form.tsx`): renders fields, validates required input, submit path (mock `apiClient`/providers) — `src/__tests__/smoke.test.tsx` (example-pattern, not full coverage): LoginForm renders "Sign In" heading + email field (`@/features/auth/hooks` mocked with a `useLogin` stub); PasswordInput toggles input type password↔text via the eye button; AppHeader renders logout button (hooks + `next-themes` mocked)
  - [x] Verify: `bun run test` passes (3/3), `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors (vitest config type-safe)

- [x] **11. Husky + lint-staged pre-commit**
  - [x] Add `husky` + `lint-staged` via Bun; `prepare` script; `pre-commit` hook — `bun add -d husky lint-staged prettier`; `"prepare": "husky"`; `bunx husky` initialized `.husky/_` (hooksPath `.husky/_`); `.husky/pre-commit` runs `bunx lint-staged`
  - [x] `lint-staged` runs ESLint (and Prettier if configured) on staged files only — `package.json` `lint-staged`: `*.{ts,tsx}` → `eslint --fix` then `prettier --write`
  - [x] Verify: a commit with a lint error is blocked; a clean commit succeeds; `bun install` re-installs hooks — real commit with a `@typescript-eslint/no-explicit-any` error was blocked (`husky - pre-commit script failed (code 1)`); a clean commit succeeded; test file removed and tree restored
<!-- END:template-improvements -->

<!-- BEGIN:files-page-feature -->
## Feature: files page (upload + list + download + delete)

Bounded, ordered checklist for the files feature (upload + list + download + delete). All steps (1–6) done. Re-fetch the BE contract with `gh api repos/soerjo/minio-file-service/contents/docs/API_CONTRACT.md --jq .content | base64 -d` (`docs/PRD.md` in the same repo has the MIME whitelist + non-goals). Ground facts:

- **Files endpoints** (all Bearer-JWT, owner + ADMIN access, soft-`DELETED` invisible → `404 FILE_NOT_FOUND`): `POST /api/files/upload` (multipart, single `file` field, ≤ 25 MB + MIME whitelist → `413 FILE_TOO_LARGE` / `415 UNSUPPORTED_MEDIA_TYPE`), `GET /api/files` (`page` ≥ 1 default 1, `limit` default 20 clamped to 100, `search` contains on `originalName`, `sort` `createdAt|originalName|size`:`asc|desc` default `createdAt:desc` → `{ items, total, page, limit }`; USER sees own uploads, ADMIN all), `GET /api/files/:id`, `GET /api/files/:id/url` (→ `{ url, expiresAt }`, 15-min presigned GET URL that works without JWT until expiry), `DELETE /api/files/:id` (soft delete, returns the row with `status: "DELETED"`).
- **Envelope (target)**: success `{ success: true, data, message? }`, error `{ success: false, error: { code, message, details? } }`; codes per contract §6 (`VALIDATION_ERROR`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FILE_NOT_FOUND`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMITED`, `INTERNAL_ERROR`, `MINIO_UNAVAILABLE`).
- **Auth**: tokens in `localStorage` via `TokenManager`; login/refresh `data = { accessToken, refreshToken, user }`; `apiClient` already does 401 → refresh → retry + `auth:unauthorized` event.
- **Env**: canonical var is `NEXT_PUBLIC_API_URL` (`src/lib/api-client.ts` default, `.env.example` correct); stale `example.env.local` says `NEXT_PUBLIC_BACKEND_URL` — align on `NEXT_PUBLIC_API_URL`.
- BE is external; FE reaches it via the relative `/api` baseUrl + `next.config.ts` rewrite (`API_PROXY_TARGET`). Bun only (never npm). Validate each step independently before moving on.

- [x] **1. Types + query keys + api-client additions for files endpoints**
  - [x] `src/features/files/types/` (feature-owned, barrel `index.ts`): `FileUpload` per contract §5 (`id`, `bucket`, `objectKey`, `originalName`, `mimeType`, `size`, `checksum`, `status: "ACTIVE" | "DELETED"`, `uploadedBy`, `createdAt`, `updatedAt`), `FilesListParams { page?; limit?; search?; sort? }`, `FilesListResponse { items: FileUpload[]; total; page; limit }`, `PresignedUrlResponse { url: string; expiresAt: string }` — created `src/features/files/types/index.ts`; also added `FileUploadStatus` and `FilesSortField`/`FilesSortOrder`/`FilesSort` template-literal unions so `sort` is strictly typed `createdAt|originalName|size`:`asc|desc`
  - [x] `src/types/api.ts`: extend the envelope for the target shape — success adds `success: true` (additive; existing auth callers keep reading `.data`) + add the error body type `{ success: false; error: { code: string; message: string; details?: string[] } }`; align login/refresh `data` types to `{ accessToken, refreshToken, user }` (contract §3.1/§3.4) — `ApiResponse<T>` now has `success: true`; added `ApiErrorEnvelope` (also exported via the `src/types/index.ts` barrel); `LoginResponse` gains `user: AuthUser` with `AuthUser` + `UserRole` added to `src/features/auth/types/index.ts` per contract §3.6 (all consumers only read, so fully additive)
  - [x] `src/lib/query-keys.ts`: add the `files` namespace — `files.all: ["files"] as const` + `files.list(filters)` keyed by `{ page, limit, search, sort }`, following the existing `as const` factory pattern — done; `list(filters?: FilesListParams)` returns `['files', 'list', filters] as const`
  - [x] `src/constants/index.ts`: add `API_ROUTES.files.upload` (`/api/files/upload`) + `API_ROUTES.files.list` (`/api/files`) plus a small `fileRoutes(id)` helper (or equivalent) for the per-id routes (`/api/files/:id`, `/api/files/:id/url`, `DELETE /api/files/:id`) — no ad-hoc URL string building inside hooks — added `files.upload`/`files.list` to `API_ROUTES` + `fileRoutes.detail(id)`/`fileRoutes.url(id)` (DELETE reuses `detail(id)`)
  - [x] `src/lib/api-client.ts`: teach `parseErrorMessage` the target error envelope — it currently reads `body.error` as a string, but the target `error` is `{ code, message, details? }`, so today it falls back to raw text; read `error.message` (fallback `error.code`) and carry `code`/`details` as optional fields on `ApiError` so the UI can branch on `FILE_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` / `FILE_NOT_FOUND` / `RATE_LIMITED`; keep the 401 → refresh → retry flow untouched — renamed to `parseErrorBody` returning `{ message, code?, details? }`: object `error` → `error.message` (fallback `error.code`, then raw text), legacy top-level `message`/string `error` paths preserved; `ApiError` carries optional `code`/`details`, both throw sites updated; 401 → refresh → retry + `auth:unauthorized` flow untouched; `refreshAccessToken` now typed via `ApiResponse<LoginResponse>`
  - [x] `src/lib/api-client.ts`: allow `FormData` request bodies without forcing `Content-Type: application/json` (the browser must set the multipart boundary) — skip the JSON content-type when `body instanceof FormData` (the progress upload itself goes through XHR in step 2; this keeps `apiClient` consistent for any multipart use) — `request()` skips the JSON content-type for FormData bodies; `RequestOptions.body` widened to `string | FormData`; `post()` passes FormData through without `JSON.stringify`
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run test` passes — lint exit 0, tsc 0 errors, tests 3/3 passed

- [x] **2. Files feature: `src/features/files/` hooks**
  - [x] `useFilesList` — `useQuery` on `GET /api/files` keyed by `queryKeys.files.list(filters)`; pass `page`/`limit`/`search`/`sort` through (server clamps and echoes effective values) — `hooks/use-files-list.ts`; query string built via `URLSearchParams` off `API_ROUTES.files.list` (no route literals); `placeholderData: keepPreviousData` so pagination transitions keep the previous rows
  - [x] `useUploadFile` — mutation implemented with `XMLHttpRequest` (fetch cannot report upload progress): multipart field `file` (one file per request), `Authorization: Bearer` from `TokenManager`, `xhr.upload.onprogress` → live percent; parse the success envelope into a `FileUpload`; client-side pre-checks (≤ 25 MB + MIME whitelist) for instant feedback while treating server `413`/`415` as source of truth; invalidate `queryKeys.files.all` on success; on 401 do a single token-refresh retry (or dispatch `auth:unauthorized`) — `hooks/use-upload-file.ts`: XHR + `onprogress` → `progress` state, `cancel()` aborts via an xhr ref, `onMutate` resets progress; pre-checks throw `ApiError` with `FILE_TOO_LARGE`/`UNSUPPORTED_MEDIA_TYPE` codes; 401 → single `apiClient.refreshAccessToken()` retry, dispatches `auth:unauthorized` only when refresh fails; error path parses the `ApiErrorEnvelope` (incl. `details`) so `code` survives to the UI; also added `src/features/files/constants/index.ts` (`MAX_FILE_SIZE_BYTES` 25 MB + `ALLOWED_MIME_TYPES` per PRD §4) and two small `api-client.ts` additions: public `getBaseUrl()` (XHR needs the same base as `apiClient`) and `refreshAccessToken()` made public (was private; internals unchanged)
  - [x] `useDeleteFile` — mutation on `DELETE /api/files/:id` (soft delete; returns the updated `FileUpload`); invalidate `queryKeys.files.all` on success — `hooks/use-delete-file.ts` on `fileRoutes.detail(id)`
  - [x] `useGetPresignedUrl` — mutation on `GET /api/files/:id/url` → `{ url, expiresAt }`; consumers download (or re-presign) before `expiresAt` — `hooks/use-get-presigned-url.ts` on `fileRoutes.url(id)`
  - [x] Feature barrels (`src/features/files/hooks/index.ts`, `src/features/files/index.ts`) per repo convention — `hooks/index.ts` re-exports the four hooks; feature root `index.ts` does `export * from './hooks'` + `export type * from './types'` (first feature-root barrel in the repo; auth/home have none)
  - [x] Verify: `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors — lint exit 0, tsc 0 errors; smoke tests also still 3/3

- [x] **3. Files page UI at `src/app/(main)/files/page.tsx`**
  - [x] Add primitives: `bunx --bun shadcn@latest add -y table progress alert-dialog` (+ `dropdown-menu` if row actions/sort need it) — added `table` `progress` `alert-dialog` + `select` (sort control needed a proper select; `dropdown-menu` not needed — row actions are direct icon buttons); CLI re-added the deprecated `cn` package → removed via `bun remove cn` and rewrote the 4 new primitives to `import { cn } from "@/utils"` per the migration convention; also reverted a CLI-made `button.tsx` change (`@/utils/index` → `@/utils`) and answered the button-overwrite prompt with "no" so the customized `button.tsx` was preserved
  - [x] `src/features/files/components/`: upload dropzone (drag-and-drop + click-to-browse, per-file progress bar + cancel, pre-check feedback) and files table (name, size, type, status, uploaded date, actions) — `upload-dropzone.tsx` (dragenter/dragleave depth counter to avoid child-leave flicker, hidden multi-file input with `accept` from `ALLOWED_MIME_TYPES`, keyboard-openable; queue rows each own a `useUploadFile` instance → per-file progress/cancel, strict-mode-guarded auto-start, row removed on success/cancel, pre-check errors shown inline) + `files-table.tsx` (toolbar: debounced search + 6-option sort select; skeleton on first load, empty state, error callout with retry, placeholder dim on page change) + `files-table-row.tsx` (per-row presign/delete mutations, mime-based file icon, status badge); lint's new react-hooks rules caught + fixed two patterns: dialog close moved from `useEffect` to the mutate promise callback (`set-state-in-effect`), icon rendered via a helper returning an element instead of a render-created component (`static-components`); post-feature bugfix: upload queue row ids switched from `crypto.randomUUID()` (secure-context-only — unavailable over plain HTTP) to `makeId()` in `src/features/files/utils/uuid.ts` (re-exported from the utils barrel): uses `crypto.randomUUID` when available, else a Math.random-based RFC 4122 v4 string with no crypto dependency; the dropzone was the only `crypto.randomUUID` usage in src
  - [x] Download flow: `useGetPresignedUrl` → trigger the browser download from `url` (anchor click / new tab — the presigned URL hits MinIO directly, no JWT header) — click → presign → injected `<a target="_blank" rel="noopener noreferrer">` click (robust after the await, avoids popup blockers); presign error shown inline under the file name
  - [x] Delete flow: `alert-dialog` confirm → `useDeleteFile`; surface `FILE_NOT_FOUND` errors — controlled AlertDialog per row: Action uses `preventDefault` so the dialog stays open while pending and on failure (`deleteFile.error.message` rendered inside), closes via `mutateAsync` success; list invalidation handled by the hook
  - [x] List controls: search box, sort select (`createdAt|originalName|size` × `asc|desc`, default `createdAt:desc`), pagination off `total`/`page`/`limit`; loading skeleton + empty state; pure `formatBytes`/date helpers for display — 400 ms debounced search (resets page to 1 on search/sort change), shadcn `Select` for sort, fixed `PAGE_SIZE = 20`, Previous/Next + "Page X of Y" + total count driven by `total`; `formatBytes`/`formatDate` (Intl) added as pure helpers in `src/features/files/utils/index.ts`
  - [x] Page is `"use client"` on the hooks; `(main)/layout.tsx` `ProtectedRoute` guards it automatically — `src/app/(main)/files/page.tsx` composes `UploadDropzone` + `FilesTable`; components barrel `src/features/files/components/index.ts` + feature root barrel extended (`components`/`constants`/`utils` added)
  - [x] Verify: `bun run lint`, `bunx tsc --noEmit`, `bun run build`, `bun run test` all green; manual round-trip smoke against a running BE — lint exit 0, tsc 0 errors, build success (`/files` prerendered, 9 static pages), tests 3/3; manual BE round-trip deferred to step 6's optional runtime smoke (no BE running in this session)

- [x] **4. Nav entry + route constants**
  - [x] `ROUTES.files: "/files"` in `src/constants/index.ts` — added alongside `home` (nav order: Home, Files)
  - [x] Files nav entry in `src/components/layouts/app-header.tsx` (template has a top-nav header, no sidebar — add alongside existing links with active-state styling) — nav refactored to a `NAV_LINKS` array driven by `ROUTES`; active state via `usePathname` (exact match for Home, exact-or-prefix for Files), rendered as `aria-current="page"` + `font-medium text-foreground` vs `text-muted-foreground hover:text-foreground` via `cn`; `usePathname() ?? ''` guards the non-router (test) context
  - [x] Verify: nav renders + active state follows pathname; `bun run lint` + `bunx tsc --noEmit` green; `src/__tests__/smoke.test.tsx` still passes (extend it if it asserts the exact nav set) — smoke test extended with a nav-links case + a `next/navigation` `usePathname` mock (`/` → Home `aria-current="page"`, Files link `href="/files"` and inactive); lint exit 0, tsc 0 errors, tests 4/4

- [x] **5. Remove unused template demo pages (forgot/reset password)**
  Contract §3.7 removed `forgot-password`/`reset-password` (+ Google OAuth, `set-password`) from the BE — remove the dead FE surface (keep login/register):
  - [x] Delete route dirs `src/app/(auth)/forgot-password/` and `src/app/(auth)/reset-password/` — both removed
  - [x] Delete `src/features/auth/components/{forgot,reset}-password-form.tsx` (+ barrel exports) and `src/features/auth/providers/{forgot,reset}-password-provider.tsx` (+ `useForgotPassword`/`useResetPassword` exports in `src/features/auth/hooks/index.ts`) — forms + providers deleted; `components/index.ts` + `hooks/index.ts` now export login/register only
  - [x] Remove `forgotPasswordSchema`/`resetPasswordSchema` + their form types from `src/features/auth/types/index.ts` — schemas + `Forgot/ResetPasswordFormValues` + `Forgot/ResetPasswordResponse` removed; login/register schemas untouched
  - [x] Remove `ROUTES.forgotPassword`/`resetPassword` + `API_ROUTES.forgotPassword`/`resetPassword` from `src/constants/index.ts`; drop the "Forgot password?" link in `login-form.tsx`; drop the forgot/reset pathname entries in the `auth-provider.tsx` guest-route allowlist — all removed; `use-auth.tsx` had no forgot/reset refs
  - [x] Align env samples on the canonical `NEXT_PUBLIC_API_URL`: rewrite stale `example.env.local` (still says `NEXT_PUBLIC_BACKEND_URL` + `GOOGLE_*` OAuth vars) to match `.env.example`; sanity-check `.env.local` the same way — `example.env.local` rewritten to a canonical `NEXT_PUBLIC_API_URL` sample (pointer to `.env.example` for the full set); `.env.local` sanity-checked: already canonical (`NEXT_PUBLIC_API_URL` only, no stale vars), left untouched
  - [x] Verify: `rg -i 'forgot|reset-password|BACKEND_URL|GOOGLE_CLIENT' src/ example.env.local` clean; remaining `(auth)` links all resolve; `bun run lint`, `bunx tsc --noEmit`, `bun run build`, `bun run test` green — rg sweep exit 1 across `src/`, `example.env.local`, `.env.local`; login↔register are the only remaining `(auth)` links; lint exit 0, tsc 0 errors, tests 4/4, build success (routes now `/`, `/_not-found`, `/files`, `/login`, `/register`); gotcha hit + resolved: `bunx tsc` first failed with TS2307 from stale `.next/types/validator.ts` still referencing the deleted pages — re-running `bun run build` regenerates those route types, after which tsc is clean

- [x] **6. Gate: lint / tsc / build**
  - [x] `bun install --frozen-lockfile` (only if deps changed, e.g. shadcn add in step 3), `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success, `bun run test` passes — verified by parent: lint exit 0, tsc 0 errors, build success, tests 4/4 passed (deps changed in step 3 via shadcn add + `bun remove cn`; lockfile updated then)
  - [x] Optional runtime smoke on `bun run dev` against the BE: login → upload (happy path + >25 MB rejection + non-whitelisted MIME rejection) → list/search/sort/paginate → presigned download → delete → row gone from list; token refresh mid-session still works — route-level smoke verified by parent: `/login` 200, `/files` 200, `/forgot-password` 404 (removed route) as expected; full upload→download→delete round-trip not exercised (bullet was optional)
  - [x] Audit: all files endpoints/keys flow through `API_ROUTES` + `queryKeys` (no inline literals); semantic tokens only (no `zinc-*`/hardcoded colors) — holds by construction from steps 1–3: hooks/pages use `API_ROUTES.files.*`/`fileRoutes(id)`/`queryKeys.files.*` exclusively; step-3 rg audit found no `zinc-*`/hardcoded colors in feature code (only registry-shipped `dark:` variants inside generated `select.tsx`)
<!-- END:files-page-feature -->

<!-- BEGIN:remove-dashboard-files-default -->
## Remove dashboard, /files as default after login

Bounded, ordered checklist to remove the dashboard/home route and make `/files` the default landing page after login. Bun only (never npm). Validate each step independently before moving on.

- [x] **1. Delete home feature + landing page**
  - [x] Delete `src/features/home/` (`home-hero.tsx` + barrel `index.ts`)
  - [x] Delete `src/app/(main)/page.tsx`
  - [x] Verify: no references to `@/features/home` remain (`rg 'features/home' src/` clean); `bun run lint`

- [x] **2. Remove `home` route**
  - [x] Remove `home: '/'` from `ROUTES` in `src/constants/index.ts`
  - [x] Verify: no `ROUTES.home` references remain (`rg 'ROUTES\\.home' src/` clean)

- [x] **3. Redirect to `/files` after login**
  - [x] Update `ROUTES.home` usage → `ROUTES.files` in `src/features/auth/hooks/use-auth.tsx` (`GuestRoute`)
  - [x] Update `ROUTES.home` usage → `ROUTES.files` in `src/features/auth/providers/login-provider.tsx`
  - [x] Verify: `bun run lint`

- [x] **4. Update `AppHeader` brand + nav links**
  - [x] Update brand link and nav links from `/` to `ROUTES.files` in `src/components/layouts/app-header.tsx`
  - [x] Verify: no bare `href="/"` remain in the header (`rg 'href=\"/\"' src/components/layouts/app-header.tsx` clean)

- [x] **5. Final verification**
  - [x] `bun run lint` exit 0
  - [x] `bunx tsc --noEmit` 0 errors
  - [x] `bun run build` success
<!-- END:remove-dashboard-files-default -->

<!-- BEGIN:files-enhancements -->
## Files page enhancements (tests · URL state · detail/preview · copy+countdown · optimistic delete)

Bounded, ordered checklist for 5 frontend enhancements on top of the existing files feature. Context: files UI lives in `src/features/files/` (`FilesTable`, `FilesTableRow`, `UploadDropzone`), hooks in `src/features/files/hooks/`, routes/keys via `API_ROUTES`/`fileRoutes`/`queryKeys`, tests via Vitest + RTL (`bun run test`, single `src/__tests__/smoke.test.tsx`), Bun only (never npm), semantic tokens only. Current list controls (`page`/`search`/`sort`) and `SORT_OPTIONS`/`PAGE_SIZE` are local `useState` inside `src/features/files/components/files-table.tsx`; `useDeleteFile` invalidates only (no optimistic update); presign/download is fire-and-forget with no copy or expiry UI; no detail view exists. **Do NOT write source code in this step — plan only; every item pending.** Each section must be independently verifiable before moving on.

- [x] **1. Unit tests for the files feature**
  - [x] Add `src/__tests__/test-utils.tsx`: `renderWithQueryClient()` (fresh `QueryClient` with `retry: false`, wrapped in `QueryClientProvider`) + `createQueryClient()` export for hook tests — added; both exported
  - [x] Add `src/features/files/__tests__/factories.ts`: `makeFileUpload(overrides?)` and `makeFilesListResponse(overrides?)` typed fakes (all `FileUpload` fields per `src/features/files/types/index.ts`) — added
  - [x] Unit-test `src/features/files/utils` (`formatBytes`, `formatDate`, `makeId`): zero/negative/NaN bytes, unit boundaries, invalid date → `—`, id shape/uniqueness — `__tests__/utils.test.ts` covers all cases incl. crypto fallback via `vi.stubGlobal`
  - [x] Unit-test `useFilesList` (`hooks/use-files-list.ts`): mock `apiClient.get`, assert endpoint includes `page`/`limit`/`search`/`sort` (via `URLSearchParams` off `API_ROUTES.files.list`) and `queryKeys.files.list(filters)`; assert omission when filters empty — `__tests__/hooks.test.tsx`; asserts both the built URL and the cache key
  - [x] Unit-test `useDeleteFile` and `useGetPresignedUrl`: assert `fileRoutes.detail(id)` / `fileRoutes.url(id)` call and `queryKeys.files.all` invalidation on delete success — covered in `__tests__/hooks.test.tsx`
  - [x] Component-test `FilesTable` (`components/files-table.tsx`) with `@/features/files/hooks` mocked: loading skeleton, error + "Try again", empty state (`search` on/off copy), rows rendered, Previous/Next disabled states — `__tests__/files-table.test.tsx` (7 cases)
  - [x] Component-test `FilesTableRow` (`components/files-table-row.tsx`): renders name/size/status/action buttons; download calls `useGetPresignedUrl`; delete opens `AlertDialog` and confirm calls `mutateAsync` — `__tests__/files-table-row.test.tsx` (3 cases)
  - [x] Add `test:coverage` script (`bun run test:coverage`) with a `coverage` block scoped to `src/features/files/**` (do not enforce global thresholds yet) — `package.json` script + `@vitest/coverage-v8` dep; `vitest.config.ts` `coverage.include` scoped to `src/features/files/**`, tests excluded, no thresholds
  - [x] Verify: `bun run test` green (existing smoke + new), `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors; `rg` shows tests colocated under `src/features/files/__tests__/` — 5 files / 28 tests pass (incl. `test:coverage` run), lint exit 0, tsc 0 errors; 5 test files colocated under `src/features/files/__tests__/`; stale `Home` nav assertion in `src/__tests__/smoke.test.tsx` updated to the Files-only nav (removed route)

- [x] **2. List state in the URL (page / search / sort)**
  - [x] Move `SORT_OPTIONS`, `PAGE_SIZE`, and a new `DEFAULT_SORT = 'createdAt:desc'` out of `files-table.tsx` into `src/features/files/constants/index.ts` (single source shared by select + URL parser) — all three moved; constants imports the `FilesSort` type from the feature types barrel
  - [x] Add `useFilesQueryParams()` in `src/features/files/hooks/use-files-query-params.ts` (+ barrel): read `page`/`search`/`sort` from `useSearchParams()`, validate (integer `page >= 1`, `sort` must be a known `FilesSort`, else default), expose typed values + setters that write via `router.replace(pathname + params, { scroll: false })` (no history spam); search/sort setters reset `page` to 1 — `parsePage` (`Number.isInteger && >= 1`) + `parseSort` (validated against `SORT_OPTIONS`); `commit()` rebuilds params, drops values equal to defaults, `router.replace(..., { scroll: false })`; `setSearch`/`setSort` force `page: 1`; exported via `hooks/index.ts`
  - [x] Refactor `FilesTable` to consume `useFilesQueryParams` instead of the local `page`/`sort`/`search` `useState`; keep the 400 ms debounce between the search input and the URL write — removed `page`/`sort`/`search` state; only the in-progress `searchInput` stays local (synced from URL search via the render-phase adjust pattern so browser Back resets it) with a 400 ms debounce writing `setSearch`; empty-state copy + pagination now read the URL-derived values
  - [x] Wrap the `useSearchParams`-reading client component in `<Suspense>` with a skeleton fallback in `src/app/(main)/files/page.tsx` per the Next 16 App Router requirement — read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` first (static prerender requires the boundary or the build fails); page converted from `'use client'` to a Server Component and `<FilesTable>` wrapped in `<Suspense fallback={<FilesTableFallback />}>` (skeleton on semantic tokens)
  - [x] Update `next/navigation` mocks in `src/__tests__/smoke.test.tsx` (and any new test utils) to provide `useSearchParams`/`useRouter`/`usePathname`; add a `useFilesQueryParams` unit test (parse, defaults, invalid `sort`/`page` coercion) — smoke mock now provides all three; `files-table.test.tsx` gained a `useFilesQueryParams` mock (search/pagination cases reworked to drive the mocked hook); new `use-files-query-params.test.tsx` (6 cases: defaults, parse, invalid coercion, page write, search+page reset, default-stripping)
  - [!] Verify: manual — changing search/sort/page updates the URL, reload and browser Back restore the view, deep-linking `?page=2&sort=size:desc&search=x` works; `rg` confirms no list-state `useState` remains in `FilesTable`; `bun run lint`, `bunx tsc --noEmit`, `bun run test` green — automated green: `bun run test` 34/34 (6 files), `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors, `bun run build` success (`/files` prerendered static, confirming the Suspense boundary); `FilesTable` holds only the `searchInput` `useState` (no list-state `useState`); browser URL/Back/deep-link smoke not exercised in this session

- [x] **3. File detail view + preview**
  - [x] Add `queryKeys.files.detail(id)` to `src/lib/query-keys.ts` (follow the `as const` factory pattern) — `detail: (id: string) => ['files', 'detail', id] as const` added alongside `list`
  - [x] Add `useGetFile(id)` in `src/features/files/hooks/use-get-file.ts` (+ barrel): `useQuery` on `fileRoutes.detail(id)` → `ApiResponse<FileUpload>`, `enabled: Boolean(id)` — `hooks/use-get-file.ts`; `queryKeys.files.detail(id ?? '')` + `enabled: Boolean(id)`; exported via `hooks/index.ts`
  - [x] Add the shadcn `dialog` primitive (`bunx --bun shadcn@latest add -y dialog`); fix any regressions (CLI re-adding `cn` dep, `@/utils` import path) per the existing migration convention — `src/components/ui/dialog.tsx` added via the CLI and already uses `import { cn } from "@/utils"` (no `cn` dep re-added); `button.tsx` left untouched
  - [x] Add `src/features/files/components/file-detail-dialog.tsx` (controlled `open`/`onOpenChange`): metadata block (name, mime, size, status, `uploadedBy`, `createdAt`/`updatedAt`, `checksum`, `bucket`/`objectKey`) + loading/error states using semantic tokens — done; `useGetFile(open ? file?.id : undefined)`, `DialogHeader` + `Loader2` loading + destructive error callout with `refetch` retry, `MetadataList` renders all 10 fields
  - [x] Preview strategy (lazy, only when open): image via `<img>` (presigned URL from `useGetPresignedUrl`), PDF via `<iframe>`/`<embed>`, `text/*` + `text/csv` + `text/markdown` via client fetch + `<pre>`, otherwise a "preview not available" fallback with the download action — `FilePreview` presigns lazily inside the mounted (open-only) dialog; `getPreviewKind` routes `image/*` → `<img>`, `application/pdf` → `<iframe>`, `text/*` → `TextPreview` (fetch + `<pre>`, abortable); unsupported → fallback with download (`openInNewTab`)
  - [x] Wire a "View details" trigger into `FilesTableRow` (action icon + clickable file name) that opens the dialog; add to `components/index.ts` barrel — clickable name button + `Eye` action button both `setIsDetailOpen(true)`; `<FileDetailDialog>` rendered per row; `export { FileDetailDialog }` added to `components/index.ts`
  - [x] Tests: mock `@/features/files/hooks` to cover dialog metadata + preview fallback + loading/error; extend the row test for the view trigger — new `__tests__/file-detail-dialog.test.tsx` (6 cases: metadata, loading, error+retry, fallback, image, text); `files-table-row.test.tsx` gained a view-trigger case + `useGetFile` mock; existing `files-table-row`/`files-table` mocks extended with `useGetFile` + full presign shape
  - [x] Verify: `bun run lint`, `bunx tsc --noEmit`, `bun run test` green; manual preview of image, PDF, text, and an unsupported type (fallback) — automated green: `bun run test` 41/41 (7 files), `bun run lint` exit 0, `bunx tsc --noEmit` 0 errors; manual browser preview deferred to the optional step 6 runtime smoke (no BE running in this session)

- [x] **4. Copy link + presigned-URL expiry countdown**
  - [x] Add a pure `formatDuration(ms)` (and `formatRemaining(expiresAt, now?)` if useful) to `src/features/files/utils/index.ts` + unit test (0, sub-minute, minutes, expired/negative)
  - [x] Add `useCountdown(expiresAt)` in `src/hooks/use-countdown.ts` (+ barrel): returns `remainingMs` + `isExpired`, 1 s tick with `clearInterval` cleanup, SSR/hydration-safe
  - [x] Add `src/features/files/components/copy-link-button.tsx`: `navigator.clipboard.writeText` with a feature-detected fallback (insecure-context safe, mirroring the `makeId` guard); disabled + "Expired" past `expiresAt`; accessible "Copied" status via `aria-live`
  - [x] Integrate into the row/detail presign result: next to the download action show the copy button + live "expires in mm:ss"; once expired, disable download/copy and offer "Get a new link" (re-run `useGetPresignedUrl`)
  - [x] Tests: `formatDuration` unit; `useCountdown` with fake timers (counts down, hits expired); `CopyLinkButton` (clipboard mock, copied feedback, disabled when expired)
  - [x] Verify: `bun run lint`, `bunx tsc --noEmit`, `bun run test` green; manual — copy link puts the presigned URL on the clipboard, countdown reaches expiry, re-presign works

- [ ] **5. Optimistic delete**
  - [ ] Extend `useDeleteFile` (`hooks/use-delete-file.ts`) with `onMutate`: `cancelQueries({ queryKey: queryKeys.files.all })`, snapshot every `files.list` cache, `setQueriesData` to drop the id from `items` (and decrement `total`); return the snapshots as context
  - [ ] `onError`: roll back each snapshot from the returned context
  - [ ] `onSettled`: keep invalidating `queryKeys.files.all` and also invalidate/remove `queryKeys.files.detail(id)`
  - [ ] Adjust `FilesTableRow` delete UX: close the `AlertDialog` immediately on confirm (stop waiting on `mutateAsync`) and rely on the optimistic row removal
  - [ ] Add failure feedback that survives the row unmount/rollback: shadcn `sonner` (`bunx --bun shadcn@latest add -y sonner`) + `<Toaster />` in `src/providers/index.tsx`; fire a toast on delete error ("Couldn't delete …") and optionally on success
  - [ ] Tests: unit-test `useDeleteFile` optimistic behavior — seed a `QueryClient` `files.list` cache, mock `apiClient.delete` resolving (item removed, then refetch) and rejecting (item restored), assert snapshot rollback
  - [ ] Verify: `bun run lint`, `bunx tsc --noEmit`, `bun run test` green; manual — row disappears instantly, reappears with a toast when the BE returns `FILE_NOT_FOUND`, final list reconciles after invalidation
<!-- END:files-enhancements -->
