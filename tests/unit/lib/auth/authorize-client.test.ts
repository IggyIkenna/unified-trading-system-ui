import { afterEach, describe, expect, it, vi } from "vitest";

import { APP_ID, fetchAuthorization } from "@/lib/auth/authorize-client";

/**
 * Coverage lift for lib/auth/authorize-client.ts.
 * Uses `vi.stubGlobal` to replace `fetch` so no network is touched.
 */

interface MockResponseInit {
  ok: boolean;
  status: number;
  body: unknown;
}
function mockResponse({ ok, status, body }: MockResponseInit): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("authorize-client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("APP_ID is the trading UI identifier", () => {
    expect(APP_ID).toBe("unified-trading-system-ui");
  });

  it("successful response returns parsed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockResponse({
          ok: true,
          status: 200,
          body: {
            authorized: true,
            role: "admin",
            capabilities: ["all"],
            source: "direct",
            environments: ["prod"],
          },
        }),
      ),
    );
    const r = await fetchAuthorization("uid-123");
    expect(r.authorized).toBe(true);
    expect(r.role).toBe("admin");
    expect(r.capabilities).toEqual(["all"]);
  });

  it("passes env query when provided", async () => {
    const fetchSpy = vi.fn(async () =>
      mockResponse({
        ok: true,
        status: 200,
        body: {
          authorized: true,
          role: "viewer",
          capabilities: [],
          source: "direct",
          environments: [],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    await fetchAuthorization("uid-x", "staging");
    const firstCall = fetchSpy.mock.calls[0] as readonly unknown[] | undefined;
    if (!firstCall || firstCall.length === 0) throw new Error("fetch not called");
    const called = String(firstCall[0]);
    expect(called).toContain("app_id=unified-trading-system-ui");
    expect(called).toContain("uid=uid-x");
    expect(called).toContain("env=staging");
  });

  it("non-ok response returns unauthorized fallback with error string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse({ ok: false, status: 503, body: {} })),
    );
    const r = await fetchAuthorization("uid-err");
    expect(r.authorized).toBe(false);
    expect(r.role).toBeNull();
    expect(r.capabilities).toEqual([]);
    expect(r.source).toBe("none");
    expect(r.environments).toEqual([]);
    expect(r.error).toBe("HTTP 503");
  });
});
