import { describe, expect, test } from "vitest";
import {
  APP_SLUGS,
  ENGINE_SLUGS,
  PLATFORM_SLUGS,
  normalizeSlug,
  toSourceAppIdentifier,
  tryNormalizeSlug,
} from "../src/index";

// PLATFORM-TRACKING-SYSTEM S1 (Platform KA prompt 1604): the Tracking Engine is
// a platform service engine. It authenticates inbound app keys and calls Rello
// with its own key, so it needs a canonical engine slug and the matching
// TRACKING_ENGINE routing identifier (ApiKey.appSource / targetApp).
describe("tracking-engine (v0.13.0)", () => {
  test("ENGINE_SLUGS is exactly the canonical 7 engines, tracking-engine last", () => {
    expect([...ENGINE_SLUGS]).toEqual([
      "milo-engine",
      "content-engine",
      "property-engine",
      "journey-engine",
      "report-engine",
      "drumbeat-video-engine",
      "tracking-engine",
    ]);
  });

  test("it is a platform slug, an engine, and not an app", () => {
    expect(PLATFORM_SLUGS).toContain("tracking-engine");
    const apps: readonly string[] = APP_SLUGS;
    expect(apps).not.toContain("tracking-engine");
  });

  test("the routing identifier round-trips", () => {
    expect(toSourceAppIdentifier("tracking-engine")).toBe("TRACKING_ENGINE");
    expect(normalizeSlug("TRACKING_ENGINE")).toBe("tracking-engine");
    expect(tryNormalizeSlug("tracking-engine")).toBe("tracking-engine");
  });

  test("near-misses do not normalize to it", () => {
    for (const v of ["tracking", "trackingengine", "tracking_engine_x", "tracking-engines"]) {
      expect(tryNormalizeSlug(v)).not.toBe("tracking-engine");
    }
  });
});
