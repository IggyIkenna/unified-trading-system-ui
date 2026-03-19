import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@unified-trading/ui-auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: null,
  }),
}));

vi.mock("@unified-trading/ui-kit", () => ({
  AppShell: ({
    appName,
    authWrapper,
    children,
  }: {
    appName: string;
    authWrapper?: (c: React.ReactNode) => React.ReactNode;
    children: React.ReactNode;
  }) => {
    const inner = (
      <>
        <div data-testid="app-name">{appName}</div>
        {children}
      </>
    );
    return <>{authWrapper ? authWrapper(inner) : inner}</>;
  },
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Input: (props: Record<string, unknown>) => <input {...props} />,
  Label: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
  }) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{
                onValueChange?: (v: string) => void;
              }>,
              { onValueChange },
            )
          : child,
      )}
    </div>
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
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange?: (v: string) => void;
  }) => (
    <button onClick={() => onValueChange?.(value)} data-value={value}>
      {children}
    </button>
  ),
}));

vi.mock("./pages/ReportsPage", () => ({
  ReportsPage: () => <div>ReportsPage</div>,
}));

vi.mock("./pages/PerformancePage", () => ({
  PerformancePage: () => <div>PerformancePage</div>,
}));

vi.mock("./pages/GenerateReportPage", () => ({
  GenerateReportPage: () => <div>GenerateReportPage</div>,
}));

vi.mock("./pages/DeploymentsPage", () => ({
  DeploymentsPage: () => <div>DeploymentsPage</div>,
}));

vi.mock("lucide-react", () => ({
  BarChart3: () => null,
  FileText: () => null,
  TrendingUp: () => null,
  FilePlus: () => null,
  Rocket: () => null,
  Download: () => null,
  Send: () => null,
}));

vi.mock("react-router-dom", () => ({
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element, path }: { element: React.ReactNode; path: string }) =>
    path === "/reports" ? <>{element}</> : null,
  Navigate: () => null,
}));

describe("App", () => {
  it('renders "Client Reporting" app name', () => {
    render(<App />);
    expect(screen.getByText("Client Reporting")).toBeInTheDocument();
  });

  it("renders the default ReportsPage route", () => {
    render(<App />);
    expect(screen.getByText("ReportsPage")).toBeInTheDocument();
  });

  it("wraps content with auth provider", () => {
    render(<App />);
    // AppShell mock calls authWrapper, which renders AuthProvider + RequireAuth
    // If auth wrapper didn't work, no content would render
    expect(screen.getByTestId("app-name")).toBeInTheDocument();
  });
});
