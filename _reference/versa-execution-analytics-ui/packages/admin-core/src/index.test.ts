import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  defineColumns,
  createNavItem,
  createPaginationState,
  hasNextPage,
  hasPrevPage,
  isTokenExpired,
  buildAuthorizationUrl,
  createEmptySession,
  getStoredToken,
  clearToken,
  initiateGoogleLogin,
  getCognitoToken,
  clearCognitoToken,
  initiateCognitoLogin,
  handleCognitoCallback,
  getSessionToken,
  generatePKCE,
  mergeHeaders,
  jsonHeaders,
  createClientConfig,
  createApiClient,
  ApiClientError,
} from "./index.js";

// ── components ────────────────────────────────────────────────────────────────

describe("defineColumns", () => {
  it("returns the same array reference", () => {
    interface Row {
      id: number;
      name: string;
    }
    const cols = defineColumns<Row>([
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
    ]);
    expect(cols).toHaveLength(2);
    expect(cols[0]?.key).toBe("id");
  });
});

describe("createNavItem", () => {
  it("sets active=false by default", () => {
    const item = createNavItem("Dashboard", "/dashboard");
    expect(item.active).toBe(false);
    expect(item.label).toBe("Dashboard");
    expect(item.href).toBe("/dashboard");
  });
});

// ── hooks ─────────────────────────────────────────────────────────────────────

describe("createPaginationState", () => {
  it("defaults to page 1, pageSize 25, total 0", () => {
    const state = createPaginationState();
    expect(state).toEqual({ page: 1, pageSize: 25, total: 0 });
  });

  it("accepts a custom pageSize", () => {
    const state = createPaginationState(50);
    expect(state.pageSize).toBe(50);
  });
});

describe("hasNextPage", () => {
  it("returns false when all items fit on current page", () => {
    expect(hasNextPage({ page: 1, pageSize: 25, total: 20 })).toBe(false);
  });

  it("returns true when more pages remain", () => {
    expect(hasNextPage({ page: 1, pageSize: 25, total: 100 })).toBe(true);
  });
});

describe("hasPrevPage", () => {
  it("returns false on page 1", () => {
    expect(hasPrevPage({ page: 1, pageSize: 25, total: 100 })).toBe(false);
  });

  it("returns true on page 2+", () => {
    expect(hasPrevPage({ page: 2, pageSize: 25, total: 100 })).toBe(true);
  });
});

// ── auth ──────────────────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  it("returns true when expiry is in the past", () => {
    const past = Date.now() - 1000;
    expect(isTokenExpired(past)).toBe(true);
  });

  it("returns false when token has ample time remaining", () => {
    const future = Date.now() + 600_000; // 10 min
    expect(isTokenExpired(future)).toBe(false);
  });
});

describe("buildAuthorizationUrl", () => {
  it("contains the required OAuth params", () => {
    const url = buildAuthorizationUrl(
      {
        clientId: "client-abc",
        authorizationEndpoint: "https://auth.example.com/authorize",
        tokenEndpoint: "https://auth.example.com/token",
        redirectUri: "https://app.example.com/callback",
        scopes: ["openid", "profile"],
      },
      "code-challenge-xyz",
      "state-123",
    );
    expect(url).toContain("client_id=client-abc");
    expect(url).toContain("code_challenge=code-challenge-xyz");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain("state=state-123");
  });
});

describe("createEmptySession", () => {
  it("returns unauthenticated session", () => {
    const session = createEmptySession();
    expect(session.authenticated).toBe(false);
    expect(session.userId).toBeUndefined();
  });
});

describe("getStoredToken", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns null when no token is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("returns stored google_id_token", () => {
    sessionStorage.setItem("google_id_token", "tok_abc");
    expect(getStoredToken()).toBe("tok_abc");
  });
});

describe("clearToken", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("removes google_id_token from sessionStorage", () => {
    sessionStorage.setItem("google_id_token", "tok_xyz");
    clearToken();
    expect(sessionStorage.getItem("google_id_token")).toBeNull();
  });

  it("does not throw when no token is stored", () => {
    expect(() => clearToken()).not.toThrow();
  });
});

describe("getCognitoToken", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns null when no token is stored", () => {
    expect(getCognitoToken()).toBeNull();
  });

  it("returns stored cognito_access_token", () => {
    sessionStorage.setItem("cognito_access_token", "cognito_tok");
    expect(getCognitoToken()).toBe("cognito_tok");
  });
});

describe("clearCognitoToken", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("removes cognito_access_token and pkce_verifier", () => {
    sessionStorage.setItem("cognito_access_token", "tok");
    sessionStorage.setItem("cognito_pkce_verifier", "verifier");
    clearCognitoToken();
    expect(sessionStorage.getItem("cognito_access_token")).toBeNull();
    expect(sessionStorage.getItem("cognito_pkce_verifier")).toBeNull();
  });
});

describe("getSessionToken", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns null when neither token exists", () => {
    expect(getSessionToken()).toBeNull();
  });

  it("returns google_id_token when present", () => {
    sessionStorage.setItem("google_id_token", "google-tok");
    expect(getSessionToken()).toBe("google-tok");
  });

  it("falls back to cognito_access_token when google token absent", () => {
    sessionStorage.setItem("cognito_access_token", "cognito-tok");
    expect(getSessionToken()).toBe("cognito-tok");
  });

  it("prefers google_id_token over cognito_access_token", () => {
    sessionStorage.setItem("google_id_token", "google-tok");
    sessionStorage.setItem("cognito_access_token", "cognito-tok");
    expect(getSessionToken()).toBe("google-tok");
  });
});

