import { describe, expect, it } from "vitest";

import {
  audienceForPersonaId,
  audienceForUser,
} from "@/lib/auth/audience-from-persona";
import type { AuthUser } from "@/lib/auth/types";

function mkUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "test",
    email: "test@test",
    displayName: "Test",
    role: "client",
    org: { id: "org", name: "Test Org" },
    entitlements: [],
    ...overrides,
  };
}

describe("audienceForUser", () => {
  it("returns trading_platform_subscriber for null/undefined user", () => {
    expect(audienceForUser(null)).toBe("trading_platform_subscriber");
    expect(audienceForUser(undefined)).toBe("trading_platform_subscriber");
  });

  it("returns admin for admin role", () => {
    expect(
      audienceForUser(mkUser({ id: "admin", role: "admin" })),
    ).toBe("admin");
  });

  it("returns admin for internal role", () => {
    expect(
      audienceForUser(mkUser({ id: "internal-trader", role: "internal" })),
    ).toBe("admin");
  });

  it("returns im_client for prospect-im", () => {
    expect(
      audienceForUser(mkUser({ id: "prospect-im", role: "client" })),
    ).toBe("im_client");
  });

  it("returns im_client for investor + advisor", () => {
    expect(
      audienceForUser(mkUser({ id: "investor", role: "client" })),
    ).toBe("im_client");
    expect(
      audienceForUser(mkUser({ id: "advisor", role: "client" })),
    ).toBe("im_client");
  });

  it("returns trading_platform_subscriber for DART + Reg prospects", () => {
    expect(
      audienceForUser(mkUser({ id: "prospect-platform", role: "client" })),
    ).toBe("trading_platform_subscriber");
    expect(
      audienceForUser(mkUser({ id: "prospect-regulatory", role: "client" })),
    ).toBe("trading_platform_subscriber");
    expect(
      audienceForUser(mkUser({ id: "elysium-defi", role: "client" })),
    ).toBe("trading_platform_subscriber");
    expect(
      audienceForUser(mkUser({ id: "client-full", role: "client" })),
    ).toBe("trading_platform_subscriber");
    expect(
      audienceForUser(mkUser({ id: "client-data-only", role: "client" })),
    ).toBe("trading_platform_subscriber");
  });
});

describe("audienceForPersonaId", () => {
  it("works from just a persona id without the full AuthUser", () => {
    expect(audienceForPersonaId("admin")).toBe("admin");
    expect(audienceForPersonaId("internal-trader")).toBe("admin");
    expect(audienceForPersonaId("prospect-im")).toBe("im_client");
    expect(audienceForPersonaId("prospect-platform")).toBe(
      "trading_platform_subscriber",
    );
    expect(audienceForPersonaId(null)).toBe("trading_platform_subscriber");
  });

  it("role hint overrides unknown persona id", () => {
    expect(audienceForPersonaId("unknown-new-persona", "admin")).toBe("admin");
  });

  it("internal role hint returns admin audience", () => {
    expect(audienceForPersonaId("unknown-persona", "internal")).toBe("admin");
  });

  it("client role hint with unknown persona defaults to trading_platform_subscriber", () => {
    expect(audienceForPersonaId("unknown-persona", "client")).toBe(
      "trading_platform_subscriber",
    );
  });
});
