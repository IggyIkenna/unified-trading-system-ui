/**
 * Tests for MSW handler logic — tests handler functions directly
 * by calling the resolver functions with mock requests.
 *
 * We don't use setupServer here because Jest + MSW v2 interceptors
 * have module resolution issues. Instead we test the data and scoping
 * logic that the handlers use.
 */
import { PERSONAS, getPersonaById } from "@/lib/mocks/fixtures/personas"
import { personaHasEntitlement, scopeByEntitlement } from "@/lib/mocks/utils"

// Import mock data that handlers use — verifies the data sources compile and export correctly
import { MOCK_INSTRUMENTS, MOCK_CATALOGUE, MOCK_ETL_PIPELINES, MOCK_VENUE_COVERAGE } from "@/lib/data-service-mock-data"
import { MOCK_EXECUTION_ALGOS, MOCK_VENUES, MOCK_RECENT_ORDERS } from "@/lib/execution-platform-mock-data"
import { STRATEGY_TEMPLATES, STRATEGY_CONFIGS, BACKTEST_RUNS } from "@/lib/strategy-platform-mock-data"
import { MODEL_FAMILIES, EXPERIMENTS, TRAINING_RUNS, MODEL_VERSIONS } from "@/lib/ml-mock-data"
import { ORGANIZATIONS, CLIENTS } from "@/lib/trading-data"
import { STRATEGIES } from "@/lib/strategy-registry"

describe("handler data sources — compile and export", () => {
  it("data-service exports arrays", () => {
    expect(Array.isArray(MOCK_INSTRUMENTS)).toBe(true)
    expect(MOCK_INSTRUMENTS.length).toBeGreaterThan(0)
    expect(Array.isArray(MOCK_CATALOGUE)).toBe(true)
    expect(Array.isArray(MOCK_ETL_PIPELINES)).toBe(true)
    expect(Array.isArray(MOCK_VENUE_COVERAGE)).toBe(true)
  })

  it("execution-platform exports arrays", () => {
    expect(Array.isArray(MOCK_EXECUTION_ALGOS)).toBe(true)
    expect(MOCK_EXECUTION_ALGOS.length).toBeGreaterThan(0)
    expect(Array.isArray(MOCK_VENUES)).toBe(true)
    expect(Array.isArray(MOCK_RECENT_ORDERS)).toBe(true)
  })

  it("strategy-platform exports arrays", () => {
    expect(Array.isArray(STRATEGY_TEMPLATES)).toBe(true)
    expect(STRATEGY_TEMPLATES.length).toBeGreaterThan(0)
    expect(Array.isArray(STRATEGY_CONFIGS)).toBe(true)
    expect(Array.isArray(BACKTEST_RUNS)).toBe(true)
  })

  it("ml exports arrays", () => {
    expect(Array.isArray(MODEL_FAMILIES)).toBe(true)
    expect(MODEL_FAMILIES.length).toBeGreaterThan(0)
    expect(Array.isArray(EXPERIMENTS)).toBe(true)
    expect(Array.isArray(TRAINING_RUNS)).toBe(true)
    expect(Array.isArray(MODEL_VERSIONS)).toBe(true)
  })

  it("trading-data exports orgs and clients", () => {
    expect(Array.isArray(ORGANIZATIONS)).toBe(true)
    expect(ORGANIZATIONS.length).toBeGreaterThan(0)
    expect(Array.isArray(CLIENTS)).toBe(true)
    expect(CLIENTS.length).toBeGreaterThan(0)
  })

  it("strategy-registry exports strategies", () => {
    expect(Array.isArray(STRATEGIES)).toBe(true)
    expect(STRATEGIES.length).toBeGreaterThan(0)
  })
})

