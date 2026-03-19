import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "./header";

describe("AppHeader", () => {
  it("renders appName", () => {
    render(<AppHeader appName="Trading Desk" />);
    expect(
      screen.getByRole("heading", { name: "Trading Desk" }),
    ).toBeInTheDocument();
  });

  it("renders appDescription when provided", () => {
    render(<AppHeader appName="App" appDescription="subtitle text" />);
    expect(screen.getByText("subtitle text")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<AppHeader appName="App" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders version when provided", () => {
    render(<AppHeader appName="App" version="v1.2.3" />);
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });

  it("renders leftSlot content", () => {
    render(<AppHeader appName="App" leftSlot={<span>left slot</span>} />);
    expect(screen.getByText("left slot")).toBeInTheDocument();
  });

  it("renders rightSlot content", () => {
    render(<AppHeader appName="App" rightSlot={<span>right slot</span>} />);
    expect(screen.getByText("right slot")).toBeInTheDocument();
  });

  it("renders badge labels", () => {
    render(
      <AppHeader
        appName="App"
        badges={[
          { label: "LIVE", variant: "running" },
          { label: "READY", variant: "success" },
        ]}
      />,
    );
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("READY")).toBeInTheDocument();
  });
});
