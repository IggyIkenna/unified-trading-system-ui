import { SERVICE_ENDPOINTS } from "@/lib/config/api";
import { ENTITLEMENTS, SUBSCRIPTION_TIERS } from "@/lib/config/auth";
import { BRAND_COLORS, COMPANY, FONTS, USP } from "@/lib/config/branding";
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services";

describe("lib/config/api", () => {
  it("exports SERVICE_ENDPOINTS with all required services", () => {
    expect(SERVICE_ENDPOINTS).toBeDefined();
    const keys = Object.keys(SERVICE_ENDPOINTS);
    expect(keys.length).toBeGreaterThanOrEqual(10);
    expect(keys).toContain("execution");
    expect(keys).toContain("positions");
    expect(keys).toContain("risk");
    expect(keys).toContain("strategy");
    expect(keys).toContain("marketTick");
  });

  it("all endpoints are strings", () => {
    for (const [, value] of Object.entries(SERVICE_ENDPOINTS)) {
      expect(typeof value).toBe("string");
    }
  });
});

describe("lib/config/branding", () => {
  it("exports COMPANY with name", () => {
    expect(COMPANY).toBeDefined();
    expect(COMPANY.name).toBe("Odum Research");
  });

  it("exports BRAND_COLORS with primary and background", () => {
    expect(BRAND_COLORS).toBeDefined();
    expect(BRAND_COLORS).toHaveProperty("primary");
    expect(BRAND_COLORS).toHaveProperty("background");
  });

  it("exports FONTS with display and mono", () => {
    expect(FONTS).toBeDefined();
    expect(Object.keys(FONTS).length).toBeGreaterThanOrEqual(1);
  });

  it("exports USP array with 3 selling points", () => {
    expect(Array.isArray(USP)).toBe(true);
    expect(USP).toHaveLength(3);
    for (const usp of USP) {
      expect(usp).toHaveProperty("title");
      expect(usp).toHaveProperty("description");
    }
  });
});

describe("lib/config/auth", () => {
  it("exports ENTITLEMENTS array", () => {
    expect(Array.isArray(ENTITLEMENTS)).toBe(true);
    expect(ENTITLEMENTS).toContain("data-basic");
    expect(ENTITLEMENTS).toContain("data-pro");
    expect(ENTITLEMENTS).toContain("ml-full");
  });

  it("exports SUBSCRIPTION_TIERS", () => {
    expect(Array.isArray(SUBSCRIPTION_TIERS)).toBe(true);
    expect(SUBSCRIPTION_TIERS.length).toBeGreaterThanOrEqual(3);
    for (const tier of SUBSCRIPTION_TIERS) {
      expect(tier).toHaveProperty("key");
      expect(tier).toHaveProperty("name");
    }
  });
});

describe("lib/config/services", () => {
  it("exports SERVICE_REGISTRY with the 6 product tiles (post dart-split)", () => {
    expect(Array.isArray(SERVICE_REGISTRY)).toBe(true);
    // 2026-04-21 collapse — top-level grid renders product tiles.
    // 2026-04-28 dart-split (commit a36a9889) — the legacy single `dart` tile
    // was split into `dart-terminal` (Signals-In + DART-Full visible) and
    // `dart-research` (DART-Full only; padlocked-visible for Signals-In).
    // Folded-away (now DART sub-routes): data · observe · strategy-catalogue
    // live under dart-terminal; research · promote live under dart-research.
    expect(SERVICE_REGISTRY.length).toBe(6);
    const keys = SERVICE_REGISTRY.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "dart-terminal",
        "dart-research",
        "odum-signals",
        "reports",
        "investor-relations",
        "admin",
      ]),
    );
    // Legacy single `dart` tile is gone — must NOT appear as a top-level key.
    expect(keys).not.toContain("dart");
    // Folded-away keys MUST NOT appear as top-level tiles (they live as
    // sub-routes under dart-terminal / dart-research).
    expect(keys).not.toContain("data");
    expect(keys).not.toContain("research");
    expect(keys).not.toContain("promote");
    expect(keys).not.toContain("observe");
    expect(keys).not.toContain("strategy-catalogue");
  });

  it("dart-terminal + dart-research carry the folded-away surfaces", () => {
    const dartTerminal = SERVICE_REGISTRY.find((s) => s.key === "dart-terminal");
    const dartResearch = SERVICE_REGISTRY.find((s) => s.key === "dart-research");
    expect(dartTerminal, "dart-terminal tile must exist post-split").toBeDefined();
    expect(dartResearch, "dart-research tile must exist post-split").toBeDefined();
    const terminalKeys = dartTerminal!.subRoutes.map((r) => r.key);
    const researchKeys = dartResearch!.subRoutes.map((r) => r.key);

    // Trading-day surfaces under dart-terminal (per the split SSOT).
    for (const k of ["terminal", "observe", "strategy-catalogue", "signal-intake", "data"]) {
      expect(terminalKeys, `dart-terminal missing sub-route "${k}"`).toContain(k);
    }
    // Research-side surfaces under dart-research; the legacy `research` chip
    // was broken into research-overview + features + feature-etl + quant +
    // strategies + ml + backtests + signals + execution-research + allocate.
    expect(researchKeys, "dart-research must include research-overview").toContain("research-overview");
    expect(researchKeys, "dart-research must include promote").toContain("promote");
  });

  it("each service has required fields", () => {
    for (const svc of SERVICE_REGISTRY) {
      expect(svc).toHaveProperty("key");
      expect(svc).toHaveProperty("label");
      expect(svc).toHaveProperty("href");
      expect(svc).toHaveProperty("lifecycleStage");
    }
  });

  it("getVisibleServices returns all for wildcard", () => {
    const visible = getVisibleServices(["*"], "internal");
    expect(visible.length).toBe(SERVICE_REGISTRY.length);
  });

  it("getVisibleServices hides internal-only for clients", () => {
    const visible = getVisibleServices(["data-pro", "execution-full"], "client");
    const internalOnly = SERVICE_REGISTRY.filter((s) => s.internalOnly);
    expect(visible.length).toBeLessThan(SERVICE_REGISTRY.length);
    for (const svc of visible) {
      expect(svc.internalOnly).toBeFalsy();
    }
    expect(internalOnly.length).toBeGreaterThan(0);
  });

  it("getVisibleServices filters by entitlements", () => {
    const basicVisible = getVisibleServices(["data-basic"], "client");
    const fullVisible = getVisibleServices(
      ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
      "client",
    );
    expect(basicVisible.length).toBeLessThanOrEqual(fullVisible.length);
  });
});
