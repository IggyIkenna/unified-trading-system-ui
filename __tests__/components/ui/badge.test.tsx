import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("renders with data-slot attribute", () => {
    render(<Badge>Slotted</Badge>);
    expect(screen.getByText("Slotted")).toHaveAttribute("data-slot", "badge");
  });

  it("renders success variant with green styling", () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText("OK");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-green");
  });

  it("renders error variant with red styling", () => {
    render(<Badge variant="error">Fail</Badge>);
    const badge = screen.getByText("Fail");
    expect(badge.className).toContain("bg-red");
  });

  it("renders warning variant with amber styling", () => {
    render(<Badge variant="warning">Warn</Badge>);
    const badge = screen.getByText("Warn");
    expect(badge.className).toContain("bg-amber");
  });

  it("renders destructive variant", () => {
    render(<Badge variant="destructive">Delete</Badge>);
    const badge = screen.getByText("Delete");
    expect(badge.className).toContain("bg-destructive");
  });

  it("renders outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("renders running variant with cyan styling", () => {
    render(<Badge variant="running">Running</Badge>);
    const badge = screen.getByText("Running");
    expect(badge.className).toContain("bg-cyan");
  });

  it("renders pending variant with gray styling", () => {
    render(<Badge variant="pending">Pending</Badge>);
    const badge = screen.getByText("Pending");
    expect(badge.className).toContain("bg-gray");
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("custom-class");
  });

  it("renders as child component when asChild is true", () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>,
    );
    const link = screen.getByText("Link Badge");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/test");
  });
});
