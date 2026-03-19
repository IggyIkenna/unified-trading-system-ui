import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfigLink } from "./config-link";

describe("ConfigLink", () => {
  it("renders with default label 'Configure'", () => {
    render(<ConfigLink path="/strategy-manifest" />);
    const link = screen.getByTestId("config-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Configure");
  });

  it("renders custom label when provided", () => {
    render(<ConfigLink label="Risk Config" path="/risk" />);
    expect(screen.getByTestId("config-link")).toHaveTextContent("Risk Config");
  });

  it("generates correct href with default base URL", () => {
    render(<ConfigLink path="/strategy-manifest" />);
    const link = screen.getByTestId("config-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "http://localhost:5173/strategy-manifest",
    );
  });

  it("uses custom onboardingBaseUrl when provided", () => {
    render(
      <ConfigLink
        path="/risk"
        onboardingBaseUrl="https://onboarding.example.com"
      />,
    );
    const link = screen.getByTestId("config-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "https://onboarding.example.com/risk",
    );
  });

  it("renders a Settings (gear) icon", () => {
    const { container } = render(<ConfigLink path="/venues" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("has a descriptive title attribute", () => {
    render(<ConfigLink label="Venue Setup" path="/venue-connections" />);
    const link = screen.getByTestId("config-link");
    expect(link).toHaveAttribute(
      "title",
      "Open Venue Setup in Onboarding Portal",
    );
  });

  it("applies custom className", () => {
    render(<ConfigLink path="/risk" className="mt-2" />);
    const link = screen.getByTestId("config-link");
    expect(link.className).toContain("mt-2");
  });
});
