import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it("renders Batch Jobs page heading by default", () => {
    render(<App />);
    // The BatchJobsPage renders an h1 with "Batch Jobs"
    const heading = screen.getByRole("heading", { name: /batch jobs/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders total jobs count", () => {
    render(<App />);
    expect(screen.getByText(/5 total jobs/i)).toBeInTheDocument();
  });

  it("renders job table columns", () => {
    render(<App />);
    expect(screen.getByText("Job")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
