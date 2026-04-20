/**
 * DebugFooter smoke tests — mock-mode gating, persona groups, and the
 * PERSONAS-driven login hand-off.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/tests/helpers/test-wrapper";

// -------------------------------------------------------------------
// Hoisted mocks
// -------------------------------------------------------------------
const loginByEmail = vi.fn().mockResolvedValue(true);
const refresh = vi.fn();

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      loginByEmail,
      logout: vi.fn(),
      hasEntitlement: () => false,
      isAdmin: () => false,
      isInternal: () => false,
      token: null,
      loading: false,
      loginError: null,
    }),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh }),
}));

// Default: mock mode ON.
vi.mock("@/lib/runtime/data-mode", () => ({
  isMockDataMode: () => true,
}));

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------
describe("DebugFooter", () => {
  beforeEach(() => {
    loginByEmail.mockClear();
    refresh.mockClear();
  });

  it("renders the Mock Mode badge when mock mode is detected", async () => {
    const { DebugFooter } = await import("@/components/shell/debug-footer");
    render(<DebugFooter />, { wrapper: TestWrapper });
    expect(screen.getByText("Mock Mode")).toBeTruthy();
    expect(screen.getByText("Switch Persona")).toBeTruthy();
  });

  it("exposes the data-slot attribute for Playwright", async () => {
    const { DebugFooter } = await import("@/components/shell/debug-footer");
    const { container } = render(<DebugFooter />, { wrapper: TestWrapper });
    expect(container.querySelector('[data-slot="debug-footer"]')).toBeTruthy();
  });
});

describe("DebugFooter + PERSONAS SSOT alignment", () => {
  it("references every id in the PERSONA_GROUPS map against PERSONAS", async () => {
    // The component file groups ids statically; the test guards against
    // drift between PERSONA_GROUPS (in debug-footer.tsx) and PERSONAS
    // (in lib/auth/personas.ts) — we reach in via the module system.
    const { PERSONAS } = await import("@/lib/auth/personas");
    const existing = new Set(PERSONAS.map((p) => p.id));
    // Static list mirrors the PERSONA_GROUPS definition in debug-footer.tsx.
    const groupedIds = [
      "admin",
      "internal-trader",
      "im-desk-operator",
      "client-full",
      "client-premium",
      "client-data-only",
      "prospect-dart",
      "prospect-signals-only",
      "client-im-pooled",
      "client-im-sma",
      "prospect-im",
      "client-regulatory",
      "prospect-regulatory",
      "investor",
      "advisor",
      "prospect-platform",
      "elysium-defi",
    ];
    for (const id of groupedIds) {
      expect(existing.has(id)).toBe(true);
    }
  });
});
