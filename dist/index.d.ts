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
export declare const APP_SLUGS: readonly ["arive", "rello", "harvest-home", "home-ready", "home-stretch", "home-scout", "market-intel", "newsletter-studio", "the-oven", "the-drumbeat", "open-house-hub", "pathfinder-pro", "prequal-pro"];
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
export declare const ENGINE_SLUGS: readonly ["milo-engine", "content-engine", "property-engine", "journey-engine", "report-engine", "drumbeat-video-engine", "tracking-engine"];
/** Every canonical slug in the ecosystem. Derived; do not hand-maintain. */
export declare const PLATFORM_SLUGS: readonly ["arive", "rello", "harvest-home", "home-ready", "home-stretch", "home-scout", "market-intel", "newsletter-studio", "the-oven", "the-drumbeat", "open-house-hub", "pathfinder-pro", "prequal-pro", "milo-engine", "content-engine", "property-engine", "journey-engine", "report-engine", "drumbeat-video-engine", "tracking-engine"];
export type AppSlug = (typeof APP_SLUGS)[number];
export type EngineSlug = (typeof ENGINE_SLUGS)[number];
export type PlatformSlug = AppSlug | EngineSlug;
/** Read-only Set for fast `.has()` checks over the full platform slug space. */
export declare const CANONICAL_SET: ReadonlySet<PlatformSlug>;
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
export declare const LEGACY_ALIASES: Readonly<Record<string, PlatformSlug>>;
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
export declare function tryNormalizeSlug(raw: string | null | undefined): PlatformSlug | null;
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
export declare function normalizeSlug(raw: string | null | undefined): PlatformSlug | null;
/** Type guard for any canonical platform slug (apps + engines). */
export declare function isCanonicalSlug(value: string): value is PlatformSlug;
/** Type guard: is this slug a consumer App (has an App table row)? */
export declare function isAppSlug(value: string): value is AppSlug;
/** Type guard: is this slug a platform Engine (service component)? */
export declare function isEngineSlug(value: string): value is EngineSlug;
/**
 * UPPERCASE_UNDERSCORE stable routing identifier for Event.sourceApp,
 * Journey.appSource, Message.appSource, CommunicationTemplate.sourceApp,
 * Document.sourceApp, ApiKey.appSource, OAuthApp.appSource, App.appSourceKey.
 *
 * Derived mechanically from PLATFORM_SLUGS — covers BOTH consumer apps
 * (AppSlug) AND platform engines (EngineSlug), because engines legitimately
 * write routing identifiers too: Journey Engine posts to Rello `/api/events`
 * with `sourceApp: "JOURNEY_ENGINE"`, ApiKey admin creates keys with
 * `appSource: "MILO_ENGINE"` / `"CONTENT_ENGINE"` / `"PROPERTY_ENGINE"`.
 * Any APP_SLUGS or ENGINE_SLUGS change propagates to this type automatically.
 *
 * See DISCOVERED-EVENT-SOURCEAPP-FORMAT-WAR-041826.md §8 for the decision
 * history (A-013 resolution — Option B). v0.3.1 widened the type from
 * AppSlug-only to PlatformSlug after the post-commit microscopic re-audit
 * surfaced engine-identifier producers that v0.3.0 would have rejected.
 */
type Replace<S extends string, From extends string, To extends string> = S extends `${infer L}${From}${infer R}` ? `${L}${To}${Replace<R, From, To>}` : S;
export type SourceAppIdentifier = Uppercase<Replace<PlatformSlug, "-", "_">>;
export declare function toSourceAppIdentifier(slug: PlatformSlug): SourceAppIdentifier;
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
export declare const PLATFORM_TENANT_ID: "tenant_rello_platform";
/**
 * Rello Growth house tenant — the per-purpose system tenant whose leads are the
 * professionals Rello markets its own software to; its sends go out as Rello.
 * Real `Tenant` row in Rello (`type=GROWTH`, `isSystemTenant=true`). Never use
 * it for system-context calls: that is `PLATFORM_TENANT_ID`.
 */
