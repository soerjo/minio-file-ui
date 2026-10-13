<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
