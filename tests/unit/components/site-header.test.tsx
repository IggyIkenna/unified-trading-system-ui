import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("SiteHeader", () => {
  it("renders the Odum Research brand", async () => {
    const { SiteHeader } = await import("@/components/shell/site-header");
    render(<SiteHeader />, { wrapper: TestWrapper });
    expect(screen.getByText("Odum Research")).toBeTruthy();
  }, 15000);

  it("renders FCA badge", async () => {
    const { SiteHeader } = await import("@/components/shell/site-header");
    render(<SiteHeader />, { wrapper: TestWrapper });
    expect(screen.getByText("FCA 975797")).toBeTruthy();
  }, 15000);

  it("renders navigation items", async () => {
    const { SiteHeader } = await import("@/components/shell/site-header");
    const { PLATFORM_MARKETING_NAV_LABEL } = await import("@/components/shell/nav-copy");
    render(<SiteHeader />, { wrapper: TestWrapper });
    // Nav label SSOT: components/shell/nav-copy.ts (DART post-2026-04-19 rebrand).
    expect(screen.getByText(PLATFORM_MARKETING_NAV_LABEL)).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
  }, 15000);

  it("exposes [data-shell='site-header'] for Playwright shell selectors", async () => {
    const { SiteHeader } = await import("@/components/shell/site-header");
    const { container } = render(<SiteHeader />, { wrapper: TestWrapper });
    const shell = container.querySelector('[data-shell="site-header"]');
    expect(shell).toBeTruthy();
  }, 15000);

  it("renders Sign In and Get Started when not authenticated", async () => {
    const { SiteHeader } = await import("@/components/shell/site-header");
    const { AuthContext } = await import("@/hooks/use-auth");
    const React = await import("react");
    const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const unauthState = {
      user: null,
      token: null,
      loading: false,
      loginError: null,
      loginByEmail: async () => true,
      logout: async () => { },
      hasEntitlement: () => false,
      isAdmin: () => false,
      isInternal: () => false,
    };

    const UnauthWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(AuthContext.Provider, { value: unauthState as never }, children),
      );

    render(<SiteHeader />, { wrapper: UnauthWrapper });
    expect(screen.getByText("Sign In")).toBeTruthy();
    expect(screen.getByText("Get Started")).toBeTruthy();
  }, 15000);
});
