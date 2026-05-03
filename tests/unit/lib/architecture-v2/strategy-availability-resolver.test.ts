import { describe, expect, it } from "vitest";

import {
  classifyPersona,
  filterVisibleStrategyInstances,
  resolveStrategyVisibility,
  type AuthUserForResolver,
  type StrategyInstanceForResolver,
} from "@/lib/architecture-v2/strategy-availability-resolver";

function makeInstance(overrides: Partial<StrategyInstanceForResolver> = {}): StrategyInstanceForResolver {
  return {
    id: "strat-1",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "dart_only",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
    ...overrides,
  };
}

function makeUser(overrides: Partial<AuthUserForResolver> = {}): AuthUserForResolver {
  return {
    role: "client",
    entitlements: ["strategy-full", "ml-full"],
    subscriptions: [],
    ...overrides,
  };
}

describe("classifyPersona", () => {
  it("classifies admin role / wildcard entitlement as admin", () => {
    expect(classifyPersona({ role: "admin", entitlements: [] })).toBe("admin");
    expect(classifyPersona({ role: "client", entitlements: ["*"] })).toBe("admin");
  });

  it("classifies internal IM-desk-operator", () => {
    expect(
      classifyPersona({
        role: "internal",
        entitlements: ["im-desk-operator"],
      }),
    ).toBe("im-desk-operator");
  });

  it("classifies internal trader", () => {
    expect(
      classifyPersona({
        role: "internal",
        entitlements: ["trader-full"],
      }),
    ).toBe("internal-trader");
  });

  it("classifies DART-Full client", () => {
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["strategy-full", "ml-full"],
      }),
    ).toBe("dart-full");
  });

  it("classifies Signals-In client", () => {
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["signals-in"],
      }),
    ).toBe("signals-in");
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["signals-receive"],
      }),
    ).toBe("signals-in");
  });

  it("classifies IM client", () => {
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["im-client"],
      }),
    ).toBe("im-client");
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["investor-board"],
      }),
    ).toBe("im-client");
  });

  it("classifies regulatory client", () => {
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["regulatory"],
      }),
    ).toBe("regulatory");
    expect(
      classifyPersona({
        role: "client",
        entitlements: ["compliance-only"],
      }),
    ).toBe("regulatory");
  });

  it("falls back to prospect for un-entitled clients", () => {
    expect(classifyPersona({ role: "client", entitlements: [] })).toBe("prospect");
  });
});

