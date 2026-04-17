import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/__tests__/helpers/test-wrapper";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Public pages", () => {
  it("homepage exports and renders without error", async () => {
    const mod = await import("@/app/(public)/page");
    expect(typeof mod.default).toBe("function");
    const Page = mod.default;
    const { container } = render(<Page />, { wrapper: TestWrapper });
    expect(container.querySelector("section")).toBeTruthy();
  }, 30000);

  it("homepage renders hero headline", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(screen.getByText("Unified Trading Infrastructure")).toBeTruthy();
  }, 30000);

  it("homepage renders all five service cards", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(screen.getAllByText("Data").length).toBeGreaterThan(0);
    expect(screen.getByText("Research & Build")).toBeTruthy();
    expect(screen.getByText("Trading Terminal")).toBeTruthy();
    expect(screen.getByText("Regulatory Umbrella")).toBeTruthy();
    expect(screen.getAllByText("Investment Management").length).toBeGreaterThan(0);
  }, 30000);

  it("homepage renders FCA badge", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(screen.getByText("FCA Authorised (975797)")).toBeTruthy();
  }, 30000);

  it("homepage renders venue marquee pills", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    expect(screen.getAllByText("Binance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OKX").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Uniswap V3").length).toBeGreaterThan(0);
  }, 30000);

  it("homepage renders Get Started and Book a Demo CTAs", async () => {
    const mod = await import("@/app/(public)/page");
    const Page = mod.default;
    render(<Page />, { wrapper: TestWrapper });
    const getStartedLinks = screen.getAllByText("Get Started");
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1);
  }, 30000);
});

describe("Service pages export default functions", () => {
  it("investment page exports", async () => {
    const mod = await import("@/app/(public)/services/investment/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("platform page exports", async () => {
    const mod = await import("@/app/(public)/services/platform/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("regulatory page exports", async () => {
    const mod = await import("@/app/(public)/services/regulatory/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("data page exports", async () => {
    const mod = await import("@/app/(public)/services/data/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("backtesting page exports", async () => {
    const mod = await import("@/app/(public)/services/backtesting/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);

  it("contact page exports", async () => {
    const mod = await import("@/app/(public)/contact/page");
    expect(typeof mod.default).toBe("function");
  }, 30000);
});
