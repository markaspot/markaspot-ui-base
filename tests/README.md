# Mark-a-Spot Frontend Test Suite

The frontend test suite is split into clearly separated **layers**. Each layer has a
different dependency on the backend, so a test belongs in exactly one of them. Keeping
the layers separate is what lets the unit layer stay fast and deterministic (no backend,
no network) while contract/integration layers verify the real Drupal API.

## The four layers

| Layer | Script | Runner | Backend? | What it covers |
|-------|--------|--------|----------|----------------|
| **1. Unit** | `pnpm run test:unit` | Vitest + happy-dom | **No** — fully mocked | Pure functions, composables, stores, components in isolation. All Nuxt composables and the API client are mocked in `tests/unit/setup.ts` / `tests/unit/__mocks__/`. |
| **2. API contract** | `pnpm run test:api-contract` | Vitest (`vitest.integration.config.ts`) | Yes — live DDEV | Asserts the **shape** of real JSON:API / Open311 / settings responses so the frontend's assumptions can't silently drift from Drupal. |
| **3. Integration** | `pnpm run test:integration` | Drush php:script | Yes — live DDEV | Endpoint + multi-tenant behaviour driven through Drupal (`web/profiles/contrib/markaspot/tests/...`). |
| **4. Drupal** | `pnpm run test:drupal` | PHPUnit (in DDEV) | Yes — Drupal kernel | Backend unit/kernel coverage for the profile modules. |

Browser-level acceptance is **not** part of the automated suite. The Playwright `test:e2e`
suite was retired (it had drifted ~70% red). Browser smoke now runs through the
`/agent-smoke` skill, which drives Chrome DevTools MCP through the canonical tenant flow
before a deploy or after a user-facing feature.

`pnpm run test:all` runs the gate chain: `lint` → `i18n:check:strict` → `test:unit` →
`test:drupal` → `test:integration`.

## Which layer do I extend?

Ask: **does the thing under test need a real backend response?**

- **No** — it's logic you can drive with fixed inputs (a composable, a util, a store,
  a component with mocked data) → **Layer 1, `tests/unit/`**. Mock every dependency.
  A real `fetch()` / `XMLHttpRequest` in a unit test now **throws** (guard in
  `tests/unit/setup.ts`), so backend-dependent code cannot sneak into this layer.
- **Yes, and I'm checking the response *shape*/contract** (fields, types, status codes
  the frontend relies on) → **Layer 2, `test:api-contract`** against a running DDEV.
- **Yes, and I'm checking end-to-end behaviour or multi-tenant routing through Drupal**
  → **Layer 3, `test:integration`**.
- **It's backend (PHP) logic** → **Layer 4, `test:drupal`** (PHPUnit, lives in the
  profile repo under each module's `tests/src/Unit|Kernel/`).

See `tests/unit/README.md` for the detailed unit-testing patterns (mocking Nuxt
composables, the API client, Pinia stores, etc.).

## Running

```bash
# Unit (fast, no backend) — runs anywhere
pnpm --dir frontend run test:unit

# Backend-dependent layers — run from the host with DDEV up
pnpm --dir frontend run test:api-contract
pnpm --dir frontend run test:integration
pnpm --dir frontend run test:drupal

# Full gate chain
pnpm --dir frontend run test:all
```

Node commands inside the container go through `ddev exec -s node-dev …`; the
backend-dependent scripts auto-skip with a notice when `ddev` is not on `PATH`.