describe("resolveStrategyVisibility", () => {
  it("returns owned for admin on a live strategy", () => {
    const decision = resolveStrategyVisibility(
      makeInstance(),
      makeUser({ role: "admin", entitlements: [] }),
      "terminal",
    );
    expect(decision.visibility).toBe("owned");
    expect(decision.reason).toBe("owned_subscription");
  });

  it("returns owned for a DART-Full client subscribed to the strategy", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({ id: "strat-7" }),
      makeUser({ subscriptions: ["strat-7"] }),
      "terminal",
    );
    expect(decision.visibility).toBe("owned");
  });

  it("returns available_to_request for a DART-Full client on a public, unsubscribed strategy", () => {
    const decision = resolveStrategyVisibility(makeInstance(), makeUser({ subscriptions: [] }), "terminal");
    expect(decision.visibility).toBe("available_to_request");
    expect(decision.cta).toBe("request_access");
  });

  it("hides pre-maturity strategies from client-tier personas", () => {
    const decision = resolveStrategyVisibility(makeInstance({ maturityPhase: "smoke" }), makeUser(), "terminal");
    expect(decision.visibility).toBe("hidden");
    expect(decision.reason).toBe("pre_maturity");
  });

  it("hides retired strategies from client-tier personas", () => {
    const decision = resolveStrategyVisibility(makeInstance({ availabilityState: "RETIRED" }), makeUser(), "terminal");
    expect(decision.visibility).toBe("hidden");
    expect(decision.reason).toBe("retired");
  });

  it("returns admin_only for admin viewing a retired strategy", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({ availabilityState: "RETIRED" }),
      makeUser({ role: "admin", entitlements: [] }),
      "terminal",
    );
    expect(decision.visibility).toBe("admin_only");
  });

  it("returns read_only for IM-desk on a CLIENT_EXCLUSIVE strategy", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({ availabilityState: "CLIENT_EXCLUSIVE" }),
      makeUser({
        role: "internal",
        entitlements: ["im-desk-operator"],
      }),
      "terminal",
    );
    expect(decision.visibility).toBe("read_only");
    expect(decision.reason).toBe("client_exclusive_read_only");
  });

  it("returns locked_by_tier for Signals-In on Full-only research surface", () => {
    const decision = resolveStrategyVisibility(
      makeInstance(),
      makeUser({ entitlements: ["signals-in"], subscriptions: [] }),
      "research",
    );
    expect(decision.visibility).toBe("locked_by_tier");
    expect(decision.cta).toBe("upgrade_to_dart_full");
  });

  it("hides BLOCKED coverage from client tier", () => {
    const decision = resolveStrategyVisibility(makeInstance({ coverageStatus: "BLOCKED" }), makeUser(), "terminal");
    expect(decision.visibility).toBe("hidden");
    expect(decision.reason).toBe("coverage_blocked");
  });

  it("propagates partial coverage qualifier", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({ coverageStatus: "PARTIAL" }),
      makeUser({ subscriptions: ["strat-1"] }),
      "terminal",
    );
    expect(decision.visibility).toBe("owned");
    expect(decision.coverageQualifier).toBe("partial");
  });

  it("hides allocation surface from regulatory persona", () => {
    const decision = resolveStrategyVisibility(
      makeInstance(),
      makeUser({
        entitlements: ["regulatory"],
        subscriptions: [],
      }),
      "terminal",
    );
    expect(decision.visibility).toBe("hidden");
    expect(decision.reason).toBe("wrong_product_routing");
  });

  it("shows reports surface to regulatory persona as available", () => {
    const decision = resolveStrategyVisibility(
      makeInstance(),
      makeUser({
        entitlements: ["regulatory"],
        subscriptions: [],
      }),
      "reports",
    );
    expect(decision.visibility).toBe("available_to_request");
  });

  it("hides DART-only strategies from IM clients", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({ productRouting: "dart_only" }),
      makeUser({
        entitlements: ["im-client"],
        subscriptions: [],
      }),
      "terminal",
    );
    expect(decision.visibility).toBe("hidden");
  });

  it("returns read_only for IM client on IM-reserved strategies", () => {
    const decision = resolveStrategyVisibility(
      makeInstance({
        availabilityState: "INVESTMENT_MANAGEMENT_RESERVED",
        productRouting: "im_only",
      }),
      makeUser({
        entitlements: ["im-client"],
        subscriptions: [],
      }),
      "terminal",
    );
    expect(decision.visibility).toBe("read_only");
    expect(decision.reason).toBe("im_reserved");
  });

  it("hides everything except FOMO-safe public from prospect", () => {
    const publicDecision = resolveStrategyVisibility(
      makeInstance(),
      makeUser({ entitlements: [], subscriptions: [] }),
      "terminal",
    );
    expect(publicDecision.visibility).toBe("available_to_request");

    const internalDecision = resolveStrategyVisibility(
      makeInstance({ productRouting: "internal_only" }),
      makeUser({ entitlements: [], subscriptions: [] }),
      "terminal",
    );
    expect(internalDecision.visibility).toBe("hidden");
  });
});

describe("filterVisibleStrategyInstances", () => {
  it("excludes hidden instances", () => {
    const instances: StrategyInstanceForResolver[] = [
      makeInstance({ id: "live-1", maturityPhase: "live_stable" }),
      makeInstance({ id: "smoke-1", maturityPhase: "smoke" }),
      makeInstance({ id: "retired-1", availabilityState: "RETIRED" }),
    ];
    const visible = filterVisibleStrategyInstances(instances, makeUser(), "terminal");
    expect(visible.map((v) => v.instance.id)).toEqual(["live-1"]);
  });
});