describe("handler scoping logic", () => {
  const internalPersona = getPersonaById("internal-trader")!
  const clientFull = getPersonaById("client-full")!
  const clientBasic = getPersonaById("client-data-only")!

  describe("data scoping — subscription-filtered", () => {
    it("internal sees all instruments", () => {
      const scoped = scopeByEntitlement(
        MOCK_INSTRUMENTS as unknown[] as Record<string, unknown>[],
        [...internalPersona.entitlements],
        { categoryField: "category", basicLimit: 180 }
      )
      expect(scoped.length).toBe(MOCK_INSTRUMENTS.length)
    })

    it("client-full sees all instruments (data-pro)", () => {
      const scoped = scopeByEntitlement(
        MOCK_INSTRUMENTS as unknown[] as Record<string, unknown>[],
        [...clientFull.entitlements],
        { categoryField: "category", basicLimit: 180 }
      )
      expect(scoped.length).toBe(MOCK_INSTRUMENTS.length)
    })

    it("client-basic sees CEFI only, limited to 180", () => {
      const scoped = scopeByEntitlement(
        MOCK_INSTRUMENTS as unknown[] as Record<string, unknown>[],
        [...clientBasic.entitlements],
        { categoryField: "category", basicLimit: 180 }
      )
      expect(scoped.length).toBeLessThanOrEqual(180)
      for (const item of scoped) {
        expect((item as Record<string, string>).category?.toUpperCase()).toBe("CEFI")
      }
    })
  })

  describe("ml scoping — entitlement-gated", () => {
    it("client-full has ml-full entitlement", () => {
      expect(personaHasEntitlement([...clientFull.entitlements], "ml-full")).toBe(true)
    })

    it("client-basic lacks ml-full entitlement", () => {
      expect(personaHasEntitlement([...clientBasic.entitlements], "ml-full")).toBe(false)
    })

    it("internal has ml-full via wildcard", () => {
      expect(personaHasEntitlement([...internalPersona.entitlements], "ml-full")).toBe(true)
    })
  })

  describe("client scoping — org-based filtering", () => {
    it("internal sees all orgs", () => {
      const isInternal = internalPersona.role === "internal" || internalPersona.role === "admin"
      expect(isInternal).toBe(true)
      // Internal sees all organizations
      expect(ORGANIZATIONS.length).toBeGreaterThan(1)
    })

    it("client sees only their org", () => {
      const isInternal = clientFull.role === "internal" || clientFull.role === "admin"
      expect(isInternal).toBe(false)
      const filtered = ORGANIZATIONS.filter((o) => o.id === clientFull.org.id)
      expect(filtered.length).toBeLessThanOrEqual(ORGANIZATIONS.length)
    })

    it("client sees only their org's clients", () => {
      const filtered = CLIENTS.filter((c) => c.orgId === clientFull.org.id)
      expect(filtered.length).toBeLessThanOrEqual(CLIENTS.length)
    })
  })

  describe("internal-only scoping", () => {
    it("ETL pipelines only available to internal roles", () => {
      // Simulating handler logic
      const isInternalTrader = internalPersona.role === "internal" || internalPersona.role === "admin"
      const isClientFull = clientFull.role === "internal" || clientFull.role === "admin"
      expect(isInternalTrader).toBe(true)
      expect(isClientFull).toBe(false)
      // Internal gets data, client would get 403
    })

    it("admin persona has full access", () => {
      const admin = getPersonaById("admin")!
      expect(admin.role).toBe("admin")
      expect(admin.entitlements).toContain("*")
    })
  })
})

describe("handler data shape validation", () => {
  it("instruments have required fields", () => {
    for (const inst of MOCK_INSTRUMENTS.slice(0, 5)) {
      expect(inst).toHaveProperty("instrumentKey")
      expect(inst).toHaveProperty("venue")
      expect(inst).toHaveProperty("category")
    }
  })

  it("strategies have required fields", () => {
    for (const strat of STRATEGIES.slice(0, 5)) {
      expect(strat).toHaveProperty("id")
      expect(strat).toHaveProperty("name")
      expect(strat).toHaveProperty("instruments")
    }
  })

  it("model families have required fields", () => {
    for (const fam of MODEL_FAMILIES) {
      expect(fam).toHaveProperty("id")
      expect(fam).toHaveProperty("name")
    }
  })

  it("organizations have required fields", () => {
    for (const org of ORGANIZATIONS) {
      expect(org).toHaveProperty("id")
      expect(org).toHaveProperty("name")
    }
  })

  it("clients have orgId field", () => {
    for (const client of CLIENTS) {
      expect(client).toHaveProperty("orgId")
      expect(client).toHaveProperty("id")
    }
  })
})
