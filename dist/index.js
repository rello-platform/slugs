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
 *
 * - arive: LOS-side integration partner (Mortgage Loan Origination
 *   System). Inbound-only via Zapier-mediated webhooks; no /apps/arive
 *   proxy route — surfaces are owned by Rello Closing Co-Pilot.
 *   Added v0.5.0 per CLOSING-COPILOT-ARIVE-INTEGRATION spec G-14.
 */
export const APP_SLUGS = [
    "arive",
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
];
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
 * - report-engine: reporting pipeline (confirmed emits via
 *   signal_emitter.py:39 with X-App-Source: "report-engine")
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
];
/** Every canonical slug in the ecosystem. Derived; do not hand-maintain. */
export const PLATFORM_SLUGS = [...APP_SLUGS, ...ENGINE_SLUGS];
/** Read-only Set for fast `.has()` checks over the full platform slug space. */
export const CANONICAL_SET = new Set(PLATFORM_SLUGS);
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
export const LEGACY_ALIASES = {
    // open-house-hub
    openhousehub: "open-house-hub",
    open_house: "open-house-hub",
    open_house_hub: "open-house-hub",
    "the-open-house-hub": "open-house-hub",
    "open-house": "open-house-hub",
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
    scout: "home-scout",
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
    newsletter: "newsletter-studio",
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
    pathfinder: "pathfinder-pro",
    // milo-engine (kept from PR 1 baseline)
    miloengine: "milo-engine",
    milo_engine: "milo-engine",
    milo: "milo-engine",
    // content-engine (kept from PR 1 baseline)
    contentengine: "content-engine",
    content_engine: "content-engine",
    // property-engine
    propertyengine: "property-engine",
    // journey-engine
    journeyengine: "journey-engine",
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
 * Silent probe: normalize any raw slug string to canonical form, returning
 * null when it does not resolve. Identical resolution to `normalizeSlug()`
 * but NEVER emits a warning — use this when a miss is an expected, handled
 * outcome (multi-candidate probing, optional headers, best-effort mapping)
 * and the caller does its own reporting.
 *
 * Resolution order (LOAD-BEARING — do not reorder):
 *   1. canonical set          — the slug is already canonical
 *   2. LEGACY_ALIASES         — an explicitly-mapped drifted variant
 *   3. underscore fold        — `_` → `-`, re-checked against the canonical set
 *
 * Step 2 MUST precede step 3. Several aliases map to a target that is NOT
 * their hyphenated spelling (`rello_crm` / `inbound_sms` / `inbound_email` /
 * `inbound_call` → `rello`; `open_house` → `open-house-hub`); the explicit
 * mapping has to win before any mechanical transform gets a look.
 *
 * Step 3 exists because `toSourceAppIdentifier()` (below, in this same file)
 * defines UPPER_SNAKE routing identifiers as a mechanical `-`→`_` uppercase
 * of the canonical slug — so the inverse fold is a bijection this package
 * already owns. Every `ApiKey.appSource` / `ApiKey.targetApp` /
 * `Event.sourceApp` value is such an identifier. Folding here (rather than
 * enumerating each UPPER_SNAKE form in LEGACY_ALIASES) means a NEW app or
 * engine added to APP_SLUGS / ENGINE_SLUGS is covered automatically, with
 * no second edit and no chance of the two lists drifting apart.
 *
 * The fold is deliberately narrow: it only accepts a result that is already
 * in CANONICAL_SET, so genuinely unknown input (`neighborhood-intel`,
 * `daily_plan`, `FUB`) still resolves to null. No canonical slug contains an
 * underscore, so the fold can never shadow a canonical value.
 */
export function tryNormalizeSlug(raw) {
    if (raw === null || raw === undefined)
        return null;
    const trimmed = String(raw).trim();
    if (trimmed.length === 0)
        return null;
    const lowered = trimmed.toLowerCase();
    // 1. already canonical
    if (CANONICAL_SET.has(lowered))
        return lowered;
    // 2. explicitly-mapped legacy variant (MUST precede the fold — see above)
    const aliased = LEGACY_ALIASES[lowered];
    if (aliased)
        return aliased;
    // 3. UPPER_SNAKE / snake_case routing identifier → canonical slug.
    //    The folded spelling is run through BOTH lookups, in the same order as
    //    steps 1-2. Checking CANONICAL_SET alone is not enough: four alias keys
    //    are hyphenated but NOT canonical, so their underscore spellings
    //    (THE_HOME_SCOUT, THE_HOME_STRETCH, THE_OPEN_HOUSE_HUB, OPEN_HOUSE) would
    //    fall through to null and force callers back into the hand-rolled
    //    hyphenate-and-retry this fold exists to delete.
    const folded = lowered.replace(/_/g, "-");
    if (folded !== lowered) {
        if (CANONICAL_SET.has(folded))
            return folded;
        const foldedAlias = LEGACY_ALIASES[folded];
        if (foldedAlias)
            return foldedAlias;
    }
    return null;
}
/**
 * Normalize any raw slug string to canonical form. Returns null when
 * the input is missing, empty, or refers to a non-platform origin
 * (including `neighborhood-intel`, which is a Property Engine feature
 * not a platform slug).
 *
 * Resolution is `tryNormalizeSlug()`; this wrapper adds the console warning
 * on an unrecognized-but-present value. Missing / empty / whitespace-only
 * input returns null SILENTLY (an absent value is not a drift signal).
 * Prefer `tryNormalizeSlug()` when a miss is expected and handled.
 */
export function normalizeSlug(raw) {
    const resolved = tryNormalizeSlug(raw);
    if (resolved !== null)
        return resolved;
    // Preserve the historical silent-on-absent contract: only a present,
    // non-blank, unrecognized value warrants the drift warning.
    if (raw === null || raw === undefined)
        return null;
    if (String(raw).trim().length === 0)
        return null;
    console.warn(`[@rello-platform/slugs] Unrecognized slug "${raw}" — treating as unknown.`);
    return null;
}
/** Type guard for any canonical platform slug (apps + engines). */
export function isCanonicalSlug(value) {
    return CANONICAL_SET.has(value);
}
/** Type guard: is this slug a consumer App (has an App table row)? */
export function isAppSlug(value) {
    return APP_SLUGS.includes(value);
}
/** Type guard: is this slug a platform Engine (service component)? */
export function isEngineSlug(value) {
    return ENGINE_SLUGS.includes(value);
}
export function toSourceAppIdentifier(slug) {
    return slug.toUpperCase().replace(/-/g, "_");
}
/**
 * Platform System Tenant — singleton canonical identifier for system-context
 * inter-app calls (cron-driven, portal-without-real-tenant, notification-helper,
 * fallback) into tenant-scoped Milo Engine endpoints (`/api/decide`,
 * `/api/chat`, `/api/personalize`, `/api/outcome`, etc.) when no real
 * end-user tenant is in scope.
 *
 * Resolves to a real `Tenant` row in Rello's prod DB
 * (`id="tenant_rello_platform"`, `name="Rello Platform"`, `type=PLATFORM`,
 * `isSystemTenant=true`, `status=ACTIVE`) seeded via
 * `~/Rello/prisma/migrate-platform-tenant.ts` →
 * `ensurePlatformTenant(prisma)` (idempotent `prisma.tenant.upsert`).
 *
 * Use as the `tenantId` field on outbound Milo Engine calls in genuinely
 * no-tenant flows. Forbidden alternatives: legacy spoke-name literals
 * (`"homestretch"`, `"newsletter"`, etc.); spoke `APP_SLUG` literals
 * (e.g. `"home-stretch"`); parallel system-tenant identifiers like
 * `tenant_platform_system`. See `~/.claude/CLAUDE.md` § "Platform System
 * Tenant Convention" for the full guidance including the
 * real-tenant-but-no-lead exception.
 *
 * Singleton today; the `isSystemTenant=true` flag admits multiplicity if a
 * future workstream needs per-purpose system tenants.
 *
 * Provenance: PA-054 Phase B.A (2026-04-27).
 */
export const PLATFORM_TENANT_ID = "tenant_rello_platform";