export declare const GROWTH_HOUSE_TENANT_ID: "tenant_rello_growth";
export type SystemTenantId = typeof PLATFORM_TENANT_ID | typeof GROWTH_HOUSE_TENANT_ID;
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
export declare const RELLO_SURFACE_SLUGS: readonly ["rello-full", "rello-dashboard", "rello-today", "rello-today-tasks", "rello-leads-all", "rello-leads-home-insight", "rello-team-realtor-prospects", "rello-team-performance", "rello-apps-the-oven", "rello-calendar", "rello-settings", "rello-team-settings-lead-intelligence", "rello-team-settings-team", "rello-team-settings-brand", "rello-team-settings-billing", "rello-team-settings-audit-log", "rello-team-settings-custom-domain", "rello-quick-action-create-lead", "rello-quick-action-all-leads", "rello-quick-action-realtor-partners", "rello-quick-action-past-clients", "rello-quick-action-send-homeowner-hub"];
export type RelloSurfaceSlug = (typeof RELLO_SURFACE_SLUGS)[number];
/**
 * Harvest Home surface keys decided by Rello's plan access.
 *
 * - `hh-lead-buying` — Discover search and unlock, credit purchase and "Share
 *   with partner" in Harvest Home. Open on every FULL plan (no plan has to list
 *   it) and absent from the Home Insight grants (spec §4 L-7).
 *
 * Added v0.15.0.
 */
export declare const HH_SURFACE_SLUGS: readonly ["hh-lead-buying"];
export type HhSurfaceSlug = (typeof HH_SURFACE_SLUGS)[number];
/** Every surface key `isSurfaceOpen` answers for. Derived; do not hand-maintain. */
export declare const SURFACE_SLUGS: readonly ["rello-full", "rello-dashboard", "rello-today", "rello-today-tasks", "rello-leads-all", "rello-leads-home-insight", "rello-team-realtor-prospects", "rello-team-performance", "rello-apps-the-oven", "rello-calendar", "rello-settings", "rello-team-settings-lead-intelligence", "rello-team-settings-team", "rello-team-settings-brand", "rello-team-settings-billing", "rello-team-settings-audit-log", "rello-team-settings-custom-domain", "rello-quick-action-create-lead", "rello-quick-action-all-leads", "rello-quick-action-realtor-partners", "rello-quick-action-past-clients", "rello-quick-action-send-homeowner-hub", "hh-lead-buying"];
export type SurfaceSlug = RelloSurfaceSlug | HhSurfaceSlug;
/** True only for an exact Rello surface key (no trimming, no case folding). */
export declare function isRelloSurfaceSlug(value: unknown): value is RelloSurfaceSlug;
/** True only for an exact surface key, Rello's or Harvest Home's. */
export declare function isSurfaceSlug(value: unknown): value is SurfaceSlug;
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
export declare const HOME_INSIGHT_PLAN_GRANTS: readonly ["rello-dashboard", "rello-today", "rello-today-tasks", "rello-leads-all", "rello-leads-home-insight", "rello-team-realtor-prospects", "rello-team-performance", "rello-settings", "rello-team-settings-brand", "rello-team-settings-billing", "rello-apps-the-oven", "rello-calendar", "rello-quick-action-create-lead", "rello-quick-action-all-leads", "rello-quick-action-realtor-partners", "rello-quick-action-past-clients", "rello-quick-action-send-homeowner-hub"];
export type HomeInsightPlanGrant = (typeof HOME_INSIGHT_PLAN_GRANTS)[number];
/**
 * A tenant's resolved plan access, as Rello's resolver returns it (spec §6
 * X-01). `grants` may be a Set or an array, so the resolver's
 * `ReadonlySet<RelloSurfaceSlug>` and a JSON-decoded `string[]` both fit.
 * `trialEndsAt` is informational here: the resolver already answers FULL
 * while a trial runs.
 */
