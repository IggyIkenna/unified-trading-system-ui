import { render, screen } from "@testing-library/react";
import { ManualTradingPanel } from "@/components/trading/manual-trading-panel";

// Mock hooks
jest.mock("@/hooks/api/use-orders", () => ({
  usePlaceOrder: () => ({ mutateAsync: jest.fn() }),
  usePreTradeCheck: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@example.com", org_id: "org-1" },
  }),
}));

describe("ManualTradingPanel (enhanced)", () => {
  it("renders without crashing", () => {
    const { container } = render(<ManualTradingPanel />);
    expect(container).toBeTruthy();
  });

  it("renders the Manual Trade button", () => {
    render(<ManualTradingPanel />);
    const btn = screen.getByText(/Manual Trade/i);
    expect(btn).toBeTruthy();
  });
});
