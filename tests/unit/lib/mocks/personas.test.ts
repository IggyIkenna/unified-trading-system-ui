import { PERSONAS, getPersonaByEmail, getPersonaById } from "@/lib/auth/personas";

describe("PERSONAS", () => {
  // Count intentionally asserted as a floor rather than an exact number.
  // New personas are added as G1.x/G2.x waves layer in (e.g. G1.4 Wave F
  // added 6 axis-coverage personas). We enforce the curated minimum set
  // via ``REQUIRED_PERSONA_IDS`` below instead of pinning the total length.
  it("contains at least the curated minimum persona set", () => {
    const REQUIRED_PERSONA_IDS = [
      "admin",
      "internal-trader",
      "client-full",
      "client-data-only",
      "client-premium",
      "investor",
      "advisor",
      "prospect-im",
      "prospect-platform",
      "prospect-regulatory",
      "elysium-defi",
    ];
    expect(PERSONAS.length).toBeGreaterThanOrEqual(REQUIRED_PERSONA_IDS.length);
    const ids = PERSONAS.map((p) => p.id);
    for (const requiredId of REQUIRED_PERSONA_IDS) {
      expect(ids).toContain(requiredId);
    }
  });

  it("every persona has required fields", () => {
    for (const p of PERSONAS) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("email");
      expect(p).toHaveProperty("displayName");
      expect(p).toHaveProperty("role");
      expect(p).toHaveProperty("org");
      expect(p).toHaveProperty("entitlements");
      expect(p).toHaveProperty("description");
      expect(p.org).toHaveProperty("id");
      expect(p.org).toHaveProperty("name");
    }
  });

  it("has an admin persona with wildcard entitlements", () => {
    const admin = PERSONAS.find((p) => p.role === "admin");
    expect(admin).toBeTruthy();
    expect(admin!.entitlements).toContain("*");
  });

  it("has an internal-trader persona", () => {
    const trader = PERSONAS.find((p) => p.id === "internal-trader");
    expect(trader).toBeTruthy();
    expect(trader!.role).toBe("internal");
  });

  it("has client personas with specific entitlements", () => {
    const clients = PERSONAS.filter((p) => p.role === "client");
    expect(clients.length).toBeGreaterThanOrEqual(2);

    const full = clients.find((c) => c.id === "client-full");
    expect(full).toBeTruthy();
    expect(full!.entitlements.length).toBeGreaterThan(1);

    const basic = clients.find((c) => c.id === "client-data-only");
    expect(basic).toBeTruthy();
    expect(basic!.entitlements).toContain("data-basic");
  });

  it("all personas have unique ids", () => {
    const ids = PERSONAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all personas have unique emails except known demo-toggle pairs", () => {
    // desmondhw@gmail.com is intentionally shared between desmond-dart-full and
    // desmond-signals-in — the DemoPlanToggle switches tiers via persona ID directly.
    const knownSharedEmails = new Set(["desmondhw@gmail.com", "patrick@bankelysium.com"]);
    const emailCount = new Map<string, number>();
    for (const email of PERSONAS.map((p) => p.email)) {
      emailCount.set(email, (emailCount.get(email) ?? 0) + 1);
    }
    const unexpectedDuplicates = [...emailCount.entries()].filter(
      ([email, count]) => count > 1 && !knownSharedEmails.has(email),
    );
    expect(unexpectedDuplicates).toHaveLength(0);
  });
});

describe("getPersonaById", () => {
  it("returns persona for valid id", () => {
    const persona = getPersonaById("internal-trader");
    expect(persona).toBeTruthy();
    expect(persona!.id).toBe("internal-trader");
  });

  it("returns undefined for invalid id", () => {
    expect(getPersonaById("nonexistent")).toBeUndefined();
  });
});

describe("getPersonaByEmail", () => {
  it("returns persona for valid email", () => {
    const admin = PERSONAS[0];
    const persona = getPersonaByEmail(admin.email);
    expect(persona).toBeTruthy();
    expect(persona!.email).toBe(admin.email);
  });

  it("returns undefined for invalid email", () => {
    expect(getPersonaByEmail("nope@nope.com")).toBeUndefined();
  });
});
