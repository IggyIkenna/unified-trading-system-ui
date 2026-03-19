import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@unified-trading/ui-auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  RequireAuth: ({
    children,
    loginPath,
  }: {
    children: React.ReactNode;
    loginPath?: string;
  }) => {
    void loginPath;
    return <>{children}</>;
  },
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    token: "test-token",
  }),
}));

vi.mock("@unified-trading/ui-kit", async () => {
  const { MemoryRouter, useNavigate } = await import("react-router-dom");
  function AppShellInner({
    appName,
    nav,
    authWrapper,
    extraProviders,
    children,
  }: {
    appName: string;
    nav?: {
      id: string;
      label: string;
      items?: { id: string; label: string }[];
    }[];
    authWrapper?: (c: React.ReactNode) => React.ReactNode;
    extraProviders?: (c: React.ReactNode) => React.ReactNode;
    children: React.ReactNode;
  }) {
    const navigate = useNavigate();
    const allItems = nav?.flatMap((item) =>
      item.items ? [item, ...item.items] : [item],
    );
    const inner = (
      <>
        <span data-testid="app-name">{appName}</span>
        <nav>
          {allItems?.map((item) => (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)}>
              {item.label}
            </button>
          ))}
        </nav>
        {children}
      </>
    );
    const withAuth = authWrapper ? authWrapper(inner) : inner;
    return <>{extraProviders ? extraProviders(withAuth) : withAuth}</>;
  }
  return {
    AppShell: ({
      appName,
      nav,
      defaultRoute = "/",
      authWrapper,
      extraProviders,
      children,
    }: {
      appName: string;
      nav?: {
        id: string;
        label: string;
        items?: { id: string; label: string }[];
      }[];
      defaultRoute?: string;
      authWrapper?: (c: React.ReactNode) => React.ReactNode;
      extraProviders?: (c: React.ReactNode) => React.ReactNode;
      children: React.ReactNode;
    }) => (
      <MemoryRouter initialEntries={[defaultRoute]}>
        <AppShellInner
          appName={appName}
          nav={nav}
          authWrapper={authWrapper}
          extraProviders={extraProviders}
        >
          {children}
        </AppShellInner>
      </MemoryRouter>
    ),
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    PageLayout: ({
      header,
      sidebar,
      children,
    }: {
      header?: React.ReactNode;
      sidebar?: React.ReactNode;
      children: React.ReactNode;
    }) => (
      <div>
        {header}
        {sidebar}
        {children}
      </div>
    ),
    AppHeader: ({ appName }: { appName: string }) => <div>{appName}</div>,
    SidebarNav: ({
      sections,
      header: navHeader,
    }: {
      sections?: {
        id: string;
        label: string;
        items: { id: string; label: string }[];
      }[];
      header?: React.ReactNode;
    }) => (
      <nav>
        {navHeader}
        {sections?.map((section) =>
          section.items.map((item) => (
            <button key={item.id}>{item.label}</button>
          )),
        )}
      </nav>
    ),
    MockModeBanner: () => null,
    CloudModeBadge: () => null,
    ApiConnectionBadge: () => null,
  };
});

// Mock heavy page components to avoid deep import trees
vi.mock("./pages/Login", () => ({ Login: () => <div>Login</div> }));
vi.mock("./pages/RunBacktest", () => ({
  default: () => <div>RunBacktest</div>,
}));
vi.mock("./pages/LoadResults", () => ({
  default: () => <div>LoadResults</div>,
}));
vi.mock("./pages/Analysis", () => ({ default: () => <div>Analysis</div> }));
vi.mock("./pages/DeepDive", () => ({ default: () => <div>DeepDive</div> }));
vi.mock("./pages/AlgorithmComparison", () => ({
  default: () => <div>AlgorithmComparison</div>,
}));
vi.mock("./pages/GridResults", () => ({
  GridResults: () => <div>GridResults</div>,
}));
vi.mock("./pages/ConfigBrowser", () => ({
  default: () => <div>ConfigBrowser</div>,
}));
vi.mock("./pages/ConfigGenerator", () => ({
  default: () => <div>ConfigGenerator</div>,
}));
vi.mock("./pages/InstrumentDefinitions", () => ({
  default: () => <div>InstrumentDefinitions</div>,
}));
vi.mock("./pages/InstructionAvailability", () => ({
  default: () => <div>InstructionAvailability</div>,
}));
vi.mock("./pages/MarketTickData", () => ({
  default: () => <div>MarketTickData</div>,
}));

describe("App", () => {
  it("renders the app shell", () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it("renders navigation buttons", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /run backtest/i }),
    ).toBeInTheDocument();
  });

  it("renders load results nav button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /load results/i }),
    ).toBeInTheDocument();
  });

  it("renders analysis nav button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /^analysis$/i }),
    ).toBeInTheDocument();
  });
});
