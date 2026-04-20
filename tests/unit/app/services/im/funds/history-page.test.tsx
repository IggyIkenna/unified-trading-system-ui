import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import HistoryPage from "@/app/(platform)/services/im/funds/history/page";
import { resetMockStore } from "@/lib/mocks/fund-administration";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

describe("/services/im/funds/history page", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("renders the NAV snapshot table from the seeded fixture", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-history-nav-table")).toBeInTheDocument(),
    );
  });

  it("renders the ledger table with rows from subs + reds + allocs", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-history-ledger-table")).toBeInTheDocument(),
    );
    // Subscription seed (sub-001) should appear as a subscription row.
    expect(screen.getByTestId("im-funds-history-row-subscription-sub-001")).toBeInTheDocument();
    // Redemption seed (red-001) should appear.
    expect(screen.getByTestId("im-funds-history-row-redemption-red-001")).toBeInTheDocument();
    // Allocation seed (alloc-001) should appear.
    expect(screen.getByTestId("im-funds-history-row-allocation-alloc-001")).toBeInTheDocument();
  });

  it("shows the allocator-filter select populated from the seeded data", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-history-allocator-filter")).toBeInTheDocument(),
    );
  });

  it("does not render the error banner when the mock store is healthy", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<HistoryPage />, { wrapper: Wrapper });
    await screen.findByTestId("im-funds-history-ledger-table");
    expect(screen.queryByTestId("im-funds-history-error")).toBeNull();
  });
});
