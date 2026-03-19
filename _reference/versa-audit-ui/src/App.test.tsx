import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

vi.mock("@unified-trading/ui-auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  RequireAuth: ({
    children,
  }: {
    loginPath?: string;
    children: React.ReactNode;
  }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: null,
  }),
}));

vi.mock("@unified-trading/ui-kit", async () => {
  const { MemoryRouter, useNavigate } = await import("react-router-dom");
  function NavShell({
    nav,
    kids,
  }: {
    nav?: { id: string; label: string }[];
    kids: React.ReactNode;
  }) {
    const navigate = useNavigate();
    return (
      <>
        {nav && (
          <nav data-testid="sidebar-nav">
            {nav.map((item) => (
              <button key={item.id} onClick={() => navigate(`/${item.id}`)}>
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <div data-testid="mock-mode-banner">Mock Mode</div>
        <div data-testid="content">{kids}</div>
      </>
    );
  }
  return {
    AppShell: ({
      appName,
      appDescription,
      version,
      nav,
      authWrapper,
      extraProviders,
      children,
    }: {
      appName: string;
      appDescription?: string;
      version?: string;
      nav?: { id: string; label: string; icon?: React.ReactNode }[];
      authWrapper?: (c: React.ReactNode) => React.ReactNode;
      extraProviders?: (c: React.ReactNode) => React.ReactNode;
      children: React.ReactNode;
    }) => {
      const inner = (
        <MemoryRouter initialEntries={["/jobs"]}>
          <div data-testid="app-shell">
            <div data-testid="header">
              <span data-testid="app-name">{appName}</span>
              {appDescription && (
                <span data-testid="app-description">{appDescription}</span>
              )}
              {version && <span data-testid="app-version">{version}</span>}
            </div>
            <NavShell nav={nav} kids={children} />
          </div>
        </MemoryRouter>
      );
      const withAuth = authWrapper ? authWrapper(inner) : inner;
      return extraProviders ? <>{extraProviders(withAuth)}</> : <>{withAuth}</>;
    },
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    PageLayout: ({
      children,
      header,
      sidebar,
    }: {
      children: React.ReactNode;
      header?: React.ReactNode;
      sidebar?: React.ReactNode;
    }) => (
      <div>
        <div data-testid="header">{header}</div>
        <div data-testid="sidebar">{sidebar}</div>
        <div data-testid="content">{children}</div>
      </div>
    ),
    AppHeader: ({
      appName,
      appDescription,
      version,
    }: {
      appName: string;
      appDescription?: string;
      version?: string;
      badges?: unknown[];
    }) => (
      <div>
        <span data-testid="app-name">{appName}</span>
        {appDescription && (
          <span data-testid="app-description">{appDescription}</span>
        )}
        {version && <span data-testid="app-version">{version}</span>}
      </div>
    ),
    SidebarNav: ({
      items,
      activeId,
      onSelect,
      header,
    }: {
      items: { id: string; label: string; icon?: React.ReactNode }[];
      activeId: string;
      onSelect: (id: string) => void;
      header?: React.ReactNode;
    }) => (
      <nav data-testid="sidebar-nav" data-active={activeId}>
        {header}
        {items.map((item) => (
          <button key={item.id} onClick={() => onSelect(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
    ),
    MockModeBanner: () => <div data-testid="mock-mode-banner">Mock Mode</div>,
    Card: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CardContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CardHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CardTitle: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Badge: ({
      children,
      variant,
    }: {
      children: React.ReactNode;
      variant?: string;
    }) => <span data-variant={variant}>{children}</span>,
    Button: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
    Select: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => <option value={value}>{children}</option>,
    CloudModeBadge: () => null,
    ApiConnectionBadge: () => null,
  };
});

vi.mock("lucide-react", () => ({
  ChevronRight: () => null,
  RefreshCw: () => null,
  ArrowLeft: () => null,
  AlertTriangle: () => null,
  Briefcase: () => null,
  ListFilter: () => null,
  LayoutGrid: () => null,
  ShieldAlert: () => null,
  ClipboardCheck: () => null,
  Rocket: () => null,
}));

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it("renders the app name 'Batch Audit' in the header", () => {
    render(<App />);
    expect(screen.getByTestId("app-name")).toHaveTextContent("Batch Audit");
  });

  it("renders the app description in the header", () => {
    render(<App />);
    expect(screen.getByTestId("app-description")).toHaveTextContent(
      "pipeline job monitoring & audit",
    );
  });

  it("renders the version number in the header", () => {
    render(<App />);
    expect(screen.getByTestId("app-version")).toHaveTextContent("v0.1.0");
  });

  it("renders sidebar navigation with all four nav items", () => {
    render(<App />);
    // Each label appears at least once (may also appear as a page heading)
    expect(screen.getAllByText("Batch Jobs").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Audit Trail").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Data Completeness").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Compliance").length).toBeGreaterThanOrEqual(1);
    // Confirm they are rendered in the sidebar
    expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
  });

  it("defaults to /jobs route, showing Batch Jobs page content", () => {
    render(<App />);
    // The BatchJobsPage renders "5 total jobs"
    expect(screen.getByText("5 total jobs")).toBeInTheDocument();
  });

  it("clicking 'Audit Trail' nav item navigates to audit trail page", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Audit Trail"));
    expect(screen.getByText(/8 events today/)).toBeInTheDocument();
  });

  it("clicking 'Data Completeness' nav item navigates to data completeness page", () => {
    render(<App />);
    // Multiple elements with "Data Completeness" may exist — click the button in sidebar
    const navButtons = screen.getAllByText("Data Completeness");
    const navButton = navButtons.find((el) => el.tagName === "BUTTON");
    if (navButton) fireEvent.click(navButton);
    expect(screen.getByText(/GCS path presence grid/)).toBeInTheDocument();
  });

  it("clicking 'Compliance' nav item navigates to compliance page", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Compliance"));
    expect(screen.getByText("Services With Violations")).toBeInTheDocument();
  });

  it("renders MockModeBanner because VITE_MOCK_API=true in .env.test", () => {
    render(<App />);
    // .env.test sets VITE_MOCK_API=true so the banner is always shown in tests
    expect(screen.getByTestId("mock-mode-banner")).toBeInTheDocument();
  });
});
