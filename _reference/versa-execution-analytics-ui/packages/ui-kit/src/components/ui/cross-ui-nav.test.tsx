import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CrossUINav, DEFAULT_UI_GROUPS } from "./cross-ui-nav";
import type { CrossUINavGroup } from "./cross-ui-nav";

const TEST_GROUPS: CrossUINavGroup[] = [
  {
    label: "Monitoring",
    entries: [
      { key: "live-health-monitor", label: "Live Health Monitor", port: 5177 },
      { key: "logs-dashboard", label: "Logs Dashboard", port: 5178 },
    ],
  },
  {
    label: "Analytics",
    entries: [
      { key: "trading-analytics", label: "Trading Analytics", port: 5180 },
    ],
  },
];

describe("CrossUINav", () => {
  it("renders trigger button with current UI label", () => {
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    const trigger = screen.getByTestId("cross-ui-nav-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Live Health Monitor");
  });

  it("renders 'Switch UI' when currentUIKey does not match any entry", () => {
    render(<CrossUINav currentUIKey="nonexistent" groups={TEST_GROUPS} />);
    const trigger = screen.getByTestId("cross-ui-nav-trigger");
    expect(trigger).toHaveTextContent("Switch UI");
  });

  it("does not show menu by default", () => {
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    expect(screen.queryByTestId("cross-ui-nav-menu")).not.toBeInTheDocument();
  });

  it("opens menu on click", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    expect(screen.getByTestId("cross-ui-nav-menu")).toBeInTheDocument();
  });

  it("renders all group labels when open", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("renders all UI entry links when open", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const menu = screen.getByTestId("cross-ui-nav-menu");
    expect(within(menu).getByText("Live Health Monitor")).toBeInTheDocument();
    expect(within(menu).getByText("Logs Dashboard")).toBeInTheDocument();
    expect(within(menu).getByText("Trading Analytics")).toBeInTheDocument();
  });

  it("marks current UI with 'current' badge", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const currentLink = screen.getByTestId("cross-ui-link-live-health-monitor");
    expect(within(currentLink).getByText("current")).toBeInTheDocument();
  });

  it("does not mark non-current UIs with 'current' badge", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const otherLink = screen.getByTestId("cross-ui-link-logs-dashboard");
    expect(within(otherLink).queryByText("current")).not.toBeInTheDocument();
  });

  it("generates correct localhost href for each link", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const link = screen.getByTestId(
      "cross-ui-link-logs-dashboard",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("http://localhost:5178");
  });

  it("closes menu on second click (toggle)", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    const trigger = screen.getByTestId("cross-ui-nav-trigger");
    await user.click(trigger);
    expect(screen.getByTestId("cross-ui-nav-menu")).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByTestId("cross-ui-nav-menu")).not.toBeInTheDocument();
  });

  it("closes menu on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    expect(screen.getByTestId("cross-ui-nav-menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("cross-ui-nav-menu")).not.toBeInTheDocument();
  });

  it("closes menu on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">outside area</div>
        <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />
      </div>,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    expect(screen.getByTestId("cross-ui-nav-menu")).toBeInTheDocument();
    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByTestId("cross-ui-nav-menu")).not.toBeInTheDocument();
  });

  it("sets aria-expanded correctly", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    const trigger = screen.getByTestId("cross-ui-nav-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("uses DEFAULT_UI_GROUPS when no groups prop is provided", async () => {
    const user = userEvent.setup();
    render(<CrossUINav currentUIKey="deployment" />);
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const menu = screen.getByTestId("cross-ui-nav-menu");
    // DEFAULT_UI_GROUPS has 4 groups
    expect(within(menu).getByText("Monitoring")).toBeInTheDocument();
    expect(within(menu).getByText("Analytics")).toBeInTheDocument();
    expect(within(menu).getByText("Operations")).toBeInTheDocument();
    expect(within(menu).getByText("Data")).toBeInTheDocument();
  });

  it("DEFAULT_UI_GROUPS contains expected entries", () => {
    const allKeys = DEFAULT_UI_GROUPS.flatMap((g) =>
      g.entries.map((e) => e.key),
    );
    expect(allKeys).toContain("live-health-monitor");
    expect(allKeys).toContain("logs-dashboard");
    expect(allKeys).toContain("trading-analytics");
    expect(allKeys).toContain("execution-analytics");
    expect(allKeys).toContain("strategy");
    expect(allKeys).toContain("deployment");
    expect(allKeys).toContain("onboarding");
    expect(allKeys).toContain("settlement");
    expect(allKeys).toContain("batch-audit");
    expect(allKeys).toContain("client-reporting");
    expect(allKeys).toContain("ml-training");
  });

  it("menu items have role='menuitem'", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    const menuItems = screen.getAllByRole("menuitem");
    // 2 Monitoring + 1 Analytics = 3
    expect(menuItems).toHaveLength(3);
  });

  it("closes menu when clicking a link entry", async () => {
    const user = userEvent.setup();
    render(
      <CrossUINav currentUIKey="live-health-monitor" groups={TEST_GROUPS} />,
    );
    await user.click(screen.getByTestId("cross-ui-nav-trigger"));
    expect(screen.getByTestId("cross-ui-nav-menu")).toBeInTheDocument();
    // Click a link (it calls onClick which sets open=false)
    // Since jsdom doesn't navigate, we can test the state change
    await user.click(screen.getByTestId("cross-ui-link-logs-dashboard"));
    expect(screen.queryByTestId("cross-ui-nav-menu")).not.toBeInTheDocument();
  });
});
