import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import ImFundsOverviewPage from "@/app/(platform)/services/im/funds/page";
import { resetMockStore } from "@/lib/mocks/fund-administration";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

describe("/services/im/funds (overview)", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("renders the header and all four child-surface links", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<ImFundsOverviewPage />, { wrapper: Wrapper });
    expect(await screen.findByText(/Fund Administration/)).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-overview-link-subscriptions")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-overview-link-redemptions")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-overview-link-allocations")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-overview-link-history")).toBeInTheDocument();
  });

  it("resolves the KPI summary cards against the seeded mock fixtures", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<ImFundsOverviewPage />, { wrapper: Wrapper });
    const navCard = await screen.findByTestId("im-funds-kpi-nav");
    const pendingSubsCard = screen.getByTestId("im-funds-kpi-pending-subs");
    const pendingRedsCard = screen.getByTestId("im-funds-kpi-pending-reds");
    expect(navCard).toBeInTheDocument();
    expect(pendingSubsCard).toBeInTheDocument();
    expect(pendingRedsCard).toBeInTheDocument();
  });

  it("surfaces the fund + share-class descriptor text", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<ImFundsOverviewPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByText(/odum-pooled-fund-1/)).toBeInTheDocument(),
    );
  });

  it("does not render the error card when the mock store is healthy", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<ImFundsOverviewPage />, { wrapper: Wrapper });
    await screen.findByTestId("im-funds-overview-link-subscriptions");
    expect(screen.queryByTestId("im-funds-overview-error")).toBeNull();
  });
});
