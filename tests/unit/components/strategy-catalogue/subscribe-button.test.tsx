import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SubscribeButton } from "@/components/strategy-catalogue/SubscribeButton";
import * as subsApi from "@/lib/api/strategy-subscriptions";

const FIXED_RECORD: subsApi.SubscriptionRecord = {
  instance_id: "inst_alpha",
  client_id: "client_a",
  subscription_type: "dart_exclusive",
  subscribed_at: "2026-04-25T12:00:00+00:00",
  version_id: "v_genesis_inst_alpha",
  exclusive_lock: true,
};

beforeEach(() => {
  vi.spyOn(subsApi, "subscribeToInstance").mockResolvedValue(FIXED_RECORD);
  vi.spyOn(subsApi, "unsubscribeFromInstance").mockResolvedValue({
    released_at: "2026-04-25T13:00:00+00:00",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SubscribeButton", () => {
  it("disables when DART is not in the routing", () => {
    render(
      <SubscribeButton
        instanceId="inst_alpha"
        productRouting={["IM"]}
        callerClientId="client_a"
        callerEntitlements={["strategy-full"]}
      />,
    );
    expect(screen.getByTestId("subscribe-button")).toBeDisabled();
  });

  it("disables when exclusive holder is another client", () => {
    render(
      <SubscribeButton
        instanceId="inst_alpha"
        productRouting={["DART"]}
        callerClientId="client_a"
        callerEntitlements={["strategy-full"]}
        existingExclusiveHolder="client_b"
      />,
    );
    const btn = screen.getByTestId("subscribe-button");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("title")).toContain("Held by client_b");
  });

  it("optimistically flips to Unsubscribe on click", async () => {
    const user = userEvent.setup();
    render(
      <SubscribeButton
        instanceId="inst_alpha"
        productRouting={["DART"]}
        callerClientId="client_a"
        callerEntitlements={["strategy-full"]}
      />,
    );
    expect(screen.getByTestId("subscribe-button")).toHaveTextContent("Subscribe (DART Exclusive)");
    await user.click(screen.getByTestId("subscribe-button"));
    await waitFor(() => expect(screen.getByTestId("subscribe-button")).toHaveTextContent("Unsubscribe"));
    expect(subsApi.subscribeToInstance).toHaveBeenCalledOnce();
  });

  it("rolls back on 409 ExclusiveLockViolation", async () => {
    vi.spyOn(subsApi, "subscribeToInstance").mockRejectedValue(
      new subsApi.ExclusiveLockViolationError("held by client_b"),
    );
    const user = userEvent.setup();
    render(
      <SubscribeButton
        instanceId="inst_alpha"
        productRouting={["DART"]}
        callerClientId="client_a"
        callerEntitlements={["strategy-full"]}
      />,
    );
    await user.click(screen.getByTestId("subscribe-button"));
    await waitFor(() => expect(screen.getByTestId("subscribe-button")).toHaveTextContent("Subscribe (DART Exclusive)"));
    expect(screen.getByRole("alert")).toHaveTextContent("held by client_b");
  });

  it("unsubscribes when initially subscribed", async () => {
    const user = userEvent.setup();
    render(
      <SubscribeButton
        instanceId="inst_alpha"
        productRouting={["DART"]}
        callerClientId="client_a"
        callerEntitlements={["strategy-full"]}
        initiallySubscribed
      />,
    );
    expect(screen.getByTestId("subscribe-button")).toHaveTextContent("Unsubscribe");
    await user.click(screen.getByTestId("subscribe-button"));
    await waitFor(() => expect(screen.getByTestId("subscribe-button")).toHaveTextContent("Subscribe (DART Exclusive)"));
    expect(subsApi.unsubscribeFromInstance).toHaveBeenCalledOnce();
  });
});