export type SurfaceAccess = {
    readonly state: "known";
    readonly mode: "FULL";
} | {
    readonly state: "known";
    readonly mode: "GRANTS_ONLY";
    readonly grants: ReadonlySet<string> | readonly string[];
    readonly trialEndsAt?: Date | string | null;
} | {
    readonly state: "unknown";
    readonly reason: string;
};
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
export declare function isSurfaceOpen(access: SurfaceAccess | null | undefined, key: SurfaceSlug): boolean;
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
export declare const FEATURE_SLUGS: readonly ["pfp-rates", "pfp-full", "check-your-rate", "refi-radar", "pfp-signature", "rello-full", "rello-dashboard", "rello-today", "rello-today-tasks", "rello-leads-all", "rello-leads-home-insight", "rello-team-realtor-prospects", "rello-team-performance", "rello-apps-the-oven", "rello-calendar", "rello-settings", "rello-team-settings-lead-intelligence", "rello-team-settings-team", "rello-team-settings-brand", "rello-team-settings-billing", "rello-team-settings-audit-log", "rello-team-settings-custom-domain", "rello-quick-action-create-lead", "rello-quick-action-all-leads", "rello-quick-action-realtor-partners", "rello-quick-action-past-clients", "rello-quick-action-send-homeowner-hub", "hh-lead-buying"];
export type FeatureSlug = (typeof FEATURE_SLUGS)[number];
/** True only for an exact canonical feature slug (no trimming, no case folding, no aliases). */
export declare function isFeatureSlug(value: unknown): value is FeatureSlug;
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
export declare const PLATFORM_BRAND: Readonly<{
    readonly name: "Rallyroo";
    readonly domain: "hellorallyroo.com";
    readonly appUrl: "https://hellorallyroo.com";
    readonly supportEmail: "support@hellorallyroo.com";
    readonly logoUrl: "https://hellorallyroo.com/email/logos/rallyroo.png";
    readonly legacyName: "Rello";
}>;
export type PlatformBrand = typeof PLATFORM_BRAND;
/**
 * The pro category groups, in the order the Pros screen shows them (mockup 08).
 * `key` is internal; `label` is the group heading a person sees.
 */
export declare const PRO_CATEGORY_GROUPS: readonly [Readonly<{
    key: "real-estate-pros";
    label: "Real estate pros";
}>, Readonly<{
    key: "buying-and-selling";
    label: "Buying and selling";
}>, Readonly<{
    key: "home-improvement";
    label: "Home improvement and upkeep";
}>, Readonly<{
    key: "money-and-planning";
    label: "Money and planning";
}>, Readonly<{
    key: "moving-and-settling-in";
    label: "Moving and settling in";
}>, Readonly<{
    key: "specialty";
    label: "Specialty";
}>];
export type ProCategoryGroupKey = (typeof PRO_CATEGORY_GROUPS)[number]["key"];
/**
 * Source rows for `PRO_CATEGORIES`. Values are Newsletter Studio's
 * `PartnerType` spellings (NS stores them in live rows) plus
 * `PROPERTY_MANAGER` (KA ruling 2026-11-28: Specialty, not a settlement
 * service). Labels are mockup 08's. `settlementService` marks the decided
 * RESPA list (part B §4f); PEST_CONTROL is not on it.
 */
