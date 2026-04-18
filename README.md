# @rello-platform/slugs

Canonical app slug registry for the Rello platform. A single source of truth for every repo that identifies a platform app (Rello, Harvest Home, all spokes, Milo Engine, Content Engine, trigger workers, Prisma seeds). Consuming this package makes a slug rename a **compile error** in every consumer instead of silent data drift.

## Install

```bash
npm install "github:rello-platform/slugs"
```

## Usage

```ts
import {
  APP_SLUGS,
  AppSlug,
  CANONICAL_SET,
  LEGACY_ALIASES,
  normalizeSlug,
  isCanonicalSlug,
} from "@rello-platform/slugs";

// Type-safe app identifier:
const slug: AppSlug = "home-ready";

// Normalize any legacy / mixed-case input:
normalizeSlug("HomeReady");        // → "home-ready"
normalizeSlug("the-home-scout");   // → "home-scout"
normalizeSlug("FUB");               // → null (non-platform origin)

// Type guard:
if (isCanonicalSlug(value)) {
  // value is narrowed to AppSlug
}
```

## Adding a new app

1. Add the canonical slug to `APP_SLUGS` in `src/index.ts`.
2. Bump the version in `package.json` and push.
3. In Rello, update `prisma/seed-platform.ts` to seed the new `App` row.
4. In Harvest Home, update `HARDCODED_FALLBACK` in `src/lib/app-registry.ts` — the HH CI test asserts equality with `APP_SLUGS` and will fail until they agree.
5. Update `~/.claude/CLAUDE.md` canonical slug table.

## Distribution

This package is consumed via `github:` install (not published to npm). The compiled `dist/` output is **committed to the repo** so consumers don't need to run a build step at install time. Rebuild before commit:

```bash
npm run build
git add dist
```

## See also

- `~/.claude/CLAUDE.md` — authoritative canonical table and forbidden-variants list.
- `SPOKE-SLUG-CANONICAL-ALIGNMENT-ARCHITECTURE-041726.md` — the 12-PR rollout plan this package anchors.
