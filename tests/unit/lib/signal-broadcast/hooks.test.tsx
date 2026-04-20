import "@testing-library/jest-dom/vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MOCK_BACKTEST_PAPER_LIVE,
  MOCK_DELIVERY_HEALTH,
  MOCK_PNL_ATTRIBUTION,
  MOCK_SIGNAL_EMISSIONS,
  useBacktestPaperLive,
  useDeliveryHealth,
  usePnlAttribution,
  useSignalEmissions,
} from "@/lib/signal-broadcast";

const ORIGINAL_MOCK_API = process.env.NEXT_PUBLIC_MOCK_API;
const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL;

function setMockMode(on: boolean): void {
  process.env.NEXT_PUBLIC_MOCK_API = on ? "true" : "false";
}

afterEach(() => {
  if (ORIGINAL_MOCK_API === undefined) {
    delete process.env.NEXT_PUBLIC_MOCK_API;
  } else {
    process.env.NEXT_PUBLIC_MOCK_API = ORIGINAL_MOCK_API;
  }
  if (ORIGINAL_BASE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL;
  } else {
    process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL = ORIGINAL_BASE_URL;
  }
  vi.restoreAllMocks();
});

describe("signal-broadcast hooks — mock mode", () => {
  beforeEach(() => setMockMode(true));

  it("useSignalEmissions returns mock fixtures + isMock flag", async () => {
    const { result } = renderHook(() => useSignalEmissions("cp-qrt-alpha"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(MOCK_SIGNAL_EMISSIONS);
    expect(result.current.isMock).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it("useBacktestPaperLive returns the 3-way comparison fixture", async () => {
    const { result } = renderHook(() => useBacktestPaperLive("cp-qrt-alpha"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(MOCK_BACKTEST_PAPER_LIVE);
    expect(result.current.isMock).toBe(true);
  });

  it("useDeliveryHealth returns the delivery health fixture", async () => {
    const { result } = renderHook(() => useDeliveryHealth("cp-qrt-alpha"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(MOCK_DELIVERY_HEALTH);
    expect(result.current.isMock).toBe(true);
  });

  it("usePnlAttribution returns the P&L attribution fixture", async () => {
    const { result } = renderHook(() => usePnlAttribution("cp-qrt-alpha"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(MOCK_PNL_ATTRIBUTION);
    expect(result.current.isMock).toBe(true);
  });
});

describe("signal-broadcast hooks — live mode", () => {
  beforeEach(() => {
    setMockMode(false);
    process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL =
      "https://strategy.example.odum";
  });

  it("useSignalEmissions fetches from the REST pull endpoint with counterparty_id", async () => {
    const payload = [
      { ...MOCK_SIGNAL_EMISSIONS[0], counterparty_id: "cp-live" },
    ];
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const { result } = renderHook(() => useSignalEmissions("cp-live"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = spy.mock.calls[0][0];
    const url = typeof callArg === "string" ? callArg : (callArg as Request).url;
    expect(url).toBe(
      "https://strategy.example.odum/signal_broadcast/emissions?counterparty_id=cp-live",
    );
    expect(result.current.isMock).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual(payload);
  });

  it("surfaces fetch errors in the error field without crashing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500, statusText: "Server Error" }),
    );

    const { result } = renderHook(() => useDeliveryHealth("cp-live"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBe(null);
    expect(result.current.error).toContain("500");
    expect(result.current.isMock).toBe(false);
  });
});
