/**
 * Unit tests for GoogleAdapter.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoogleAdapter } from "./GoogleAdapter";
import type { AuthProviderConfig } from "../types";

const config: AuthProviderConfig = {
  provider: "google",
  clientId: "test-google-client-id",
  redirectUri: "https://example.com/auth/callback",
  scopes: ["openid", "email", "profile"],
};

// Helper to build an adapter with standard config.
function makeAdapter(overrides?: Partial<AuthProviderConfig>): GoogleAdapter {
  return new GoogleAdapter({ ...config, ...overrides });
}

// Reset sessionStorage and window.location before each test.
beforeEach(() => {
  sessionStorage.clear();
  // Reset hash and search.
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("GoogleAdapter.getToken()", () => {
  it("returns null when sessionStorage is empty", () => {
    const adapter = makeAdapter();
    expect(adapter.getToken()).toBeNull();
  });

  it("returns the stored token", () => {
    sessionStorage.setItem("google_id_token", "my-test-token");
    const adapter = makeAdapter();
    expect(adapter.getToken()).toBe("my-test-token");
  });
});

describe("GoogleAdapter.handleCallback()", () => {
  it("returns null when hash is empty", async () => {
    const adapter = makeAdapter();
    window.history.replaceState({}, "", "/#");
    expect(await adapter.handleCallback()).toBeNull();
  });

  it("returns null when hash has no id_token", async () => {
    window.history.replaceState({}, "", "/#access_token=abc");
    const adapter = makeAdapter();
    expect(await adapter.handleCallback()).toBeNull();
  });

  it("parses id_token from hash fragment, stores in sessionStorage, returns token", async () => {
    window.history.replaceState(
      {},
      "",
      "/#id_token=my-id-token&token_type=Bearer",
    );
    const adapter = makeAdapter();
    const result = await adapter.handleCallback();
    expect(result).toBe("my-id-token");
    expect(sessionStorage.getItem("google_id_token")).toBe("my-id-token");
  });

  it("clears the hash from the URL after parsing", async () => {
    window.history.replaceState({}, "", "/#id_token=my-id-token");
    const adapter = makeAdapter();
    await adapter.handleCallback();
    expect(window.location.hash).toBe("");
  });
});

describe("GoogleAdapter.logout()", () => {
  it("removes the google_id_token from sessionStorage", () => {
    sessionStorage.setItem("google_id_token", "token-to-remove");
    const adapter = makeAdapter();
    adapter.logout();
    expect(sessionStorage.getItem("google_id_token")).toBeNull();
  });
});

describe("GoogleAdapter.refreshToken()", () => {
  it("always returns null (implicit flow has no refresh)", async () => {
    const adapter = makeAdapter();
    const result = await adapter.refreshToken();
    expect(result).toBeNull();
  });
});

describe("GoogleAdapter.login()", () => {
  it("redirects window.location.href to accounts.google.com", () => {
    // Mock window.location.href setter.
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

    const adapter = makeAdapter({ skipAuth: false });
    adapter.login();
    expect(hrefSetter).toHaveBeenCalledOnce();
    const redirectUrl = hrefSetter.mock.calls[0][0] as string;
    expect(redirectUrl).toContain("accounts.google.com");
    expect(redirectUrl).toContain("client_id=test-google-client-id");
    expect(redirectUrl).toContain("response_type=id_token");
  });
});
