/**
 * Unit tests for AuthContext (AuthProvider + useAuth).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import type { AuthProviderConfig } from "./types";

// AuthContext relies on react-router-dom's useNavigate in RequireAuth, but
// AuthContext itself does not. We only test AuthProvider and useAuth here.

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

// Unmount all rendered components after each test to avoid DOM accumulation.
afterEach(() => {
  cleanup();
});

const googleConfig: AuthProviderConfig = {
  provider: "google",
  clientId: "test-client-id",
  redirectUri: "https://example.com/auth/callback",
  scopes: ["openid", "email", "profile"],
};

// ---- Helper component -------------------------------------------------------

/** Renders auth state from context into the DOM for assertions. */
function AuthStateDisplay(): React.ReactElement {
  const { isAuthenticated, isLoading, token } = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="token">{token ?? "null"}</span>
    </div>
  );
}

// ---- Tests ------------------------------------------------------------------

describe("AuthProvider — renders children", () => {
  it("renders its children in the DOM", async () => {
    await act(async () => {
      render(
        <AuthProvider config={googleConfig}>
          <div data-testid="child">hello</div>
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("child")).toBeDefined();
  });
});

describe("AuthProvider — skipAuth bypass", () => {
  it("sets isAuthenticated=true and token='dev_token' immediately when skipAuth=true", async () => {
    const skipConfig: AuthProviderConfig = { ...googleConfig, skipAuth: true };
    await act(async () => {
      render(
        <AuthProvider config={skipConfig}>
          <AuthStateDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("dev_token");
  });
});

describe("AuthProvider — unauthenticated state", () => {
  it("sets isAuthenticated=false when no token in sessionStorage and no callback in URL", async () => {
    await act(async () => {
      render(
        <AuthProvider config={googleConfig}>
          <AuthStateDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("null");
  });
});

describe("AuthProvider — existing token in sessionStorage", () => {
  it("sets isAuthenticated=true when google_id_token is present in sessionStorage", async () => {
    // Use a minimal valid JWT payload (sub + email) base64url encoded.
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
          <AuthStateDisplay />
        </AuthProvider>,
      );
    });
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
    expect(screen.getByTestId("token").textContent).toBe(fakeJwt);
  });
});

describe("useAuth — throws outside AuthProvider", () => {
  it("throws an error with a helpful message when used outside AuthProvider", () => {
    function BadComponent(): React.ReactElement {
      useAuth(); // Should throw
      return <div />;
    }

    // Suppress React's error boundary console.error output for this test.
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => render(<BadComponent />)).toThrow(
      /useAuth\(\) must be used inside an <AuthProvider>/,
    );

    console.error = originalError;
  });
});
