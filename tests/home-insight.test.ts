import { describe, expect, test } from "vitest";
import {
  FEATURE_SLUGS,
  HH_SURFACE_SLUGS,
  HOME_CARE_TO_PRO_CATEGORY,
  HOME_FIGURE_SOURCES,
  HOME_INSIGHT_PLAN_GRANTS,
  HUB_DOMAINS,
  HUB_TRADE_TABS,
  MORTGAGE_DATA_SOURCES,
  NURTURE_STREAM_SLUGS,
  PLATFORM_SLUGS,
  PRO_CATEGORIES,
  PRO_CATEGORY_ALIASES,
  PRO_CATEGORY_GROUPS,
  PRO_CATEGORY_VALUES,
  RELLO_SURFACE_SLUGS,
  SURFACE_SLUGS,
  isFeatureSlug,
  isHubDomain,
  isMortgageDataSource,
  isNurtureStreamSlug,
  isProCategory,
  isRelloSurfaceSlug,
  isSurfaceOpen,
  isSurfaceSlug,
  normalizeProCategory,
  proCategoryForHomeCare,
  tryNormalizeSlug,
  type HubDomain,
  type MortgageDataSource,
  type ProCategory,
  type RelloSurfaceSlug,
  type SurfaceAccess,
  type SurfaceSlug,
} from "../src/index";
import { NS_PARTNER_TYPE_ENUM_25F8FCC2 } from "./fixtures/ns-partner-type-25f8fcc2";

// HOME INSIGHT HI-01 (spec RELLO-HOME-INSIGHT/_SPEC-FEATURE.md §9 HI-01, §4 L-7/L-8/L-13).

// Object.isFrozen(undefined) is true, so a frozen check alone passes on a missing export.
function expectFrozen(value: unknown): void {
  expect(typeof value === "object" && value !== null).toBe(true);
  expect(Object.isFrozen(value)).toBe(true);
}

// ── Surface keys ────────────────────────────────────────────────────────────

// Part A §4a's v1 keys plus `rello-calendar` (HA-1) and the Audit Log and Custom
// Domain tabs (AMENDED 018, ledger HA-1r), in the package's order.
const SPEC_SURFACE_KEYS = [
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
];

// §4 L-13, the grant table, row by row (as amended by the KA ruling of 2026-11-28, HA-1r).
const L13_GRANTS = [
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
];

describe("RELLO_SURFACE_SLUGS", () => {
  test("every key is rello- prefixed, lowercase and hyphenated, and unique", () => {
    expect(RELLO_SURFACE_SLUGS.length).toBeGreaterThan(0);
    for (const key of RELLO_SURFACE_SLUGS) expect(key).toMatch(/^rello(-[a-z]+)+$/);
    expect(new Set(RELLO_SURFACE_SLUGS).size).toBe(RELLO_SURFACE_SLUGS.length);
  });

  test("rello-full (the key of every surface not granted) and rello-calendar are present", () => {
    expect(RELLO_SURFACE_SLUGS).toContain("rello-full");
    expect(RELLO_SURFACE_SLUGS).toContain("rello-calendar");
  });

  test("is exactly part A §4a's keys plus rello-calendar, audit-log and custom-domain", () => {
    expect([...RELLO_SURFACE_SLUGS]).toEqual(SPEC_SURFACE_KEYS);
  });

  test("hh-lead-buying is its own surface key, not a rello- key", () => {
    expect([...HH_SURFACE_SLUGS]).toEqual(["hh-lead-buying"]);
    expect(RELLO_SURFACE_SLUGS as readonly string[]).not.toContain("hh-lead-buying");
    expect([...SURFACE_SLUGS]).toEqual([...RELLO_SURFACE_SLUGS, "hh-lead-buying"]);
  });

  test("every surface key is a feature slug, so Plan.grants validation covers it", () => {
    for (const key of SURFACE_SLUGS) {
      expect(FEATURE_SLUGS as readonly string[]).toContain(key);
      expect(isFeatureSlug(key)).toBe(true);
    }
  });

  test("no surface key is a platform slug or normalizes to one", () => {
    const platform: readonly string[] = PLATFORM_SLUGS;
    for (const key of SURFACE_SLUGS) {
      expect(platform).not.toContain(key);
      expect(tryNormalizeSlug(key)).toBeNull();
    }
  });

  test("the lists are frozen at runtime", () => {
    expectFrozen(RELLO_SURFACE_SLUGS);
    expectFrozen(HH_SURFACE_SLUGS);
    expectFrozen(SURFACE_SLUGS);
  });

  test("type guards are exact", () => {
    expect(isRelloSurfaceSlug("rello-today")).toBe(true);
    expect(isRelloSurfaceSlug("hh-lead-buying")).toBe(false);
    expect(isSurfaceSlug("hh-lead-buying")).toBe(true);
    for (const v of ["RELLO-TODAY", " rello-today", "rello-today ", "rello_today", "rello", "pfp-rates", "", null, undefined, 1, {}, ["rello-today"]]) {
      expect(isRelloSurfaceSlug(v)).toBe(false);
      expect(isSurfaceSlug(v)).toBe(false);
    }
    const raw: unknown = "rello-calendar";
    if (!isRelloSurfaceSlug(raw)) throw new Error("expected a surface slug");
    const narrowed: RelloSurfaceSlug = raw;
    expect(narrowed).toBe("rello-calendar");
    // @ts-expect-error: a PFP feature is not a Rello surface key.
    const notASurface: RelloSurfaceSlug = "pfp-rates";
    expect(notASurface).toBe("pfp-rates");
  });
});

