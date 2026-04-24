import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FamilyArchetypePicker,
  type FamilyArchetypeSelection,
} from "@/components/architecture-v2/family-archetype-picker";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";

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

function renderPicker(
  initial: FamilyArchetypeSelection,
  overrides: Partial<{
    showStrategyIdDropdown: boolean;
    availabilityFilter: "allowed" | "all";
  }> = {},
) {
  const onChange = vi.fn<(next: FamilyArchetypeSelection) => void>();
  const result = render(
    <AvailabilityStoreProvider persist={false}>
      <FamilyArchetypePicker
        value={initial}
        onChange={onChange}
        showStrategyIdDropdown={overrides.showStrategyIdDropdown ?? false}
        availabilityFilter={overrides.availabilityFilter ?? "allowed"}
      />
    </AvailabilityStoreProvider>,
  );
  return { ...result, onChange };
}

describe("FamilyArchetypePicker", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useAuthMock.mockImplementation(() => ({
      user: { id: "admin", role: "admin" },
    }));
  });

  it("renders family, archetype, and strategy-id selects with testids", () => {
    renderPicker({}, { showStrategyIdDropdown: true });
    expect(screen.getByTestId("family-select")).toBeInTheDocument();
    expect(screen.getByTestId("archetype-select")).toBeInTheDocument();
    expect(screen.getByTestId("strategy-id-select")).toBeInTheDocument();
    expect(screen.getByTestId("family-archetype-picker")).toBeInTheDocument();
  });

  it("renders all 8 v2 families for admin audience", async () => {
    const user = userEvent.setup();
    renderPicker({});
    const familyTrigger = screen.getByTestId("family-select");
    await user.click(familyTrigger);

    // Expect all 8 family labels in the listbox (formatted via formatFamily).
    expect(await screen.findByText("ML Directional")).toBeInTheDocument();
    expect(screen.getByText("Rules Directional")).toBeInTheDocument();
    expect(screen.getByText("Carry & Yield")).toBeInTheDocument();
    expect(screen.getByText("Structural Arbitrage")).toBeInTheDocument();
    expect(screen.getByText("Market Making")).toBeInTheDocument();
    expect(screen.getByText("Event Driven")).toBeInTheDocument();
    expect(screen.getByText("Volatility Trading")).toBeInTheDocument();
    expect(screen.getByText("Statistical Arbitrage")).toBeInTheDocument();
  });

  it("filters archetypes by family selection", async () => {
    const user = userEvent.setup();
    renderPicker({ family: "CARRY_AND_YIELD" });
    const archetypeTrigger = screen.getByTestId("archetype-select");
    await user.click(archetypeTrigger);
    // CARRY_AND_YIELD contains 6 archetypes per ARCHETYPE_TO_FAMILY (formatted via formatArchetype).
    expect(await screen.findByText("Basis Carry — Dated Futures")).toBeInTheDocument();
    expect(screen.getByText("Basis Carry — Funding Rate (Perp)")).toBeInTheDocument();
    expect(screen.getByText("Staked Basis Carry")).toBeInTheDocument();
    expect(screen.getByText("Recursive Staked Carry")).toBeInTheDocument();
    expect(screen.getByText("Lending Yield Rotation")).toBeInTheDocument();
    expect(screen.getByText("Simple Staking Yield")).toBeInTheDocument();
    // A non-matching archetype should NOT appear.
    expect(screen.queryByText("ML Directional — Continuous")).toBeNull();
  });

  it("emits onChange({family}) when a family is picked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({});
    await user.click(screen.getByTestId("family-select"));
    await user.click(await screen.findByText("ML Directional"));
    expect(onChange).toHaveBeenCalledWith({ family: "ML_DIRECTIONAL" });
  });

  it("emits onChange({family, archetype}) when archetype is picked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ family: "STAT_ARB_PAIRS" });
    await user.click(screen.getByTestId("archetype-select"));
    // Picker renders formatArchetype() labels; value emitted is still the raw archetype id.
    await user.click(await screen.findByText("Statistical Arbitrage — Fixed Pairs"));
    expect(onChange).toHaveBeenCalledWith({
      family: "STAT_ARB_PAIRS",
      archetype: "STAT_ARB_PAIRS_FIXED",
    });
  });

  it("disables archetype select when no family is chosen", () => {
    renderPicker({});
    const archetypeTrigger = screen.getByTestId("archetype-select");
    expect(archetypeTrigger).toBeDisabled();
  });

  it("disables strategy-id select when no archetype is chosen", () => {
    renderPicker({ family: "ML_DIRECTIONAL" }, { showStrategyIdDropdown: true });
    const slotTrigger = screen.getByTestId("strategy-id-select");
    expect(slotTrigger).toBeDisabled();
  });

  it("respects persona visibility filter — client audience still sees PUBLIC archetypes", async () => {
    useAuthMock.mockImplementation(() => ({
      user: { id: "client-full", role: "client" },
    }));
    const user = userEvent.setup();
    renderPicker({});
    await user.click(screen.getByTestId("family-select"));
    // Defaults (PUBLIC + LIVE_ALLOCATED) mean every family with representative
    // slots remains visible to non-admin audiences under the default registry.
    expect(await screen.findByText("ML Directional")).toBeInTheDocument();
    expect(screen.getByText("Statistical Arbitrage")).toBeInTheDocument();
  });

  it("shows all archetypes when availabilityFilter='all' regardless of audience", async () => {
    useAuthMock.mockImplementation(() => ({
      user: { id: "client-data-only", role: "client" },
    }));
    const user = userEvent.setup();
    renderPicker({}, { availabilityFilter: "all" });
    await user.click(screen.getByTestId("family-select"));
    expect(await screen.findByText("Volatility Trading")).toBeInTheDocument();
  });

  it("handles the (All families) sentinel to clear selection", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({
      family: "ML_DIRECTIONAL",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
    });
    await user.click(screen.getByTestId("family-select"));
    await user.click(await screen.findByText("All families"));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
