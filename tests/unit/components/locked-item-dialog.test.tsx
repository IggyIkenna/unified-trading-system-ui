import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => "/",
}));

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function renderIn(ui: React.ReactNode) {
  return render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>open</DropdownMenuTrigger>
      <DropdownMenuContent>{ui}</DropdownMenuContent>
    </DropdownMenu>,
    { wrapper: TestWrapper },
  );
}

describe("LockedItemDialog", () => {
  beforeEach(() => {
    vi.resetModules();
    pushMock.mockClear();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signin variant shows Sign-in CTA with redirect to target href", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE", "");
    const { LockedItemDialog } = await import("@/components/shell/locked-item-dialog");
    renderIn(
      <LockedItemDialog
        href="/investor-relations"
        label="Investor Relations"
        sectionTitle="Client Access"
        accessType="signin"
      >
        Investor Relations
      </LockedItemDialog>,
    );

    fireEvent.click(screen.getByTestId("locked-item-trigger"));

    expect(screen.getByTestId("locked-item-signin").getAttribute("href")).toBe(
      "/login?redirect=%2Finvestor-relations",
    );
    expect(screen.getByTestId("locked-item-contact").getAttribute("href")).toBe("/contact");
    expect(screen.getByTestId("locked-item-demo").getAttribute("href")).toBe("/demo");
  });

  it("code variant rejects wrong code and unlocks on right code", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE", "goldenkey");
    const { LockedItemDialog } = await import("@/components/shell/locked-item-dialog");
    renderIn(
      <LockedItemDialog
        href="/briefings"
        label="Briefings Hub"
        sectionTitle="Research & Documentation"
        accessType="code"
      >
        Briefings Hub
      </LockedItemDialog>,
    );

    fireEvent.click(screen.getByTestId("locked-item-trigger"));

    const input = screen.getByTestId("locked-item-code-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "nope" } });
    fireEvent.click(screen.getByTestId("locked-item-code-submit"));
    expect(screen.getByText("Code does not match.")).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "goldenkey" } });
    fireEvent.click(screen.getByTestId("locked-item-code-submit"));
    expect(pushMock).toHaveBeenCalledWith("/briefings");
    expect(window.localStorage.getItem("odum-briefing-session")).toBe("1");
  });
});
