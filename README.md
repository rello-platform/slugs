# @rello-platform/slugs

Canonical platform slug registry for the Rello ecosystem. A single source of truth for every repo that identifies a platform app or engine (Rello, Harvest Home, all spokes, Milo Engine, Content Engine, Property Engine, Journey Engine, trigger workers, Prisma seeds). Consuming this package makes a slug rename a **compile error** in every consumer instead of silent data drift.

## Install

```bash
npm install "github:rello-platform/slugs"
```

## Usage

```ts
import {
  APP_SLUGS,          // consumer apps (11) — mirror of Rello's App table
  ENGINE_SLUGS,       // service engines (6) — no App table row
  PLATFORM_SLUGS,     // union of both (17) — derived
  CANONICAL_SET,
  LEGACY_ALIASES,
  normalizeSlug,
  isCanonicalSlug,
  isAppSlug,
  isEngineSlug,
  type AppSlug,
  type EngineSlug,
  type PlatformSlug,
} from "@rello-platform/slugs";

// Type-safe app identifier (consumer apps only):
const app: AppSlug = "home-ready";

// Type-safe engine identifier:
const engine: EngineSlug = "property-engine";

// Type-safe any-platform-slug identifier:
const origin: PlatformSlug = "milo-engine";

// Normalize any legacy / mixed-case input:
normalizeSlug("HomeReady");         // → "home-ready"
normalizeSlug("the-home-scout");    // → "home-scout"
normalizeSlug("property-engine");   // → "property-engine"
normalizeSlug("neighborhood-intel");// → null (NOT a platform slug — Property Engine feature)
normalizeSlug("FUB");                // → null (non-platform origin)

// Type guards:
if (isCanonicalSlug(value)) { /* value is PlatformSlug */ }
if (isAppSlug(value))       { /* value is AppSlug (consumer app) */ }
if (isEngineSlug(value))    { /* value is EngineSlug */ }
```

## Exports

| Export | Kind | Count | Use when |
|---|---|---|---|
| `APP_SLUGS` | `readonly string[]` | 11 | Indexing App-table rows, tenant entitlements, plan features, spoke embed routes |
| `ENGINE_SLUGS` | `readonly string[]` | 6 | Signal-router origin classification, engine-specific service-to-service auth |
| `PLATFORM_SLUGS` | `readonly string[]` | 17 | Any allow-list accepting either apps or engines (e.g., X-App-Source header validation) |
| `AppSlug` | `type` | — | Narrow "this is a consumer app" type |
| `EngineSlug` | `type` | — | Narrow "this is a service engine" type |
| `PlatformSlug` | `type` | — | Union — anything valid in the ecosystem |
| `normalizeSlug` | `(raw) => PlatformSlug \| null` | — | Canonicalize any inbound slug string; unknown → null + loud-warn |
| `isCanonicalSlug` | type guard | — | Runtime "is this a known platform slug?" |
| `isAppSlug` | type guard | — | Runtime "is this a consumer app?" |
| `isEngineSlug` | type guard | — | Runtime "is this a service engine?" |
| `LEGACY_ALIASES` | `Record<string, PlatformSlug>` | — | Drifted-variant → canonical mapping, consumed by `normalizeSlug` |
| `CANONICAL_SET` | `ReadonlySet<PlatformSlug>` | 17 | Fast `.has()` check (pre-populated from `PLATFORM_SLUGS`) |

## `neighborhood-intel` is NOT a platform slug

`neighborhood-intel` is a **feature** inside Property Engine (see `Property-Engine/src/app/api/neighborhood-intel/`), not a consumer app or a standalone engine. It has no App table row, no tenant entitlement, no signal origin. `normalizeSlug("neighborhood-intel")` returns `null`, and no `LEGACY_ALIASES` entry resolves to it. If a caller tries to set `X-App-Source: neighborhood-intel` on a signal, it will be rejected by any allow-list derived from `PLATFORM_SLUGS`.

## Adding a new slug

**New consumer app** (has an App table row, a tenant entitlement, probably a `/apps/{slug}/*` route):

1. Add the canonical slug to `APP_SLUGS` in `src/index.ts`.
2. Bump the version (`0.x.y` → `0.x+1.0` for additive changes).
3. In Rello, update `prisma/seed-platform.ts` to seed the new `App` row.
4. In the spoke repo, set the `APP_SLUG` constant to the canonical form.
5. In Harvest Home, update `HARDCODED_FALLBACK` in `src/lib/app-registry.ts` — the HH CI test asserts equality and will fail until they agree.
6. Update `~/.claude/CLAUDE.md` canonical slug table.

**New engine** (service component, no App table row, no `/apps/{slug}/*` route):

1. Add the canonical slug to `ENGINE_SLUGS` in `src/index.ts`.
2. Bump the version.
3. In the engine's own repo, register the slug in its outbound `X-App-Source` / `X-App-Slug` headers.
4. No Rello seed change; no HH whitelist change; engines don't appear in consumer-facing lists.
5. Update `~/.claude/CLAUDE.md` canonical slug table if the canonical table is maintained there.

## Distribution

This package is consumed via `github:` install (not published to npm). The compiled `dist/` output is **committed to the repo** so consumers don't need to run a build step at install time. Rebuild before commit:

```bash
npm run build
git add dist
```

## See also

- `~/.claude/CLAUDE.md` — canonical slug table and forbidden-variants list.
- `SPOKE-SLUG-CANONICAL-ALIGNMENT-ARCHITECTURE-041726.md` — the 12-PR rollout plan this package anchors.
- `SPOKE-SLUG-ALIGNMENT-PR-01-AMEND-DESIGN-B-041826-DONE.md` — the companion for the 0.1.0 → 0.2.0 amendment that split APP_SLUGS + ENGINE_SLUGS and removed `neighborhood-intel`.
