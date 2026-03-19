import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Login } from "./Login";

const mockLogin = vi.fn();

vi.mock("@unified-trading/ui-auth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
    token: null,
  }),
}));

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));

describe("Login", () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it("renders the card title", () => {
    render(<Login />);
    expect(screen.getByText("Execution Analytics")).toBeInTheDocument();
  });

  it("renders the sign-in description text", () => {
    render(<Login />);
    expect(
      screen.getByText(
        /Sign in to access backtesting and strategy analysis tools/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the Login with Google button", () => {
    render(<Login />);
    expect(
      screen.getByRole("button", { name: /Login with Google/i }),
    ).toBeInTheDocument();
  });

  it("calls login when button is clicked", () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Login with Google/i }));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it("calls login with no arguments", () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Login with Google/i }));
    expect(mockLogin).toHaveBeenCalledWith();
  });

  it("renders without crashing", () => {
    const { container } = render(<Login />);
    expect(container.firstChild).toBeTruthy();
  });

  it("button is not disabled by default", () => {
    render(<Login />);
    const btn = screen.getByRole("button", { name: /Login with Google/i });
    expect(btn).not.toBeDisabled();
  });
});
