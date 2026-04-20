import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import RedemptionsPage, {
  validateNewRedemption,
} from "@/app/(platform)/services/im/funds/redemptions/page";
import { resetMockStore } from "@/lib/mocks/fund-administration";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

describe("validateNewRedemption", () => {
  it("flags all required fields when empty", () => {
    const result = validateNewRedemption({
      redemption_id: "",
      allocator_id: "",
      share_class: "",
      units_to_redeem: "",
      destination: "",
      grace_period_days: "5",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.redemption_id).toBe("required");
    expect(result.errors.destination).toBe("required");
    expect(result.errors.units_to_redeem).toBe("required");
  });

  it("rejects negative or non-numeric units", () => {
    const result = validateNewRedemption({
      redemption_id: "red-1",
      allocator_id: "x",
      share_class: "USD-A",
      units_to_redeem: "-10",
      destination: "iban:TEST",
      grace_period_days: "5",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.units_to_redeem).toMatch(/positive/);
  });

  it("rejects fractional grace_period_days", () => {
    const result = validateNewRedemption({
      redemption_id: "red-1",
      allocator_id: "x",
      share_class: "USD-A",
      units_to_redeem: "100",
      destination: "iban:TEST",
      grace_period_days: "3.5",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.grace_period_days).toMatch(/integer/);
  });

  it("accepts an empty grace_period_days (will default server-side)", () => {
    const result = validateNewRedemption({
      redemption_id: "red-1",
      allocator_id: "x",
      share_class: "USD-A",
      units_to_redeem: "100",
      destination: "iban:TEST",
      grace_period_days: "",
    });
    expect(result.ok).toBe(true);
  });
});

describe("/services/im/funds/redemptions page", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("renders seeded redemption rows", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<RedemptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-red-table")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("im-funds-red-row-red-001")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-red-row-red-002")).toBeInTheDocument();
  });

  it("opens the dialog and submits a valid redemption", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<RedemptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-red-new-open")).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByTestId("im-funds-red-new-open"));
    });
    fireEvent.change(
      await screen.findByTestId("im-funds-red-field-redemption_id"),
      { target: { value: "red-auto-1" } },
    );
    fireEvent.change(screen.getByTestId("im-funds-red-field-allocator_id"), {
      target: { value: "client-auto" },
    });
    fireEvent.change(screen.getByTestId("im-funds-red-field-units_to_redeem"), {
      target: { value: "250" },
    });
    fireEvent.change(screen.getByTestId("im-funds-red-field-destination"), {
      target: { value: "iban:AUTO" },
    });
    const submit = screen.getByTestId("im-funds-red-submit");
    await waitFor(() => expect(submit).not.toBeDisabled());
    act(() => {
      fireEvent.click(submit);
    });
    await waitFor(() =>
      expect(screen.queryByTestId("im-funds-red-row-red-auto-1")).toBeInTheDocument(),
    );
  });

  it("renders the redemption status filter", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<RedemptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-red-status-filter")).toBeInTheDocument(),
    );
  });

  it("initial dialog state blocks Create until fields validate", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<RedemptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-red-new-open")).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByTestId("im-funds-red-new-open"));
    });
    const submit = await screen.findByTestId("im-funds-red-submit");
    expect(submit).toBeDisabled();
  });
});