describe("FEATURE_SLUGS keeps its positional reads", () => {
  // PathfinderPro and Rello read FEATURE_SLUGS[0..4] by index (PFP
  // resolve-pfp-plan.ts GRANT_PFP_SIGNATURE = FEATURE_SLUGS[4], refi-radar
  // feature.ts FEATURE_SLUGS[3]; Rello tests destructure [RATES, FULL, CYR]).
  // New keys go after them, never before.
  test("the five gateway features stay first, in order", () => {
    expect(FEATURE_SLUGS.slice(0, 5)).toEqual(["pfp-rates", "pfp-full", "check-your-rate", "refi-radar", "pfp-signature"]);
    expect(FEATURE_SLUGS[3]).toBe("refi-radar");
    expect(FEATURE_SLUGS[4]).toBe("pfp-signature");
  });

  test("is the five gateway features, then every surface key, with no duplicate", () => {
    expect([...FEATURE_SLUGS]).toEqual(["pfp-rates", "pfp-full", "check-your-rate", "refi-radar", "pfp-signature", ...SURFACE_SLUGS]);
    expect(new Set(FEATURE_SLUGS).size).toBe(FEATURE_SLUGS.length);
  });
});

// ── Home Insight grant set (L-13, HA-1) ─────────────────────────────────────

describe("HOME_INSIGHT_PLAN_GRANTS", () => {
  test("never contains rello-full", () => {
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).not.toContain("rello-full");
  });

  test("contains rello-calendar", () => {
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).toContain("rello-calendar");
  });

  test("every grant is a RELLO_SURFACE_SLUGS member, with no duplicate", () => {
    for (const grant of HOME_INSIGHT_PLAN_GRANTS) expect(RELLO_SURFACE_SLUGS as readonly string[]).toContain(grant);
    expect(new Set(HOME_INSIGHT_PLAN_GRANTS).size).toBe(HOME_INSIGHT_PLAN_GRANTS.length);
  });

  test("does not open lead buying", () => {
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).not.toContain("hh-lead-buying");
  });

  test("is exactly §4 L-13's grant table", () => {
    expect([...HOME_INSIGHT_PLAN_GRANTS]).toEqual(L13_GRANTS);
  });

  // AMENDED 018 (HA-1r): prospectus :303 locks these four Team Settings tabs on the
  // plan; they stay in RELLO_SURFACE_SLUGS as locked previews. Brand and Billing stay open.
  test("keeps Lead Intelligence, Team, Audit Log and Custom Domain locked; Brand and Billing open", () => {
    const locked = [
      "rello-team-settings-lead-intelligence",
      "rello-team-settings-team",
      "rello-team-settings-audit-log",
      "rello-team-settings-custom-domain",
    ];
    for (const key of locked) {
      expect(RELLO_SURFACE_SLUGS as readonly string[]).toContain(key);
      expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).not.toContain(key);
    }
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).toContain("rello-team-settings-brand");
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).toContain("rello-team-settings-billing");
  });

  test("is frozen, so no consumer can add a grant at runtime", () => {
    expectFrozen(HOME_INSIGHT_PLAN_GRANTS);
    expect(() => (HOME_INSIGHT_PLAN_GRANTS as unknown as string[]).push("rello-full")).toThrow();
    expect(HOME_INSIGHT_PLAN_GRANTS as readonly string[]).not.toContain("rello-full");
  });
});

