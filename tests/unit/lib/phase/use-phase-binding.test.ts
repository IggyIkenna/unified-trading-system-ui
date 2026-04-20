import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type Phase } from "@/lib/phase/types";
import { usePhaseBinding } from "@/lib/phase/use-phase-binding";

describe("G1.1 phase — usePhaseBinding", () => {
  it.each<[Phase, string, string]>([
    ["research", "/api/research", "/ws/research"],
    ["paper", "/api/trading", "/ws/trading"],
    ["live", "/api/trading", "/ws/trading"],
  ])("returns correct baseUrl/wsUrl for phase=%s", (phase, baseUrl, wsUrl) => {
    const { result } = renderHook(() => usePhaseBinding(phase));
    expect(result.current.phase).toBe(phase);
    expect(result.current.baseUrl).toBe(baseUrl);
    expect(result.current.wsUrl).toBe(wsUrl);
  });

  it("resolvePath maps phase-agnostic segments correctly", () => {
    const r = renderHook(() => usePhaseBinding("research"));
    const p = renderHook(() => usePhaseBinding("paper"));
    const l = renderHook(() => usePhaseBinding("live"));

    expect(r.result.current.resolvePath("/strategy/overview")).toBe(
      "/services/research/strategy/overview",
    );
    expect(l.result.current.resolvePath("/strategy/overview")).toBe(
      "/services/trading/strategy/overview",
    );
    expect(p.result.current.resolvePath("/strategy/overview")).toBe(
      "/services/trading/strategy/overview?phase=paper",
    );

    // Leading slash normalisation
    expect(r.result.current.resolvePath("strategy/overview")).toBe(
      "/services/research/strategy/overview",
    );
    expect(l.result.current.resolvePath("strategy/overview")).toBe(
      "/services/trading/strategy/overview",
    );
  });

  it("returns a stable object reference for the same phase", () => {
    const { result, rerender } = renderHook(({ phase }: { phase: Phase }) => usePhaseBinding(phase), {
      initialProps: { phase: "research" },
    });
    const first = result.current;
    rerender({ phase: "research" });
    expect(result.current).toBe(first);
  });

  it("returns a new object reference when phase changes", () => {
    const { result, rerender } = renderHook(({ phase }: { phase: Phase }) => usePhaseBinding(phase), {
      initialProps: { phase: "research" },
    });
    const first = result.current;
    rerender({ phase: "live" });
    expect(result.current).not.toBe(first);
    expect(result.current.phase).toBe("live");
  });

  it("fetcher injects X-Trading-Phase header", async () => {
    const originalFetch = globalThis.fetch;
    const captured: { url: RequestInfo | URL; init?: RequestInit }[] = [];
    globalThis.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
      captured.push({ url, init });
      return Promise.resolve(new Response(null));
    }) as typeof fetch;

    try {
      const { result } = renderHook(() => usePhaseBinding("paper"));
      await result.current.fetcher("/api/trading/ping");
      expect(captured).toHaveLength(1);
      const headers = new Headers(captured[0]?.init?.headers);
      expect(headers.get("X-Trading-Phase")).toBe("paper");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
