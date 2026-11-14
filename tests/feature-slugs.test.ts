import { describe, expect, test } from "vitest";
import {
  FEATURE_SLUGS,
  PLATFORM_SLUGS,
  isFeatureSlug,
  tryNormalizeSlug,
  type FeatureSlug,
} from "../src/index";

// PFP Gateway §4.1 (G-2): Rello's Plan.grants lists feature slugs from this one
// canonical list, and the plan editor refuses anything else with a 400.
describe("FEATURE_SLUGS", () => {
  test("is exactly the four gateway features, in order", () => {
    expect([...FEATURE_SLUGS]).toEqual(["pfp-rates", "pfp-full", "check-your-rate", "refi-radar"]);
  });

  test("every feature slug is lowercase hyphenated and unique", () => {
    for (const slug of FEATURE_SLUGS) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(new Set(FEATURE_SLUGS).size).toBe(FEATURE_SLUGS.length);
  });

  test("no feature slug is a platform slug, and none normalizes to one", () => {
    const platform: readonly string[] = PLATFORM_SLUGS;
    for (const slug of FEATURE_SLUGS) {
      expect(platform).not.toContain(slug);
      expect(tryNormalizeSlug(slug)).toBeNull();
    }
  });
});

describe("isFeatureSlug", () => {
  test("accepts each canonical feature slug", () => {
    for (const slug of FEATURE_SLUGS) expect(isFeatureSlug(slug)).toBe(true);
  });

  test("refuses near-misses, app slugs and non-strings", () => {
    for (const v of ["PFP-RATES", " pfp-rates", "pfp-rates ", "pfp_rates", "pfp", "", "pathfinder-pro", "home-scout", null, undefined, 1, {}, ["pfp-rates"]]) {
      expect(isFeatureSlug(v)).toBe(false);
    }
  });

  test("narrows to FeatureSlug", () => {
    const raw: unknown = "pfp-full";
    if (!isFeatureSlug(raw)) throw new Error("expected a feature slug");
    const narrowed: FeatureSlug = raw;
    expect(narrowed).toBe("pfp-full");
    // @ts-expect-error — an app slug is not a feature slug.
    const notAFeature: FeatureSlug = "pathfinder-pro";
    expect(notAFeature).toBe("pathfinder-pro");
  });
});

// PFP Gateway §4.12c (G-RR, K-195): PFP shows Refi Radar only to a tenant holding
// the `refi-radar` grant — included on Pro and Team (D28), or from the add-on on
// Rates and Starter (D31). v0.11.0 adds it; nothing else in the package changes.
describe("refi-radar (v0.11.0)", () => {
  test("is a feature slug", () => {
    expect(isFeatureSlug("refi-radar")).toBe(true);
    expect(FEATURE_SLUGS).toContain("refi-radar");
  });

  test("is exact: near-misses are refused", () => {
    for (const v of ["Refi-Radar", "REFI-RADAR", "refi_radar", "refiradar", " refi-radar", "refi-radar ", "refi"]) {
      expect(isFeatureSlug(v)).toBe(false);
    }
  });

  test("is not a platform slug and normalizes to none", () => {
    const platform: readonly string[] = PLATFORM_SLUGS;
    expect(platform).not.toContain("refi-radar");
    expect(tryNormalizeSlug("refi-radar")).toBeNull();
  });

  test("narrows to FeatureSlug at the type level", () => {
    const slug: FeatureSlug = "refi-radar";
    expect(slug).toBe("refi-radar");
  });
});
