/**
 * Plan D Phase 4 — Versions tab on parent strategy detail page.
 *
 * Verifies that the previously-orphaned [id]/versions/page.tsx sub-route is
 * reachable from the parent strategy-detail page header. This is the ONLY
 * Versions surface a DART-Full holder has on the per-instance terminal — if
 * this Link disappears, the version timeline is unreachable from the
 * cockpit.
 */

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { StrategyDetailPageClient } from "@/app/(platform)/services/trading/strategies/[id]/strategy-detail-page-client";
import { ExecutionModeProvider } from "@/lib/execution-mode-context";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";
import { STRATEGIES } from "@/lib/mocks/fixtures/strategy-instances";

// Mock next/navigation hooks pulled in by inner widgets / providers.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/services/trading/strategies/test",
  useSearchParams: () => new URLSearchParams(),
}));

// Avoid hammering /api/trading/performance — registry fallback path is
// exercised when the hook returns no data.
vi.mock("@/hooks/api/use-strategies", () => ({
  useStrategyPerformance: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

/**
 * Build a "use()-compatible" thenable that resolves *synchronously* so
 * React.use() can unwrap on the first render pass without suspending.
 * This mirrors what Next.js produces server-side after streaming params
 * resolve. See https://react.dev/reference/react/use#use-with-a-promise.
 */
function syncThenable<T>(value: T): Promise<T> {
  // The shape React.use() accepts: { then(onFulfilled) } that fulfils
  // synchronously. Setting status/value on the object is the public
  // contract React reads when present.
  const thenable = Promise.resolve(value);
  // @ts-expect-error -- React.use() reads `status` / `value` for sync paths.
  thenable.status = "fulfilled";
  // @ts-expect-error -- as above.
  thenable.value = value;
  return thenable;
}

function renderDetail(strategyId: string) {
  const { Wrapper: PersonaWrapper } = renderWithPersona("admin");
  function CombinedWrapper({ children }: { children: React.ReactNode }) {
    return (
      <PersonaWrapper>
        <ExecutionModeProvider>{children}</ExecutionModeProvider>
      </PersonaWrapper>
    );
  }
  return render(<StrategyDetailPageClient params={syncThenable({ id: strategyId })} />, { wrapper: CombinedWrapper });
}

describe("StrategyDetailPageClient — Versions tab (Plan D Phase 4)", () => {
  it("renders the Versions Link in the page header pointing at the per-instance timeline route", async () => {
    // Pick the first registry-backed strategy so the registry-fallback path
    // is taken (no API data).
    const fixture = STRATEGIES[0];
    expect(fixture).toBeDefined();
    const id = fixture.id;

    renderDetail(id);

    // Wait past the Suspense boundary (params Promise resolution + first
    // render) — happy-dom does not batch the microtask + paint together.
    const versionsBtn = await waitFor(() => screen.getByTestId("strategy-detail-versions-tab"), { timeout: 5000 });
    expect(versionsBtn).toBeInTheDocument();
    expect(versionsBtn).toHaveTextContent(/Versions/);

    // The Button is wrapped in a Link → the surrounding <a> carries the
    // href; assert the encoded route lines up with the canonical Plan D
    // sub-route ([id]/versions/page.tsx).
    const link = versionsBtn.closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe(`/services/trading/strategies/${encodeURIComponent(id)}/versions`);
  });
});