// ── isSurfaceOpen (L-7) ─────────────────────────────────────────────────────

describe("isSurfaceOpen", () => {
  const FULL: SurfaceAccess = { state: "known", mode: "FULL" };
  const UNKNOWN: SurfaceAccess = { state: "unknown", reason: "plan_unreadable" };
  const hiSet: SurfaceAccess = { state: "known", mode: "GRANTS_ONLY", grants: new Set(HOME_INSIGHT_PLAN_GRANTS), trialEndsAt: null };
  const hiArray: SurfaceAccess = { state: "known", mode: "GRANTS_ONLY", grants: HOME_INSIGHT_PLAN_GRANTS, trialEndsAt: null };

  test("FULL opens every surface, including rello-full and lead buying", () => {
    for (const key of SURFACE_SLUGS) expect(isSurfaceOpen(FULL, key)).toBe(true);
  });

  test("GRANTS_ONLY opens exactly its grants (Set or array)", () => {
    for (const access of [hiSet, hiArray]) {
      for (const key of SURFACE_SLUGS) {
        expect(isSurfaceOpen(access, key)).toBe((HOME_INSIGHT_PLAN_GRANTS as readonly string[]).includes(key));
      }
      expect(isSurfaceOpen(access, "rello-full")).toBe(false);
      expect(isSurfaceOpen(access, "hh-lead-buying")).toBe(false);
      expect(isSurfaceOpen(access, "rello-calendar")).toBe(true);
    }
  });

  test("GRANTS_ONLY with an empty grant list opens nothing", () => {
    const empty: SurfaceAccess = { state: "known", mode: "GRANTS_ONLY", grants: [], trialEndsAt: null };
    for (const key of SURFACE_SLUGS) expect(isSurfaceOpen(empty, key)).toBe(false);
  });

  test("unknown returns false for every key, granted ones included", () => {
    for (const key of SURFACE_SLUGS) expect(isSurfaceOpen(UNKNOWN, key)).toBe(false);
  });

  test("malformed access is never open", () => {
    const bad: unknown[] = [
      null,
      undefined,
      "FULL",
      1,
      {},
      { state: "known" },
      { state: "known", mode: "full" },
      { state: "known", mode: "PARTIAL", grants: ["rello-today"] },
      { mode: "FULL" },
      { state: "unknown", mode: "FULL" },
      { state: "known", mode: "GRANTS_ONLY" },
      { state: "known", mode: "GRANTS_ONLY", grants: null },
      { state: "known", mode: "GRANTS_ONLY", grants: { "rello-today": true } },
      // a string would pass String#includes for a substring of a granted key
      { state: "known", mode: "GRANTS_ONLY", grants: "rello-today-tasks" },
    ];
    for (const access of bad) expect(isSurfaceOpen(access as SurfaceAccess, "rello-today")).toBe(false);
  });

  test("does not change the access it reads", () => {
    const grants = new Set<string>(["rello-today"]);
    const access: SurfaceAccess = { state: "known", mode: "GRANTS_ONLY", grants, trialEndsAt: null };
    isSurfaceOpen(access, "rello-full");
    isSurfaceOpen(access, "rello-today");
    expect([...grants]).toEqual(["rello-today"]);
  });

  test("accepts the resolver's ReadonlySet<RelloSurfaceSlug> shape", () => {
    const grants: ReadonlySet<RelloSurfaceSlug> = new Set<RelloSurfaceSlug>(["rello-settings"]);
    const access: SurfaceAccess = { state: "known", mode: "GRANTS_ONLY", grants, trialEndsAt: new Date(0) };
    const key: SurfaceSlug = "rello-settings";
    expect(isSurfaceOpen(access, key)).toBe(true);
  });
});

// ── Pro categories (part B §4g, H-01; PROPERTY_MANAGER per the KA ruling) ───

function enumValues(prismaEnum: string): string[] {
  const body = prismaEnum.slice(prismaEnum.indexOf("{") + 1, prismaEnum.lastIndexOf("}"));
  return body
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter((line) => line.length > 0);
}

