import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TradingFamilyFilterBanner } from "@/components/architecture-v2/trading-family-filter-banner";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

type AuthUser = {
  readonly id: string;
  readonly role: "admin" | "internal" | "client";
};

const useAuthMock = vi.fn<() => { user: AuthUser | null }>(() => ({
  user: { id: "admin", role: "admin" },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

function resetScope() {
  const { setFamilies, setArchetypes } = useWorkspaceScopeStore.getState();
  setFamilies([]);
  setArchetypes([]);
}

describe("TradingFamilyFilterBanner", () => {
  beforeEach(() => {
    resetScope();
  });

  it("renders with default test-id prefix", () => {
    render(
      <AvailabilityStoreProvider persist={false}>
        <TradingFamilyFilterBanner testIdPrefix="orders" />
      </AvailabilityStoreProvider>,
    );
    expect(screen.getByTestId("orders-family-picker")).toBeInTheDocument();
  });

  it("does not show counts when no filter is active", () => {
    render(
      <AvailabilityStoreProvider persist={false}>
        <TradingFamilyFilterBanner
          testIdPrefix="positions"
          counts={{ total: 42, filtered: 42 }}
        />
      </AvailabilityStoreProvider>,
    );
    expect(screen.queryByTestId("positions-family-picker-count")).not.toBeInTheDocument();
  });

  it("shows counts + clear button when a family is selected", async () => {
    const user = userEvent.setup();
    render(
      <AvailabilityStoreProvider persist={false}>
        <TradingFamilyFilterBanner
          testIdPrefix="orders"
          counts={{ total: 10, filtered: 3 }}
        />
      </AvailabilityStoreProvider>,
    );
    // Open family dropdown
    await user.click(screen.getByTestId("orders-family-select"));
    // Pick a family — pick "ML Directional" since it always exists under
    // the admin audience.
    await user.click(screen.getByRole("option", { name: "ML Directional" }));

    expect(screen.getByTestId("orders-family-picker-count")).toHaveTextContent(
      "3 of 10 rows",
    );
    expect(screen.getByTestId("orders-family-picker-clear")).toBeInTheDocument();
  });

  it("clear button resets the global scope selection", async () => {
    const user = userEvent.setup();
    // Seed a selection directly.
    useWorkspaceScopeStore.getState().setFamilies(["ML_DIRECTIONAL"]);

    render(
      <AvailabilityStoreProvider persist={false}>
        <TradingFamilyFilterBanner
          testIdPrefix="pnl"
          counts={{ total: 5, filtered: 2 }}
        />
      </AvailabilityStoreProvider>,
    );
    const clearBtn = screen.getByTestId("pnl-family-picker-clear");
    await user.click(clearBtn);
    expect(useWorkspaceScopeStore.getState().scope.families).toEqual([]);
    expect(useWorkspaceScopeStore.getState().scope.archetypes).toEqual([]);
  });
});
