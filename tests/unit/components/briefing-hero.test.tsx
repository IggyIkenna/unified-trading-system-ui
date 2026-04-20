import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("BriefingHero", () => {
  it("renders title, tldr, and primary CTA", async () => {
    const { BriefingHero } = await import("@/components/briefings/briefing-hero");
    render(
      <BriefingHero
        title="Investment management"
        tldr="One-sentence situation summary."
        cta={{ label: "Book 45-minute call", href: "/contact" }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Investment management")).toBeTruthy();
    expect(screen.getByText("One-sentence situation summary.")).toBeTruthy();
    expect(screen.getByText("Book 45-minute call")).toBeTruthy();
  });

  it("exposes [data-briefing-hero] for Playwright selectors", async () => {
    const { BriefingHero } = await import("@/components/briefings/briefing-hero");
    const { container } = render(
      <BriefingHero
        title="Regulatory"
        tldr="Short sentence."
        cta={{ label: "Book call", href: "/contact" }}
      />,
      { wrapper: TestWrapper },
    );
    expect(container.querySelector("[data-briefing-hero]")).toBeTruthy();
    expect(container.querySelector('[data-testid="briefing-primary-cta"]')).toBeTruthy();
  });
});