const NS_PARTNER_TYPES = enumValues(NS_PARTNER_TYPE_ENUM_25F8FCC2);

// Part B §4f: the decided RESPA list (settlement services). PEST_CONTROL and PROPERTY_MANAGER are not on it.
const RESPA_SETTLEMENT_SERVICES = [
  "REALTOR",
  "MLO",
  "INSPECTOR",
  "TITLE",
  "INSURANCE",
  "APPRAISER",
  "HOME_WARRANTY",
  "ESCROW_OFFICER",
  "SURVEYOR",
  "SEPTIC_WELL_INSPECTOR",
  "REAL_ESTATE_ATTORNEY",
  "ESTATE_PLANNING_ATTORNEY",
  "BANKRUPTCY_ATTORNEY",
  "DIVORCE_ATTORNEY",
];

// Mockup 08 (Pros and Paid Sponsorship), the category select, group by group.
// PROPERTY_MANAGER joins Specialty (KA ruling 2026-11-28), before Other.
const MOCKUP_08_GROUPS: { label: string; rows: [string, string][] }[] = [
  { label: "Real estate pros", rows: [["REALTOR", "Realtor"], ["MLO", "Mortgage loan officer"], ["INSPECTOR", "Home inspector"], ["TITLE", "Title"], ["INSURANCE", "Insurance"], ["HANDYMAN", "Handyman"]] },
  { label: "Buying and selling", rows: [["APPRAISER", "Appraiser"], ["HOME_WARRANTY", "Home warranty"], ["ESCROW_OFFICER", "Escrow officer"], ["REAL_ESTATE_ATTORNEY", "Real estate attorney"], ["SURVEYOR", "Surveyor"]] },
  {
    label: "Home improvement and upkeep",
    rows: [
      ["GENERAL_CONTRACTOR", "General contractor"], ["LANDSCAPER", "Landscaper"], ["INTERIOR_DESIGNER", "Interior designer"], ["PAINTER", "Painter"],
      ["ROOFER", "Roofer"], ["ELECTRICIAN", "Electrician"], ["PLUMBER", "Plumber"], ["HVAC_TECHNICIAN", "HVAC technician"],
      ["POOL_SERVICE", "Pool service"], ["PEST_CONTROL", "Pest control"], ["CLEANING_SERVICE", "Cleaning service"],
    ],
  },
  { label: "Money and planning", rows: [["FINANCIAL_PLANNER", "Financial planner"], ["CPA_TAX_ADVISOR", "CPA / tax advisor"], ["ESTATE_PLANNING_ATTORNEY", "Estate planning attorney"]] },
  { label: "Moving and settling in", rows: [["MOVING_COMPANY", "Moving company"], ["STORAGE_FACILITY", "Storage facility"], ["LOCKSMITH", "Locksmith"]] },
  {
    label: "Specialty",
    rows: [
      ["PHOTOGRAPHER", "Photographer"], ["SOLAR_INSTALLER", "Solar installer"], ["STRUCTURAL_ENGINEER", "Structural engineer"],
      ["SEPTIC_WELL_INSPECTOR", "Septic / well inspector"], ["CREDIT_REPAIR", "Credit repair"], ["BANKRUPTCY_ATTORNEY", "Bankruptcy attorney"],
      ["DIVORCE_ATTORNEY", "Divorce attorney"], ["DOWN_PAYMENT_ASSISTANCE", "Down payment assistance"], ["HUD_COUNSELOR", "HUD counselor"],
      ["BUILDER", "Builder"], ["PROPERTY_MANAGER", "Property manager"], ["OTHER", "Other"],
    ],
  },
];

