/**
 * Canonical app slugs for the Rello platform. Authoritative list.
 *
 * Every repo that identifies an app (Rello, HH, all spokes, Milo, Content
 * Engine, trigger workers, Prisma seeds) imports from here. A rename
 * becomes a compile error in consuming repos instead of silent data drift.
 *
 * Additions: add the slug here FIRST, then update Rello's App table via
 * prisma/seed-platform.ts, then update HH's HARDCODED_FALLBACK. The test
 * assertion in HH will fail loudly until all three agree.
 *
 * See ~/.claude/CLAUDE.md for the authoritative canonical table and its
 * forbidden-variants list.
 */
export declare const APP_SLUGS: readonly ["rello", "harvest-home", "home-ready", "home-stretch", "home-scout", "market-intel", "newsletter-studio", "the-oven", "the-drumbeat", "open-house-hub", "pathfinder-pro", "milo-engine", "content-engine", "neighborhood-intel"];
/** Union of canonical slug values. Use this in Record keys, function args, etc. */
export type AppSlug = (typeof APP_SLUGS)[number];
/** Read-only Set for fast `.has()` checks. */
export declare const CANONICAL_SET: ReadonlySet<AppSlug>;
/**
 * Legacy-form → canonical mapping. Every variant observed in production
 * write paths as of the canonicalization migration. Keep in sync with
 * Rello/src/lib/leads/source-app.ts LEGACY_ALIASES.
 */
export declare const LEGACY_ALIASES: Readonly<Record<string, AppSlug>>;
/**
 * Normalize any raw slug string to canonical form. Returns null when
 * the input is missing, empty, or refers to a non-platform origin.
 *
 * Accepts canonical, legacy, mixed-case, and snake_case. Trims + lowercases
 * before matching. Unknown inputs loud-warn and return null so routing
 * falls through to a lifecycle-based default.
 *
 * Mirror of Rello/src/lib/leads/source-app.ts normalizeSourceApp().
 */
export declare function normalizeSlug(raw: string | null | undefined): AppSlug | null;
/** Type guard: is this string a canonical slug? */
export declare function isCanonicalSlug(value: string): value is AppSlug;
//# sourceMappingURL=index.d.ts.map