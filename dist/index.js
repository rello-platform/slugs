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
    // prequal-pro: consumer-facing pre-qualification app (its own repo,
    // PreQual-Pro). Emits document-upload / signal traffic to Rello with
    // sourceApp "prequal-pro" / "PREQUAL_PRO". Added v0.8.0 (C-49) — it had a
    // Rello App row and emitters but was missing from this registry, which forced
    // Rello's document-upload receiver to hand-roll a bridge for it (A-107).
    "prequal-pro",
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
 * - tracking-engine: the platform tracking engine (events, interest, hot
 *   moments; Cloudflare Workers, its own Neon project). Authenticates inbound
 *   app keys and calls Rello as TRACKING_ENGINE. Added v0.13.0
 *   (PLATFORM-TRACKING-SYSTEM S1).
 */
export const ENGINE_SLUGS = [
    "milo-engine",
    "content-engine",
    "property-engine",
    "journey-engine",
    "report-engine",
    "drumbeat-video-engine",
    "tracking-engine",
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
    // prequal-pro (the concatenated / camelCase spellings the spoke sends —
    // "PreQualPro"/"PREQUALPRO" fold to "prequalpro"; the underscore form
    // "prequal_pro" is also covered by the step-3 fold, but is listed for parity)
    prequalpro: "prequal-pro",
    prequal_pro: "prequal-pro",
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
/**
 * Rello Growth house tenant — the per-purpose system tenant whose leads are the
 * professionals Rello markets its own software to; its sends go out as Rello.
 * Real `Tenant` row in Rello (`type=GROWTH`, `isSystemTenant=true`). Never use
 * it for system-context calls: that is `PLATFORM_TENANT_ID`.
 */
export const GROWTH_HOUSE_TENANT_ID = "tenant_rello_growth";
// ---------------------------------------------------------------------------
// Feature slugs — what a Rello `Plan.grants` may list (PFP Gateway §4.1, G-2)
// ---------------------------------------------------------------------------
/**
 * Rello surface keys (Home Insight HI-01). Each surface of the hub app (a nav
 * item, tab, card, Quick Actions item, settings tab) carries one key. A plan
 * with `access = GRANTS_ONLY` opens only the surfaces whose key it grants; a
 * FULL plan opens all of them (see `isSurfaceOpen`).
 *
 * - `rello-full` is the key of every surface that is not one of the named keys
 *   below, including surfaces added later. It is never granted to a
 *   GRANTS_ONLY plan: it is what makes "everything else shows locked" hold.
 * - The rest name the surfaces the Home Insight plan decides on one by one
 *   (spec RELLO-HOME-INSIGHT §4 L-13). A key here is not a grant: some exist
 *   only so their surface shows as a locked preview (the Lead Intelligence,
 *   Team, Audit Log and Custom Domain settings tabs).
 *
 * These are internal identifiers. Never render one as customer text.
 *
 * Added v0.15.0.
 */
export const RELLO_SURFACE_SLUGS = Object.freeze([
    "rello-full",
    "rello-dashboard",
    "rello-today",
    "rello-today-tasks",
    "rello-leads-all",
    "rello-leads-home-insight",
    "rello-team-realtor-prospects",
    "rello-team-performance",
    "rello-apps-the-oven",
    "rello-calendar",
    "rello-settings",
    "rello-team-settings-lead-intelligence",
    "rello-team-settings-team",
    "rello-team-settings-brand",
    "rello-team-settings-billing",
    "rello-team-settings-audit-log",
    "rello-team-settings-custom-domain",
    "rello-quick-action-create-lead",
    "rello-quick-action-all-leads",
    "rello-quick-action-realtor-partners",
    "rello-quick-action-past-clients",
    "rello-quick-action-send-homeowner-hub",
]);
/**
 * Harvest Home surface keys decided by Rello's plan access.
 *
 * - `hh-lead-buying` — Discover search and unlock, credit purchase and "Share
 *   with partner" in Harvest Home. Open on every FULL plan (no plan has to list
 *   it) and absent from the Home Insight grants (spec §4 L-7).
 *
 * Added v0.15.0.
 */
export const HH_SURFACE_SLUGS = Object.freeze(["hh-lead-buying"]);
/** Every surface key `isSurfaceOpen` answers for. Derived; do not hand-maintain. */
export const SURFACE_SLUGS = Object.freeze([...RELLO_SURFACE_SLUGS, ...HH_SURFACE_SLUGS]);
const RELLO_SURFACE_SET = new Set(RELLO_SURFACE_SLUGS);
const SURFACE_SET = new Set(SURFACE_SLUGS);
/** True only for an exact Rello surface key (no trimming, no case folding). */
export function isRelloSurfaceSlug(value) {
    return typeof value === "string" && RELLO_SURFACE_SET.has(value);
}
/** True only for an exact surface key, Rello's or Harvest Home's. */
export function isSurfaceSlug(value) {
    return typeof value === "string" && SURFACE_SET.has(value);
}
/**
 * The Home Insight plan's grants: the one copy (spec §4 L-13). Rello's plan
 * seed reads it; nothing else lists these keys.
 *
 * Never contains `rello-full`. The Lead Intelligence, Team, Audit Log and
 * Custom Domain settings tabs stay locked (prospectus :303, KA ruling
 * 2026-11-28 HA-1r); `rello-team-settings-brand` opens Brand & White-Label only.
 * Lead buying (`hh-lead-buying`) is not on the plan.
 *
 * Frozen: a consumer cannot add a grant at runtime.
 *
 * Added v0.15.0.
 */
export const HOME_INSIGHT_PLAN_GRANTS = Object.freeze([
    "rello-dashboard",
    "rello-today",
    "rello-today-tasks",
    "rello-leads-all",
    "rello-leads-home-insight",
    "rello-team-realtor-prospects",
    "rello-team-performance",
    "rello-settings",
    "rello-team-settings-brand",
    "rello-team-settings-billing",
    "rello-apps-the-oven",
    "rello-calendar",
    "rello-quick-action-create-lead",
    "rello-quick-action-all-leads",
    "rello-quick-action-realtor-partners",
    "rello-quick-action-past-clients",
    "rello-quick-action-send-homeowner-hub",
]);
/**
 * Is this surface open for this access? Pure: FULL opens every surface;
 * GRANTS_ONLY opens exactly the keys it grants.
 *
 * Returns `false` for `state: "unknown"` and for anything malformed. `false`
 * on unknown means "not known to be open", NOT "locked": a caller that can tell
 * the difference must check `access.state` itself and treat unknown as unknown
 * (spec §12.1: a granted surface still renders, a `rello-full` surface answers
 * 503 `access_unknown` with a retry, never a lock and never open).
 */
export function isSurfaceOpen(access, key) {
    if (access === null || typeof access !== "object")
        return false;
    if (access.state !== "known")
        return false;
    if (access.mode === "FULL")
        return true;
    if (access.mode !== "GRANTS_ONLY")
        return false;
    const grants = access.grants;
    // Array first: a string also has `includes`, and would match a substring.
    if (Array.isArray(grants))
        return grants.includes(key);
    if (grants instanceof Set)
        return grants.has(key);
    return false;
}
/**
 * Canonical feature slugs a Rello `Plan` may grant in its `grants` column.
 * A feature is narrower than an app: it names a part of an app a plan buys,
 * not an App row, so it is deliberately NOT in `PLATFORM_SLUGS` and never
 * normalizes to one.
 *
 * - `pfp-rates` — the Gateway Rates pages in PathfinderPro.
 * - `pfp-full` — all of PathfinderPro, as today (includes everything
 *   `pfp-rates` gives).
 * - `check-your-rate` — the plan includes Check Your Rate: the existing
 *   add-on feature, not a second entitlement.
 * - `refi-radar` — Refi Radar in PathfinderPro (PFP Gateway §4.12c): included
 *   on Pro and Team, or bought as an add-on on Rates and Starter. PFP shows it
 *   only to a tenant holding this grant.
 * - `pfp-signature` — one live-rate email signature in PathfinderPro: the
 *   Rates setup (lender + comp) without the Rate Widget, which stays locked as
 *   the upgrade to `pfp-rates` (Kelly D64, the $9 Signature plan). A tenant
 *   holding both resolves to Rates.
 * - every surface key (`SURFACE_SLUGS`: `RELLO_SURFACE_SLUGS` then
 *   `hh-lead-buying`), so a Home Insight plan's grants pass the same
 *   validation (Home Insight HI-01, v0.15.0).
 *
 * Rello's plan editor validates `grants` against this list (an off-list slug
 * is a 400), so adding a feature is a release of this package first.
 *
 * ORDER IS LOAD-BEARING: consumers read the first five by index
 * (PathfinderPro `FEATURE_SLUGS[3]` / `[4]`, Rello tests destructuring
 * `[RATES, FULL, CYR]`). Append new slugs; never insert before them.
 */
export const FEATURE_SLUGS = [
    "pfp-rates",
    "pfp-full",
    "check-your-rate",
    "refi-radar",
    "pfp-signature",
    ...SURFACE_SLUGS,
];
const FEATURE_SET = new Set(FEATURE_SLUGS);
/** True only for an exact canonical feature slug (no trimming, no case folding, no aliases). */
export function isFeatureSlug(value) {
    return typeof value === "string" && FEATURE_SET.has(value);
}
// ---------------------------------------------------------------------------
// Platform brand — the one source for the product name users see (RALLYROO Phase 2)
// ---------------------------------------------------------------------------
/**
 * The platform's public brand: the name, domain and addresses a person outside
 * the team sees in UI text, page titles, emails, SMS and AI-written copy.
 *
 * Read it instead of typing the name. A tenant fallback such as
 * `tenant?.tenantName || "Rello"` becomes `tenant?.tenantName || PLATFORM_BRAND.name`,
 * so a later rename is one release of this package, not a sweep of every repo.
 * The lint rule `platform-rules/no-legacy-brand-in-visible-text` refuses the name
 * typed by hand in visible strings and points here.
 *
 * Internal names are NOT the brand and stay "Rello": the `rello` app slug in
 * `APP_SLUGS`, the `@rello-platform` scope, `RELLO_*` env vars, `X-Rello-*`
 * headers, DB tables/columns, log and error strings, and internal app-to-app
 * hosts on hellorello.app.
 *
 * - `name` — the product name, spelled "Rallyroo" (capital R only; never
 *   "RallyRoo" or "RALLYROO"). Kelly, 2026-11-24.
 * - `domain` — the primary public domain (hellorallyroo.com, Kelly 2026-11-24).
 * - `appUrl` — the public homepage / app origin: no trailing slash, so
 *   `${PLATFORM_BRAND.appUrl}/pricing` joins cleanly.
 * - `supportEmail` — the public support mailbox on the primary domain.
 * - `logoUrl` — the absolute email-safe PNG logo. It mirrors the hub's existing
 *   `/email/logos/rello.png` path; the file itself lands with the logo work
 *   (spec Phase 3), so until then this URL may not resolve.
 * - `legacyName` — the old product name. Used by the lint rule and redirects
 *   only; never render it.
 *
 * Added v0.14.0 (PLATFORM-RENAME-RALLYROO Phase 2).
 */
export const PLATFORM_BRAND = Object.freeze({
    name: "Rallyroo",
    domain: "hellorallyroo.com",
    appUrl: "https://hellorallyroo.com",
    supportEmail: "support@hellorallyroo.com",
    logoUrl: "https://hellorallyroo.com/email/logos/rallyroo.png",
    legacyName: "Rello",
});
// ---------------------------------------------------------------------------
// Pro categories — the one list of homeowner pros (Home Insight HI-01, part B §4g)
// ---------------------------------------------------------------------------
/**
 * The pro category groups, in the order the Pros screen shows them (mockup 08).
 * `key` is internal; `label` is the group heading a person sees.
 */
export const PRO_CATEGORY_GROUPS = Object.freeze([
    Object.freeze({ key: "real-estate-pros", label: "Real estate pros" }),
    Object.freeze({ key: "buying-and-selling", label: "Buying and selling" }),
    Object.freeze({ key: "home-improvement", label: "Home improvement and upkeep" }),
    Object.freeze({ key: "money-and-planning", label: "Money and planning" }),
    Object.freeze({ key: "moving-and-settling-in", label: "Moving and settling in" }),
    Object.freeze({ key: "specialty", label: "Specialty" }),
]);
/**
 * Source rows for `PRO_CATEGORIES`. Values are Newsletter Studio's
 * `PartnerType` spellings (NS stores them in live rows) plus
 * `PROPERTY_MANAGER` (KA ruling 2026-11-28: Specialty, not a settlement
 * service). Labels are mockup 08's. `settlementService` marks the decided
 * RESPA list (part B §4f); PEST_CONTROL is not on it.
 */
const PRO_CATEGORY_ROWS = [
    { value: "REALTOR", label: "Realtor", group: "real-estate-pros", settlementService: true },
    { value: "MLO", label: "Mortgage loan officer", group: "real-estate-pros", settlementService: true },
    { value: "INSPECTOR", label: "Home inspector", group: "real-estate-pros", settlementService: true },
    { value: "TITLE", label: "Title", group: "real-estate-pros", settlementService: true },
    { value: "INSURANCE", label: "Insurance", group: "real-estate-pros", settlementService: true },
    { value: "HANDYMAN", label: "Handyman", group: "real-estate-pros", settlementService: false },
    { value: "APPRAISER", label: "Appraiser", group: "buying-and-selling", settlementService: true },
    { value: "HOME_WARRANTY", label: "Home warranty", group: "buying-and-selling", settlementService: true },
    { value: "ESCROW_OFFICER", label: "Escrow officer", group: "buying-and-selling", settlementService: true },
    { value: "REAL_ESTATE_ATTORNEY", label: "Real estate attorney", group: "buying-and-selling", settlementService: true },
    { value: "SURVEYOR", label: "Surveyor", group: "buying-and-selling", settlementService: true },
    { value: "GENERAL_CONTRACTOR", label: "General contractor", group: "home-improvement", settlementService: false },
    { value: "LANDSCAPER", label: "Landscaper", group: "home-improvement", settlementService: false },
    { value: "INTERIOR_DESIGNER", label: "Interior designer", group: "home-improvement", settlementService: false },
    { value: "PAINTER", label: "Painter", group: "home-improvement", settlementService: false },
    { value: "ROOFER", label: "Roofer", group: "home-improvement", settlementService: false },
    { value: "ELECTRICIAN", label: "Electrician", group: "home-improvement", settlementService: false },
    { value: "PLUMBER", label: "Plumber", group: "home-improvement", settlementService: false },
    { value: "HVAC_TECHNICIAN", label: "HVAC technician", group: "home-improvement", settlementService: false },
    { value: "POOL_SERVICE", label: "Pool service", group: "home-improvement", settlementService: false },
    { value: "PEST_CONTROL", label: "Pest control", group: "home-improvement", settlementService: false },
    { value: "CLEANING_SERVICE", label: "Cleaning service", group: "home-improvement", settlementService: false },
    { value: "FINANCIAL_PLANNER", label: "Financial planner", group: "money-and-planning", settlementService: false },
    { value: "CPA_TAX_ADVISOR", label: "CPA / tax advisor", group: "money-and-planning", settlementService: false },
    { value: "ESTATE_PLANNING_ATTORNEY", label: "Estate planning attorney", group: "money-and-planning", settlementService: true },
    { value: "MOVING_COMPANY", label: "Moving company", group: "moving-and-settling-in", settlementService: false },
    { value: "STORAGE_FACILITY", label: "Storage facility", group: "moving-and-settling-in", settlementService: false },
    { value: "LOCKSMITH", label: "Locksmith", group: "moving-and-settling-in", settlementService: false },
    { value: "PHOTOGRAPHER", label: "Photographer", group: "specialty", settlementService: false },
    { value: "SOLAR_INSTALLER", label: "Solar installer", group: "specialty", settlementService: false },
    { value: "STRUCTURAL_ENGINEER", label: "Structural engineer", group: "specialty", settlementService: false },
    { value: "SEPTIC_WELL_INSPECTOR", label: "Septic / well inspector", group: "specialty", settlementService: true },
    { value: "CREDIT_REPAIR", label: "Credit repair", group: "specialty", settlementService: false },
    { value: "BANKRUPTCY_ATTORNEY", label: "Bankruptcy attorney", group: "specialty", settlementService: true },
    { value: "DIVORCE_ATTORNEY", label: "Divorce attorney", group: "specialty", settlementService: true },
    { value: "DOWN_PAYMENT_ASSISTANCE", label: "Down payment assistance", group: "specialty", settlementService: false },
    { value: "HUD_COUNSELOR", label: "HUD counselor", group: "specialty", settlementService: false },
    { value: "BUILDER", label: "Builder", group: "specialty", settlementService: false },
    { value: "PROPERTY_MANAGER", label: "Property manager", group: "specialty", settlementService: false },
    { value: "OTHER", label: "Other", group: "specialty", settlementService: false },
];
/**
 * The six trade tabs on the homeowner page's pros card, in tab order. Every
 * other category shows under More.
 */
export const HUB_TRADE_TABS = Object.freeze([
    "PLUMBER",
    "ELECTRICIAN",
    "HVAC_TECHNICIAN",
    "ROOFER",
    "LANDSCAPER",
    "HANDYMAN",
]);
const HUB_TRADE_TAB_SET = new Set(HUB_TRADE_TABS);
/**
 * Every pro category (40), grouped and in mockup order. The Oven's
 * `ServiceProviderCategory`, NS `PartnerType`, Home Scout's pros card and
 * Rello's wizard all follow this list.
 */
export const PRO_CATEGORIES = Object.freeze(PRO_CATEGORY_ROWS.map((row) => Object.freeze({ ...row, hubTab: HUB_TRADE_TAB_SET.has(row.value) })));
/** The category values alone, in the same order. */
export const PRO_CATEGORY_VALUES = Object.freeze(PRO_CATEGORY_ROWS.map((row) => row.value));
const PRO_CATEGORY_SET = new Set(PRO_CATEGORY_VALUES);
/** True only for an exact category value (no trimming, no case folding, no aliases). */
export function isProCategory(value) {
    return typeof value === "string" && PRO_CATEGORY_SET.has(value);
}
/**
 * Old spellings → current value. The Oven renames `HVAC` and `CLEANER` in its
 * enum (rows kept); a reader that meets an old value maps it here.
 */
export const PRO_CATEGORY_ALIASES = Object.freeze({
    HVAC: "HVAC_TECHNICIAN",
    CLEANER: "CLEANING_SERVICE",
});
/**
 * A stored category value → its current `ProCategory`: itself, or the value an
 * old spelling maps to. Anything else is `null` (exact match; no trimming or
 * case folding, because stored values are enum spellings).
 */
export function normalizeProCategory(raw) {
    if (typeof raw !== "string")
        return null;
    if (PRO_CATEGORY_SET.has(raw))
        return raw;
    if (Object.prototype.hasOwnProperty.call(PRO_CATEGORY_ALIASES, raw)) {
        return PRO_CATEGORY_ALIASES[raw];
    }
    return null;
}
/**
 * Content Engine `HomeCareHint.category` → the pro who does that work, for the
 * care tip that names a pro (part B §4h). Every other care category names none.
 */
export const HOME_CARE_TO_PRO_CATEGORY = Object.freeze({
    plumbing: "PLUMBER",
    hvac: "HVAC_TECHNICIAN",
    electrical: "ELECTRICIAN",
    landscaping: "LANDSCAPER",
    irrigation: "LANDSCAPER",
    roof: "ROOFER",
    foundation: "STRUCTURAL_ENGINEER",
});
/** A care-tip category → its pro category, or `null` when it names none. Trims and lowercases. */
export function proCategoryForHomeCare(category) {
    if (typeof category !== "string")
        return null;
    const key = category.trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(HOME_CARE_TO_PRO_CATEGORY, key))
        return null;
    return HOME_CARE_TO_PRO_CATEGORY[key];
}
// ---------------------------------------------------------------------------
// Nurture streams, hub domains, mortgage data sources (Home Insight HI-01)
// ---------------------------------------------------------------------------
/** Nurture stream slugs a person can opt out of on their own (lowercase, hyphenated). */
export const NURTURE_STREAM_SLUGS = Object.freeze(["home-insight-monthly"]);
export function isNurtureStreamSlug(value) {
    return typeof value === "string" && NURTURE_STREAM_SLUGS.includes(value);
}
/**
 * The domain a tenant's homeowner pages are served on. Rello's and Home
 * Scout's `HubDomain` Prisma enums mirror this list; `THEHOMESCOUT` is the
 * default. `HOMEINSIGHT` is also what marks a Home Insight account (spec §4 L-2).
 */
