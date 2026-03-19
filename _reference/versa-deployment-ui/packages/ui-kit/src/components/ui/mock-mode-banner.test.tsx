import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MockModeBanner } from "./mock-mode-banner";

describe("MockModeBanner", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders MOCK MODE text", () => {
    render(<MockModeBanner />);
    expect(screen.getByText("MOCK MODE")).toBeInTheDocument();
  });

  it("renders default label", () => {
    render(<MockModeBanner />);
    expect(screen.getByText(/using simulated data/)).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<MockModeBanner label="custom label text" />);
    expect(screen.getByText(/custom label text/)).toBeInTheDocument();
  });

  it("has dismiss button by default", () => {
    render(<MockModeBanner />);
    expect(
      screen.getByRole("button", { name: /dismiss/i }),
    ).toBeInTheDocument();
  });

  it("hides banner after dismiss click", async () => {
    render(<MockModeBanner />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("MOCK MODE")).not.toBeInTheDocument();
  });

  it("persists dismissal to sessionStorage", async () => {
    render(<MockModeBanner />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(sessionStorage.getItem("mock-mode-banner-dismissed")).toBe("true");
  });

  it("does not show dismiss button when dismissible=false", () => {
    render(<MockModeBanner dismissible={false} />);
    expect(
      screen.queryByRole("button", { name: /dismiss/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render when already dismissed in sessionStorage", () => {
    sessionStorage.setItem("mock-mode-banner-dismissed", "true");
    render(<MockModeBanner />);
    expect(screen.queryByText("MOCK MODE")).not.toBeInTheDocument();
  });

  it("has role=alert", () => {
    render(<MockModeBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
