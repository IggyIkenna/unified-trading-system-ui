import { getPersonaFromRequest, personaHasEntitlement, scopeByEntitlement } from "@/lib/mocks/utils"

// getPersonaFromRequest needs a Request-like object with headers.get()
function mockRequest(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as never // Cast to MSW's StrictRequest type
}

describe("getPersonaFromRequest", () => {
  it("returns internal-trader when no header set", () => {
    const persona = getPersonaFromRequest(mockRequest())
    expect(persona).toBeTruthy()
    expect(persona!.id).toBe("internal-trader")
  })

  it("returns requested persona when header is set", () => {
    const persona = getPersonaFromRequest(mockRequest({ "x-demo-persona": "client-full" }))
    expect(persona!.id).toBe("client-full")
  })

  it("falls back to default for unknown persona", () => {
    const persona = getPersonaFromRequest(mockRequest({ "x-demo-persona": "nonexistent" }))
    expect(persona!.id).toBe("internal-trader")
  })
})

describe("personaHasEntitlement", () => {
  it("returns true for wildcard entitlement", () => {
    expect(personaHasEntitlement(["*"], "data-pro")).toBe(true)
  })

  it("returns true when specific entitlement matches", () => {
    expect(personaHasEntitlement(["data-pro", "execution-full"], "data-pro")).toBe(true)
  })

  it("returns false when entitlement not present", () => {
    expect(personaHasEntitlement(["data-basic"], "ml-full")).toBe(false)
  })

  it("returns false for empty entitlements", () => {
    expect(personaHasEntitlement([], "data-pro")).toBe(false)
  })
})

describe("scopeByEntitlement", () => {
  const data = [
    { id: 1, category: "CEFI", name: "BTC" },
    { id: 2, category: "DEFI", name: "ETH" },
    { id: 3, category: "TRADFI", name: "SPX" },
    { id: 4, category: "CEFI", name: "SOL" },
    { id: 5, category: "SPORTS", name: "NFL" },
  ]

  it("returns all data for wildcard", () => {
    const result = scopeByEntitlement(data, ["*"])
    expect(result).toHaveLength(5)
  })

  it("returns all data for data-pro", () => {
    const result = scopeByEntitlement(data, ["data-pro"])
    expect(result).toHaveLength(5)
  })

  it("filters to CEFI only for data-basic", () => {
    const result = scopeByEntitlement(data, ["data-basic"])
    expect(result).toHaveLength(2)
    expect(result.every((d) => d.category === "CEFI")).toBe(true)
  })

  it("applies basicLimit when not data-pro", () => {
    const result = scopeByEntitlement(data, ["data-basic"], { basicLimit: 1 })
    expect(result).toHaveLength(1)
  })

  it("ignores basicLimit for data-pro", () => {
    const result = scopeByEntitlement(data, ["data-pro"], { basicLimit: 1 })
    expect(result).toHaveLength(5)
  })

  it("uses custom categoryField", () => {
    const customData = [
      { id: 1, shard: "CEFI" },
      { id: 2, shard: "DEFI" },
    ]
    const result = scopeByEntitlement(customData, ["data-basic"], { categoryField: "shard" })
    expect(result).toHaveLength(1)
  })

  it("includes items without category field", () => {
    const noCatData = [{ id: 1, name: "no-category" }]
    const result = scopeByEntitlement(noCatData, ["data-basic"])
    expect(result).toHaveLength(1)
  })
})
