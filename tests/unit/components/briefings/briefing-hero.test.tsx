import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("BriefingHero (extended)", () => {
  it("points the CTA anchor to the provided href", async () => {
    const { BriefingHero } = await import("@/components/briefings/briefing-hero");
    const { container } = render(
      <BriefingHero
        title="Regulatory Umbrella"
        tldr="Short regulatory pitch."
        cta={{ label: "Schedule intro", href: "/contact" }}
      />,
      { wrapper: TestWrapper },
    );
    const cta = container.querySelector('[data-testid="briefing-primary-cta"]');
    expect(cta).toBeTruthy();
    const anchor = cta?.querySelector("a");
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute("href")).toBe("/contact");
    expect(anchor?.textContent).toBe("Schedule intro");
  });

  it("includes a data-briefing-hero attribute on the section root", async () => {
    const { BriefingHero } = await import("@/components/briefings/briefing-hero");
    const { container } = render(
      <BriefingHero
        title="T"
        tldr="S"
        cta={{ label: "Go", href: "/x" }}
      />,
      { wrapper: TestWrapper },
    );
    const section = container.querySelector("section[data-briefing-hero]");
    expect(section).toBeTruthy();
  });

  it("renders the title as an h1", async () => {
    const { BriefingHero } = await import("@/components/briefings/briefing-hero");
    render(
      <BriefingHero
        title="Investor Briefings"
        tldr="We trade."
        cta={{ label: "Go", href: "/x" }}
      />,
      { wrapper: TestWrapper },
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Investor Briefings");
  });
});
