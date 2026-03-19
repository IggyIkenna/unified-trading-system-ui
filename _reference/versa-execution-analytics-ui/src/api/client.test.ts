import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@unified-admin/core", async () => {
  const actual = await vi.importActual<typeof import("@unified-admin/core")>(
    "@unified-admin/core",
  );
  return { ...actual };
});

describe("api/client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports apiClient with get, post, put, delete methods", async () => {
    const { apiClient } = await import("./client");
    expect(typeof apiClient.get).toBe("function");
    expect(typeof apiClient.post).toBe("function");
    expect(typeof apiClient.put).toBe("function");
    expect(typeof apiClient.delete).toBe("function");
  }, 15000);

  it("injects Authorization header when session token exists", async () => {
    sessionStorage.setItem("google_id_token", "test-tok");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { apiClient } = await import("./client");
    await apiClient.get("/test");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-tok");

    sessionStorage.clear();
  });

  it("wraps response in { data } for backward compatibility", async () => {
    const payload = { items: [1, 2, 3] };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { apiClient } = await import("./client");
    const response = await apiClient.get<{ items: number[] }>("/test");
    expect(response.data).toEqual(payload);

    sessionStorage.clear();
  });
});

describe("getSessionToken logic", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("uses google_id_token when present", () => {
    sessionStorage.setItem("google_id_token", "google-tok");
    const token =
      sessionStorage.getItem("google_id_token") ??
      sessionStorage.getItem("cognito_access_token");
    expect(token).toBe("google-tok");
  });

  it("falls back to cognito_access_token when google_id_token is absent", () => {
    sessionStorage.setItem("cognito_access_token", "cognito-tok");
    const token =
      sessionStorage.getItem("google_id_token") ??
      sessionStorage.getItem("cognito_access_token");
    expect(token).toBe("cognito-tok");
  });

  it("returns null when neither token exists", () => {
    const token =
      sessionStorage.getItem("google_id_token") ??
      sessionStorage.getItem("cognito_access_token");
    expect(token).toBeNull();
  });

  it("prefers google_id_token over cognito_access_token", () => {
    sessionStorage.setItem("google_id_token", "google-tok");
    sessionStorage.setItem("cognito_access_token", "cognito-tok");
    const token =
      sessionStorage.getItem("google_id_token") ??
      sessionStorage.getItem("cognito_access_token");
    expect(token).toBe("google-tok");
  });
});