describe("PRO_CATEGORIES", () => {
  test("the NS fixture parses to its 39 PartnerType values (control: the parser finds a known value)", () => {
    expect(NS_PARTNER_TYPES).toHaveLength(39);
    expect(NS_PARTNER_TYPES).toContain("DIVORCE_ATTORNEY");
    expect(NS_PARTNER_TYPES).toContain("OTHER");
  });

  test("the values equal NS PartnerType plus PROPERTY_MANAGER (40)", () => {
    expect(PRO_CATEGORY_VALUES).toHaveLength(40);
    expect([...PRO_CATEGORY_VALUES].sort()).toEqual([...NS_PARTNER_TYPES, "PROPERTY_MANAGER"].sort());
    expect(PRO_CATEGORIES.map((c) => c.value)).toEqual([...PRO_CATEGORY_VALUES]);
  });

  test("no duplicate value", () => {
    expect(new Set(PRO_CATEGORY_VALUES).size).toBe(PRO_CATEGORY_VALUES.length);
  });

  test("groups, order and labels are mockup 08's", () => {
    expect(PRO_CATEGORY_GROUPS.map((g) => g.label)).toEqual(MOCKUP_08_GROUPS.map((g) => g.label));
    for (const g of PRO_CATEGORY_GROUPS) expect(g.key).toMatch(/^[a-z]+(-[a-z]+)*$/);
    const groupLabel = new Map(PRO_CATEGORY_GROUPS.map((g) => [g.key, g.label] as const));
    const actual = PRO_CATEGORIES.map((c) => [groupLabel.get(c.group), c.value, c.label]);
    const expected = MOCKUP_08_GROUPS.flatMap((g) => g.rows.map(([value, label]) => [g.label, value, label]));
    expect(actual).toEqual(expected);
  });

  test("settlementService is true exactly on the decided RESPA list; PEST_CONTROL and PROPERTY_MANAGER are false", () => {
    const flagged = PRO_CATEGORIES.filter((c) => c.settlementService).map((c) => c.value);
    expect([...flagged].sort()).toEqual([...RESPA_SETTLEMENT_SERVICES].sort());
    expect(PRO_CATEGORIES.find((c) => c.value === "PEST_CONTROL")?.settlementService).toBe(false);
    expect(PRO_CATEGORIES.find((c) => c.value === "PROPERTY_MANAGER")?.settlementService).toBe(false);
  });

  test("HUB_TRADE_TABS is the six hub tabs, each a value, and hubTab marks exactly them", () => {
    expect([...HUB_TRADE_TABS]).toEqual(["PLUMBER", "ELECTRICIAN", "HVAC_TECHNICIAN", "ROOFER", "LANDSCAPER", "HANDYMAN"]);
    for (const tab of HUB_TRADE_TABS) expect(PRO_CATEGORY_VALUES).toContain(tab);
    expect(PRO_CATEGORIES.filter((c) => c.hubTab).map((c) => c.value).sort()).toEqual([...HUB_TRADE_TABS].sort());
  });

  test("the lists and rows are frozen", () => {
    expectFrozen(PRO_CATEGORIES);
    expectFrozen(PRO_CATEGORIES[0]);
    expectFrozen(PRO_CATEGORY_VALUES);
    expectFrozen(PRO_CATEGORY_GROUPS);
    expectFrozen(HUB_TRADE_TABS);
    expectFrozen(PRO_CATEGORY_ALIASES);
    expectFrozen(HOME_CARE_TO_PRO_CATEGORY);
  });

  test("isProCategory is exact", () => {
    expect(isProCategory("PLUMBER")).toBe(true);
    expect(isProCategory("PROPERTY_MANAGER")).toBe(true);
    for (const v of ["plumber", " PLUMBER", "HVAC", "CLEANER", "constructor", "__proto__", "", null, undefined, 3, {}]) expect(isProCategory(v)).toBe(false);
    const raw: unknown = "ROOFER";
    if (!isProCategory(raw)) throw new Error("expected a pro category");
    const narrowed: ProCategory = raw;
    expect(narrowed).toBe("ROOFER");
  });
});

describe("PRO_CATEGORY_ALIASES and normalizeProCategory", () => {
  test("maps the two Oven spellings the rename retires", () => {
    expect({ ...PRO_CATEGORY_ALIASES }).toEqual({ HVAC: "HVAC_TECHNICIAN", CLEANER: "CLEANING_SERVICE" });
    for (const [from, to] of Object.entries(PRO_CATEGORY_ALIASES)) {
      expect(PRO_CATEGORY_VALUES).toContain(to);
      expect(PRO_CATEGORY_VALUES as readonly string[]).not.toContain(from);
    }
  });

  test("a value maps to itself, an old spelling to its new one, anything else to null", () => {
    expect(normalizeProCategory("PLUMBER")).toBe("PLUMBER");
    expect(normalizeProCategory("HVAC")).toBe("HVAC_TECHNICIAN");
    expect(normalizeProCategory("CLEANER")).toBe("CLEANING_SERVICE");
    for (const v of ["constructor", "__proto__", "toString", "hasOwnProperty", "hvac", " HVAC", "", null, undefined, 7, {}]) {
      expect(normalizeProCategory(v)).toBeNull();
    }
  });
});

