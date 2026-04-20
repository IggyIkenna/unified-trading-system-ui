import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import AllocationsPage from "@/app/(platform)/services/im/funds/allocations/page";
import { resetMockStore } from "@/lib/mocks/fund-administration";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

describe("/services/im/funds/allocations page", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("renders seeded allocation rows with status badges", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<AllocationsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-alloc-table")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("im-funds-alloc-row-alloc-001")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-alloc-row-alloc-002")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-alloc-row-alloc-003")).toBeInTheDocument();
  });

  it("renders treasury health + allocation delta KPI cards", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<AllocationsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-alloc-kpi-reserve")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("im-funds-alloc-kpi-delta")).toBeInTheDocument();
  });

  it("Rebalance button is enabled in mock mode (ops bypass) and runs a rebalance", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<AllocationsPage />, { wrapper: Wrapper });

    const btn = await screen.findByTestId("im-funds-alloc-rebalance-button");
    await waitFor(() => expect(btn).not.toBeDisabled());
    act(() => {
      fireEvent.click(btn);
    });
    // After rebalance the button remains rendered and rows still appear.
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-alloc-table")).toBeInTheDocument(),
    );
  });

  it("does not render the ops-gate notice when useIsOpsUser() returns true", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<AllocationsPage />, { wrapper: Wrapper });
    await screen.findByTestId("im-funds-alloc-rebalance-button");
    expect(screen.queryByTestId("im-funds-alloc-ops-gate")).toBeNull();
  });
});
