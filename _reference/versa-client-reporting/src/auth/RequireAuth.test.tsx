import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

beforeEach(() => {
  sessionStorage.clear();
  vi.unstubAllEnvs();
  // Reset hash and pathname
  Object.defineProperty(window, "location", {
    value: {
      hash: "",
      pathname: "/",
      href: "http://localhost:3000/",
      origin: "http://localhost:3000",
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("RequireAuth — SKIP_AUTH=true", () => {
  it("renders children immediately when VITE_SKIP_AUTH is true", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "true");
    vi.resetModules();

    vi.doMock("./GoogleAuth", () => ({
      getStoredToken: vi.fn().mockReturnValue(null),
      initiateGoogleLogin: vi.fn(),
    }));

    const { RequireAuth } = await import("./RequireAuth");

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});

describe("RequireAuth — token in sessionStorage", () => {
  it("renders children when a valid token is stored", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "false");
    vi.resetModules();

    vi.doMock("./GoogleAuth", () => ({
      getStoredToken: vi.fn().mockReturnValue("valid_token"),
      initiateGoogleLogin: vi.fn(),
    }));

    const { RequireAuth } = await import("./RequireAuth");

    render(
      <RequireAuth>
        <div>Authenticated Content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
    });
  });
});

describe("RequireAuth — no token, no hash", () => {
  it("calls initiateGoogleLogin when no token and no id_token in hash", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "false");
    vi.resetModules();

    const mockInitiateGoogleLogin = vi.fn();

    vi.doMock("./GoogleAuth", () => ({
      getStoredToken: vi.fn().mockReturnValue(null),
      initiateGoogleLogin: mockInitiateGoogleLogin,
    }));

    const { RequireAuth } = await import("./RequireAuth");

    render(
      <RequireAuth>
        <div>Should Not Show</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(mockInitiateGoogleLogin).toHaveBeenCalled();
    });
  });
});

describe("RequireAuth — id_token in URL hash", () => {
  it("extracts token from hash, stores it, and renders children", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "false");

    Object.defineProperty(window, "location", {
      value: {
        hash: "#id_token=hash_token_abc",
        pathname: "/",
        href: "http://localhost:3000/#id_token=hash_token_abc",
        origin: "http://localhost:3000",
      },
      writable: true,
      configurable: true,
    });

    window.history.replaceState = vi.fn();

    vi.resetModules();

    vi.doMock("./GoogleAuth", () => ({
      getStoredToken: vi.fn().mockReturnValue(null),
      initiateGoogleLogin: vi.fn(),
    }));

    const { RequireAuth } = await import("./RequireAuth");

    render(
      <RequireAuth>
        <div>Hash Auth Content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(screen.getByText("Hash Auth Content")).toBeInTheDocument();
    });

    expect(sessionStorage.getItem("google_id_token")).toBe("hash_token_abc");
  });
});

describe("RequireAuth — loading state", () => {
  it("shows Loading... during initial auth check (SKIP_AUTH=false, no token)", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "false");
    vi.resetModules();

    vi.doMock("./GoogleAuth", () => ({
      getStoredToken: vi.fn().mockReturnValue(null),
      initiateGoogleLogin: vi.fn(),
    }));

    const { RequireAuth } = await import("./RequireAuth");

    render(
      <RequireAuth>
        <div>Content</div>
      </RequireAuth>,
    );

    // Loading appears synchronously before effects run (or redirecting after)
    const loadingOrRedirecting =
      screen.queryByText("Loading...") ||
      screen.queryByText("Redirecting to login...");
    // At least one of these states will be visible before auth resolves
    expect(loadingOrRedirecting).not.toBeNull();
  });
});