export const HUB_DOMAINS = Object.freeze(["THEHOMESCOUT", "HOMEINSIGHT"]);
export function isHubDomain(value) {
    return typeof value === "string" && HUB_DOMAINS.includes(value);
}
/**
 * Where one mortgage field's value came from (part C D-1; spec §4 L-8).
 * Property Engine's `MortgageDataSource` Prisma enum mirrors this list.
 *
 * - `LOS_UPLOAD` — the loan officer's own loan-system export (past clients)
 * - `LIST_UPLOAD` — a purchased or prospecting list file
 * - `VENDOR_RECORDED` — a provider, from recorded documents
 * - `VENDOR_ESTIMATED` — a provider's own model
 * - `MARKET_ESTIMATE` — PE's closing-month Freddie Mac estimate
 * - `AMORTIZED` — balance computed from amount, rate, term and date
 * - `HOMEOWNER` — the homeowner's own correction
 * - `BATCHDATA_LEGACY` — rows written before field sources existed
 */
export const MORTGAGE_DATA_SOURCES = Object.freeze([
    "LOS_UPLOAD",
    "LIST_UPLOAD",
    "VENDOR_RECORDED",
    "VENDOR_ESTIMATED",
    "MARKET_ESTIMATE",
    "AMORTIZED",
    "HOMEOWNER",
    "BATCHDATA_LEGACY",
]);
export function isMortgageDataSource(value) {
    return typeof value === "string" && MORTGAGE_DATA_SOURCES.includes(value);
}
/**
 * The source of any figure on the homeowner page: a mortgage source, or
 * `VALUATION` for the home's value and equity (spec §4 L-8). One vocabulary;
 * PE's mortgage enum holds only `MORTGAGE_DATA_SOURCES`.
 */
export const HOME_FIGURE_SOURCES = Object.freeze([...MORTGAGE_DATA_SOURCES, "VALUATION"]);
