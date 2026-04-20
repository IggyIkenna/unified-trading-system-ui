import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { SpacesNavSections } from "@/components/shell/spaces-nav-sections";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuthContext, type AuthState } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

const UNAUTH_STATE = {
  user: null,
  token: null,
  loading: false,
  loginError: null,
  loginByEmail: async () => true,
  logout: async () => {},
  hasEntitlement: () => false,
  isAdmin: () => false,
  isInternal: () => false,
} as unknown as AuthState;

function UnauthWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={UNAUTH_STATE}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>open</DropdownMenuTrigger>
          <DropdownMenuContent>{children}</DropdownMenuContent>
        </DropdownMenu>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("SpacesNavSections — cached briefing session", () => {
  beforeEach(() => {
    // Intentionally NOT calling vi.resetModules() — top-level imports (AuthContext,
    // SpacesNavSections, DropdownMenu) share module identity with the provider.
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("locks code-gated items when signed-out and session empty", () => {
    render(<SpacesNavSections />, { wrapper: UnauthWrapper });

    // Briefings Hub renders via LockedItemDialog → has the lock-trigger testid.
    const triggers = screen.getAllByTestId("locked-item-trigger");
    const briefings = triggers.find((t) => t.textContent?.includes("Briefings Hub"));
    expect(briefings).toBeTruthy();
    const devDocs = triggers.find((t) => t.textContent?.includes("Developer Documentation"));
    expect(devDocs).toBeTruthy();
  });

  it("treats code-gated items as unlocked when briefing session is active — no dialog, plain link", () => {
    window.localStorage.setItem("odum-briefing-session", "1");
    render(<SpacesNavSections />, { wrapper: UnauthWrapper });

    // Briefings Hub and Developer Documentation should now be plain links.
    const briefingsLink = screen.getByText("Briefings Hub").closest("a");
    expect(briefingsLink?.getAttribute("href")).toBe("/briefings");
    const docsLink = screen.getByText("Developer Documentation").closest("a");
    expect(docsLink?.getAttribute("href")).toBe("/docs");

    // Client-access items stay locked (different auth axis).
    const triggers = screen.getAllByTestId("locked-item-trigger");
    const ir = triggers.find((t) => t.textContent?.includes("Investor Relations"));
    expect(ir).toBeTruthy();
  });

  it("Research & Documentation section drops the lock hint when session is active", () => {
    window.localStorage.setItem("odum-briefing-session", "1");
    render(<SpacesNavSections />, { wrapper: UnauthWrapper });

    // With session active, the section renders the compact label (no hint line).
    expect(screen.queryByText("Access code required")).toBeNull();
    // Client Access section is still locked → its hint still renders.
    expect(screen.getByText("Sign-in required")).toBeTruthy();
  });
});
