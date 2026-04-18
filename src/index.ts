/**
 * Canonical platform slugs for the Rello ecosystem. Authoritative list.
 *
 * Design B (decided 2026-04-18 after PR 1 correction): consumer apps
 * (APP_SLUGS — mirror Rello's App table) and engines (ENGINE_SLUGS —
 * service components that identify themselves by slug but have no App
 * row) are separate lists with distinct types. Union type
 * `PlatformSlug = AppSlug | EngineSlug` covers any ecosystem slug;
 * `AppSlug` is the narrow type for "is this an App table row?" checks.
 *
 * Use `APP_SLUGS` for App-table-indexed code (entitlements, seed-platform,
 * Rello admin UI).
 * Use `ENGINE_SLUGS` for engine-specific code (signal routers that need
 * to distinguish consumer-origin from service-origin).
 * Use `PLATFORM_SLUGS` / `PlatformSlug` for any code that accepts any
 * ecosystem slug (signal-ingest allow-lists, Lead.sourceApp type, etc.).
 *
 * neighborhood-intel is NOT an app — it's a feature exposed by
 * Property Engine via /api/neighborhood-intel. Do NOT add it here.
 */

/**
 * Consumer-facing apps. Mirror of Rello's `public."App"` table rows.
 * Each has a tenant-entitlement feature key, a plan-features membership,
 * and (for the embeddable ones) a /apps/{slug}/* proxy route.
 */
export const APP_SLUGS = [
  "rello",
  "harvest-home",
  "home-ready",
  "home-stretch",
  "home-scout",
  "market-intel",
  "newsletter-studio",
  "the-oven",
  "the-drumbeat",
  "open-house-hub",
  "pathfinder-pro",
] as const;

/**
 * Platform service engines. Not consumer-facing apps; not in Rello's
 * App table. Identified by slug for service-to-service auth headers
 * (X-App-Slug / X-App-Source) and signal-origin classification.
 *
 * - milo-engine: AI composition + nurture decisions (emits to Rello)
 * - content-engine: article + digest generation
 * - property-engine: property/valuation data (confirmed emits via
 *   signal-emitter.ts:23 with X-App-Source: "property-engine")
 * - journey-engine: workflow automation (live; Rello dispatches events
 *   to JE today, no outbound slug header yet — included for future-proofing)
 * - report-engine: reporting pipeline (not yet slug-emitting; included
 *   for future-proofing per ecosystem authoritative list 2026-04-18)
 * - drumbeat-video-engine: Drumbeat video generation (not yet slug-emitting;
 *   included for future-proofing)
 */
export const ENGINE_SLUGS = [
  "milo-engine",
  "content-engine",
  "property-engine",
  "journey-engine",
  "report-engine",
  "drumbeat-video-engine",
] as const;

/** Every canonical slug in the ecosystem. Derived; do not hand-maintain. */
export const PLATFORM_SLUGS = [...APP_SLUGS, ...ENGINE_SLUGS] as const;

export type AppSlug = (typeof APP_SLUGS)[number];
export type EngineSlug = (typeof ENGINE_SLUGS)[number];
export type PlatformSlug = AppSlug | EngineSlug;

/** Read-only Set for fast `.has()` checks over the full platform slug space. */
export const CANONICAL_SET: ReadonlySet<PlatformSlug> =
  new Set<PlatformSlug>(PLATFORM_SLUGS);

/**
 * Legacy-form → canonical mapping. Every drifted variant observed in
 * production write paths as of the canonicalization migration.
 *
 * Engines other than milo/content have no legacy aliases today (no
 * drifted data exists for property/journey/report/drumbeat-video).
 * The milo + content entries are kept from the Rello source-app.ts
 * baseline; remove them only if a follow-up audit confirms no
 * production rows reference them.
 *
 * neighborhood-intel has NO entries here — it's not a canonical slug
 * and must resolve to null via normalizeSlug() so any code that reads
 * it falls through to the unknown-origin branch.
 */
export const LEGACY_ALIASES: Readonly<Record<string, PlatformSlug>> = {
  // open-house-hub
  openhousehub: "open-house-hub",
  open_house: "open-house-hub",
  open_house_hub: "open-house-hub",
  "the-open-house-hub": "open-house-hub",
  // home-ready
  homeready: "home-ready",
  home_ready: "home-ready",
  // home-stretch
  homestretch: "home-stretch",
  home_stretch: "home-stretch",
  "the-home-stretch": "home-stretch",
  thehomestretch: "home-stretch",
  // home-scout
  homescout: "home-scout",
  home_scout: "home-scout",
  "the-home-scout": "home-scout",
  thehomescout: "home-scout",
  // the-oven
  the_oven: "the-oven",
  oven: "the-oven",
  theoven: "the-oven",
  // harvest-home
  harvesthome: "harvest-home",
  harvest_home: "harvest-home",
  // newsletter-studio
  newsletterstudio: "newsletter-studio",
  newsletter_studio: "newsletter-studio",
  // market-intel
  marketintel: "market-intel",
  market_intel: "market-intel",
  // the-drumbeat
  drumbeat: "the-drumbeat",
  the_drumbeat: "the-drumbeat",
  thedrumbeat: "the-drumbeat",
  // pathfinder-pro
  pathfinderpro: "pathfinder-pro",
  pathfinder_pro: "pathfinder-pro",
  // milo-engine (kept from PR 1 baseline)
  miloengine: "milo-engine",
  milo_engine: "milo-engine",
  milo: "milo-engine",
  // content-engine (kept from PR 1 baseline)
  contentengine: "content-engine",
  content_engine: "content-engine",
  // NO neighborhood-intel aliases — not a canonical slug.
  // Rello-internal origins
  manual: "rello",
  rello_crm: "rello",
  website: "rello",
  inbound_sms: "rello",
  inbound_email: "rello",
  inbound_call: "rello",
};

/**
 * Normalize any raw slug string to canonical form. Returns null when
 * the input is missing, empty, or refers to a non-platform origin
 * (including `neighborhood-intel`, which is a Property Engine feature
 * not a platform slug).
 */
export function normalizeSlug(raw: string | null | undefined): PlatformSlug | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  const lowered = trimmed.toLowerCase();
  if (CANONICAL_SET.has(lowered as PlatformSlug)) return lowered as PlatformSlug;
  const aliased = LEGACY_ALIASES[lowered];
  if (aliased) return aliased;
  console.warn(
    `[@rello-platform/slugs] Unrecognized slug "${raw}" — treating as unknown.`,
  );
  return null;
}

/** Type guard for any canonical platform slug (apps + engines). */
export function isCanonicalSlug(value: string): value is PlatformSlug {
  return CANONICAL_SET.has(value as PlatformSlug);
}

/** Type guard: is this slug a consumer App (has an App table row)? */
export function isAppSlug(value: string): value is AppSlug {
  return (APP_SLUGS as readonly string[]).includes(value);
}

/** Type guard: is this slug a platform Engine (service component)? */
export function isEngineSlug(value: string): value is EngineSlug {
  return (ENGINE_SLUGS as readonly string[]).includes(value);
}
