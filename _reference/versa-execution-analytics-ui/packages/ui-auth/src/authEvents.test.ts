/**
 * Unit tests for authEvents.ts (emitAuthEvent + SESSION_SENTINEL_KEY).
 *
 * emitAuthEvent() is fire-and-forget: it calls fetch().catch(() => {}).
 * Every test that exercises a call with an endpoint must await a microtask
 * flush so the .catch() handler settles before the next test begins.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { emitAuthEvent, SESSION_SENTINEL_KEY } from "./authEvents";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Flush pending microtasks so fire-and-forget fetch().catch() chains settle. */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

// ---- SESSION_SENTINEL_KEY ---------------------------------------------------

describe("SESSION_SENTINEL_KEY", () => {
  it("is a non-empty string", () => {
    expect(typeof SESSION_SENTINEL_KEY).toBe("string");
    expect(SESSION_SENTINEL_KEY.length).toBeGreaterThan(0);
  });
});

// ---- emitAuthEvent — no-op when endpoint omitted ---------------------------

describe("emitAuthEvent — no endpoint", () => {
  it("does not call fetch when eventEndpoint is undefined", () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGIN_INITIATED", { provider: "google" });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not call fetch when eventEndpoint is empty string", () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGIN_INITIATED", { provider: "google" }, "");

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ---- emitAuthEvent — INFO events -------------------------------------------

describe("emitAuthEvent — INFO severity events", () => {
  it("POSTs LOGIN_INITIATED with severity INFO", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGIN_INITIATED", { provider: "cognito" }, "/api/events");
    await flushMicrotasks();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/events");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string) as {
      event_name: string;
      severity: string;
      details: Record<string, string>;
    };
    expect(body.event_name).toBe("LOGIN_INITIATED");
    expect(body.severity).toBe("INFO");
    expect(body.details.provider).toBe("cognito");
  });

  it("POSTs LOGIN_SUCCESS with severity INFO", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGIN_SUCCESS", { provider: "google" }, "/api/events");
    await flushMicrotasks();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { severity: string };
    expect(body.severity).toBe("INFO");
  });

  it("POSTs LOGOUT with severity INFO", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGOUT", {}, "/api/events");
    await flushMicrotasks();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { severity: string };
    expect(body.severity).toBe("INFO");
  });
});

// ---- emitAuthEvent — WARNING severity events --------------------------------

describe("emitAuthEvent — WARNING severity events", () => {
  it("POSTs LOGIN_FAILURE with severity WARNING", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("LOGIN_FAILURE", { reason: "bad_token" }, "/api/events");
    await flushMicrotasks();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { severity: string };
    expect(body.severity).toBe("WARNING");
  });

  it("POSTs SESSION_EXPIRED with severity WARNING", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    vi.stubGlobal("fetch", mockFetch);

    emitAuthEvent("SESSION_EXPIRED", { reason: "timeout" }, "/api/events");
    await flushMicrotasks();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { severity: string };
    expect(body.severity).toBe("WARNING");
  });
});

// ---- emitAuthEvent — network error silently swallowed ----------------------

describe("emitAuthEvent — network failure", () => {
  it("does not throw when fetch rejects (fire-and-forget)", async () => {
    // Use a deferred promise so we control when rejection happens, avoiding
    // unhandled rejection errors in the test environment.
    let rejectFn!: (e: Error) => void;
    const fetchPromise = new Promise<Response>((_resolve, reject) => {
      rejectFn = reject;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchPromise));

    // Must not throw — telemetry failures must be silent.
    expect(() => emitAuthEvent("LOGOUT", {}, "/api/events")).not.toThrow();

    // Trigger the rejection so the .catch() handler settles cleanly.
    rejectFn(new Error("network down"));
    await flushMicrotasks();
  });
});
