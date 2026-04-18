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
export declare const APP_SLUGS: readonly ["rello", "harvest-home", "home-ready", "home-stretch", "home-scout", "market-intel", "newsletter-studio", "the-oven", "the-drumbeat", "open-house-hub", "pathfinder-pro"];
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
export declare const ENGINE_SLUGS: readonly ["milo-engine", "content-engine", "property-engine", "journey-engine", "report-engine", "drumbeat-video-engine"];
/** Every canonical slug in the ecosystem. Derived; do not hand-maintain. */
export declare const PLATFORM_SLUGS: readonly ["rello", "harvest-home", "home-ready", "home-stretch", "home-scout", "market-intel", "newsletter-studio", "the-oven", "the-drumbeat", "open-house-hub", "pathfinder-pro", "milo-engine", "content-engine", "property-engine", "journey-engine", "report-engine", "drumbeat-video-engine"];
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
 * Normalize any raw slug string to canonical form. Returns null when
 * the input is missing, empty, or refers to a non-platform origin
 * (including `neighborhood-intel`, which is a Property Engine feature
 * not a platform slug).
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
 * Derived mechanically from APP_SLUGS — any change to APP_SLUGS propagates
 * automatically. See DISCOVERED-EVENT-SOURCEAPP-FORMAT-WAR-041826.md §8
 * for the decision history (A-013 resolution — Option B).
 */
type Replace<S extends string, From extends string, To extends string> = S extends `${infer L}${From}${infer R}` ? `${L}${To}${Replace<R, From, To>}` : S;
export type SourceAppIdentifier = Uppercase<Replace<AppSlug, "-", "_">>;
export declare function toSourceAppIdentifier(slug: AppSlug): SourceAppIdentifier;
export {};
//# sourceMappingURL=index.d.ts.map