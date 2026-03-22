import { PERSONAS, getPersonaById, getPersonaByEmail } from "@/lib/auth/personas"

describe("PERSONAS", () => {
  it("has 4 demo personas", () => {
    expect(PERSONAS).toHaveLength(5)
  })

  it("every persona has required fields", () => {
    for (const p of PERSONAS) {
      expect(p).toHaveProperty("id")
      expect(p).toHaveProperty("email")
      expect(p).toHaveProperty("displayName")
      expect(p).toHaveProperty("role")
      expect(p).toHaveProperty("org")
      expect(p).toHaveProperty("entitlements")
      expect(p).toHaveProperty("description")
      expect(p.org).toHaveProperty("id")
      expect(p.org).toHaveProperty("name")
    }
  })

  it("has an admin persona with wildcard entitlements", () => {
    const admin = PERSONAS.find((p) => p.role === "admin")
    expect(admin).toBeTruthy()
    expect(admin!.entitlements).toContain("*")
  })

  it("has an internal-trader persona", () => {
    const trader = PERSONAS.find((p) => p.id === "internal-trader")
    expect(trader).toBeTruthy()
    expect(trader!.role).toBe("internal")
  })

  it("has client personas with specific entitlements", () => {
    const clients = PERSONAS.filter((p) => p.role === "client")
    expect(clients.length).toBeGreaterThanOrEqual(2)

    const full = clients.find((c) => c.id === "client-full")
    expect(full).toBeTruthy()
    expect(full!.entitlements.length).toBeGreaterThan(1)

    const basic = clients.find((c) => c.id === "client-data-only")
    expect(basic).toBeTruthy()
    expect(basic!.entitlements).toContain("data-basic")
  })

  it("all personas have unique ids", () => {
    const ids = PERSONAS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("all personas have unique emails", () => {
    const emails = PERSONAS.map((p) => p.email)
    expect(new Set(emails).size).toBe(emails.length)
  })
})

describe("getPersonaById", () => {
  it("returns persona for valid id", () => {
    const persona = getPersonaById("internal-trader")
    expect(persona).toBeTruthy()
    expect(persona!.id).toBe("internal-trader")
  })

  it("returns undefined for invalid id", () => {
    expect(getPersonaById("nonexistent")).toBeUndefined()
  })
})

describe("getPersonaByEmail", () => {
  it("returns persona for valid email", () => {
    const admin = PERSONAS[0]
    const persona = getPersonaByEmail(admin.email)
    expect(persona).toBeTruthy()
    expect(persona!.email).toBe(admin.email)
  })

  it("returns undefined for invalid email", () => {
    expect(getPersonaByEmail("nope@nope.com")).toBeUndefined()
  })
})
