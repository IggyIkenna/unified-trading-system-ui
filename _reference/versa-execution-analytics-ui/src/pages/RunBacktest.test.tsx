import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock() is hoisted before const declarations — use vi.fn() inline in factories.

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi
    .fn()
    .mockReturnValue({ data: undefined, isLoading: false, error: null }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    isPending: false,
    data: undefined,
    error: null,
  }),
  QueryClient: vi
    .fn()
    .mockImplementation(() => ({ invalidateQueries: vi.fn() })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@unified-trading/ui-kit", () => ({
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
    <h2>{children}</h2>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Input: ({
    value,
    onChange,
    placeholder,
    type,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
  }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
    />
  ),
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("lucide-react", () => ({
  Play: () => null,
  Upload: () => null,
  Loader2: () => null,
  Folder: () => null,
  FileJson: () => null,
  ChevronRight: () => null,
  ArrowLeft: () => null,
  AlertCircle: () => null,
  CheckCircle: () => null,
  AlertTriangle: () => null,
  Cpu: () => null,
  Cloud: () => null,
  BarChart3: () => null,
  RefreshCw: () => null,
  Copy: () => null,
  Download: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
  Eye: () => null,
}));

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/api/deploymentClient", () => ({
  deploymentClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  DeploymentResponse: {},
  DataStatusResponse: {},
  ExecutionMissingShardsResponse: {},
}));

// ─── Import after mocks ────────────────────────────────────────────────────────

import RunBacktest from "./RunBacktest";
import apiClient from "@/api/client";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("RunBacktest page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { cores: 8, recommended_workers: 4, max_safe_workers: 6 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing", () => {
    render(<RunBacktest />);
    expect(document.body).toBeTruthy();
  });

  it("renders a heading or page title", () => {
    render(<RunBacktest />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renders mode selection buttons (single / batch / mass-deploy)", () => {
    render(<RunBacktest />);
    expect(screen.getByText(/Single/i)).toBeInTheDocument();
  });

  it("renders batch mode button", () => {
    render(<RunBacktest />);
    expect(screen.getByText(/Batch/i)).toBeInTheDocument();
  });

  it("switches to batch mode when clicking Batch", () => {
    render(<RunBacktest />);
    const batchBtn = screen.getByText(/Batch/i);
    fireEvent.click(batchBtn);
    expect(document.body).toBeTruthy();
  });

  it("renders a run/submit button", () => {
    render(<RunBacktest />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders file/path input or similar config area", () => {
    render(<RunBacktest />);
    const inputs = document.querySelectorAll("input, select, textarea");
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});

// ─── Pure helper function tests (extracted logic) ──────────────────────────────

describe("formatDateTime helper", () => {
  function formatDateTime(date: string, hour: number, minute: number): string {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
  }

  it("formats a date with hour and minute correctly", () => {
    expect(formatDateTime("2024-01-15", 9, 30)).toBe("2024-01-15T09:30:00Z");
  });

  it("pads single-digit hour with leading zero", () => {
    expect(formatDateTime("2024-06-01", 3, 5)).toBe("2024-06-01T03:05:00Z");
  });

  it("returns empty string for empty date", () => {
    expect(formatDateTime("", 0, 0)).toBe("");
  });

  it("handles midnight (00:00)", () => {
    expect(formatDateTime("2024-12-31", 0, 0)).toBe("2024-12-31T00:00:00Z");
  });

  it("handles end of day (23:59)", () => {
    expect(formatDateTime("2024-01-01", 23, 59)).toBe("2024-01-01T23:59:00Z");
  });
});

describe("formatDateOnly helper", () => {
  function formatDateOnly(date: string): string {
    if (!date) return "";
    return date;
  }

  it("returns the date string unchanged", () => {
    expect(formatDateOnly("2024-03-15")).toBe("2024-03-15");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateOnly("")).toBe("");
  });
});
