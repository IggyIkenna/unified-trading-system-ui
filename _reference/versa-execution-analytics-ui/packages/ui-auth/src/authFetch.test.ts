/**
 * Unit tests for authFetch and authFetchJson.
 *
 * useAuthFetch() is a React hook — tested via a render wrapper in authFetch.hook.test.tsx.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authFetch, authFetchJson } from "./authFetch";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---- authFetch ---------------------------------------------------------------

describe("authFetch — no stored token", () => {
  it("calls fetch without Authorization header when no token stored", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});

describe("authFetch — google token in sessionStorage", () => {
  it("adds Authorization header from google_id_token", async () => {
    sessionStorage.setItem("google_id_token", "google-token-abc");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer google-token-abc");
  });
});

describe("authFetch — cognito token in sessionStorage", () => {
  it("adds Authorization header from cognito_access_token when google_id_token absent", async () => {
    sessionStorage.setItem("cognito_access_token", "cognito-token-xyz");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer cognito-token-xyz");
  });
});

describe("authFetch — getToken callback", () => {
  it("uses getToken callback over sessionStorage when provided", async () => {
    sessionStorage.setItem("google_id_token", "stored-token");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api", {}, () => "callback-token");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer callback-token");
  });

  it("omits Authorization when getToken returns null", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api", {}, () => null);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});

describe("authFetch — skipAuth flag", () => {
  it("omits Authorization header when skipAuth=true even if token is stored", async () => {
    sessionStorage.setItem("google_id_token", "should-not-appear");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await authFetch("https://example.com/api", { skipAuth: true });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});

// ---- authFetchJson -----------------------------------------------------------

describe("authFetchJson — success", () => {
  it("returns parsed JSON on ok response", async () => {
    const data = { value: 42 };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => data,
      }),
    );

    const result = await authFetchJson<{ value: number }>(
      "https://example.com/api",
    );
    expect(result).toEqual(data);
  });
});

describe("authFetchJson — non-OK response", () => {
  it("throws an error with status on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      }),
    );

    await expect(authFetchJson("https://example.com/api")).rejects.toThrow(
      /HTTP 403/,
    );
  });
});
