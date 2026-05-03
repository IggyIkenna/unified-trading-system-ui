/**
 * Super-admin vs full-admin claim resolution + restricted-entitlement
 * detection. These power /api/admin/set-claims and the auth-context
 * isSuperAdmin helper, so any drift between them and the real claim
 * shapes provisioned by scripts/admin/provision-workspace-admin.mjs
 * shows up here first.
 */
import { describe, expect, it } from "vitest";

import { isSuperAdminClaim, isRestrictedEntitlementGrant, RESTRICTED_ENTITLEMENTS } from "@/lib/auth/super-admin";

describe("isSuperAdminClaim", () => {
  it("returns true when superAdmin flag is explicitly true", () => {
    expect(isSuperAdminClaim({ role: "admin", superAdmin: true, entitlements: ["*"] })).toBe(true);
    expect(isSuperAdminClaim({ role: "admin", superAdmin: true })).toBe(true);
  });

  it("returns false when superAdmin flag is explicitly false (Harsh's shape)", () => {
    expect(isSuperAdminClaim({ role: "admin", superAdmin: false, entitlements: ["*"] })).toBe(false);
  });

  it('legacy back-compat: role:admin + entitlements:["*"] without flag = super', () => {
    // Ikenna's pre-flag claim shape
    expect(isSuperAdminClaim({ role: "admin", entitlements: ["*"] })).toBe(true);
  });

  it("legacy back-compat: admin:true (alternate alias) + wildcard = super", () => {
    expect(isSuperAdminClaim({ admin: true, entitlements: ["*"] })).toBe(true);
  });

  it("returns false for non-admins regardless of entitlements", () => {
    expect(isSuperAdminClaim({ entitlements: ["*"] })).toBe(false);
    expect(isSuperAdminClaim({ role: "client", entitlements: ["*"] })).toBe(false);
  });

  it("returns false for full admin without wildcard or super flag", () => {
    expect(isSuperAdminClaim({ role: "admin", entitlements: ["dart_full"] })).toBe(false);
    expect(isSuperAdminClaim({ role: "admin" })).toBe(false);
  });

  it("returns false for null / undefined / empty claims", () => {
    expect(isSuperAdminClaim(null)).toBe(false);
    expect(isSuperAdminClaim(undefined)).toBe(false);
    expect(isSuperAdminClaim({})).toBe(false);
  });

  it("explicit superAdmin:false beats legacy wildcard back-compat", () => {
    // Even if Harsh somehow has both superAdmin:false and entitlements:["*"]
    // (he does — that's the deliberately-set shape), the explicit flag wins.
    expect(isSuperAdminClaim({ role: "admin", superAdmin: false, entitlements: ["*"] })).toBe(false);
  });
});

describe("isRestrictedEntitlementGrant", () => {
  it("flags wildcard grants", () => {
    expect(isRestrictedEntitlementGrant(["*"])).toBe(true);
    expect(isRestrictedEntitlementGrant(["dart_full", "*"])).toBe(true);
  });

  it("flags admin / super_admin grants", () => {
    expect(isRestrictedEntitlementGrant(["admin"])).toBe(true);
    expect(isRestrictedEntitlementGrant(["super_admin"])).toBe(true);
  });

  it("does NOT flag normal persona-level entitlements", () => {
    expect(isRestrictedEntitlementGrant(["dart_full"])).toBe(false);
    expect(isRestrictedEntitlementGrant(["pension_allocator", "investor-board"])).toBe(false);
    expect(isRestrictedEntitlementGrant([])).toBe(false);
  });

  it("ignores non-string entries safely", () => {
    expect(isRestrictedEntitlementGrant([null, 42, undefined, { key: "*" }])).toBe(false);
  });
});

describe("RESTRICTED_ENTITLEMENTS", () => {
  it("contains the three escalation values", () => {
    expect(RESTRICTED_ENTITLEMENTS.has("*")).toBe(true);
    expect(RESTRICTED_ENTITLEMENTS.has("admin")).toBe(true);
    expect(RESTRICTED_ENTITLEMENTS.has("super_admin")).toBe(true);
  });

  it("does NOT contain normal persona keys", () => {
    expect(RESTRICTED_ENTITLEMENTS.has("dart_full")).toBe(false);
    expect(RESTRICTED_ENTITLEMENTS.has("investor-board")).toBe(false);
  });
});
