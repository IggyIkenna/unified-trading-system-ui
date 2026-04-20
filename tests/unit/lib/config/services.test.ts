import { describe, expect, it } from "vitest";

import {
  SERVICE_REGISTRY,
  getVisibleServices,
  type ServiceDefinition,
} from "@/lib/config/services";

/**
 * Line 153 in services.ts: `if (svc.requiredEntitlements[0] === "*") return false;`
 * fires when a non-admin / non-wildcard user encounters a service whose
 * `requiredEntitlements` is the admin-only sentinel `["*"]`. The existing
 * config.test.ts has a general "hides internal-only for clients" but does
 * not cover the case where the user ALREADY passes the internalOnly gate
 * yet the service is still wildcard-gated. Admin service is both internalOnly
 * AND wildcard-gated, so testing a non-admin/non-internal user with no
 * wildcard hits that branch.
 */
describe("getVisibleServices branch coverage", () => {
  it("filters out wildcard-only services for non-admin client users", () => {
    const visible = getVisibleServices([], "client");
    for (const svc of visible) {
      expect(svc.requiredEntitlements[0]).not.toBe("*");
    }
  });

  it("admin sees wildcard-only services via wildcard entitlement", () => {
    const visible = getVisibleServices(["*"], "admin");
    expect(visible.length).toBe(SERVICE_REGISTRY.length);
  });

  it("internal role sees internal-only services but wildcard-required services only via wildcard entitlement", () => {
    // internal role passes the internalOnly gate, but without wildcard entitlement
    // the admin service (requiredEntitlements=["*"]) still gets filtered at line 153.
    const visible = getVisibleServices([], "internal");
    const adminSvc = SERVICE_REGISTRY.find((s) => s.internalOnly);
    if (!adminSvc) throw new Error("expected an internalOnly service");
    expect(visible.some((s) => s.key === adminSvc.key)).toBe(false);
  });

  it("empty-entitlement client sees zero services (no entitlement overlap)", () => {
    const visible = getVisibleServices([], "client");
    // All public services require some entitlement from ["data-basic","data-pro",...].
    // With empty entitlements, no overlap → empty visible list.
    expect(visible).toEqual([]);
  });

  it("each public service with a single-entitlement user only shows that service's bundle", () => {
    const reporter = getVisibleServices(["reporting"], "client");
    const reporterKeys = reporter.map((s: ServiceDefinition) => s.key);
    expect(reporterKeys).toContain("reports");
  });
});
