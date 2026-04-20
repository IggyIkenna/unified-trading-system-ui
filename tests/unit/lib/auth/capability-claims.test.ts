import { describe, expect, it } from "vitest";

import {
  capabilityClaimsFromToken,
  EMPTY_CAPABILITY_CLAIMS,
} from "@/lib/auth/capability-claims";

describe("capabilityClaimsFromToken", () => {
  it("defaults every flag to false when token is empty", () => {
    const claims = capabilityClaimsFromToken({});
    expect(claims).toEqual(EMPTY_CAPABILITY_CLAIMS);
  });

  it("reads bool flags verbatim when true", () => {
    const claims = capabilityClaimsFromToken({
      role: "admin",
      audience: "admin",
      org_id: null,
      pricing_read_internal: true,
      strategy_catalogue_admin: true,
      im_desk: true,
      admin: true,
    });
    expect(claims.admin).toBe(true);
    expect(claims.strategy_catalogue_admin).toBe(true);
    expect(claims.pricing_read_internal).toBe(true);
    expect(claims.im_desk).toBe(true);
    expect(claims.audience).toBe("admin");
  });

  it("treats non-true values as false (no truthy coercion)", () => {
    const claims = capabilityClaimsFromToken({
      admin: 1, // NOT true — must stay false
      pricing_read_internal: "true",
      strategy_catalogue_admin: {},
      im_desk: null,
    });
    expect(claims.admin).toBe(false);
    expect(claims.pricing_read_internal).toBe(false);
    expect(claims.strategy_catalogue_admin).toBe(false);
    expect(claims.im_desk).toBe(false);
  });

  it("falls back to trading_platform_subscriber for unknown audience", () => {
    const claims = capabilityClaimsFromToken({
      role: "client",
      audience: "superuser",
    });
    expect(claims.audience).toBe("trading_platform_subscriber");
  });

  it("accepts only string org_id; anything else → null", () => {
    expect(capabilityClaimsFromToken({ org_id: "alpha" }).org_id).toBe("alpha");
    expect(capabilityClaimsFromToken({ org_id: 42 }).org_id).toBeNull();
    expect(capabilityClaimsFromToken({ org_id: null }).org_id).toBeNull();
    expect(capabilityClaimsFromToken({}).org_id).toBeNull();
  });
});
