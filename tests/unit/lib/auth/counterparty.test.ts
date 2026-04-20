import { describe, expect, it } from "vitest";

import type { AuthUser } from "@/lib/auth/types";
import {
  COUNTERPARTY_POST_AUTH_REDIRECT,
  COUNTERPARTY_USER_TYPE,
  isCounterpartyUser,
  postAuthRedirectFor,
} from "@/lib/auth/counterparty";

const BASE_USER: AuthUser = {
  id: "u-1",
  email: "user@example.com",
  displayName: "Example",
  role: "client",
  org: { id: "org-1", name: "Example Org" },
  entitlements: [],
};

describe("counterparty persona wiring", () => {
  it("exports the canonical user-type discriminator", () => {
    expect(COUNTERPARTY_USER_TYPE).toBe("counterparty");
  });

  it("exports the correct post-auth redirect to B-3a's dashboard", () => {
    expect(COUNTERPARTY_POST_AUTH_REDIRECT).toBe("/services/signals/dashboard");
  });

  it("isCounterpartyUser returns false for null / undefined", () => {
    expect(isCounterpartyUser(null)).toBe(false);
    expect(isCounterpartyUser(undefined)).toBe(false);
  });

  it("isCounterpartyUser returns false for a plain client persona", () => {
    expect(isCounterpartyUser(BASE_USER)).toBe(false);
  });

  it("isCounterpartyUser returns true when counterparty-tenant marker present", () => {
    const cpUser: AuthUser = {
      ...BASE_USER,
      entitlements: ["counterparty-tenant" as never],
    };
    expect(isCounterpartyUser(cpUser)).toBe(true);
  });

  it("postAuthRedirectFor routes counterparty users to the dashboard", () => {
    const cpUser: AuthUser = {
      ...BASE_USER,
      entitlements: ["counterparty-tenant" as never],
    };
    expect(postAuthRedirectFor(cpUser)).toBe(
      COUNTERPARTY_POST_AUTH_REDIRECT,
    );
  });

  it("postAuthRedirectFor falls back for non-counterparty users", () => {
    expect(postAuthRedirectFor(BASE_USER, "/dashboard")).toBe("/dashboard");
    expect(postAuthRedirectFor(null, "/login")).toBe("/login");
  });
});
