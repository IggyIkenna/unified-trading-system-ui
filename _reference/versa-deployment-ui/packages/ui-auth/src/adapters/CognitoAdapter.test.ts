/**
 * Unit tests for CognitoAdapter.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CognitoAdapter,
  generateCodeVerifier,
  generateCodeChallenge,
} from "./CognitoAdapter";
import type { AuthProviderConfig } from "../types";

const config: AuthProviderConfig = {
  provider: "cognito",
  clientId: "test-cognito-client",
  redirectUri: "https://example.com/auth/callback",
  scopes: ["openid", "email", "profile"],
  cognitoDomain: "https://my-domain.auth.us-east-1.amazoncognito.com",
};

function makeAdapter(overrides?: Partial<AuthProviderConfig>): CognitoAdapter {
  return new CognitoAdapter({ ...config, ...overrides });
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

// ---- PKCE helpers -------------------------------------------------------

describe("generateCodeVerifier()", () => {
  it("returns a string of length >= 43", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
  });

  it("returns a string of length <= 128", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("contains only URL-safe characters (no +/= padding)", () => {
    const verifier = generateCodeVerifier();
    // Must match unreserved chars per RFC 7636 §4.1
    expect(/^[A-Za-z0-9\-._~]+$/.test(verifier)).toBe(true);
  });

  it("produces unique values on successive calls", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe("generateCodeChallenge()", () => {
  it("returns a base64url string without padding", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(/^[A-Za-z0-9\-_]+$/.test(challenge)).toBe(true);
    expect(challenge).not.toContain("=");
    expect(challenge).not.toContain("+");
    expect(challenge).not.toContain("/");
  });

  it("produces a deterministic challenge for a given verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });
});

// ---- CognitoAdapter.getToken() ------------------------------------------

describe("CognitoAdapter.getToken()", () => {
  it("returns null when sessionStorage is empty", () => {
    const adapter = makeAdapter();
    expect(adapter.getToken()).toBeNull();
  });

  it("returns the stored access token", () => {
    sessionStorage.setItem("cognito_access_token", "my-access-token");
    const adapter = makeAdapter();
    expect(adapter.getToken()).toBe("my-access-token");
  });
});

// ---- CognitoAdapter.login() ---------------------------------------------

describe("CognitoAdapter.login()", () => {
  it("stores a PKCE verifier in sessionStorage and redirects to Cognito authorize endpoint", async () => {
    const hrefSetter = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      get href() {
        return "https://example.com/";
      },
      set href(val: string) {
        hrefSetter(val);
      },
      origin: "https://example.com",
      hash: "",
      search: "",
      pathname: "/",
    } as Location);

    const adapter = makeAdapter();
    adapter.login();

    // Verifier must be stored synchronously before the async challenge computation.
    expect(sessionStorage.getItem("cognito_pkce_verifier")).not.toBeNull();

    // Wait for the async challenge + redirect. crypto.subtle.digest is a native
    // async operation that may resolve in a later event loop turn rather than the
    // next microtask, so we poll until hrefSetter is called.
    await vi.waitFor(() => {
      expect(hrefSetter).toHaveBeenCalledOnce();
    });
    const redirectUrl = hrefSetter.mock.calls[0][0] as string;
    expect(redirectUrl).toContain(
      "my-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize",
    );
    expect(redirectUrl).toContain("code_challenge_method=S256");
    expect(redirectUrl).toContain("code_challenge=");
    expect(redirectUrl).toContain("client_id=test-cognito-client");
    expect(redirectUrl).toContain("response_type=code");
  });
});

// ---- CognitoAdapter.handleCallback() ------------------------------------

describe("CognitoAdapter.handleCallback()", () => {
  it("returns null when no ?code= in URL", async () => {
    const adapter = makeAdapter();
    expect(await adapter.handleCallback()).toBeNull();
  });

  it("returns null when no verifier in sessionStorage", async () => {
    window.history.replaceState({}, "", "/?code=auth-code-123");
    const adapter = makeAdapter();
    expect(await adapter.handleCallback()).toBeNull();
  });

  it("POSTs to /oauth2/token with code + verifier and stores tokens", async () => {
    window.history.replaceState({}, "", "/?code=auth-code-123");
    sessionStorage.setItem("cognito_pkce_verifier", "test-verifier");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = makeAdapter();
    const result = await adapter.handleCallback();

    expect(result).toBe("new-access-token");
    expect(sessionStorage.getItem("cognito_access_token")).toBe(
      "new-access-token",
    );
    expect(sessionStorage.getItem("cognito_refresh_token")).toBe(
      "new-refresh-token",
    );
    // Verifier must be cleared after callback.
    expect(sessionStorage.getItem("cognito_pkce_verifier")).toBeNull();

    // Verify POST body contains expected fields.
    const fetchArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchArgs[0]).toContain("/oauth2/token");
    const body = fetchArgs[1]?.body as string;
    expect(body).toContain("grant_type=authorization_code");
    expect(body).toContain("code=auth-code-123");
    expect(body).toContain("code_verifier=test-verifier");
  });

  it("clears the verifier even on fetch failure", async () => {
    window.history.replaceState({}, "", "/?code=auth-code-123");
    sessionStorage.setItem("cognito_pkce_verifier", "test-verifier");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );

    const adapter = makeAdapter();
    const result = await adapter.handleCallback();
    expect(result).toBeNull();
    expect(sessionStorage.getItem("cognito_pkce_verifier")).toBeNull();
  });
});

// ---- CognitoAdapter.refreshToken() --------------------------------------

describe("CognitoAdapter.refreshToken()", () => {
  it("returns null when no refresh token is stored", async () => {
    const adapter = makeAdapter();
    expect(await adapter.refreshToken()).toBeNull();
  });

  it("POSTs to /oauth2/token with refresh_token grant and updates stored access_token", async () => {
    sessionStorage.setItem("cognito_refresh_token", "my-refresh-token");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "refreshed-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = makeAdapter();
    const result = await adapter.refreshToken();
    expect(result).toBe("refreshed-access-token");
    expect(sessionStorage.getItem("cognito_access_token")).toBe(
      "refreshed-access-token",
    );

    const fetchArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = fetchArgs[1]?.body as string;
    expect(body).toContain("grant_type=refresh_token");
    expect(body).toContain("refresh_token=my-refresh-token");
  });

  it("returns null on non-OK response", async () => {
    sessionStorage.setItem("cognito_refresh_token", "old-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const adapter = makeAdapter();
    expect(await adapter.refreshToken()).toBeNull();
  });
});

// ---- CognitoAdapter.logout() --------------------------------------------

describe("CognitoAdapter.logout()", () => {
  it("clears all Cognito storage keys", () => {
    sessionStorage.setItem("cognito_access_token", "a");
    sessionStorage.setItem("cognito_refresh_token", "b");
    sessionStorage.setItem("cognito_pkce_verifier", "c");

    const hrefSetter = vi.fn();
    const mockLocation = { ...window.location } as Location;
    Object.defineProperty(mockLocation, "href", {
      set: hrefSetter,
      get: () => "",
    });
    vi.spyOn(window, "location", "get").mockReturnValue(mockLocation);

    const adapter = makeAdapter();
    adapter.logout();

    expect(sessionStorage.getItem("cognito_access_token")).toBeNull();
    expect(sessionStorage.getItem("cognito_refresh_token")).toBeNull();
    expect(sessionStorage.getItem("cognito_pkce_verifier")).toBeNull();
  });

  it("redirects to Cognito /logout endpoint", () => {
    const hrefSetter = vi.fn();
    const mockLocation = { ...window.location } as Location;
    Object.defineProperty(mockLocation, "href", {
      set: hrefSetter,
      get: () => "",
    });
    vi.spyOn(window, "location", "get").mockReturnValue(mockLocation);

    const adapter = makeAdapter();
    adapter.logout();

    expect(hrefSetter).toHaveBeenCalledOnce();
    const url = hrefSetter.mock.calls[0][0] as string;
    expect(url).toContain("/logout");
    expect(url).toContain("client_id=test-cognito-client");
  });
});
