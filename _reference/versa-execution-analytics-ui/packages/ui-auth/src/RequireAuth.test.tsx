/**
 * Unit tests for RequireAuth component.
 *
 * We wrap renders in react-router-dom's MemoryRouter so useNavigate() is
 * available without mocking the module (vi.mock + coverage collection hangs).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { RequireAuth } from "./RequireAuth";
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

// ---- Authenticated: renders children ----------------------------------------

describe("RequireAuth — authenticated", () => {
  it("renders children when skipAuth=true (always authenticated)", async () => {
    const skipConfig: AuthProviderConfig = { ...googleConfig, skipAuth: true };

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider config={skipConfig}>
            <RequireAuth>
              <div data-testid="protected-content">secret</div>
            </RequireAuth>
          </AuthProvider>
        </MemoryRouter>,
      );
    });

    expect(screen.getByTestId("protected-content").textContent).toBe("secret");
  });
});

// ---- Unauthenticated: redirecting state ------------------------------------

describe("RequireAuth — unauthenticated", () => {
  it("shows redirecting message when not authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider config={googleConfig}>
            <RequireAuth>
              <div data-testid="protected">secret</div>
            </RequireAuth>
          </AuthProvider>
        </MemoryRouter>,
      );
    });

    // When unauthenticated RequireAuth renders "Redirecting to login..." message.
    expect(screen.getByText("Redirecting to login...")).toBeDefined();
    expect(screen.queryByTestId("protected")).toBeNull();
  });

  it("renders with loginPath prop and navigates without throwing", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider config={googleConfig}>
            <RequireAuth loginPath="/login">
              <div data-testid="protected">secret</div>
            </RequireAuth>
          </AuthProvider>
        </MemoryRouter>,
      );
    });

    // When unauthenticated, children must not be visible.
    expect(screen.queryByTestId("protected")).toBeNull();
  });
});