declare const PRO_CATEGORY_ROWS: readonly [{
    readonly value: "REALTOR";
    readonly label: "Realtor";
    readonly group: "real-estate-pros";
    readonly settlementService: true;
}, {
    readonly value: "MLO";
    readonly label: "Mortgage loan officer";
    readonly group: "real-estate-pros";
    readonly settlementService: true;
}, {
    readonly value: "INSPECTOR";
    readonly label: "Home inspector";
    readonly group: "real-estate-pros";
    readonly settlementService: true;
}, {
    readonly value: "TITLE";
    readonly label: "Title";
    readonly group: "real-estate-pros";
    readonly settlementService: true;
}, {
    readonly value: "INSURANCE";
    readonly label: "Insurance";
    readonly group: "real-estate-pros";
    readonly settlementService: true;
}, {
    readonly value: "HANDYMAN";
    readonly label: "Handyman";
    readonly group: "real-estate-pros";
    readonly settlementService: false;
}, {
    readonly value: "APPRAISER";
    readonly label: "Appraiser";
    readonly group: "buying-and-selling";
    readonly settlementService: true;
}, {
    readonly value: "HOME_WARRANTY";
    readonly label: "Home warranty";
    readonly group: "buying-and-selling";
    readonly settlementService: true;
}, {
    readonly value: "ESCROW_OFFICER";
    readonly label: "Escrow officer";
    readonly group: "buying-and-selling";
    readonly settlementService: true;
}, {
    readonly value: "REAL_ESTATE_ATTORNEY";
    readonly label: "Real estate attorney";
    readonly group: "buying-and-selling";
    readonly settlementService: true;
}, {
    readonly value: "SURVEYOR";
    readonly label: "Surveyor";
    readonly group: "buying-and-selling";
    readonly settlementService: true;
}, {
    readonly value: "GENERAL_CONTRACTOR";
    readonly label: "General contractor";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "LANDSCAPER";
    readonly label: "Landscaper";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "INTERIOR_DESIGNER";
    readonly label: "Interior designer";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "PAINTER";
    readonly label: "Painter";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "ROOFER";
    readonly label: "Roofer";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "ELECTRICIAN";
    readonly label: "Electrician";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "PLUMBER";
    readonly label: "Plumber";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "HVAC_TECHNICIAN";
    readonly label: "HVAC technician";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "POOL_SERVICE";
    readonly label: "Pool service";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "PEST_CONTROL";
    readonly label: "Pest control";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "CLEANING_SERVICE";
    readonly label: "Cleaning service";
    readonly group: "home-improvement";
    readonly settlementService: false;
}, {
    readonly value: "FINANCIAL_PLANNER";
    readonly label: "Financial planner";
    readonly group: "money-and-planning";
    readonly settlementService: false;
}, {
    readonly value: "CPA_TAX_ADVISOR";
    readonly label: "CPA / tax advisor";
    readonly group: "money-and-planning";
    readonly settlementService: false;
}, {
    readonly value: "ESTATE_PLANNING_ATTORNEY";
    readonly label: "Estate planning attorney";
    readonly group: "money-and-planning";
    readonly settlementService: true;
}, {
    readonly value: "MOVING_COMPANY";
    readonly label: "Moving company";
    readonly group: "moving-and-settling-in";
    readonly settlementService: false;
}, {
    readonly value: "STORAGE_FACILITY";
    readonly label: "Storage facility";
    readonly group: "moving-and-settling-in";
    readonly settlementService: false;
}, {
    readonly value: "LOCKSMITH";
    readonly label: "Locksmith";
    readonly group: "moving-and-settling-in";
    readonly settlementService: false;
}, {
    readonly value: "PHOTOGRAPHER";
    readonly label: "Photographer";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "SOLAR_INSTALLER";
    readonly label: "Solar installer";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "STRUCTURAL_ENGINEER";
    readonly label: "Structural engineer";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "SEPTIC_WELL_INSPECTOR";
    readonly label: "Septic / well inspector";
    readonly group: "specialty";
    readonly settlementService: true;
}, {
    readonly value: "CREDIT_REPAIR";
    readonly label: "Credit repair";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "BANKRUPTCY_ATTORNEY";
    readonly label: "Bankruptcy attorney";
    readonly group: "specialty";
    readonly settlementService: true;
}, {
    readonly value: "DIVORCE_ATTORNEY";
    readonly label: "Divorce attorney";
    readonly group: "specialty";
    readonly settlementService: true;
}, {
    readonly value: "DOWN_PAYMENT_ASSISTANCE";
    readonly label: "Down payment assistance";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "HUD_COUNSELOR";
    readonly label: "HUD counselor";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "BUILDER";
    readonly label: "Builder";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "PROPERTY_MANAGER";
    readonly label: "Property manager";
    readonly group: "specialty";
    readonly settlementService: false;
}, {
    readonly value: "OTHER";
    readonly label: "Other";
    readonly group: "specialty";
    readonly settlementService: false;
}];
export type ProCategory = (typeof PRO_CATEGORY_ROWS)[number]["value"];
/**
 * The six trade tabs on the homeowner page's pros card, in tab order. Every
 * other category shows under More.
 */
export declare const HUB_TRADE_TABS: readonly ["PLUMBER", "ELECTRICIAN", "HVAC_TECHNICIAN", "ROOFER", "LANDSCAPER", "HANDYMAN"];
export interface ProCategoryEntry {
    readonly value: ProCategory;
    /** The category name a person sees. */
    readonly label: string;
    readonly group: ProCategoryGroupKey;
    /** On the decided RESPA settlement-service list: the Pros screen shows its heads-up. Never a gate. */
    readonly settlementService: boolean;
    /** One of `HUB_TRADE_TABS` (derived from it, so the two cannot disagree). */
    readonly hubTab: boolean;
}
/**
 * Every pro category (40), grouped and in mockup order. The Oven's
 * `ServiceProviderCategory`, NS `PartnerType`, Home Scout's pros card and
 * Rello's wizard all follow this list.
 */
