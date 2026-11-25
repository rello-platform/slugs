import { describe, expect, test } from "vitest";
import { APP_SLUGS, PLATFORM_BRAND, type PlatformBrand } from "../src/index";

// PLATFORM-RENAME-RALLYROO Phase 2: one source for the product name users see.
describe("PLATFORM_BRAND (v0.14.0)", () => {
  test("carries exactly the agreed public brand values", () => {
    expect({ ...PLATFORM_BRAND }).toEqual({
      name: "Rallyroo",
      domain: "hellorallyroo.com",
      appUrl: "https://hellorallyroo.com",
      supportEmail: "support@hellorallyroo.com",
      logoUrl: "https://hellorallyroo.com/email/logos/rallyroo.png",
      legacyName: "Rello",
    });
  });

  test("is frozen at runtime, so no consumer can reassign the name", () => {
    expect(Object.isFrozen(PLATFORM_BRAND)).toBe(true);
    expect(() => {
      (PLATFORM_BRAND as { name: string }).name = "Other";
    }).toThrow(TypeError);
    expect(PLATFORM_BRAND.name).toBe("Rallyroo");
  });

  test("is spelled with a capital R only", () => {
    expect(PLATFORM_BRAND.name).toMatch(/^R[a-z]+$/);
  });

  test("URLs are absolute https on the primary domain, appUrl without a trailing slash", () => {
    const app = new URL(PLATFORM_BRAND.appUrl);
    expect(app.protocol).toBe("https:");
    expect(app.host).toBe(PLATFORM_BRAND.domain);
    expect(PLATFORM_BRAND.appUrl.endsWith("/")).toBe(false);
    const logo = new URL(PLATFORM_BRAND.logoUrl);
    expect(logo.protocol).toBe("https:");
    expect(logo.host).toBe(PLATFORM_BRAND.domain);
    expect(PLATFORM_BRAND.supportEmail.split("@")[1]).toBe(PLATFORM_BRAND.domain);
  });

  test("gives consumers literal types and readonly fields", () => {
    const name: "Rallyroo" = PLATFORM_BRAND.name;
    const legacy: "Rello" = PLATFORM_BRAND.legacyName;
    expect([name, legacy]).toEqual(["Rallyroo", "Rello"]);
    // Never called: the assignment exists only for the compiler to refuse.
    const reassign = (b: PlatformBrand) => {
      // @ts-expect-error — fields are readonly in the type, not only frozen at runtime.
      b.domain = "example.com";
    };
    expect(typeof reassign).toBe("function");
  });

  test("leaves the internal `rello` app slug alone", () => {
    expect(APP_SLUGS).toContain("rello");
  });
});
