import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthState } from "@/hooks/use-auth";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const typedFetchMock = vi.fn();
vi.mock("@/lib/api/typed-fetch", () => ({
  typedFetch: (...args: unknown[]) => typedFetchMock(...args),
}));

import { ACTIVE_ALERTS_POLL_INTERVAL_MS, NotificationBell } from "@/components/shell/notification-bell";

const MOCK_AUTH_STATE: AuthState = {
  user: {
    uid: "test-user",
    email: "test@example.com",
    displayName: "Test",
    role: "admin",
    entitlements: [],
    organisationId: "org",
    subscriptionTier: "internal",
  },
  token: "tok",
  loading: false,
  loginError: null,
  loginByEmail: async () => true,
  logout: async () => {},
  hasEntitlement: () => true,
  isAdmin: () => true,
  isInternal: () => true,
} as unknown as AuthState;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={MOCK_AUTH_STATE}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe("NotificationBell", () => {
  beforeEach(() => {
    typedFetchMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("declares the 10s poll interval per plan spec", () => {
    expect(ACTIVE_ALERTS_POLL_INTERVAL_MS).toBe(10_000);
  });

  it("badge count is unack-critical only (not total)", async () => {
    typedFetchMock.mockResolvedValue({
      alerts: [
        {
          id: "a1",
          severity: "critical",
          message: "Aave HF below floor",
          alertType: "HEALTH_FACTOR_CRITICAL",
          timestamp: new Date().toISOString(),
        },
        {
          id: "a2",
          severity: "high",
          message: "High-severity rate flip",
          alertType: "FUNDING_RATE_FLIP",
          timestamp: new Date().toISOString(),
        },
        {
          id: "a3",
          severity: "medium",
          message: "Medium concern",
          alertType: "AAVE_UTILIZATION_SPIKE",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    render(<NotificationBell />, { wrapper: makeWrapper() });

    await waitFor(() => {
      const bell = screen.getByTestId("notification-bell");
      expect(bell.getAttribute("data-critical-count")).toBe("1");
      expect(bell.getAttribute("data-total-count")).toBe("3");
    });

    const badge = screen.getByTestId("notification-bell-badge");
    expect(badge.textContent).toBe("1");
  });

  it("hides badge when zero critical alerts", async () => {
    typedFetchMock.mockResolvedValue({
      alerts: [
        {
          id: "h1",
          severity: "high",
          message: "High but not critical",
          alertType: "RISK_WARNING",
          timestamp: new Date().toISOString(),
        },
      ],
    });
    render(<NotificationBell />, { wrapper: makeWrapper() });

    await waitFor(() => {
      const bell = screen.getByTestId("notification-bell");
      expect(bell.getAttribute("data-critical-count")).toBe("0");
      expect(bell.getAttribute("data-total-count")).toBe("1");
    });

    expect(screen.queryByTestId("notification-bell-badge")).toBeNull();
  });

  it("exposes per-alert metadata via data attributes for the e2e ack test", async () => {
    typedFetchMock.mockResolvedValue({
      alerts: [
        {
          id: "a1",
          severity: "critical",
          message: "Aave HF below floor: 1.04 < 1.05",
          alertType: "HEALTH_FACTOR_CRITICAL",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    render(<NotificationBell />, { wrapper: makeWrapper() });

    // The bell exposes the critical-count + total-count even before the
    // dropdown is opened — Playwright reads these to gate badge changes.
    await waitFor(() => {
      const bell = screen.getByTestId("notification-bell");
      expect(bell.getAttribute("data-critical-count")).toBe("1");
      expect(bell.getAttribute("data-total-count")).toBe("1");
    });
    expect(screen.getByTestId("notification-bell-badge").textContent).toBe("1");
  });
});

// Note: the dropdown→modal click path is exercised end-to-end in
// tests/e2e/alerting-ack-flow.spec.ts. Radix DropdownMenu uses portals +
// floating-ui measurements that don't fully realise under happy-dom, so
// asserting on the open-dropdown DOM here is brittle by design.
