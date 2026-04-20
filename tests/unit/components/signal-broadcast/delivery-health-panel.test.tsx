import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeliveryHealthPanel } from "@/components/signal-broadcast";
import { MOCK_DELIVERY_HEALTH } from "@/lib/signal-broadcast";

describe("DeliveryHealthPanel", () => {
  it("renders the container with the canonical data-testid", () => {
    render(<DeliveryHealthPanel health={MOCK_DELIVERY_HEALTH} />);
    expect(
      screen.getByTestId("signal-broadcast-delivery-health-panel"),
    ).toBeInTheDocument();
  });

  it("renders all 4 KPI tiles", () => {
    render(<DeliveryHealthPanel health={MOCK_DELIVERY_HEALTH} />);
    expect(
      screen.getByTestId("delivery-health-success-rate"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("delivery-health-retries")).toBeInTheDocument();
    expect(screen.getByTestId("delivery-health-latency")).toBeInTheDocument();
    expect(screen.getByTestId("delivery-health-total")).toBeInTheDocument();
  });

  it("formats success_rate as a percentage and latency as ms", () => {
    render(<DeliveryHealthPanel health={MOCK_DELIVERY_HEALTH} />);
    expect(
      screen.getByTestId("delivery-health-success-rate"),
    ).toHaveTextContent("98.7%");
    expect(screen.getByTestId("delivery-health-latency")).toHaveTextContent(
      "145ms",
    );
  });

  it("surfaces the last-delivery timestamp", () => {
    render(<DeliveryHealthPanel health={MOCK_DELIVERY_HEALTH} />);
    expect(
      screen.getByTestId("delivery-health-last-delivery"),
    ).toBeInTheDocument();
  });
});
