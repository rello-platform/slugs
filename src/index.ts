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
  "milo-engine",
  "content-engine",
  "neighborhood-intel",
] as const;

/** Union of canonical slug values. Use this in Record keys, function args, etc. */
export type AppSlug = (typeof APP_SLUGS)[number];

/** Read-only Set for fast `.has()` checks. */
export const CANONICAL_SET: ReadonlySet<AppSlug> = new Set<AppSlug>(APP_SLUGS);

/**
 * Legacy-form → canonical mapping. Every variant observed in production
 * write paths as of the canonicalization migration. Keep in sync with
 * Rello/src/lib/leads/source-app.ts LEGACY_ALIASES.
 */
export const LEGACY_ALIASES: Readonly<Record<string, AppSlug>> = {
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
  // milo-engine
  miloengine: "milo-engine",
  milo_engine: "milo-engine",
  milo: "milo-engine",
  // content-engine
  contentengine: "content-engine",
  content_engine: "content-engine",
  // neighborhood-intel
  neighborhoodintel: "neighborhood-intel",
  neighborhood_intel: "neighborhood-intel",
  // rello-internal origins (CRM UI + webhooks + inbound channels). These
  // are Rello-the-CRM's own ingestion channels — leads entered by agents
  // or picked up from Rello-provisioned Twilio / email inboxes. Not
  // included: a bare "api" string, which could be ANY spoke calling
  // Rello's HTTP API — mapping that to "rello" would falsely attribute
  // spoke-origin leads to the CRM. Unknown strings fall through to null.
  manual: "rello",
  rello_crm: "rello",
  website: "rello",
  inbound_sms: "rello",
  inbound_email: "rello",
  inbound_call: "rello",
};

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
export function normalizeSlug(raw: string | null | undefined): AppSlug | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  const lowered = trimmed.toLowerCase();
  if (CANONICAL_SET.has(lowered as AppSlug)) return lowered as AppSlug;
  const aliased = LEGACY_ALIASES[lowered];
  if (aliased) return aliased;
  console.warn(
    `[@rello-platform/slugs] Unrecognized slug "${raw}" — treating as unknown.`,
  );
  return null;
}

/** Type guard: is this string a canonical slug? */
export function isCanonicalSlug(value: string): value is AppSlug {
  return CANONICAL_SET.has(value as AppSlug);
}