export declare const PRO_CATEGORIES: readonly ProCategoryEntry[];
/** The category values alone, in the same order. */
export declare const PRO_CATEGORY_VALUES: readonly ProCategory[];
/** True only for an exact category value (no trimming, no case folding, no aliases). */
export declare function isProCategory(value: unknown): value is ProCategory;
/**
 * Old spellings → current value. The Oven renames `HVAC` and `CLEANER` in its
 * enum (rows kept); a reader that meets an old value maps it here.
 */
export declare const PRO_CATEGORY_ALIASES: Readonly<{
    readonly HVAC: "HVAC_TECHNICIAN";
    readonly CLEANER: "CLEANING_SERVICE";
}>;
/**
 * A stored category value → its current `ProCategory`: itself, or the value an
 * old spelling maps to. Anything else is `null` (exact match; no trimming or
 * case folding, because stored values are enum spellings).
 */
export declare function normalizeProCategory(raw: unknown): ProCategory | null;
/**
 * Content Engine `HomeCareHint.category` → the pro who does that work, for the
 * care tip that names a pro (part B §4h). Every other care category names none.
 */
export declare const HOME_CARE_TO_PRO_CATEGORY: Readonly<{
    readonly plumbing: "PLUMBER";
    readonly hvac: "HVAC_TECHNICIAN";
    readonly electrical: "ELECTRICIAN";
    readonly landscaping: "LANDSCAPER";
    readonly irrigation: "LANDSCAPER";
    readonly roof: "ROOFER";
    readonly foundation: "STRUCTURAL_ENGINEER";
}>;
/** A care-tip category → its pro category, or `null` when it names none. Trims and lowercases. */
export declare function proCategoryForHomeCare(category: unknown): ProCategory | null;
/** Nurture stream slugs a person can opt out of on their own (lowercase, hyphenated). */
export declare const NURTURE_STREAM_SLUGS: readonly ["home-insight-monthly"];
export type NurtureStreamSlug = (typeof NURTURE_STREAM_SLUGS)[number];
export declare function isNurtureStreamSlug(value: unknown): value is NurtureStreamSlug;
/**
 * The domain a tenant's homeowner pages are served on. Rello's and Home
 * Scout's `HubDomain` Prisma enums mirror this list; `THEHOMESCOUT` is the
 * default. `HOMEINSIGHT` is also what marks a Home Insight account (spec §4 L-2).
 */
export declare const HUB_DOMAINS: readonly ["THEHOMESCOUT", "HOMEINSIGHT"];
export type HubDomain = (typeof HUB_DOMAINS)[number];
export declare function isHubDomain(value: unknown): value is HubDomain;
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
export declare const MORTGAGE_DATA_SOURCES: readonly ["LOS_UPLOAD", "LIST_UPLOAD", "VENDOR_RECORDED", "VENDOR_ESTIMATED", "MARKET_ESTIMATE", "AMORTIZED", "HOMEOWNER", "BATCHDATA_LEGACY"];
export type MortgageDataSource = (typeof MORTGAGE_DATA_SOURCES)[number];
export declare function isMortgageDataSource(value: unknown): value is MortgageDataSource;
/**
 * The source of any figure on the homeowner page: a mortgage source, or
 * `VALUATION` for the home's value and equity (spec §4 L-8). One vocabulary;
 * PE's mortgage enum holds only `MORTGAGE_DATA_SOURCES`.
 */
export declare const HOME_FIGURE_SOURCES: readonly ["LOS_UPLOAD", "LIST_UPLOAD", "VENDOR_RECORDED", "VENDOR_ESTIMATED", "MARKET_ESTIMATE", "AMORTIZED", "HOMEOWNER", "BATCHDATA_LEGACY", "VALUATION"];
export type HomeFigureSource = (typeof HOME_FIGURE_SOURCES)[number];
export {};
//# sourceMappingURL=index.d.ts.map