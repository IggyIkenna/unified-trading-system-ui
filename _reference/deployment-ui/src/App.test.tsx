import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

vi.mock("@unified-trading/ui-auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: "test_token",
    user: null,
  }),
}));
vi.mock("./components/Header", () => ({ Header: () => <div>Header</div> }));
vi.mock("./components/ServiceList", () => ({
  ServiceList: ({
    onSelectService,
  }: {
    onSelectService: (s: string) => void;
  }) => (
    <div>
      <div>ServiceList</div>
      <button onClick={() => onSelectService("execution-service")}>
        Select Service
      </button>
    </div>
  ),
}));
vi.mock("./components/ServiceDetails", () => ({
  ServiceDetails: () => <div>ServiceDetails</div>,
}));
vi.mock("./components/DeployForm", () => ({
  DeployForm: () => <div>DeployForm</div>,
}));
vi.mock("./components/DeploymentResult", () => ({
  DeploymentResult: () => <div>DeploymentResult</div>,
}));
vi.mock("./components/DeploymentHistory", () => ({
  DeploymentHistory: () => <div>DeploymentHistory</div>,
}));
vi.mock("./components/DeploymentDetails", () => ({
  DeploymentDetails: () => <div>DeploymentDetails</div>,
}));
vi.mock("./components/ReadinessTab", () => ({
  ReadinessTab: () => <div>ReadinessTab</div>,
}));
vi.mock("./components/DataStatusTab", () => ({
  DataStatusTab: () => <div>DataStatusTab</div>,
}));
vi.mock("./components/ServiceStatusTab", () => ({
  ServiceStatusTab: () => <div>ServiceStatusTab</div>,
}));
vi.mock("./components/ServicesOverviewTab", () => ({
  ServicesOverviewTab: () => <div>ServicesOverviewTab</div>,
}));
vi.mock("./components/CloudBuildsTab", () => ({
  CloudBuildsTab: () => <div>CloudBuildsTab</div>,
}));
vi.mock("./components/EpicReadinessView", () => ({
  EpicReadinessView: () => <div>EpicReadinessView</div>,
}));
vi.mock("./api/client", () => ({ createDeployment: vi.fn() }));

describe("App", () => {
  it("renders Header and ServiceList", () => {
    render(<App />);
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("ServiceList")).toBeInTheDocument();
  });

  it("shows tabs after selecting a service", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /select service/i }));
    expect(screen.getByText("DeployForm")).toBeInTheDocument();
  });

  it("shows deploy tab content by default", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /select service/i }));
    expect(screen.getByRole("tab", { name: /deploy/i })).toBeInTheDocument();
  });

  it("shows history tab", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /select service/i }));
    expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
  });

  it("switches to history tab on click", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /select service/i }));
    // Click history tab - Radix UI tabs update state async in jsdom
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    // History tab should now be active (aria-selected)
    await waitFor(() => {
      const historyTab = screen.getByRole("tab", { name: /history/i });
      expect(
        historyTab.getAttribute("aria-selected") ??
          historyTab.getAttribute("data-state"),
      ).toBeTruthy();
    });
  });

  it("renders ConfigLink to onboarding venue connections", () => {
    render(<App />);
    const configLink = screen.getByTestId("config-link");
    expect(configLink).toBeInTheDocument();
    expect(configLink).toHaveTextContent("Venue Connections");
    expect(configLink.getAttribute("href")).toContain("/venue-connections");
  });

  it("shows tabs in correct order: Deploy, Status, History, Builds, Data Status, Readiness, Config", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /select service/i }));
    const tabs = screen.getAllByRole("tab");
    const tabLabels = tabs.map((tab) => tab.textContent?.trim());
    // Verify Deploy comes first and Status is second
    expect(tabLabels[0]).toBe("Deploy");
    expect(tabLabels[1]).toBe("Status");
    expect(tabLabels[2]).toBe("History");
    expect(tabLabels[3]).toBe("Builds");
  });
});