describe("HOME_CARE_TO_PRO_CATEGORY and proCategoryForHomeCare", () => {
  test("is exactly part B §4h's seven mappings, each to a value", () => {
    expect({ ...HOME_CARE_TO_PRO_CATEGORY }).toEqual({
      plumbing: "PLUMBER",
      hvac: "HVAC_TECHNICIAN",
      electrical: "ELECTRICIAN",
      landscaping: "LANDSCAPER",
      irrigation: "LANDSCAPER",
      roof: "ROOFER",
      foundation: "STRUCTURAL_ENGINEER",
    });
    for (const to of Object.values(HOME_CARE_TO_PRO_CATEGORY)) expect(PRO_CATEGORY_VALUES).toContain(to);
  });

  test("a mapped care category names its pro; every other category names none", () => {
    expect(proCategoryForHomeCare("plumbing")).toBe("PLUMBER");
    expect(proCategoryForHomeCare(" Foundation ")).toBe("STRUCTURAL_ENGINEER");
    for (const v of ["exterior", "interior", "appliances", "seasonal_prep", "safety", "efficiency", "windows", "general", "constructor", "__proto__", "", null, undefined, 1]) {
      expect(proCategoryForHomeCare(v)).toBeNull();
    }
  });
});

// ── Stream, hub domains, mortgage sources ───────────────────────────────────

describe("NURTURE_STREAM_SLUGS", () => {
  test("is the one Home Insight monthly stream, lowercase hyphenated", () => {
    expect([...NURTURE_STREAM_SLUGS]).toEqual(["home-insight-monthly"]);
    for (const s of NURTURE_STREAM_SLUGS) expect(s).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expectFrozen(NURTURE_STREAM_SLUGS);
    expect(isNurtureStreamSlug("home-insight-monthly")).toBe(true);
    for (const v of ["home_insight_monthly", "Home-Insight-Monthly", "home-insight", "", null, 1]) expect(isNurtureStreamSlug(v)).toBe(false);
  });
});

describe("HUB_DOMAINS", () => {
  test("is THEHOMESCOUT (the default) then HOMEINSIGHT, mirrored by the Rello and HS enums", () => {
    expect([...HUB_DOMAINS]).toEqual(["THEHOMESCOUT", "HOMEINSIGHT"]);
    expectFrozen(HUB_DOMAINS);
    expect(isHubDomain("HOMEINSIGHT")).toBe(true);
    for (const v of ["homeinsight", "HOME_INSIGHT", "homeinsight.app", "THE_HOME_SCOUT", "", null, 0]) expect(isHubDomain(v)).toBe(false);
    const d: HubDomain = "THEHOMESCOUT";
    expect(d).toBe("THEHOMESCOUT");
  });
});

describe("MORTGAGE_DATA_SOURCES (L-8)", () => {
  test("is part C's MortgageDataSource enum, in its order (PE's Prisma enum mirrors it)", () => {
    expect([...MORTGAGE_DATA_SOURCES]).toEqual([
      "LOS_UPLOAD",
      "LIST_UPLOAD",
      "VENDOR_RECORDED",
      "VENDOR_ESTIMATED",
      "MARKET_ESTIMATE",
      "AMORTIZED",
      "HOMEOWNER",
      "BATCHDATA_LEGACY",
    ]);
    expectFrozen(MORTGAGE_DATA_SOURCES);
  });

  test("the page's figure sources are those plus VALUATION, for value and equity", () => {
    expect([...HOME_FIGURE_SOURCES]).toEqual([...MORTGAGE_DATA_SOURCES, "VALUATION"]);
    expectFrozen(HOME_FIGURE_SOURCES);
    expect(isMortgageDataSource("VALUATION")).toBe(false);
    expect(isMortgageDataSource("LOS_UPLOAD")).toBe(true);
    for (const v of ["los_upload", "CLOSING", "PUBLIC_RECORD", "", null, 2]) expect(isMortgageDataSource(v)).toBe(false);
    const s: MortgageDataSource = "HOMEOWNER";
    expect(s).toBe("HOMEOWNER");
  });
});
