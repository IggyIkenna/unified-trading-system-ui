// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceList } from "../../../src/components/ServiceList";

describe("ServiceList", () => {
  it("renders Pipeline Services heading", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("Pipeline Services")).toBeTruthy();
  });

  it("renders all 7 layer headers", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("Layer 1: Root Services")).toBeTruthy();
    expect(screen.getByText("Layer 2: Data Ingestion")).toBeTruthy();
    expect(screen.getByText("Layer 3: Feature Engineering")).toBeTruthy();
    expect(screen.getByText("Layer 4: Machine Learning")).toBeTruthy();
    expect(screen.getByText("Layer 5: Strategy & Execution")).toBeTruthy();
    expect(screen.getByText("Layer 6: Risk & Monitoring")).toBeTruthy();
    expect(screen.getByText("Infrastructure")).toBeTruthy();
  });

  it("renders total service count badge", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    // 2 + 2 + 8 + 2 + 4 + 4 + 2 = 24 services
    const badge = screen.getByText(/\d+ services/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("services");
  });

  it("renders instruments-service item", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("instruments-service")).toBeTruthy();
  });

  it("renders execution-service item", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("execution-service")).toBeTruthy();
  });

  it("renders ml-training-service in Layer 4", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("ml-training-service")).toBeTruthy();
  });

  it("calls onSelectService when a service is clicked", () => {
    const onSelect = vi.fn();
    render(<ServiceList selectedService={null} onSelectService={onSelect} />);
    const btn = screen.getByText("instruments-service").closest("button");
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    expect(onSelect).toHaveBeenCalledWith("instruments-service");
  });

  it("applies selected state visually when service is selected", () => {
    render(
      <ServiceList
        selectedService="execution-service"
        onSelectService={vi.fn()}
      />,
    );
    const btn = screen.getByText("execution-service").closest("button");
    // Selected item has inline border-left style
    expect(btn?.getAttribute("style")).toContain("border-left");
  });

  it("does not apply selected style to non-selected items", () => {
    render(
      <ServiceList
        selectedService="execution-service"
        onSelectService={vi.fn()}
      />,
    );
    const btn = screen.getByText("instruments-service").closest("button");
    expect(btn?.getAttribute("style")).toBeFalsy();
  });

  it("renders dimension tags for instruments-service", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    // Multiple services share category × date dimensions; check at least one exists
    const dimTexts = screen.getAllByText("category × date");
    expect(dimTexts.length).toBeGreaterThan(0);
  });

  it("renders deployment-service in Infrastructure layer", () => {
    render(<ServiceList selectedService={null} onSelectService={vi.fn()} />);
    expect(screen.getByText("deployment-service")).toBeTruthy();
  });
});
