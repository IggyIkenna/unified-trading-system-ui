import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/tests/helpers/test-wrapper";

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
    render(<SiteHeader />, { wrapper: TestWrapper });
    expect(screen.getByText("Platform")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
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
      logout: async () => {},
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