describe("generatePKCE", () => {
  it("returns a verifier and challenge", async () => {
    const { verifier, challenge } = await generatePKCE();
    expect(typeof verifier).toBe("string");
    expect(verifier.length).toBeGreaterThan(0);
    expect(typeof challenge).toBe("string");
    expect(challenge.length).toBeGreaterThan(0);
  });

  it("produces unique verifiers on each call", async () => {
    const a = await generatePKCE();
    const b = await generatePKCE();
    expect(a.verifier).not.toBe(b.verifier);
  });
});

describe("initiateGoogleLogin (non-skip path)", () => {
  // _SKIP_AUTH is false in tests (VITE_SKIP_AUTH not set), so we hit the redirect path.
  it("sets window.location.href to Google OAuth URL", () => {
    let captured = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({
        origin: "http://localhost",
        pathname: "/",
        get href(): string {
          return captured;
        },
        set href(v: string) {
          captured = v;
        },
      }),
    });
    initiateGoogleLogin();
    expect(captured).toContain("accounts.google.com");
  });
});

describe("initiateCognitoLogin", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("stores a PKCE verifier in sessionStorage", async () => {
    let captured = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({
        origin: "http://localhost",
        pathname: "/",
        search: "",
        get href(): string {
          return captured;
        },
        set href(v: string) {
          captured = v;
        },
      }),
    });
    await initiateCognitoLogin();
    expect(sessionStorage.getItem("cognito_pkce_verifier")).not.toBeNull();
    // _COGNITO_DOMAIN is "" in tests; href will start with /oauth2/authorize
    expect(captured).toContain("oauth2/authorize");
  });
});

describe("handleCognitoCallback", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns false when no code in URL search params", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({ search: "" }),
    });
    expect(await handleCognitoCallback()).toBe(false);
  });

  it("returns false when code present but no PKCE verifier in sessionStorage", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({ search: "?code=abc123" }),
    });
    // verifier not set in sessionStorage
    expect(await handleCognitoCallback()).toBe(false);
  });
});

// ── api-client ────────────────────────────────────────────────────────────────

describe("mergeHeaders", () => {
  it("merges maps, override wins on conflict", () => {
    const result = mergeHeaders(
      { "Content-Type": "text/plain", Accept: "application/json" },
      { "Content-Type": "application/json", Authorization: "Bearer tok" },
    );
    expect(result["Content-Type"]).toBe("application/json");
    expect(result["Authorization"]).toBe("Bearer tok");
    expect(result["Accept"]).toBe("application/json");
  });
});

describe("jsonHeaders", () => {
  it("returns Content-Type and Accept JSON headers", () => {
    const headers = jsonHeaders();
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Accept"]).toBe("application/json");
  });
});

describe("createClientConfig", () => {
  it("sets default timeout and headers", () => {
    const cfg = createClientConfig("https://api.example.com");
    expect(cfg.baseUrl).toBe("https://api.example.com");
    expect(cfg.timeoutMs).toBe(30_000);
    expect(cfg.defaultHeaders?.["Content-Type"]).toBe("application/json");
  });

  it("accepts overrides", () => {
    const cfg = createClientConfig("https://api.example.com", {
      timeoutMs: 5_000,
    });
    expect(cfg.timeoutMs).toBe(5_000);
  });
});

describe("ApiClientError", () => {
  it("preserves status and code from ApiError", () => {
    const err = new ApiClientError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Not authenticated");
    expect(err.name).toBe("ApiClientError");
  });
});

// ── createApiClient ──────────────────────────────────────────────────────────

describe("createApiClient", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: { "Content-Type": "application/json" },
    });
  }

  it("GET sends correct method and URL", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    const result = await client.get<{ id: number }>("/users/1");
    expect(result).toEqual({ id: 1 });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.com/users/1");
    expect(init.method).toBe("GET");
  });

  it("POST serializes body as JSON", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ created: true }));
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      defaultHeaders: { "Content-Type": "application/json" },
    });
    await client.post("/users", { name: "Alice" });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Alice" }));
  });

  it("PUT serializes body as JSON", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ updated: true }));
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    await client.put("/users/1", { name: "Bob" });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(JSON.stringify({ name: "Bob" }));
  });

  it("DELETE sends correct method", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: "No Content" }),
    );
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    await client.delete("/users/1");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
  });

  it("applies defaultHeaders from config", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      defaultHeaders: { "X-Custom": "value" },
    });
    await client.get("/test");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Custom"]).toBe("value");
  });

  it("runs requestInterceptors for auth header injection", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      requestInterceptors: [
        (_config, headers): Record<string, string> => ({
          ...headers,
          Authorization: "Bearer tok123",
        }),
      ],
    });
    await client.get("/protected");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok123",
    );
  });

  it("throws ApiClientError on non-2xx with JSON body", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: "NOT_FOUND", message: "User not found" }),
        { status: 404, statusText: "Not Found" },
      ),
    );
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    const error = await client.get("/users/999").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    const apiErr = error as InstanceType<typeof ApiClientError>;
    expect(apiErr.status).toBe(404);
    expect(apiErr.code).toBe("NOT_FOUND");
    expect(apiErr.message).toBe("User not found");
  });

  it("throws ApiClientError on non-2xx with non-JSON body", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    const error = await client.get("/fail").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    const apiErr = error as InstanceType<typeof ApiClientError>;
    expect(apiErr.status).toBe(500);
    expect(apiErr.code).toBe("HTTP_500");
  });

  it("handles 204 No Content", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: "No Content" }),
    );
    const client = createApiClient({ baseUrl: "https://api.test.com" });
    const result = await client.delete("/users/1");
    expect(result).toBeUndefined();
  });

  it("passes AbortController signal for timeout", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      timeoutMs: 5_000,
    });
    await client.get("/test");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
