/**
 * Unit tests for useAuthToken hook.
 * Must be rendered inside an <AuthProvider>.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "./AuthContext";
import { useAuthToken } from "./useAuthToken";
import type { AuthProviderConfig } from "./types";

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

const googleConfig: AuthProviderConfig = {
  provider: "google",
  clientId: "test-client-id",
  redirectUri: "https://example.com/auth/callback",
  scopes: ["openid", "email", "profile"],
};

function TokenDisplay(): React.ReactElement {
  const { token, isAuthenticated } = useAuthToken();
  return (
    <div>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
    </div>
  );
}

describe("useAuthToken — unauthenticated state", () => {
  it("returns null token and isAuthenticated=false when no session", async () => {
    await act(async () => {
      render(
        <AuthProvider config={googleConfig}>
          <TokenDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
  });
});

describe("useAuthToken — authenticated state", () => {
  it("returns token and isAuthenticated=true when google_id_token in sessionStorage", async () => {
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payload = btoa(
      JSON.stringify({ sub: "user123", email: "user@test.com" }),
    )
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const fakeJwt = `${header}.${payload}.fakesig`;
    sessionStorage.setItem("google_id_token", fakeJwt);

    await act(async () => {
      render(
        <AuthProvider config={googleConfig}>
          <TokenDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("token").textContent).toBe(fakeJwt);
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
  });
});

describe("useAuthToken — skipAuth bypass", () => {
  it("returns dev_token and isAuthenticated=true with skipAuth=true", async () => {
    const skipConfig: AuthProviderConfig = { ...googleConfig, skipAuth: true };

    await act(async () => {
      render(
        <AuthProvider config={skipConfig}>
          <TokenDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("token").textContent).toBe("dev_token");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
  });
});
