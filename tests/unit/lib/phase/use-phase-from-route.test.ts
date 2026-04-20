import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation so the hook can execute outside the Next.js runtime.
// This covers lines 33-35 of use-phase-from-route.ts which were previously
// uncovered (the hook itself; phaseForPath is already thoroughly tested).
const mocks = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
}));

import { usePhaseFromRoute } from "@/lib/phase/use-phase-from-route";

describe("usePhaseFromRoute (hook)", () => {
  beforeEach(() => {
    mocks.pathname = "/";
    mocks.searchParams = new URLSearchParams();
  });

  it("returns 'research' for a research route", () => {
    mocks.pathname = "/services/research/strategies";
    const { result } = renderHook(() => usePhaseFromRoute());
    expect(result.current).toBe("research");
  });

  it("returns 'live' for a trading route without ?phase=paper", () => {
    mocks.pathname = "/services/trading/strategies";
    const { result } = renderHook(() => usePhaseFromRoute());
    expect(result.current).toBe("live");
  });

  it("returns 'paper' for a trading route with ?phase=paper", () => {
    mocks.pathname = "/services/trading/strategies";
    mocks.searchParams = new URLSearchParams({ phase: "paper" });
    const { result } = renderHook(() => usePhaseFromRoute());
    expect(result.current).toBe("paper");
  });

  it("defaults to 'research' for unknown routes", () => {
    mocks.pathname = "/marketing/home";
    const { result } = renderHook(() => usePhaseFromRoute());
    expect(result.current).toBe("research");
  });

  it("treats empty pathname as default 'research'", () => {
    mocks.pathname = "";
    const { result } = renderHook(() => usePhaseFromRoute());
    expect(result.current).toBe("research");
  });
});
