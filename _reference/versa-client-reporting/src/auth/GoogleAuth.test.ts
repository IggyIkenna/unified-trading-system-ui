import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  sessionStorage.clear();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GoogleAuth — getStoredToken", () => {
  it("returns null when no token is stored", async () => {
    vi.resetModules();
    const { getStoredToken } = await import("./GoogleAuth");
    expect(getStoredToken()).toBeNull();
  });

  it("returns the stored token when one exists", async () => {
    vi.resetModules();
    sessionStorage.setItem("google_id_token", "tok_abc");
    const { getStoredToken } = await import("./GoogleAuth");
    expect(getStoredToken()).toBe("tok_abc");
  });
});

describe("GoogleAuth — clearToken", () => {
  it("removes google_id_token from sessionStorage", async () => {
    vi.resetModules();
    const { clearToken } = await import("./GoogleAuth");
    sessionStorage.setItem("google_id_token", "tok_xyz");
    clearToken();
    expect(sessionStorage.getItem("google_id_token")).toBeNull();
  });

  it("does not throw when no token is stored", async () => {
    vi.resetModules();
    const { clearToken } = await import("./GoogleAuth");
    expect(() => clearToken()).not.toThrow();
  });
});

describe("GoogleAuth — initiateGoogleLogin with SKIP_AUTH=true", () => {
  it("stores dev_token in sessionStorage when SKIP_AUTH is true", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "true");
    vi.resetModules();
    const { initiateGoogleLogin } = await import("./GoogleAuth");

    // Prevent actual navigation
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });

    initiateGoogleLogin();
    expect(sessionStorage.getItem("google_id_token")).toBe("dev_token");
  });

  it("redirects to / when SKIP_AUTH is true", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "true");
    vi.resetModules();
    const { initiateGoogleLogin } = await import("./GoogleAuth");

    const loc = { href: "" };
    Object.defineProperty(window, "location", {
      value: loc,
      writable: true,
      configurable: true,
    });

    initiateGoogleLogin();
    expect(loc.href).toBe("/");
  });
});

describe("GoogleAuth — initiateGoogleLogin without SKIP_AUTH", () => {
  it("redirects to Google OAuth endpoint when SKIP_AUTH is false", async () => {
    vi.stubEnv("VITE_SKIP_AUTH", "false");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-123");
    vi.resetModules();

    let capturedHref = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      get() {
        return {
          origin: "http://localhost:5182",
          get href() {
            return capturedHref;
          },
          set href(v: string) {
            capturedHref = v;
          },
        };
      },
    });

    const { initiateGoogleLogin } = await import("./GoogleAuth");
    initiateGoogleLogin();

    expect(capturedHref).toContain("accounts.google.com");
  });
});
