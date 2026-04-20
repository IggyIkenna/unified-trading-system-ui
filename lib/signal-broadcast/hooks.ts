"use client";

/**
 * Client-side fetch hooks for the counterparty observability dashboard.
 *
 * Mock vs live mode is governed by `NEXT_PUBLIC_MOCK_API` (the canonical
 * UI data-mode axis — see `lib/runtime/data-mode.ts`). In mock mode (tier-0
 * demo, local dev, UAT) the hooks return the deterministic fixtures from
 * `./mock-data`. In live mode they fetch from the strategy-service REST-pull
 * endpoints that ship in the signal_broadcast Phase 3 sub-package:
 *
 *   GET  {STRATEGY_SERVICE_URL}/signal_broadcast/emissions?counterparty_id=...
 *   GET  {STRATEGY_SERVICE_URL}/signal_broadcast/backtest-paper-live?counterparty_id=...
 *   GET  {STRATEGY_SERVICE_URL}/signal_broadcast/delivery-health?counterparty_id=...
 *   GET  {STRATEGY_SERVICE_URL}/signal_broadcast/pnl-attribution?counterparty_id=...
 *
 * Base URL is read from `NEXT_PUBLIC_STRATEGY_SERVICE_URL` and trimmed of
 * trailing slashes. Authentication is a bearer token keyed by counterparty
 * (stub in dev; real JWT flow wires at onboarding).
 *
 * Plan reference:
 *   unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.plan.md
 *   § Phase 9 — live wiring + paper column (follow-up 2026-04-20)
 */

import { useEffect, useState } from "react";

import { isMockDataMode } from "@/lib/runtime/data-mode";

import {
  MOCK_BACKTEST_PAPER_LIVE,
  MOCK_DELIVERY_HEALTH,
  MOCK_PNL_ATTRIBUTION,
  MOCK_SIGNAL_EMISSIONS,
} from "./mock-data";
import type {
  BacktestPaperLiveRow,
  CounterpartyId,
  DeliveryHealth,
  PnlAttributionRow,
  SignalEmission,
} from "./types";

interface FetchState<T> {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly isMock: boolean;
}

function strategyServiceBase(): string {
  const raw = process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL ?? "";
  return raw.replace(/\/+$/, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return (await res.json()) as T;
}

function useRemote<T>(
  path: string,
  counterpartyId: CounterpartyId,
  mockValue: T,
): FetchState<T> {
  const mock = isMockDataMode();
  const [state, setState] = useState<FetchState<T>>(() => ({
    data: mock ? mockValue : null,
    loading: !mock,
    error: null,
    isMock: mock,
  }));

  useEffect(() => {
    if (mock) {
      setState({ data: mockValue, loading: false, error: null, isMock: true });
      return;
    }
    let cancelled = false;
    const base = strategyServiceBase();
    const url = `${base}${path}?counterparty_id=${encodeURIComponent(counterpartyId)}`;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchJson<T>(url)
      .then((payload) => {
        if (!cancelled) {
          setState({
            data: payload,
            loading: false,
            error: null,
            isMock: false,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "unknown error";
          setState({
            data: null,
            loading: false,
            error: msg,
            isMock: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mock, path, counterpartyId, mockValue]);

  return state;
}

export function useSignalEmissions(
  counterpartyId: CounterpartyId,
): FetchState<readonly SignalEmission[]> {
  return useRemote<readonly SignalEmission[]>(
    "/signal_broadcast/emissions",
    counterpartyId,
    MOCK_SIGNAL_EMISSIONS,
  );
}

export function useBacktestPaperLive(
  counterpartyId: CounterpartyId,
): FetchState<readonly BacktestPaperLiveRow[]> {
  return useRemote<readonly BacktestPaperLiveRow[]>(
    "/signal_broadcast/backtest-paper-live",
    counterpartyId,
    MOCK_BACKTEST_PAPER_LIVE,
  );
}

export function useDeliveryHealth(
  counterpartyId: CounterpartyId,
): FetchState<DeliveryHealth> {
  return useRemote<DeliveryHealth>(
    "/signal_broadcast/delivery-health",
    counterpartyId,
    MOCK_DELIVERY_HEALTH,
  );
}

export function usePnlAttribution(
  counterpartyId: CounterpartyId,
): FetchState<readonly PnlAttributionRow[]> {
  return useRemote<readonly PnlAttributionRow[]>(
    "/signal_broadcast/pnl-attribution",
    counterpartyId,
    MOCK_PNL_ATTRIBUTION,
  );
}

export type { FetchState };
