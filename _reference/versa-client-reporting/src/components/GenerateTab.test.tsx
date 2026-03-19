import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { GenerateTab } from "./GenerateTab";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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
    <button onClick={onClick} disabled={disabled} data-testid="generate-btn">
      {children}
    </button>
  ),
  Label: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
  }) => {
    // Store each handler by inspecting the placeholder in SelectValue via children
    return (
      <div data-select-handler="true">
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
    );
  },
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-placeholder={placeholder}>{placeholder}</span>
  ),
  SelectContent: ({
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

vi.mock("lucide-react", () => ({
  FileText: () => null,
}));

describe("GenerateTab", () => {
  it('renders "Generate Report" heading', () => {
    render(<GenerateTab />);
    expect(
      screen.getByRole("heading", { name: "Generate Report" }),
    ).toBeInTheDocument();
  });

  it("Generate button is present", () => {
    render(<GenerateTab />);
    expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
  });

  it("generate button is disabled when no fields selected", () => {
    render(<GenerateTab />);
    expect(screen.getByTestId("generate-btn")).toBeDisabled();
  });

  it("renders all client options", () => {
    render(<GenerateTab />);
    expect(screen.getByText("Apex Capital")).toBeInTheDocument();
    expect(screen.getByText("Meridian Fund")).toBeInTheDocument();
    expect(screen.getByText("QuantEdge HK")).toBeInTheDocument();
    expect(screen.getByText("All Clients")).toBeInTheDocument();
  });

  it("renders type options", () => {
    render(<GenerateTab />);
    expect(screen.getByText("monthly")).toBeInTheDocument();
    expect(screen.getByText("quarterly")).toBeInTheDocument();
    expect(screen.getByText("annual")).toBeInTheDocument();
    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it('shows "Report queued successfully!" after all fields set and button clicked', async () => {
    render(<GenerateTab />);

    // Click "Apex Capital" item — triggers client select
    fireEvent.click(screen.getByText("Apex Capital"));
    // Click "monthly" item — triggers type select
    fireEvent.click(screen.getByText("monthly"));
    // Click "2026-02" item — triggers period select
    fireEvent.click(screen.getByText("2026-02"));

    // Now the button should be enabled and clicking shows success message
    const btn = screen.getByTestId("generate-btn");
    expect(btn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(screen.getByText("Report queued successfully!")).toBeInTheDocument();
  });
});
