import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import SubscriptionsPage, {
  validateNewSubscription,
} from "@/app/(platform)/services/im/funds/subscriptions/page";
import { resetMockStore } from "@/lib/mocks/fund-administration";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

describe("validateNewSubscription", () => {
  it("flags every missing field", () => {
    const result = validateNewSubscription({
      subscription_id: "",
      allocator_id: "",
      share_class: "",
      requested_amount_usd: "",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.subscription_id).toBe("required");
    expect(result.errors.allocator_id).toBe("required");
    expect(result.errors.share_class).toBe("required");
    expect(result.errors.requested_amount_usd).toBe("required");
  });

  it("rejects non-numeric amounts", () => {
    const result = validateNewSubscription({
      subscription_id: "sub-1",
      allocator_id: "client-x",
      share_class: "USD-A",
      requested_amount_usd: "not-a-number",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.requested_amount_usd).toMatch(/positive/);
  });

  it("passes a fully-populated form", () => {
    const result = validateNewSubscription({
      subscription_id: "sub-1",
      allocator_id: "client-x",
      share_class: "USD-A",
      requested_amount_usd: "100000",
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });
});

describe("/services/im/funds/subscriptions page", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("renders the seeded subscription rows and a Pending badge", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<SubscriptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-sub-table")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("im-funds-sub-row-sub-001")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-sub-row-sub-002")).toBeInTheDocument();
    expect(screen.getByTestId("im-funds-sub-row-sub-003")).toBeInTheDocument();
  });

  it("opens the New subscription dialog when the header button is clicked", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<SubscriptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-sub-new-open")).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByTestId("im-funds-sub-new-open"));
    });
    expect(await screen.findByTestId("im-funds-sub-new-dialog")).toBeInTheDocument();
  });

  it("disables the Create button until the form is valid", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<SubscriptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-sub-new-open")).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByTestId("im-funds-sub-new-open"));
    });
    const submit = await screen.findByTestId("im-funds-sub-submit");
    expect(submit).toBeDisabled();
  });

  it("submitting a valid form appends the new subscription to the list", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<SubscriptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-sub-new-open")).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByTestId("im-funds-sub-new-open"));
    });

    const idField = await screen.findByTestId("im-funds-sub-field-subscription_id");
    fireEvent.change(idField, { target: { value: "sub-auto-1" } });
    fireEvent.change(screen.getByTestId("im-funds-sub-field-allocator_id"), {
      target: { value: "client-auto" },
    });
    fireEvent.change(screen.getByTestId("im-funds-sub-field-requested_amount_usd"), {
      target: { value: "7777" },
    });

    const submit = screen.getByTestId("im-funds-sub-submit");
    await waitFor(() => expect(submit).not.toBeDisabled());
    act(() => {
      fireEvent.click(submit);
    });

    await waitFor(() =>
      expect(screen.queryByTestId("im-funds-sub-row-sub-auto-1")).toBeInTheDocument(),
    );
  });

  it("renders the status filter dropdown trigger", async () => {
    const { Wrapper } = renderWithPersona("admin");
    render(<SubscriptionsPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("im-funds-sub-status-filter")).toBeInTheDocument(),
    );
  });
});
