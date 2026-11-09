import { describe, expect, test } from "vitest";
import {
  GROWTH_HOUSE_TENANT_ID,
  PLATFORM_TENANT_ID,
  type SystemTenantId,
} from "../src/index";

// RELLO GROWTH 6b-1b: the Growth house tenant id is exported beside the platform
// tenant so Rello and Newsletter Studio import ONE value instead of each
// carrying the literal (Nurture KA ruling, item a).
describe("system tenant ids", () => {
  test("the Growth house tenant id is Rello's fixed id", () => {
    expect(GROWTH_HOUSE_TENANT_ID).toBe("tenant_rello_growth");
  });

  test("the two system tenants are different tenants", () => {
    expect(GROWTH_HOUSE_TENANT_ID).not.toBe(PLATFORM_TENANT_ID);
    expect(PLATFORM_TENANT_ID).toBe("tenant_rello_platform");
  });

  test("SystemTenantId admits both, and nothing else", () => {
    const ids: SystemTenantId[] = [PLATFORM_TENANT_ID, GROWTH_HOUSE_TENANT_ID];
    expect(ids).toHaveLength(2);
    // @ts-expect-error — an arbitrary tenant id is not a system tenant id.
    const notASystemTenant: SystemTenantId = "tenant_clearpath";
    expect(notASystemTenant).toBe("tenant_clearpath");
  });
});
